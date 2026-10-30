// Annunci propri dell'agenzia: lettura, scrittura, vetrina.
//
// A differenza del resto del portale qui non si parla con la tabella: si
// passa dalle funzioni sul database. La tabella e' chiusa in scrittura e,
// dall'esterno, mostra solo gli annunci pubblicati — perche' quella stessa
// tabella la legge il sito pubblico con la chiave anonima, che chiunque puo'
// prendersi dal bundle. Le bozze non devono uscire di qui.
//
// Il token della sessione viaggia come primo argomento: le funzioni girano
// coi privilegi del proprietario e decidono loro cosa puo' fare chi chiama.

import { supabase } from './supabaseClient';
import { getToken } from './auth';

export const BUCKET_FOTO = 'immobili-foto';

export const CONTRATTI = [
  { id: 'vendita', label: 'Vendita' },
  { id: 'affitto', label: 'Affitto' }
];

export const TIPOLOGIE = [
  'Appartamento', 'Villa', 'Townhouse', 'Attico', 'Studio',
  'Ufficio', 'Negozio', 'Magazzino', 'Terreno'
];

export const STATI = [
  { id: 'disponibile', label: 'Disponibile' },
  { id: 'riservato',   label: 'Riservato' },
  { id: 'venduto',     label: 'Venduto' },
  { id: 'affittato',   label: 'Affittato' },
  { id: 'ritirato',    label: 'Ritirato' }
];

export const ARREDATO = [
  { id: 'no',       label: 'Non arredato' },
  { id: 'parziale', label: 'Parzialmente arredato' },
  { id: 'si',       label: 'Arredato' }
];

export const DOTAZIONI = [
  'Piscina', 'Palestra', 'Parcheggio', 'Vista mare', 'Vista città', 'Balcone',
  'Giardino', 'Portineria 24h', 'Area bimbi', 'Animali ammessi', 'Cucina attrezzata',
  'Aria condizionata centralizzata', 'Ripostiglio', 'Camera di servizio'
];

/* A Dubai l'affitto si quota per anno, non per mese: il campo prezzo vuole
   dire due cose a seconda del contratto, e l'etichetta lo deve dire. */
export const etichettaPrezzo = (contratto) =>
  contratto === 'affitto' ? 'Canone annuo (AED)' : 'Prezzo (AED)';

export const prezzoLeggibile = (immobile) => {
  const n = Number(immobile?.prezzo || 0);
  if (!(n > 0)) return 'Prezzo su richiesta';
  const cifra = `AED ${n.toLocaleString('it-IT')}`;
  return immobile.contratto === 'affitto' ? `${cifra}/anno` : cifra;
};

export const primaFoto = (immobile) => {
  const foto = Array.isArray(immobile?.foto) ? immobile.foto : [];
  return foto.length ? foto[0].url : null;
};

/* ── Dati ──────────────────────────────────────────────────────────────── */

export async function caricaImmobili() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra', elenco: [] };

  const { data, error } = await supabase.rpc('immobili_elenco', { p_token: token });
  if (error) return { ok: false, error: error.message, elenco: [] };
  return { ok: true, elenco: data || [] };
}

export async function salvaImmobile(payload) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('immobile_salva', {
    p_token: token,
    p_payload: payload
  });
  if (error) return { ok: false, error: error.message };
  return data;
}

/* La funzione rifiuta di pubblicare un annuncio senza prezzo, zona, foto o
   descrizione, e dice quale manca: una pagina mezza vuota sotto il dominio
   dell'agenzia fa piu' danno che non averla. */
export async function pubblicaImmobile(id, pubblicato) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('immobile_pubblica', {
    p_token: token,
    p_id: id,
    p_pubblicato: pubblicato
  });
  if (error) return { ok: false, error: error.message };
  return data;
}

export async function eliminaImmobile(id) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Sessione scaduta, rientra' };

  const { data, error } = await supabase.rpc('immobile_elimina', { p_token: token, p_id: id });
  if (error) return { ok: false, error: error.message };
  return data;
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

export async function caricaFoto(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const nome = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_FOTO)
    .upload(nome, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(BUCKET_FOTO).getPublicUrl(nome);
  return { ok: true, url: data.publicUrl };
}

/* Indirizzo pubblico dell'annuncio sulla vetrina. Il dominio sta in una
   variabile d'ambiente perche' in collaudo la vetrina e' altrove. */
export const SITO_VETRINA =
  process.env.REACT_APP_SITO_VETRINA || 'https://www.keyprimere.com';

export const linkVetrina = (immobile) =>
  immobile?.slug ? `${SITO_VETRINA}/immobili/${immobile.slug}` : null;
