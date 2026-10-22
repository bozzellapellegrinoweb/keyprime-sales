// Regole per decidere cosa lavorare adesso.
//
// La coda di lavoro non e' un elenco di lead: e' un elenco di azioni ordinate
// per urgenza. Un lead appena arrivato e mai chiamato viene prima di un
// follow-up programmato fra tre giorni, e un lead fermo da due settimane viene
// prima di uno toccato ieri.

import { supabase } from './supabaseClient';
import { getToken } from './auth';

export const SLA_PREDEFINITO = {
  primo_contatto_ore: 24,
  lead_fermo_giorni: 7,
  trattativa_ferma_giorni: 14
};

export const TEMPERATURE = {
  hot: { label: 'Caldo', colore: '#ef4444', emoji: '🔥' },
  warm: { label: 'Tiepido', colore: '#f59e0b', emoji: '🌤' },
  cold: { label: 'Freddo', colore: '#60a5fa', emoji: '❄️' }
};

export const TIPI_ATTIVITA = [
  { id: 'call', label: 'Chiamata', icona: '📞' },
  { id: 'whatsapp', label: 'WhatsApp', icona: '💬' },
  { id: 'email', label: 'Email', icona: '📧' },
  { id: 'meeting', label: 'Incontro', icona: '🤝' },
  { id: 'viewing', label: 'Visita', icona: '🏠' },
  { id: 'note', label: 'Nota', icona: '📝' }
];

const GIORNO = 86400000;
const ORA = 3600000;

export const giorniDa = (d) => (d ? (Date.now() - new Date(d).getTime()) / GIORNO : null);
export const oreDa = (d) => (d ? (Date.now() - new Date(d).getTime()) / ORA : null);

export const inRitardo = (d) => Boolean(d) && new Date(d) < new Date();
export const eOggi = (d) => Boolean(d) && new Date(d).toDateString() === new Date().toDateString();

const STATI_APERTI = ['lead', 'trattativa', 'EOI'];
export const eAperto = (lead) => STATI_APERTI.includes(lead?.stato || 'lead');

// Un lead "mio" e' quello assegnato a me; per i dati storici, dove
// assegnato_a non era ancora compilato, vale anche il campo agente.
export function eMio(lead, nomeUtente) {
  if (!nomeUtente) return false;
  if (lead.assegnato_a) return lead.assegnato_a === nomeUtente;
  return lead.agente === nomeUtente || lead.segnalatore === nomeUtente;
}

// --- Diagnosi del lead ------------------------------------------------------

// Perche' questo lead chiede attenzione, e quanto.
export function valutaLead(lead, sla = SLA_PREDEFINITO) {
  if (!eAperto(lead)) return null;

  const eta = giorniDa(lead.created_at);
  const daContatto = giorniDa(lead.ultimo_contatto_at);

  if (!lead.ultimo_contatto_at) {
    const ore = oreDa(lead.created_at) || 0;
    const scaduto = ore > (sla.primo_contatto_ore ?? 24);
    return {
      motivo: scaduto ? 'Mai contattato, fuori SLA' : 'Mai contattato',
      urgenza: scaduto ? 100 : 80,
      gravita: scaduto ? 'critica' : 'alta',
      dettaglio: `Arrivato ${ore < 24 ? `${Math.round(ore)} ore` : `${Math.round(eta)} giorni`} fa`
    };
  }

  const soglia = lead.stato === 'lead'
    ? (sla.lead_fermo_giorni ?? 7)
    : (sla.trattativa_ferma_giorni ?? 14);

  if (daContatto > soglia) {
    return {
      motivo: 'Fermo da troppo tempo',
      // oltre il doppio della soglia resta critico, senza crescere all'infinito
      urgenza: Math.min(95, 55 + (daContatto - soglia) * 4),
      gravita: daContatto > soglia * 2 ? 'critica' : 'alta',
      dettaglio: `Ultimo contatto ${Math.round(daContatto)} giorni fa`
    };
  }

  if (!lead.prossima_azione_at) {
    return {
      motivo: 'Nessun prossimo passo',
      urgenza: 45,
      gravita: 'media',
      dettaglio: `Ultimo contatto ${Math.round(daContatto)} giorni fa`
    };
  }

  return null;
}

// --- Coda di lavoro ---------------------------------------------------------

