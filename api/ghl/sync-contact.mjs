// Portale -> GHL: allinea contatto e opportunita'.
//
// Chiamato dal portale a ogni creazione di cliente e a ogni cambio di stato del
// lead, cosi' le automazioni GHL girano su dati veri invece che su una copia
// vecchia. Richiede una sessione valida: non e' un endpoint pubblico.

import { serviceClient } from '../_lib/supabase.mjs';
import { requireSession } from '../_lib/auth.mjs';
import {
  ghlConfigured, upsertContact, createOpportunity, updateOpportunity, addContactTags, logSync
} from '../_lib/ghl.mjs';

// Lo stato della pipeline KeyPrime diventa stato dell'opportunita' GHL.
const STATO_OPPORTUNITA = {
  lead: 'open', trattativa: 'open', EOI: 'open',
  venduto: 'won', incassato: 'won', perso: 'lost'
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const utente = await requireSession(req, res, supabase);
  if (!utente) return;

  if (!ghlConfigured()) {
    return res.status(503).json({ error: 'GHL non configurato (GHL_API_KEY / GHL_LOCATION_ID)' });
  }

  const { sale_id, cliente_id } = req.body || {};
  if (!sale_id && !cliente_id) return res.status(400).json({ error: 'Serve sale_id o cliente_id' });

  try {
    let sale = null;
    let cliente = null;

    if (sale_id) {
      const { data } = await supabase.from('sales').select('*').eq('id', sale_id).maybeSingle();
      sale = data;
      if (sale?.cliente_id) {
        const { data: c } = await supabase.from('clienti').select('*').eq('id', sale.cliente_id).maybeSingle();
        cliente = c;
      }
    } else {
      const { data } = await supabase.from('clienti').select('*').eq('id', cliente_id).maybeSingle();
      cliente = data;
    }

    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    const { data: cfgRow } = await supabase
      .from('app_settings').select('value').eq('key', 'ghl').maybeSingle();
    const cfg = cfgRow?.value || {};
    const prefisso = cfg.tag_prefix || 'kp-';

    // 1. Contatto.
    const tags = [`${prefisso}portale`];
    if (sale?.stato) tags.push(`${prefisso}${sale.stato}`);
    if (sale?.assegnato_a) tags.push(`${prefisso}agente-${slug(sale.assegnato_a)}`);
    if (cliente.fonte) tags.push(`${prefisso}fonte-${slug(cliente.fonte)}`);

    const risposta = await upsertContact({
      nome: cliente.nome,
      cognome: cliente.cognome,
      email: cliente.email,
      telefono: cliente.telefono,
      source: cliente.fonte || 'KeyPrime Portal',
      tags
    });

    const contactId =
      risposta?.contact?.id || risposta?.id || cliente.ghl_contact_id || null;

    if (contactId && contactId !== cliente.ghl_contact_id) {
      await supabase.from('clienti').update({ ghl_contact_id: contactId }).eq('id', cliente.id);
    }
    if (contactId && sale && contactId !== sale.ghl_contact_id) {
      await supabase.from('sales').update({ ghl_contact_id: contactId }).eq('id', sale.id);
    }

    // 2. Opportunita', solo se la pipeline GHL e' stata mappata.
    let opportunityId = sale?.ghl_opportunity_id || null;
    let opportunitaEsito = 'saltata';

    if (sale && contactId && cfg.pipeline_id) {
      const stageId = (cfg.stage_map || {})[sale.stato] || null;
      const stato = STATO_OPPORTUNITA[sale.stato] || 'open';
      const nome = `${sale.progetto} - ${cliente.nome} ${cliente.cognome || ''}`.trim();

      if (opportunityId) {
        await updateOpportunity(opportunityId, {
          pipelineStageId: stageId, nome, valore: sale.valore, status: stato
        });
        opportunitaEsito = 'aggiornata';
      } else {
        const opp = await createOpportunity({
          pipelineId: cfg.pipeline_id, pipelineStageId: stageId,
          nome, contactId, valore: sale.valore, status: stato
        });
        opportunityId = opp?.opportunity?.id || opp?.id || null;
        if (opportunityId) {
          await supabase.from('sales').update({ ghl_opportunity_id: opportunityId }).eq('id', sale.id);
        }
        opportunitaEsito = 'creata';
      }
    } else if (sale && contactId) {
      // Senza pipeline mappata restano i tag: le automazioni GHL possono
      // comunque reagire al cambio di stato.
      await addContactTags(contactId, [`${prefisso}${sale.stato}`]).catch(() => {});
    }

    await logSync(supabase, {
      direzione: 'out', evento: 'sync_contatto', entita: 'contact', entita_id: contactId,
      sale_id: sale?.id || null, cliente_id: cliente.id,
      payload: { opportunita: opportunitaEsito, opportunity_id: opportunityId, eseguito_da: utente.nome }
    });

    return res.status(200).json({ ok: true, contact_id: contactId, opportunity_id: opportunityId, opportunita: opportunitaEsito });
  } catch (err) {
    console.error('Sync GHL:', err);
    await logSync(supabase, {
      direzione: 'out', evento: 'sync_contatto', entita: 'contact',
      sale_id: sale_id || null, cliente_id: cliente_id || null,
      esito: 'errore', errore: err.message, payload: err.body || null
    });
    return res.status(502).json({ error: err.message, dettaglio: err.body || null });
  }
}

function slug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
