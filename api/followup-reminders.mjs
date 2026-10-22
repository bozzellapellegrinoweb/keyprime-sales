// Il promemoria che fa accadere i follow-up.
//
// Gira come cron Vercel. Per ogni agente mette insieme un solo avviso con:
//   - i follow-up scaduti e quelli di oggi,
//   - i lead mai contattati oltre lo SLA,
//   - i lead fermi da troppo tempo nello stesso stato.
// Un messaggio per persona, non uno per riga: altrimenti vengono ignorati.
//
// Lancio manuale per collaudo:
//   curl -X POST "https://portal.keyprimere.com/api/followup-reminders" \
//        -H "x-kp-secret: <KP_JOB_SECRET>"

import { serviceClient } from './_lib/supabase.mjs';
import { checkCron } from './_lib/auth.mjs';
import { push, email, template, riga, APP_URL } from './_lib/notify.mjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bozzellapellegrino@gmail.com';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = checkCron(req);
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  try {
    const oggi = new Date().toISOString().split('T')[0];

    const { data: slaRow } = await supabase
      .from('app_settings').select('value').eq('key', 'sla').maybeSingle();
    const sla = slaRow?.value || {};
    const oreePrimoContatto = Number(sla.primo_contatto_ore ?? 24);
    const giorniLeadFermo = Number(sla.lead_fermo_giorni ?? 7);
    const giorniTrattativaFerma = Number(sla.trattativa_ferma_giorni ?? 14);

    // --- Follow-up da fare ---------------------------------------------------
    const { data: followUpsRaw } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('completato', false)
      .lte('data_reminder', oggi)
      .order('data_reminder', { ascending: true });

    // Un follow-up gia' segnalato nelle ultime 12 ore non viene ripetuto:
    // il job resta corretto se il cron scatta due volte, e una chiamata
    // ripetuta dall'esterno non produce una raffica di notifiche.
    const dodiciOreFa = Date.now() - 12 * 60 * 60 * 1000;
    const followUps = (followUpsRaw || []).filter(f =>
      !f.reminder_inviato_at || new Date(f.reminder_inviato_at).getTime() < dodiciOreFa);

    // --- Lead che stanno marcendo -------------------------------------------
    const { data: leadsRaw } = await supabase
      .from('sales')
      .select('id, progetto, stato, assegnato_a, agente, cliente_id, created_at, ultimo_contatto_at, temperatura, fonte')
      .in('stato', ['lead', 'trattativa', 'EOI']);
    const leads = leadsRaw || [];

    const adesso = Date.now();
    const giorni = (d) => d ? (adesso - new Date(d).getTime()) / 86400000 : null;
    const ore = (d) => d ? (adesso - new Date(d).getTime()) / 3600000 : null;

    const maiContattati = leads.filter(l =>
      !l.ultimo_contatto_at && ore(l.created_at) > oreePrimoContatto);

    const fermi = leads.filter(l => {
      if (!l.ultimo_contatto_at) return false;
      const d = giorni(l.ultimo_contatto_at);
      const soglia = l.stato === 'lead' ? giorniLeadFermo : giorniTrattativaFerma;
      return d > soglia;
    });

    if (!followUps.length && !maiContattati.length && !fermi.length) {
      return res.status(200).json({ ok: true, messaggio: 'Niente da ricordare', inviati: 0 });
    }

    // --- Nomi dei clienti, per scrivere avvisi leggibili --------------------
    const idClienti = [...new Set([
      ...followUps.map(f => f.cliente_id),
      ...maiContattati.map(l => l.cliente_id),
      ...fermi.map(l => l.cliente_id)
    ].filter(Boolean))];

    const nomi = {};
    if (idClienti.length) {
      const { data: clientiRaw } = await supabase
        .from('clienti').select('id, nome, cognome, telefono').in('id', idClienti);
      const clienti = clientiRaw || [];
      for (const c of clienti) {
        nomi[c.id] = { nome: `${c.nome} ${c.cognome || ''}`.trim(), telefono: c.telefono };
      }
    }

    const titoliLead = {};
    for (const l of leads) titoliLead[l.id] = l.progetto;

    // --- Raggruppamento per agente ------------------------------------------
    const perAgente = new Map();
    const prendi = (nome) => {
      if (!nome) return null;
      if (!perAgente.has(nome)) {
        perAgente.set(nome, { scaduti: [], oggi: [], maiContattati: [], fermi: [] });
      }
      return perAgente.get(nome);
    };

    for (const f of followUps) {
      const voce = prendi(f.assegnato_a);
      if (!voce) continue;
      const descrizione = {
        cliente: nomi[f.cliente_id]?.nome || 'Cliente',
        progetto: titoliLead[f.sale_id] || '',
        tipo: f.tipo || 'contatto',
        data: f.data_reminder,
        ora: f.ora_reminder ? String(f.ora_reminder).slice(0, 5) : null,
        nota: f.nota
      };
      (f.data_reminder < oggi ? voce.scaduti : voce.oggi).push(descrizione);
    }

    for (const l of maiContattati) {
      const voce = prendi(l.assegnato_a || l.agente);
      if (!voce) continue;
      voce.maiContattati.push({
        cliente: nomi[l.cliente_id]?.nome || 'Cliente',
        progetto: l.progetto,
        oreDaCreazione: Math.round(ore(l.created_at)),
        fonte: l.fonte
      });
    }

    for (const l of fermi) {
      const voce = prendi(l.assegnato_a || l.agente);
      if (!voce) continue;
      voce.fermi.push({
        cliente: nomi[l.cliente_id]?.nome || 'Cliente',
        progetto: l.progetto,
        stato: l.stato,
        giorniDaContatto: Math.round(giorni(l.ultimo_contatto_at))
      });
    }

    // --- Rubrica del team ---------------------------------------------------
    // team_members e' la vista senza hash: leggibile anche con la chiave
    // pubblica, a differenza di user_credentials che e' chiusa da RLS.
    const { data: teamRaw } = await supabase
      .from('team_members').select('nome, username, email, ruolo, attivo').eq('attivo', true);
    const team = teamRaw || [];
    const rubrica = Object.fromEntries(team.map(u => [u.nome, u]));

    // --- Invio ---------------------------------------------------------------
    let inviati = 0;
    const riepilogoAdmin = [];

    for (const [agente, voce] of perAgente.entries()) {
      const totale = voce.scaduti.length + voce.oggi.length + voce.maiContattati.length + voce.fermi.length;
      if (!totale) continue;

      riepilogoAdmin.push({ agente, ...contaVoce(voce) });

      const utente = rubrica[agente];
      if (!utente) continue;

      const pezzi = [];
      if (voce.scaduti.length) pezzi.push(`${voce.scaduti.length} in ritardo`);
      if (voce.oggi.length) pezzi.push(`${voce.oggi.length} oggi`);
      if (voce.maiContattati.length) pezzi.push(`${voce.maiContattati.length} mai contattati`);
      if (voce.fermi.length) pezzi.push(`${voce.fermi.length} fermi`);

      await push({
        titolo: `${totale} lead da lavorare`,
        messaggio: pezzi.join(' • '),
        url: APP_URL,
        username: utente.username
      });

      if (utente.email) {
        await email({
          a: utente.email,
          oggetto: `${totale} lead da lavorare oggi`,
          html: template({
            badge: 'Promemoria', titolo: `Ciao ${agente.split(' ')[0]}`,
            accento: voce.scaduti.length || voce.maiContattati.length ? '#ef4444' : '#c9a84c',
            righe:
              blocco('In ritardo', voce.scaduti.map(v =>
                `${v.cliente}${v.progetto ? ` — ${v.progetto}` : ''} (${v.tipo}, era il ${formattaData(v.data)})`)) +
              blocco('Oggi', voce.oggi.map(v =>
                `${v.cliente}${v.progetto ? ` — ${v.progetto}` : ''} (${v.tipo}${v.ora ? ` alle ${v.ora}` : ''})`)) +
              blocco('Mai contattati', voce.maiContattati.map(v =>
                `${v.cliente} — ${v.progetto} (da ${v.oreDaCreazione}h, fonte ${v.fonte || 'n/d'})`)) +
              blocco('Fermi da troppo', voce.fermi.map(v =>
                `${v.cliente} — ${v.progetto} (${v.stato}, ultimo contatto ${v.giorniDaContatto} giorni fa)`)),
            nota: 'Apri la scheda del lead, registra l\'attivita e programma il prossimo passo.'
          })
        });
      }
      inviati++;
    }

    // Follow-up senza assegnatario: nessuno li vedrebbe, quindi vanno all'admin.
    const orfani = followUps.filter(f => !f.assegnato_a);
    const leadOrfani = [...maiContattati, ...fermi].filter(l => !l.assegnato_a && !l.agente);

    if (riepilogoAdmin.length || orfani.length || leadOrfani.length) {
      await email({
        a: ADMIN_EMAIL,
        oggetto: 'Riepilogo lead da lavorare',
        html: template({
          badge: 'Riepilogo team', titolo: 'Situazione follow-up', accento: '#60a5fa',
          righe:
            riepilogoAdmin.map(r => riga(r.agente,
              `${r.totale} (${r.scaduti} in ritardo, ${r.maiContattati} mai contattati)`)).join('') +
            (orfani.length ? riga('Follow-up senza agente', orfani.length) : '') +
            (leadOrfani.length ? riga('Lead senza agente', leadOrfani.length) : ''),
          nota: orfani.length || leadOrfani.length
            ? 'Ci sono lead senza assegnatario: assegnali dal portale.'
            : null
        })
      });
      if (orfani.length || leadOrfani.length) {
        await push({
          titolo: 'Lead senza agente',
          messaggio: `${orfani.length + leadOrfani.length} da assegnare`,
          url: APP_URL
        });
      }
    }

    // Segno i follow-up avvisati, per non ripetere lo stesso promemoria
    // piu' volte nello stesso giorno.
    const idAvvisati = followUps.filter(f => f.assegnato_a).map(f => f.id);
    if (idAvvisati.length) {
      await supabase.from('follow_ups')
        .update({ reminder_inviato_at: new Date().toISOString() })
        .in('id', idAvvisati);
    }

    return res.status(200).json({
      ok: true,
      agenti_avvisati: inviati,
      follow_up: followUps.length,
      mai_contattati: maiContattati.length,
      fermi: fermi.length,
      senza_agente: orfani.length + leadOrfani.length
    });
  } catch (err) {
    console.error('Reminder follow-up:', err);
    return res.status(500).json({ error: err.message });
  }
}

function contaVoce(v) {
  return {
    totale: v.scaduti.length + v.oggi.length + v.maiContattati.length + v.fermi.length,
    scaduti: v.scaduti.length,
    oggi: v.oggi.length,
    maiContattati: v.maiContattati.length,
    fermi: v.fermi.length
  };
}

function blocco(titolo, voci) {
  if (!voci.length) return '';
  return `<div style="margin:0 0 14px">
    <div style="color:#0f1c35;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${titolo}</div>
    ${voci.map(v => `<div style="color:#334155;font-size:14px;padding:4px 0">• ${v}</div>`).join('')}
  </div>`;
}

function formattaData(d) {
  try {
    return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch { return d; }
}
