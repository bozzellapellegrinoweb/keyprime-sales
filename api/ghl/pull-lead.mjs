// I lead vengono a noi, invece di aspettare che GHL li spinga.
//
// Perche' esiste: in GHL l'ingresso di un lead si automatizza con un'azione
// "Webhook" dentro un workflow, e l'API dei workflow su questo sotto-account
// risponde WORKFLOW_API_NOT_ENABLED_FOR_LOCATION — in lettura e in scrittura.
// Non e' un problema di token: e' un interruttore che tiene GHL. L'unico modo
// di costruire quel workflow sarebbe a mano nell'interfaccia, e un pezzo
// costruito a mano e' un pezzo che un giorno qualcuno mette in pausa senza
// che nessuno se ne accorga.
//
// Qui invece il portale va a prendersi i contatti nuovi. Vantaggi veri, non
// solo l'indipendenza: la scheda del contatto porta `attributionSource`, con
// utm, campagna, annuncio, referrer e la landing da cui e' arrivato — cose
// che un webhook passerebbe solo se qualcuno le mappa campo per campo.
//
// Non duplica la logica di creazione: rigira il contatto allo stesso
// /api/ghl/webhook, che resta l'unico posto dove un lead nasce. Cosi' se un
// domani il workflow in GHL viene aggiunto davvero, le due strade fanno
// esattamente la stessa cosa, e il controllo anti-doppione del webhook (un
// lead aperto per lo stesso cliente nell'ultima ora) impedisce il doppio.

import { serviceClient } from '../_lib/supabase.mjs';
import { requireSession, checkCron } from '../_lib/auth.mjs';
import { contattiDopo, ghlConfigured, logSync } from '../_lib/ghl.mjs';
import { APP_URL } from '../_lib/notify.mjs';

const MAX_PER_GIRO = 25;

