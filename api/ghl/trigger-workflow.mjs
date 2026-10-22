// Mette il contatto dentro un workflow GHL: e' il modo per far partire le
// sequenze di nurturing (recupero lead freddo, post-visita, benvenuto) senza
// che l'agente faccia nulla a mano.
//
// I workflow utilizzabili si configurano in app_settings.key='ghl' come
// { "workflows": { "recupero_freddo": "<workflowId>", ... } }, cosi' il client
// chiede un nome leggibile e non deve conoscere gli id GHL.

import { serviceClient } from '../_lib/supabase.mjs';
import { requireSession, checkCron } from '../_lib/auth.mjs';
import { ghlConfigured, upsertContact, addContactToWorkflow, logSync } from '../_lib/ghl.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  // Lo chiamano sia l'agente dal portale sia i job automatici.
  const cron = checkCron(req);
  let utente = null;
  if (!cron.ok) {
    utente = await requireSession(req, res, supabase);
    if (!utente) return;
  }

  if (!ghlConfigured()) {
    return res.status(503).json({ error: 'GHL non configurato (GHL_API_KEY / GHL_LOCATION_ID)' });
  }

  const { sale_id, cliente_id, workflow, workflow_id, quando } = req.body || {};

  try {
    const { data: cfgRow } = await supabase
      .from('app_settings').select('value').eq('key', 'ghl').maybeSingle();
    const workflows = cfgRow?.value?.workflows || {};
    const idWorkflow = workflow_id || (workflow ? workflows[workflow] : null);

    if (!idWorkflow) {
      return res.status(400).json({
        error: workflow
          ? `Workflow "${workflow}" non mappato in app_settings.ghl.workflows`
          : 'Serve workflow (nome mappato) o workflow_id'
      });
    }

    let sale = null;
    if (sale_id) {
      const { data } = await supabase.from('sales').select('*').eq('id', sale_id).maybeSingle();
      sale = data;
    }
    const idCliente = cliente_id || sale?.cliente_id;
    if (!idCliente) return res.status(400).json({ error: 'Serve sale_id o cliente_id' });

    const { data: cliente } = await supabase.from('clienti').select('*').eq('id', idCliente).maybeSingle();
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    let contactId = sale?.ghl_contact_id || cliente.ghl_contact_id;
    if (!contactId) {
      const creato = await upsertContact({
        nome: cliente.nome, cognome: cliente.cognome, email: cliente.email,
        telefono: cliente.telefono, source: cliente.fonte || 'KeyPrime Portal'
      });
      contactId = creato?.contact?.id || creato?.id || null;
      if (!contactId) return res.status(502).json({ error: 'GHL non ha restituito un contact id' });
      await supabase.from('clienti').update({ ghl_contact_id: contactId }).eq('id', cliente.id);
    }

    const esito = await addContactToWorkflow(contactId, idWorkflow, quando || undefined);

    if (sale) {
      await supabase.from('lead_activities').insert([{
        sale_id: sale.id,
        tipo: 'note',
        created_by: utente?.nome || 'sistema',
        contenuto: `Avviata sequenza GHL "${workflow || idWorkflow}"`
      }]);
    }

    await logSync(supabase, {
      direzione: 'out', evento: 'workflow', entita: 'workflow', entita_id: idWorkflow,
      sale_id: sale?.id || null, cliente_id: cliente.id,
      payload: { workflow, esito, eseguito_da: utente?.nome || 'sistema' }
    });

    return res.status(200).json({ ok: true, workflow_id: idWorkflow, esito });
  } catch (err) {
    console.error('Workflow GHL:', err);
    await logSync(supabase, {
      direzione: 'out', evento: 'workflow', entita: 'workflow',
      sale_id: sale_id || null, cliente_id: cliente_id || null,
      esito: 'errore', errore: err.message, payload: err.body || null
    });
    return res.status(502).json({ error: err.message, dettaglio: err.body || null });
  }
}
