import { createClient } from '@supabase/supabase-js';

// Un solo client per tutta l'app: due istanze aprirebbero due canali realtime.
export const SUPABASE_URL = 'https://wqtylxrrerhbxagdzftn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
