// Autenticazione del portale.
//
// Le password non sono piu' confrontate dal client: login, cambio password e
// gestione del team passano da funzioni SECURITY DEFINER sul database, e la
// sessione e' un token con scadenza registrato in app_sessions.
// Il profilo viene riletto dal server a ogni avvio: modificare il localStorage
// non basta piu' per diventare admin.

import { supabase } from './supabaseClient';

const CHIAVE_TOKEN = 'keyprime_token';
const CHIAVE_UTENTE = 'keyprime_user';

export function getToken() {
  try { return localStorage.getItem(CHIAVE_TOKEN); } catch { return null; }
}

function salvaSessione(token, utente) {
  try {
    localStorage.setItem(CHIAVE_TOKEN, token);
    localStorage.setItem(CHIAVE_UTENTE, JSON.stringify(utente));
  } catch {}
}

export function pulisciSessione() {
  try {
    localStorage.removeItem(CHIAVE_TOKEN);
    localStorage.removeItem(CHIAVE_UTENTE);
  } catch {}
}

export async function login(username, password) {
  const { data, error } = await supabase.rpc('app_login', {
    p_username: username,
    p_password: password
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile, riprova' };
  if (!data?.ok) return { ok: false, error: data?.error || 'Credenziali non valide' };

  salvaSessione(data.token, data.user);
  return { ok: true, user: data.user, token: data.token };
}

// Ripristino sessione all'avvio: la verita' sul ruolo arriva dal server.
export async function ripristinaSessione() {
  const token = getToken();
  if (!token) return { ok: false };

  const { data, error } = await supabase.rpc('app_session_validate', { p_token: token });
  if (error) {
    // Database irraggiungibile: tengo il profilo in cache per non buttare
    // fuori l'agente a ogni blip di rete, ma segnalo che non e' verificato.
    try {
      const cache = localStorage.getItem(CHIAVE_UTENTE);
      if (cache) return { ok: true, user: JSON.parse(cache), nonVerificato: true };
    } catch {}
    return { ok: false };
  }
  if (!data?.ok) { pulisciSessione(); return { ok: false }; }

  salvaSessione(token, data.user);
  return { ok: true, user: data.user };
}

export async function logout() {
  const token = getToken();
  pulisciSessione();
  if (token) { try { await supabase.rpc('app_logout', { p_token: token }); } catch {} }
}

export async function cambiaPassword(vecchia, nuova) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('app_change_password', {
    p_token: token, p_old: vecchia, p_new: nuova
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Non riuscito' };
}

// --- Team (solo admin, autorizzazione verificata lato database) -------------

export async function caricaTeam() {
  const { data } = await supabase.from('team_members').select('*').order('nome');
  return data || [];
}

export async function salvaUtente(payload) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('app_user_upsert', {
    p_token: token, p_payload: payload
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true, user: data.user } : { ok: false, error: data?.error || 'Non riuscito' };
}

export async function impostaAttivo(id, attivo) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('app_user_set_active', {
    p_token: token, p_id: id, p_attivo: attivo
  });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true } : { ok: false, error: data?.error || 'Non riuscito' };
}

// Password iniziale leggibile, da consegnare al nuovo agente. Viene mostrata
// una volta sola: nel database resta solo l'hash.
export function generaPassword() {
  const parole = ['Dubai', 'Marina', 'Palma', 'Creek', 'Downtown', 'Harbour', 'Jumeirah'];
  const parola = parole[Math.floor(Math.random() * parole.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${parola}${numero}`;
}

// --- Controllo accessi (solo admin) ----------------------------------------

export async function sessioniAttive() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };
  const { data, error } = await supabase.rpc('app_sessioni_attive', { p_token: token });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true, sessioni: data.sessioni || [] } : { ok: false, error: data?.error };
}

// Butta fuori un utente da tutti i dispositivi.
export async function chiudiSessioni(userId) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };
  const { data, error } = await supabase.rpc('app_chiudi_sessioni', { p_token: token, p_user_id: userId });
  if (error) return { ok: false, error: 'Servizio non raggiungibile' };
  return data?.ok ? { ok: true, chiuse: data.sessioni_chiuse } : { ok: false, error: data?.error };
}
