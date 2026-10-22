// Verifica della sessione per gli endpoint serverless.
//
// Il token e' quello emesso da app_login e vive nel localStorage del client.
// Serve a impedire che /api/send-email e /api/send-push restino relay aperti:
// prima bastava conoscere l'URL per spedire email dal dominio KeyPrime.

export function tokenFromRequest(req) {
  const header = req.headers['x-kp-token'] || req.headers['X-KP-Token'];
  if (header) return String(header);
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return (req.body && req.body.kpToken) || null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ritorna l'utente della sessione, oppure null.
//
// La verifica passa dalla funzione app_session_validate, che gira con i
// privilegi del proprietario: funziona quindi anche con la sola chiave
// pubblica, e non restituisce mai l'hash della password.
export async function sessionUser(req, supabase) {
  const token = tokenFromRequest(req);
  if (!token || !UUID.test(token)) return null;

  const { data, error } = await supabase.rpc('app_session_validate', { p_token: token });
  if (error || !data?.ok) return null;

  const u = data.user;
  if (!u || u.attivo !== true) return null;
  return u;
}

// Blocca la richiesta se non c'e' una sessione valida (ed eventualmente il ruolo giusto).
export async function requireSession(req, res, supabase, { ruoli } = {}) {
  const user = await sessionUser(req, supabase);
  if (!user) {
    res.status(401).json({ error: 'Sessione non valida o scaduta' });
    return null;
  }
  if (ruoli && !ruoli.includes(user.ruolo)) {
    res.status(403).json({ error: 'Permessi insufficienti' });
    return null;
  }
  return user;
}

// I cron di Vercel e i webhook esterni non hanno sessione: usano un segreto.
export function checkSecret(req, envName) {
  const expected = process.env[envName];
  if (!expected) return { ok: false, error: `${envName} non configurata` };

  const provided =
    req.headers['x-kp-secret'] ||
    (req.query && req.query.secret) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (!provided || String(provided) !== String(expected)) {
    return { ok: false, error: 'Segreto non valido' };
  }
  return { ok: true };
}

// Vercel firma le chiamate cron con CRON_SECRET; in alternativa accettiamo il
// nostro segreto, utile per lanciare il job a mano durante il collaudo.
export function checkCron(req) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (cronSecret && auth === `Bearer ${cronSecret}`) return { ok: true };

  const conSegreto = checkSecret(req, 'KP_JOB_SECRET');
  if (conSegreto.ok) return { ok: true };

  // Senza alcun segreto configurato il cron di Vercel non riuscirebbe a
  // partire. L'intestazione x-vercel-cron e' falsificabile, quindi non vale
  // come autenticazione: il job e' pero' reso innocuo alla ripetizione (non
  // riavvisa sullo stesso follow-up entro 12 ore), cosi' una chiamata
  // abusiva non produce altro che una risposta vuota.
  if (!cronSecret && !process.env.KP_JOB_SECRET && req.headers['x-vercel-cron']) {
    return { ok: true, senzaSegreto: true };
  }
  return conSegreto;
}
