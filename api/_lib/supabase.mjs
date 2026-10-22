import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wqtylxrrerhbxagdzftn.supabase.co';

// La service_role key sta solo nelle env di Vercel: non deve tornare nel repo.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function serviceClient() {
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurata nelle variabili ambiente');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Molti handler devono solo rispondere 500 in modo pulito se la chiave manca.
export function withService(handler) {
  return async (req, res) => {
    let supabase;
    try {
      supabase = serviceClient();
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    return handler(req, res, supabase);
  };
}
