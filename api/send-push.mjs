// Notifiche push dal client (OneSignal). Richiede una sessione valida; solo
// admin e agente_admin possono spedire a tutti o a un altro utente.

import { serviceClient } from './_lib/supabase.mjs';
import { requireSession } from './_lib/auth.mjs';
import { push } from './_lib/notify.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-kp-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const utente = await requireSession(req, res, supabase);
  if (!utente) return;

  const { title, message, url, target } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: 'Servono title e message' });

  const tipo = target?.type || 'admin';
  const versoAltri = tipo === 'all' || (tipo === 'user' && target?.username !== utente.username);
  if (versoAltri && !['admin', 'agente_admin'].includes(utente.ruolo)) {
    return res.status(403).json({ error: 'Non puoi inviare notifiche ad altri utenti' });
  }

  const esito = await push({
    titolo: title,
    messaggio: message,
    url,
    // Senza username notify.push decide da se': segmento completo per 'all',
    // filtro sul ruolo per 'admin'.
    username: tipo === 'user' ? target?.username : null,
    tutti: tipo === 'all'
  });

  if (!esito || esito.errors) {
    return res.status(502).json({ error: esito?.errors || 'Invio push fallito' });
  }
  return res.status(200).json({ success: true, recipients: esito.recipients, id: esito.id });
}
