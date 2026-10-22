import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wqtylxrrerhbxagdzftn.supabase.co';

// Chiave pubblica: la stessa che gira gia' nel bundle del portale, quindi non
// e' un segreto e puo' stare qui.
const ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ';

// La service_role, quando c'e', scavalca RLS. Non e' piu' obbligatoria:
// gli handler funzionano anche con la sola chiave pubblica, perche' le
// operazioni delicate passano da funzioni SECURITY DEFINER sul database,
// che non espongono mai gli hash delle password.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const hasServiceKey = Boolean(SERVICE_KEY);

export function db() {
  return createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Nome storico, usato dagli handler gia' scritti.
export const serviceClient = db;
