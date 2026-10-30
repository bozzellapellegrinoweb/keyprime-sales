// Catalogo off-plan: forma dei dati e ricerca.
//
// La trasformazione da riga di pf_projects a oggetto "listing" viveva dentro
// searchListings. E' uscita di li' perche' adesso serve in due posti: la
// griglia dei risultati e i suggerimenti della barra di ricerca, che aprono
// la scheda di un progetto senza passare da una ricerca completa. Due copie
// della stessa mappatura sarebbero divergite al primo campo aggiunto.

/* Colonne che bastano a disegnare una scheda. Il raw_data e' grosso (mezzo
   megabyte su certi progetti): per i suggerimenti non si tira giu'. */
export const COLONNE_SUGGERIMENTO =
  'project_id, title, location_name, location_full, developer_name, price_from, ' +
  'bedrooms, delivery_date, construction_phase, hotness_level, images, payment_plans, url, brochure_url';

export function trasformaProgetto(p) {
  return {
    project_id: p.project_id,
    title: p.title,
    location: { name: p.location_name, full_name: p.location_full },
    developer: { name: p.developer_name, logo: p.raw_data?.developer?.logo },
    price_from: p.price_from,
    bedrooms: p.bedrooms,
    delivery_date: p.delivery_date,
    construction_phase_key: p.construction_phase,
    hotness_level: p.hotness_level,
    images: p.images || [],
    payment_plans: p.payment_plans,
    url: p.url,
    brochure_url: p.brochure_url || p.raw_data?.brochure?.url || p.raw_data?.brochure ||
      (p.project_id && p.project_id.includes('-')
        ? `https://new-projects-media.propertyfinder.com/project/${p.project_id}/brochure/application/original.pdf`
        : null)
  };
}

/* La zona vera sta dentro location_full, non in location_name.
   PropertyFinder incatena "emirato,area,progetto" — "Dubai,Al Jaddaf,Binghatti
   Starfall" — e in location_name mette spesso l'ultimo anello, cioe' il nome
   del progetto. Preso cosi' com'e', fra le zone suggerite comparivano
   "Binghatti Cullinan" e "Binghatti Moonlight": nomi di palazzi, non quartieri
   dove cercare casa. L'area e' il secondo anello. */
/* "Dubai,Majan" si legge come un errore di battitura. La catena di
   PropertyFinder non ha spazi dopo la virgola: qui si separa con un punto
   mediano, che e' anche piu' corto in una card stretta. */
export function luogoLeggibile(locationFull, locationName) {
  const pezzi = String(locationFull || locationName || '')
    .split(',').map((x) => x.trim()).filter(Boolean);
  return pezzi.join(' · ');
}

export function zonaDi(locationFull, locationName, titolo) {
  const pezzi = String(locationFull || '').split(',').map((x) => x.trim()).filter(Boolean);
  let zona = pezzi.length >= 2 ? pezzi[1] : (pezzi[0] || locationName || '');

  // E non sempre la virgola c'e': su certi progetti l'ultimo anello e'
  // attaccato all'area da uno spazio — "Dubai,Al Jaddaf Binghatti Starlight".
  // Se la zona finisce col nome del progetto, quel pezzo si taglia.
  const t = String(titolo || '').trim();
  if (t && zona.length > t.length && zona.toLowerCase().endsWith(t.toLowerCase())) {
    zona = zona.slice(0, zona.length - t.length).trim();
  }
  return zona;
}

/* PostgREST passa i filtri nella query string, dove la virgola separa le
   condizioni di un or() e le parentesi le raggruppano. Un progetto che si
   chiama "Binghatti Tulip (Phase 2)" romperebbe la query. */
function perFiltro(testo) {
  return testo.replace(/[,()*\\]/g, ' ').trim();
}

/* Chi cerca "tuli" vuole Tulip in cima, non un progetto che ha "tuli" a meta'
   di una parola lunga. PostgREST non sa ordinare per questo, quindi si
   riordina qui: prima chi comincia cosi', poi chi comincia una parola cosi',
   poi tutti gli altri. */
function rilevanza(nome, cerca) {
  const n = (nome || '').toLowerCase();
  const c = cerca.toLowerCase();
  if (n.startsWith(c)) return 0;
  if (n.split(/[\s-]+/).some((parola) => parola.startsWith(c))) return 1;
  return 2;
}

/**
 * Suggerimenti per la barra di ricerca: progetti, developer e zone.
 * I progetti arrivano interi (si aprono con un clic); developer e zone sono
 * nomi, e riempiono il filtro corrispondente.
 */
export async function cercaSuggerimenti(supabase, testo, { soloAttivi = true } = {}) {
  const cerca = perFiltro(testo);
  if (cerca.length < 2) return { progetti: [], developer: [], zone: [] };

  let q = supabase
    .from('pf_projects')
    .select(COLONNE_SUGGERIMENTO)
    .or(`title.ilike.%${cerca}%,developer_name.ilike.%${cerca}%,location_name.ilike.%${cerca}%,location_full.ilike.%${cerca}%`)
    .order('hotness_level', { ascending: false, nullsFirst: false })
    .limit(60);

  // Gli stessi confini della griglia, o un suggerimento aprirebbe una scheda
  // che poi nei risultati non c'e'.
  if (soloAttivi) q = q.neq('construction_phase', 'completed');

  const { data, error } = await q;
  if (error || !data) return { progetti: [], developer: [], zone: [], errore: error?.message };

  const progetti = data
    .filter((p) => (p.title || '').toLowerCase().includes(cerca.toLowerCase()))
    .sort((a, b) => rilevanza(a.title, cerca) - rilevanza(b.title, cerca))
    .slice(0, 6)
    .map(trasformaProgetto);

  const unici = (valori) => [...new Set(valori.filter(Boolean))];

  const developer = unici(data.map((p) => p.developer_name))
    .filter((n) => n.toLowerCase().includes(cerca.toLowerCase()))
    .sort((a, b) => rilevanza(a, cerca) - rilevanza(b, cerca))
    .slice(0, 3)
    .map((nome) => ({ nome, quanti: data.filter((p) => p.developer_name === nome).length }));

  // Una zona che si chiama come un progetto gia' in elenco non aggiunge
  // niente: e' lo stesso palazzo detto due volte.
  const titoli = new Set(data.map((p) => (p.title || '').toLowerCase()));
  const zone = unici(data.map((p) => zonaDi(p.location_full, p.location_name, p.title)))
    .filter((n) => n.toLowerCase().includes(cerca.toLowerCase()) && !titoli.has(n.toLowerCase()))
    .sort((a, b) => rilevanza(a, cerca) - rilevanza(b, cerca))
    .slice(0, 3)
    .map((nome) => ({
      nome,
      quanti: data.filter((p) => zonaDi(p.location_full, p.location_name, p.title) === nome).length
    }))
    // Una zona con un progetto solo non serve come filtro — quel progetto e'
    // gia' nell'elenco qui sopra — ed e' il segno che il nome e' in realta'
    // un residuo del titolo rimasto attaccato all'area.
    .filter((z) => z.quanti >= 2);

  return { progetti, developer, zone };
}
