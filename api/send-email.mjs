// Invio email dal client. Richiede una sessione valida: prima bastava
// conoscere l'URL per spedire email dal dominio KeyPrime.

import { serviceClient } from './_lib/supabase.mjs';
import { requireSession } from './_lib/auth.mjs';
import { email as inviaEmail } from './_lib/notify.mjs';

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

  const { to, subject, html } = req.body || {};
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Servono to, subject e html' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY non configurata' });
  }

  const esito = await inviaEmail({ a: to, oggetto: subject, html });
  if (!esito || esito.error) {
    return res.status(502).json({ error: esito?.error || 'Invio fallito' });
  }
  return res.status(200).json({ success: true, data: esito });
}