// Mette in fila follow-up e lead scoperti, dal piu' urgente.
export function costruisciCoda({ leads = [], followUps = [], clienti = [], nomeUtente, sla = SLA_PREDEFINITO, soloMiei = true }) {
  const perId = new Map(clienti.map((c) => [c.id, c]));
  const nomeCliente = (id) => {
    const c = perId.get(id);
    return c ? `${c.nome} ${c.cognome || ''}`.trim() : null;
  };

  const mieiLead = soloMiei ? leads.filter((l) => eMio(l, nomeUtente)) : leads;
  const idMieiLead = new Set(mieiLead.map((l) => l.id));
  const voci = [];

  // 1. Follow-up programmati, scaduti o di oggi.
  for (const f of followUps) {
    if (f.completato) continue;
    if (soloMiei && f.assegnato_a && f.assegnato_a !== nomeUtente) continue;
    if (soloMiei && !f.assegnato_a && f.sale_id && !idMieiLead.has(f.sale_id)) continue;

    const scaduto = f.data_reminder < new Date().toISOString().split('T')[0];
    const oggi = eOggi(f.data_reminder);
    if (!scaduto && !oggi) continue;

    const lead = leads.find((l) => l.id === f.sale_id);
    voci.push({
      chiave: `fu-${f.id}`,
      genere: 'follow-up',
      followUp: f,
      lead,
      cliente: nomeCliente(f.cliente_id ?? lead?.cliente_id),
      titolo: nomeCliente(f.cliente_id ?? lead?.cliente_id) || lead?.progetto || 'Follow-up',
      sottotitolo: lead?.progetto,
      motivo: scaduto ? 'Follow-up in ritardo' : 'Follow-up di oggi',
      dettaglio: f.nota || TIPI_ATTIVITA.find((t) => t.id === f.tipo)?.label || 'Contatto',
      urgenza: scaduto ? 100 : 90,
      gravita: scaduto ? 'critica' : 'alta'
    });
  }

  // 2. Lead che chiedono attenzione e non hanno gia' un follow-up in coda.
  const conFollowUp = new Set(voci.map((v) => v.followUp?.sale_id).filter(Boolean));
  for (const lead of mieiLead) {
    if (conFollowUp.has(lead.id)) continue;
    const diagnosi = valutaLead(lead, sla);
    if (!diagnosi) continue;

    voci.push({
      chiave: `lead-${lead.id}`,
      genere: 'lead',
      lead,
      cliente: nomeCliente(lead.cliente_id),
      titolo: nomeCliente(lead.cliente_id) || lead.progetto,
      sottotitolo: lead.progetto,
      motivo: diagnosi.motivo,
      dettaglio: diagnosi.dettaglio,
      urgenza: diagnosi.urgenza,
      gravita: diagnosi.gravita
    });
  }

  return voci.sort((a, b) => b.urgenza - a.urgenza);
}

// --- Follow-up --------------------------------------------------------------

export function fraGiorni(n, ora = '09:00') {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return { data_reminder: d.toISOString().split('T')[0], ora_reminder: ora };
}

export async function programmaFollowUp({ saleId, clienteId, giorni, tipo = 'call', nota, assegnatoA, creatoDa }) {
  const quando = fraGiorni(giorni);
  const { error } = await supabase.from('follow_ups').insert([{
    sale_id: saleId,
    cliente_id: clienteId,
    tipo,
    nota,
    assegnato_a: assegnatoA,
    creato_da: creatoDa,
    ...quando
  }]);
  if (error) return { ok: false, error: error.message };

  // Il lead porta con se' la data del prossimo passo: serve alla coda di lavoro
  // e agli allarmi, senza dover rileggere tutti i follow-up.
  if (saleId) {
    await supabase.from('sales')
      .update({ prossima_azione_at: `${quando.data_reminder}T${quando.ora_reminder}:00` })
      .eq('id', saleId);
  }
  return { ok: true, quando };
}

export async function completaFollowUp(id, esito) {
  const { error } = await supabase.from('follow_ups')
    .update({ completato: true, completato_at: new Date().toISOString(), esito })
    .eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function registraAttivita({ saleId, tipo, contenuto, autore }) {
  const { error } = await supabase.from('lead_activities')
    .insert([{ sale_id: saleId, tipo, contenuto, created_by: autore }]);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// --- Assegnazione -----------------------------------------------------------

export async function assegnaLead(saleIds, agente) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('app_assign_manual', {
    p_token: token,
    p_sale_ids: Array.isArray(saleIds) ? saleIds : [saleIds],
    p_agente: agente || null
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true, aggiornati: data.aggiornati } : { ok: false, error: data?.error };
}

export async function assegnaARotazione(saleId, eseguitoDa) {
  const { data, error } = await supabase.rpc('app_assign_round_robin', {
    p_sale_id: saleId,
    p_eseguito_da: eseguitoDa || 'portale'
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true, agente: data.agente } : { ok: false, error: data?.error };
}

export async function salvaImpostazioni(key, value) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('app_settings_set', {
    p_token: token, p_key: key, p_value: value
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Non riuscito' };
}

export async function caricaImpostazioni() {
  const { data } = await supabase.from('app_settings').select('key, value');
  const mappa = {};
  for (const r of data || []) mappa[r.key] = r.value;
  return mappa;
}

// --- Commissioni ------------------------------------------------------------

// Percentuale che spetta all'agente su un lead.
// Default 70. L'override per persona vive su user_credentials.commission_pct.
// Per agente_admin resta la regola societaria legata al referente, come prima.
export function percentualeAgente(lead, utenteAgente) {
  if (utenteAgente?.ruolo === 'agente_admin') {
    return lead?.referente === 'Giovanni' ? 70 : 30;
  }
  const pct = utenteAgente?.commission_pct;
  return pct === null || pct === undefined ? 70 : Number(pct);
}

export function commissioneAgente(lead, utenteAgente) {
  const venduto = lead?.stato === 'venduto' || lead?.stato === 'incassato';
  if (!venduto) return 0;
  const totale = Number(lead.valore || 0) * (lead.commission_pct || 5) / 100;
  return totale * percentualeAgente(lead, utenteAgente) / 100;
}
