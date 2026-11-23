import { createClient } from '@supabase/supabase-js';

// Un solo client per tutta l'app: due istanze aprirebbero due canali realtime.
export const SUPABASE_URL = 'https://wqtylxrrerhbxagdzftn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ';

/* Ogni richiesta porta con se' il token di sessione del portale.
 *
 * Serve perche' sales e clienti hanno RLS, e le policy chiedono al database
 * chi sta parlando leggendo questa intestazione (PostgREST passa le
 * intestazioni della richiesta a SQL). Senza, la chiave pubblica non vede piu'
 * niente — che e' esattamente il punto: prima chiunque l'avesse, e sta nel
 * bundle, leggeva e scriveva tutta la rubrica.
 *
 * Si passa da un fetch nostro e non da global.headers perche' quelle si
 * fissano alla creazione del client, mentre il token cambia a ogni login e
 * sparisce all'uscita: qui si rilegge a ogni chiamata.
 */
const CHIAVE_TOKEN = 'keyprime_token';

function fetchConSessione(input, init = {}) {
  let token = null;
  try { token = localStorage.getItem(CHIAVE_TOKEN); } catch { /* finestra privata */ }

  if (!token) return fetch(input, init);

  const headers = new Headers(init.headers || {});
  headers.set('x-kp-token', token);
  return fetch(input, { ...init, headers });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchConSessione }
});

export default supabase;