// Da scheda contatto GHL al corpo che /api/ghl/webhook sa gia' leggere.
// Esportata per poterla provare su schede vere senza creare lead.
export function aPayload(c) {
  const a = c.lastAttributionSource || c.attributionSource || {};

  // I campi personalizzati arrivano come [{id, value}]: senza le definizioni
  // non si sa quale sia quale, ma il testo libero e' quasi sempre la
  // richiesta del lead. Meglio portarlo in nota che buttarlo.
  const testoLibero = (c.customFields || [])
    .map((f) => (typeof f?.value === 'string' ? f.value.trim() : ''))
    .filter((v) => v && v.length > 2)
    .join(' · ') || null;

  // La landing dice su cosa ha cliccato: "uae.keyprimere.com/imtiaz-raw-district"
  // vuol dire che il lead arriva dall'annuncio di Imtiaz Raw District. E' la
  // prima cosa che un agente vuole sapere prima di alzare il telefono, e un
  // webhook non gliela passerebbe.
  let progetto = null;
  try {
    const parti = new URL(a.url).pathname.split('/').filter(Boolean);
    const ultima = parti[parti.length - 1];
    if (ultima && ultima.length > 2 && !/^\d+$/.test(ultima)) {
      progetto = ultima.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }
  } catch { /* nessuna landing, o non e' un URL: si resta senza progetto */ }

  return {
    contact_id: c.id,
    progetto,
    first_name: c.firstName || null,
    last_name: c.lastName || null,
    full_name: c.contactName || null,
    email: c.email || null,
    phone: c.phone || null,
    source: c.source || a.sessionSource || 'GHL',
    tags: Array.isArray(c.tags) ? c.tags : [],
    message: testoLibero,
    utm_source: a.utmSource || null,
    utm_medium: a.utmMedium || null,
    utm_campaign: a.campaign || null,
    utm_content: a.utmContent || null,
    utm_term: a.utmTerm || null,
    // utmKeyword e' l'id dell'annuncio nelle lead ads Meta; mediumId e' il
    // modulo. Il primo identifica la creativita', che e' quello che serve.
    ad_id: a.utmKeyword || a.mediumId || null,
    landing: a.url || null
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  // Due porte: il cron col suo segreto, oppure una sessione del portale.
  // Il giro e' idempotente (la sentinella avanza solo su cio' che e' stato
  // elaborato), quindi chiunque sia dentro puo' farlo scattare senza danni.
  if (!checkCron(req).ok) {
    const utente = await requireSession(req, res, supabase);
    if (!utente) return;
  }

  if (!ghlConfigured()) {
    return res.status(200).json({ ok: false, motivo: 'GHL non configurato' });
  }

  const { data: riga } = await supabase
    .from('app_settings').select('value').eq('key', 'ghl_pull').maybeSingle();
  const conf = riga?.value || {};

  if (conf.attivo === false) {
    return res.status(200).json({ ok: true, sospeso: true, importati: 0 });
  }

  // Senza sentinella non si parte: importare "tutto" significherebbe aprire
  // un lead e mandare una mail di conferma a ogni contatto storico.
  const sentinella = conf.ultimo_contatto_iso;
  if (!sentinella) {
    return res.status(200).json({
      ok: false,
      motivo: 'Manca app_settings.ghl_pull.ultimo_contatto_iso: senza sentinella non si importa nulla'
    });
  }

  let contatti;
  try {
    contatti = await contattiDopo(sentinella, MAX_PER_GIRO);
  } catch (err) {
    await logSync(supabase, {
      direzione: 'in', evento: 'pull_lead', entita: 'contact',
      esito: 'errore', errore: err.message.slice(0, 500)
    });
    return res.status(502).json({ error: 'GHL non raggiungibile', dettaglio: err.message.slice(0, 200) });
  }

  if (!contatti.length) {
    return res.status(200).json({ ok: true, importati: 0, da: sentinella });
  }

  const segreto = process.env.GHL_WEBHOOK_SECRET;
  if (!segreto) {
    return res.status(500).json({ error: "GHL_WEBHOOK_SECRET non configurata: il giro non puo' chiamare il webhook" });
  }

  const base = process.env.APP_URL || APP_URL;
  const esiti = [];
  let avanzamento = sentinella;

  for (const c of contatti) {
    // Un contatto senza nessun recapito non e' lavorabile: si salta, ma la
    // sentinella avanza lo stesso, altrimenti lo si ritrova ogni giro.
    if (!c.email && !c.phone) {
      esiti.push({ id: c.id, esito: 'saltato', motivo: 'nessun recapito' });
      if (c.dateAdded > avanzamento) avanzamento = c.dateAdded;
      continue;
    }

    try {
      const r = await fetch(`${base}/api/ghl/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-kp-secret': segreto },
        body: JSON.stringify(aPayload(c))
      });
      const corpo = await r.json().catch(() => ({}));
      esiti.push({
        id: c.id,
        esito: r.ok ? (corpo.duplicato ? 'gia_presente' : 'creato') : 'errore',
        sale_id: corpo.sale_id || null,
        assegnato_a: corpo.assegnato_a || null,
        errore: r.ok ? undefined : (corpo.error || r.status)
      });

      // La sentinella avanza solo su cio' che e' andato a buon fine: se il
      // webhook e' caduto, quel contatto si riprova al giro dopo.
      if (r.ok && c.dateAdded > avanzamento) avanzamento = c.dateAdded;
    } catch (err) {
      esiti.push({ id: c.id, esito: 'errore', errore: err.message.slice(0, 200) });
    }
  }

  if (avanzamento !== sentinella) {
    await supabase.from('app_settings')
      .update({ value: { ...conf, ultimo_contatto_iso: avanzamento }, updated_at: new Date().toISOString() })
      .eq('key', 'ghl_pull');
  }

  const creati = esiti.filter((e) => e.esito === 'creato').length;
  if (creati) {
    await logSync(supabase, {
      direzione: 'in', evento: 'pull_lead', entita: 'contact',
      payload: { trovati: contatti.length, creati, da: sentinella, a: avanzamento }
    });
  }

  return res.status(200).json({
    ok: true,
    trovati: contatti.length,
    creati,
    da: sentinella,
    a: avanzamento,
    esiti
  });
}
