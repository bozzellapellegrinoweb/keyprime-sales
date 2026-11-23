// Ingresso dei lead da GoHighLevel.
//
// Da configurare in GHL come azione "Webhook" di un workflow:
//   POST https://portal.keyprimere.com/api/ghl/webhook
//   header  x-kp-secret: <GHL_WEBHOOK_SECRET>
//
// Cosa fa, in ordine: riconosce o crea il cliente, apre il lead, lo assegna
// a rotazione, programma il primo follow-up secondo lo SLA e avvisa l'agente.

import { serviceClient } from '../_lib/supabase.mjs';
import { checkSecret } from '../_lib/auth.mjs';
import {
  logSync, ghlConfigured, sendMessage, createOpportunity, assegnaContatto
} from '../_lib/ghl.mjs';
import { push, email, template, templateCliente, riga, APP_URL } from '../_lib/notify.mjs';

// I payload dei workflow GHL non hanno una forma fissa: ogni campo puo'
// arrivare in camelCase, snake_case o annidato sotto "contact".
function pesca(payload, ...chiavi) {
  const fonti = [payload, payload?.contact, payload?.customData, payload?.custom_data].filter(Boolean);
  for (const fonte of fonti) {
    for (const chiave of chiavi) {
      const v = fonte[chiave];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return null;
}

function normalizza(payload) {
  const contactId = pesca(payload, 'contact_id', 'contactId', 'id');
  let nome = pesca(payload, 'first_name', 'firstName');
  let cognome = pesca(payload, 'last_name', 'lastName');
  const completo = pesca(payload, 'full_name', 'fullName', 'name', 'contact_name');

  if (!nome && completo) {
    const parti = completo.split(/\s+/);
    nome = parti.shift();
    cognome = cognome || (parti.length ? parti.join(' ') : null);
  }

  const tagsRaw = payload?.tags ?? payload?.contact?.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String)
    : (typeof tagsRaw === 'string' ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []);

  const budget = pesca(payload, 'budget', 'budget_max', 'budgetMax');

  // Da dove arriva, davvero. "fonte" da sola dice il tubo (GHL), non la
  // campagna: con le inserzioni attive serve sapere quale annuncio ha prodotto
  // quale lead, altrimenti il budget si decide a sensazione.
  const utmSource = pesca(payload, 'utm_source', 'utmSource');
  const utmMedium = pesca(payload, 'utm_medium', 'utmMedium');
  const canale = (() => {
    const s = (utmSource || '').toLowerCase();
    if (/facebook|instagram|meta|fb|ig/.test(s)) return 'meta';
    if (/google|adwords|gads|youtube/.test(s)) return 'google';
    if (/tiktok/.test(s)) return 'tiktok';
    if (!s) return null;
    return 'altro';
  })();

  return {
    ghlContactId: contactId,
    nome: nome || 'Lead',
    cognome: cognome || '',
    email: pesca(payload, 'email'),
    telefono: pesca(payload, 'phone', 'telefono', 'phone_number'),
    canale,
    campagna: pesca(payload, 'utm_campaign', 'utmCampaign', 'campaign_name', 'campagna'),
    utmSource,
    utmMedium,
    utmContent: pesca(payload, 'utm_content', 'utmContent'),
    utmTerm: pesca(payload, 'utm_term', 'utmTerm'),
    adId: pesca(payload, 'ad_id', 'adId', 'adset_id', 'creative_id'),
    fonte: pesca(payload, 'source', 'fonte', 'utm_source') || 'GHL',
    zona: pesca(payload, 'zona', 'zone', 'area', 'location', 'interesse_zona'),
    progetto: pesca(payload, 'progetto', 'project', 'property', 'immobile'),
    note: pesca(payload, 'message', 'note', 'notes', 'messaggio', 'richiesta'),
    budgetMax: budget && /^[\d.,\s]+$/.test(budget) ? Number(budget.replace(/[.,\s]/g, '')) : null,
    tags
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  const auth = checkSecret(req, 'GHL_WEBHOOK_SECRET');
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const lead = normalizza(payload);

  if (!lead.email && !lead.telefono && !lead.ghlContactId) {
    await logSync(supabase, {
      direzione: 'in', evento: 'lead', entita: 'contact', esito: 'errore',
      errore: 'Payload senza email, telefono o contact id', payload
    });
    return res.status(400).json({ error: 'Serve almeno email, telefono o contact id' });
  }

  try {
    // 1. Cliente: prima per id GHL, poi per email, poi per telefono.
    let cliente = await trovaCliente(supabase, lead);

    if (!cliente) {
      const { data, error } = await supabase.from('clienti').insert([{
        nome: lead.nome,
        cognome: lead.cognome,
        email: lead.email,
        telefono: lead.telefono,
        whatsapp: lead.telefono,
        note: lead.note,
        budget_max: lead.budgetMax,
        zone_interesse: lead.zona ? [lead.zona] : null,
        fonte: lead.fonte,
        stato: 'nuovo',
        created_by: 'GHL',
        ghl_contact_id: lead.ghlContactId
      }]).select().single();
      if (error) throw error;
      cliente = data;
    } else if (lead.ghlContactId && !cliente.ghl_contact_id) {
      await supabase.from('clienti').update({ ghl_contact_id: lead.ghlContactId }).eq('id', cliente.id);
    }

    // 2. Niente doppioni: se lo stesso contatto ha gia' un lead aperto creato
    // nell'ultima ora, registro l'evento sul lead esistente e mi fermo.
    const unOraFa = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: esistenti } = await supabase
      .from('sales')
      .select('id, progetto, assegnato_a')
      .eq('cliente_id', cliente.id)
      .gte('created_at', unOraFa)
      .limit(1);

    if (esistenti && esistenti.length) {
      const sale = esistenti[0];
      await supabase.from('lead_activities').insert([{
        sale_id: sale.id, tipo: 'note', created_by: 'GHL',
        contenuto: `Nuovo contatto da GHL (${lead.fonte})${lead.note ? `: ${lead.note}` : ''}`
      }]);
      await logSync(supabase, {
        direzione: 'in', evento: 'lead_duplicato', entita: 'contact',
        entita_id: lead.ghlContactId, sale_id: sale.id, cliente_id: cliente.id, payload
      });
      return res.status(200).json({ ok: true, duplicato: true, sale_id: sale.id });
    }

    // 3. Apertura del lead.
    const { data: sale, error: errSale } = await supabase.from('sales').insert([{
      data: new Date().toISOString().split('T')[0],
      developer: 'Da qualificare',
      progetto: lead.progetto || `Richiesta ${lead.fonte}`,
      zona: lead.zona || 'Da definire',
      valore: 0,
      stato: 'lead',
      temperatura: 'hot',
      fonte: lead.fonte,
      note: lead.note,
      cliente_id: cliente.id,
      inserted_by: 'GHL',
      inserted_as: 'admin',
      ghl_contact_id: lead.ghlContactId,
      canale: lead.canale,
      campagna: lead.campagna,
      utm_source: lead.utmSource,
      utm_medium: lead.utmMedium,
      utm_campaign: lead.campagna,
      utm_content: lead.utmContent,
      utm_term: lead.utmTerm,
      ad_id: lead.adId
    }]).select().single();
    if (errSale) throw errSale;

    // 4. Assegnazione a rotazione.
    let agente = null;
    const { data: rr } = await supabase.rpc('app_assign_round_robin', {
      p_sale_id: sale.id, p_eseguito_da: 'webhook GHL'
    });
    if (rr && rr.ok) agente = rr.agente;

    // 5. Primo follow-up entro lo SLA concordato.
    const { data: impostazioni } = await supabase
      .from('app_settings').select('value').eq('key', 'sla').maybeSingle();
    const ore = Number(impostazioni?.value?.primo_contatto_ore ?? 24);
    const scadenza = new Date(Date.now() + ore * 60 * 60 * 1000);

    await supabase.from('follow_ups').insert([{
      sale_id: sale.id,
      cliente_id: cliente.id,
      data_reminder: scadenza.toISOString().split('T')[0],
      ora_reminder: scadenza.toTimeString().slice(0, 5),
      tipo: 'call',
      nota: `Primo contatto lead ${lead.fonte} (SLA ${ore}h)`,
      assegnato_a: agente,
      creato_da: 'sistema'
    }]);

    await supabase.from('sales')
      .update({ prossima_azione_at: scadenza.toISOString() })
      .eq('id', sale.id);

    await supabase.from('lead_activities').insert([{
      sale_id: sale.id, tipo: 'note', created_by: 'GHL',
      contenuto: `Lead entrato da ${lead.fonte}${agente ? ` e assegnato a ${agente}` : ' (nessun agente attivo in rotazione)'}`
    }]);

    // 6. Avviso all'agente: un lead caldo non deve aspettare che qualcuno apra l'app.
    const nominativo = `${cliente.nome} ${cliente.cognome || ''}`.trim();
    let utente = null;

    if (agente) {
      // user_credentials e non la vista team_members: la vista ha un elenco di
      // colonne fisso e non comprende ghl_calendario_url. Qui si gira con la
      // service_role, che la legge senza problemi.
      const { data } = await supabase
        .from('user_credentials')
        .select('username, email, ghl_calendario_url, ghl_user_id, ghl_pipeline_id, ghl_stadio_iniziale_id')
        .eq('nome', agente).maybeSingle();
      utente = data;

      await push({
        titolo: `Nuovo lead: ${nominativo}`,
        messaggio: `${lead.fonte} • chiamalo entro ${ore}h`,
        url: APP_URL,
        username: utente?.username
      });

      if (utente?.email) {
        await email({
          a: utente.email,
          oggetto: `Nuovo lead assegnato: ${nominativo}`,
          html: template({
            badge: 'Nuovo lead', titolo: nominativo, accento: '#ef4444',
            righe: riga('Fonte', lead.fonte) + riga('Telefono', lead.telefono) +
                   riga('Email', lead.email) + riga('Zona', lead.zona) +
                   riga('Richiesta', lead.note),
            nota: `Primo contatto da fare entro ${ore} ore.`
          })
        });
      }
    } else {
      await push({ titolo: 'Lead non assegnato', messaggio: `${lead.fonte}: nessun agente attivo in rotazione`, url: APP_URL });
    }

    // 6-bis. Il lead prende posto nella pipeline dell'agente, nello stadio
    // "Da contattare", e il contatto GHL passa in carico a lui.
    //
    // Senza questo l'agente apre GHL e non vede niente: gira con
    // assignedDataOnly, quindi un contatto non assegnato per lui non esiste.
    if (agente && lead.ghlContactId && ghlConfigured()) {
      if (utente?.ghl_user_id) {
        try {
          await assegnaContatto(lead.ghlContactId, utente.ghl_user_id);
        } catch (err) {
          await logSync(supabase, {
            direzione: 'out', evento: 'assegna_contatto', entita: 'contact',
            entita_id: lead.ghlContactId, sale_id: sale.id,
            esito: 'errore', errore: err.message.slice(0, 400)
          });
        }
      }

      if (utente?.ghl_pipeline_id && utente?.ghl_stadio_iniziale_id) {
        try {
          const opp = await createOpportunity({
            pipelineId: utente.ghl_pipeline_id,
            pipelineStageId: utente.ghl_stadio_iniziale_id,
            nome: `${nominativo} — ${sale.progetto}`,
            contactId: lead.ghlContactId,
            valore: 0
          });
          const oppId = opp?.opportunity?.id || opp?.id || null;
          if (oppId) await supabase.from('sales').update({ ghl_opportunity_id: oppId }).eq('id', sale.id);
        } catch (err) {
          await logSync(supabase, {
            direzione: 'out', evento: 'crea_opportunita', entita: 'opportunity',
            sale_id: sale.id, esito: 'errore', errore: err.message.slice(0, 400)
          });
        }
      }
    }

    // 7. Conferma al lead.
    //
    // Chi lascia i dati su un'inserzione e poi non riceve niente pensa di aver
    // sbagliato qualcosa, e intanto compila il modulo del concorrente. Questa
    // email parte entro pochi secondi, dice chi lo chiamera' e gli lascia in
    // mano il link del calendario di quell'agente: se ha fretta prenota da
    // solo invece di aspettare.
    //
    // Il testo sta qui e non in un workflow GHL perche' l'API dei workflow non
    // e' abilitata su questo sotto-account: cosi' e' versionato e si prova
    // prima di pubblicarlo. La SPEDIZIONE invece passa da GHL, non da Resend.
    //
    // Non e' un dettaglio di gusto: le mail ai lead sono tante e crescono con
    // le campagne, mentre quelle interne al team sono poche e fisse. Resend
    // resta per il portale (avvisi agli agenti, promemoria); verso i clienti
    // si spedisce dal dominio mail.keyprimere.com gia' verificato in GHL, dove
    // il volume costa molto meno e la mail resta attaccata alla conversazione
    // del contatto, cosi' una risposta non si perde.
    if (lead.email) {
      const nomeLead = (cliente.nome || '').trim() || 'ciao';
      const link = utente?.ghl_calendario_url || null;

      const corpo = agente
        ? `<p style="margin:0 0 14px">Grazie per averci scritto: abbiamo ricevuto la tua richiesta${lead.zona ? ` su <strong>${lead.zona}</strong>` : ''}.</p>
           <p style="margin:0 0 14px">Se ne occupa <strong>${agente}</strong>, che ti contatterà entro ${ore} ore al numero che ci hai lasciato.</p>
           ${link ? `<p style="margin:0">Se preferisci scegliere tu quando sentirvi, puoi fissare una call di 30 minuti quando ti è comodo.</p>` : ''}`
        : `<p style="margin:0 0 14px">Grazie per averci scritto: abbiamo ricevuto la tua richiesta${lead.zona ? ` su <strong>${lead.zona}</strong>` : ''}.</p>
           <p style="margin:0">Un nostro consulente ti contatterà a breve al numero che ci hai lasciato.</p>`;

      const oggetto = 'Abbiamo ricevuto la tua richiesta — KeyPrime Real Estate';
      const html = templateCliente({
        titolo: `Ciao ${nomeLead}, ci siamo.`,
        corpo,
        azione: link ? 'Prenota la tua call' : null,
        urlAzione: link,
        poscritto: 'Se nel frattempo vuoi aggiungere qualcosa, rispondi pure a questa email: la leggiamo noi.'
      });

      let spedita = false;
      if (lead.ghlContactId && ghlConfigured()) {
        try {
          await sendMessage({ tipo: 'Email', contactId: lead.ghlContactId, oggetto, html });
          spedita = true;
        } catch (err) {
          await logSync(supabase, {
            direzione: 'out', evento: 'conferma_lead', entita: 'contact',
            entita_id: lead.ghlContactId, sale_id: sale.id,
            esito: 'errore', errore: err.message.slice(0, 400)
          });
        }
      }

      // Resend solo se GHL non ha potuto: un lead che non riceve conferma e'
      // un lead che pensa di aver sbagliato qualcosa. Meglio pagare una mail
      // che perderlo. Resta un ripiego, e nel log si vede quando scatta.
      if (!spedita) {
        await email({ a: lead.email, oggetto, html });
        await logSync(supabase, {
          direzione: 'out', evento: 'conferma_lead_ripiego_resend', entita: 'contact',
          entita_id: lead.ghlContactId, sale_id: sale.id
        });
      }
    }

    await logSync(supabase, {
      direzione: 'in', evento: 'lead_creato', entita: 'contact',
      entita_id: lead.ghlContactId, sale_id: sale.id, cliente_id: cliente.id, payload
    });

    return res.status(200).json({ ok: true, sale_id: sale.id, cliente_id: cliente.id, assegnato_a: agente });
  } catch (err) {
    console.error('Webhook GHL:', err);
    await logSync(supabase, {
      direzione: 'in', evento: 'lead', entita: 'contact', entita_id: lead.ghlContactId,
      esito: 'errore', errore: err.message, payload
    });
    return res.status(500).json({ error: err.message });
  }
}

async function trovaCliente(supabase, lead) {
  if (lead.ghlContactId) {
    const { data } = await supabase.from('clienti').select('*').eq('ghl_contact_id', lead.ghlContactId).maybeSingle();
    if (data) return data;
  }
  if (lead.email) {
    const { data } = await supabase.from('clienti').select('*').ilike('email', lead.email).limit(1);
    if (data && data.length) return data[0];
  }
  if (lead.telefono) {
    const cifre = lead.telefono.replace(/\D/g, '').slice(-9);
    if (cifre.length >= 6) {
      const { data } = await supabase.from('clienti').select('*').ilike('telefono', `%${cifre}%`).limit(1);
      if (data && data.length) return data[0];
    }
  }
  return null;
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
