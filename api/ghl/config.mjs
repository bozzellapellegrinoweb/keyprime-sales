// Scoperta della configurazione GHL, per popolare il pannello Impostazioni.
//
// Legge pipeline (con i loro stage) e workflow della location KeyPrime, cosi'
// l'admin li scegliere da un elenco invece di incollare id a mano. Serve anche
// da prova del collegamento: se il token o gli scope sono sbagliati, la
// risposta dice esattamente cosa ha rifiutato GHL.

import { serviceClient } from '../_lib/supabase.mjs';
import { requireSession } from '../_lib/auth.mjs';
import { ghlConfigured, listaPipeline, listaWorkflow, GHL_LOCATION_ID } from '../_lib/ghl.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const utente = await requireSession(req, res, supabase, { ruoli: ['admin'] });
  if (!utente) return;

  if (!ghlConfigured()) {
    return res.status(200).json({
      ok: false,
      configurato: false,
      messaggio: 'Mancano GHL_API_KEY o GHL_LOCATION_ID nelle variabili ambiente di Vercel.'
    });
  }

  const [pip, wf] = await Promise.all([listaPipeline(), listaWorkflow()]);

  const pipelines = (pip.ok ? estraiPipeline(pip.dati) : []);
  const workflows = (wf.ok ? estraiWorkflow(wf.dati) : []);

  return res.status(200).json({
    ok: pip.ok || wf.ok,
    configurato: true,
    location_id: GHL_LOCATION_ID,
    pipelines,
    workflows,
    diagnostica: {
      pipeline: pip.ok ? { esito: 'ok', version: pip.version, trovate: pipelines.length } : { esito: 'errore', tentativi: pip.tentativi },
      workflow: wf.ok ? { esito: 'ok', version: wf.version, trovati: workflows.length } : { esito: 'errore', tentativi: wf.tentativi }
    }
  });
}

// Le risposte GHL annidano gli elenchi in modo diverso fra versioni:
// a volte in `pipelines`, a volte direttamente in radice.
function estraiPipeline(dati) {
  const elenco = dati?.pipelines || dati?.data || (Array.isArray(dati) ? dati : []);
  return (elenco || []).map((p) => ({
    id: p.id || p._id,
    nome: p.name || p.title || '(senza nome)',
    stages: (p.stages || p.pipelineStages || []).map((s) => ({
      id: s.id || s._id,
      nome: s.name || s.title || '(senza nome)'
    }))
  })).filter((p) => p.id);
}

function estraiWorkflow(dati) {
  const elenco = dati?.workflows || dati?.data || (Array.isArray(dati) ? dati : []);
  return (elenco || []).map((w) => ({
    id: w.id || w._id,
    nome: w.name || w.title || '(senza nome)',
    stato: w.status || null
  })).filter((w) => w.id);
}
