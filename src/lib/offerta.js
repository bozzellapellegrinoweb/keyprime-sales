// Dati e calcoli della presentazione immobili.
//
// Il modulo non tocca il DOM: prepara i numeri e i testi che il generatore
// del PDF si limita a impaginare. Tenerli separati serve perche' sono la
// parte che si sbaglia in silenzio - una percentuale letta male diventa una
// rata sbagliata su un documento che il cliente usa per decidere.

import { supabase } from './supabaseClient';

/* ── Prezzi ─────────────────────────────────────────────────────────────── */

// Il prezzo nell'offerta e' testo libero: "2.275.000 AED", "AED 1,200,000",
// "1.5M", "da 980000". Qui si estrae il numero, o niente se non si capisce:
// meglio stampare solo le percentuali che stampare una rata inventata.
export function leggiPrezzo(valore) {
  if (typeof valore === 'number' && Number.isFinite(valore)) return valore;
  const testo = String(valore || '').trim();
  if (!testo) return null;

  const moltiplicatore = /(\d)\s*(m|mln|milioni)\b/i.test(testo) ? 1e6
    : /(\d)\s*k\b/i.test(testo) ? 1e3 : 1;

  // Tiene solo cifre e separatori, poi decide quale separatore e' decimale.
  const grezzo = testo.replace(/[^\d.,]/g, '');
  if (!grezzo) return null;

  let normalizzato;
  const ultimaVirgola = grezzo.lastIndexOf(',');
  const ultimoPunto = grezzo.lastIndexOf('.');
  const ultimo = Math.max(ultimaVirgola, ultimoPunto);
  const cifreDopo = ultimo === -1 ? 0 : grezzo.length - ultimo - 1;

  if (ultimo !== -1 && cifreDopo > 0 && cifreDopo <= 2) {
    // Due cifre o meno dopo l'ultimo separatore: e' un decimale.
    normalizzato = grezzo.slice(0, ultimo).replace(/[.,]/g, '') + '.' + grezzo.slice(ultimo + 1);
  } else {
    normalizzato = grezzo.replace(/[.,]/g, '');
  }

  const n = Number(normalizzato);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n * moltiplicatore;
}

export const aed = (n) =>
  Number(n).toLocaleString('it-IT', { maximumFractionDigits: 0 });

export const aedEsteso = (n) => `${aed(n)} AED`;

// In italiano il separatore decimale e' la virgola: "7.1%" su un documento
// commerciale italiano si legge come un refuso.
export const pct = (n) =>
  `${Number(n).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;

// PropertyFinder scrive i luoghi senza spazio dopo la virgola
// ("Abu Dhabi,Yas Island"): a stampa sembra un errore di battitura.
export const luogo = (t) => (t || '').replace(/,\s*/g, ', ').trim();

/* ── Date ───────────────────────────────────────────────────────────────── */

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export function meseAnno(data) {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return `${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

export function trimestreAnno(data) {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

/* ── Vocabolario PropertyFinder ─────────────────────────────────────────── */

const FASI = {
  completed: 'Consegnato',
  under_construction: 'In costruzione',
  off_plan: 'Off-plan',
  not_started: 'Non avviato',
  presale: 'Prevendita'
};

const DISPONIBILITA = {
  available: 'Disponibile',
  sold_out: 'Esaurito',
  might_be_sold_out: 'Quasi esaurito',
  coming_soon: 'In arrivo',
  sales_started: 'Vendite aperte'
};

export const etichettaFase = (k) => FASI[k] || null;
export const etichettaDisponibilita = (k) => DISPONIBILITA[k] || null;

export function etichettaTipologie(bedrooms) {
  const disponibili = bedrooms?.available;
  if (!Array.isArray(disponibili) || !disponibili.length) return null;

  const numeri = [...new Set(disponibili.map(Number))]
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (!numeri.length) return null;

  const conCamere = numeri.filter((n) => n > 0);
  if (!conCamere.length) return 'Studio';

  // "1 camere, 2 camere" legge male: l'unita' la porta solo l'ultimo numero.
  const testo = conCamere.length === 1
    ? `${conCamere[0]} camera${conCamere[0] > 1 ? 'e' : ''}`
    : `${conCamere.slice(0, -1).join(', ')} e ${conCamere[conCamere.length - 1]} camere`;

  return numeri.includes(0) ? `Studio, ${testo}` : testo;
}

/* ── Piano di pagamento ─────────────────────────────────────────────────── */

// PropertyFinder descrive il piano in quattro percentuali. Qui diventano le
// rate con l'importo in AED e il momento in cui si pagano, che e' la sola
// forma in cui un cliente le legge davvero.
export function costruisciPiano(payment_plans, prezzo, consegna) {
  const piani = payment_plans?.plans;
  if (!Array.isArray(piani) || !piani.length) return null;

  const scelto = piani[0];
  const s = scelto?.summary || {};
  const voci = [
    { chiave: 'down_payment', etichetta: 'Acconto', quando: 'alla prenotazione' },
    { chiave: 'during_construction', etichetta: 'Durante la costruzione', quando: 'a stati avanzamento' },
    { chiave: 'handover', etichetta: 'Alla consegna', quando: meseAnno(consegna) || 'alla consegna' },
    { chiave: 'after_handover', etichetta: 'Dopo la consegna', quando: 'a rate post-consegna' }
  ];

  const rate = voci
    .map((v) => ({ ...v, pct: Number(s[v.chiave]) }))
    .filter((v) => Number.isFinite(v.pct) && v.pct > 0)
    .map((v) => ({ ...v, importo: prezzo ? Math.round(prezzo * v.pct / 100) : null }));

  if (!rate.length) return null;

  return {
    titolo: piani.length > 1 ? (scelto.title || 'Piano standard') : (scelto.title || null),
    altriPiani: piani.length - 1,
    rate,
    totalePct: rate.reduce((t, r) => t + r.pct, 0)
  };
}

/* ── Rendimento ─────────────────────────────────────────────────────────── */

// Solo se l'agente ha scritto l'affitto atteso. Senza quel dato non c'e'
// nessuna stima da fare: inventarla significa mettere una proiezione non
// verificata su un documento che il cliente usa per decidere.
export function calcolaRendimento({ affittoAnnuo, prezzo, speseAnnue }) {
  const affitto = leggiPrezzo(affittoAnnuo);
  if (!affitto || !prezzo) return null;
  const spese = leggiPrezzo(speseAnnue) || 0;
  const lordo = affitto / prezzo * 100;
  const netto = (affitto - spese) / prezzo * 100;
  return {
    affitto,
    spese,
    lordo: Math.round(lordo * 10) / 10,
    netto: spese > 0 ? Math.round(netto * 10) / 10 : null
  };
}

/* ── Mappa ──────────────────────────────────────────────────────────────── */

// Mosaico di tile centrato sul punto. Il server Esri e' lo stesso che usa la
// mappa del portale e serve i tile con header CORS, quindi finiscono nel PDF
// senza passare dal proxy.
const TILE = 256;
const SERVER = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
// Due livelli: lo sfondo e, sopra, i nomi di strade e quartieri. Una mappa
// senza etichette non dice al cliente dove si trova: e' decorazione.
const URL_SFONDO = (z, x, y) => `${SERVER}/World_Light_Gray_Base/MapServer/tile/${z}/${y}/${x}`;
const URL_ETICHETTE = (z, x, y) => `${SERVER}/World_Light_Gray_Reference/MapServer/tile/${z}/${y}/${x}`;

export function mosaicoMappa({ lat, lon, zoom = 13, larghezza, altezza }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const n = 2 ** zoom;
  const fx = (lon + 180) / 360 * n;
  const latR = lat * Math.PI / 180;
  const fy = (1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n;

  const cx = Math.floor(fx);
  const cy = Math.floor(fy);
  // Dove cade il punto dentro il suo tile, in pixel.
  const scartoX = (fx - cx) * TILE;
  const scartoY = (fy - cy) * TILE;

  // Quanti tile servono per coprire il riquadro, piu' una corona di sicurezza.
  const raggioX = Math.ceil(larghezza / 2 / TILE) + 1;
  const raggioY = Math.ceil(altezza / 2 / TILE) + 1;

  const tiles = [];
  for (let dx = -raggioX; dx <= raggioX; dx++) {
    for (let dy = -raggioY; dy <= raggioY; dy++) {
      const x = cx + dx;
      const y = cy + dy;
      if (y < 0 || y >= n) continue;
      const xn = ((x % n) + n) % n;
      tiles.push({
        url: URL_SFONDO(zoom, xn, y),
        urlEtichette: URL_ETICHETTE(zoom, xn, y),
        sinistra: Math.round(larghezza / 2 - scartoX + dx * TILE),
        alto: Math.round(altezza / 2 - scartoY + dy * TILE)
      });
    }
  }
  return { tiles, larghezza, altezza };
}

/* ── Arricchimento dal catalogo ─────────────────────────────────────────── */

const CAMPI_CATALOGO = `
  id, title, developer_name, location_name, location_full, price_from,
  bedrooms, delivery_date, construction_phase, payment_plans, url, raw_data
`;

// Una proprieta' scelta dal catalogo porta con se' solo nome, zona, prezzo e
// foto: developer, consegna e piano di pagamento restano nel catalogo. Qui
// si rileggono, cosi' anche le offerte salvate prima di questa versione
// vengono stampate complete.
export async function arricchisciProprieta(proprieta) {
  const daCercare = proprieta
    .map((p, i) => ({ i, id: p.listing_id }))
    .filter((x) => x.id && !x.gia);

  if (!daCercare.length) return proprieta.map(normalizzaProprieta);

  let righe = [];
  try {
    const { data } = await supabase
      .from('pf_projects')
      .select(CAMPI_CATALOGO)
      .in('id', daCercare.map((x) => x.id));
    righe = data || [];
  } catch { righe = []; }

  const perId = new Map(righe.map((r) => [String(r.id), r]));

  return proprieta.map((p) => {
    const riga = p.listing_id ? perId.get(String(p.listing_id)) : null;
    return normalizzaProprieta(p, riga);
  });
}

// Quello che l'agente ha scritto a mano vince sempre sul catalogo: se ha
// corretto un prezzo o un nome, e' perche' sa qualcosa che il catalogo non sa.
function normalizzaProprieta(p, riga) {
  const coord = riga?.raw_data?.location?.coordinates;
  const prezzo = leggiPrezzo(p.prezzo) ?? (riga ? leggiPrezzo(riga.price_from) : null);
  const consegna = p.consegna || riga?.delivery_date || null;
  const piano = costruisciPiano(p.payment_plans || riga?.payment_plans, prezzo, consegna);

  return {
    ...p,
    prezzoNum: prezzo,
    developer: p.developer || riga?.developer_name || null,
    developerLogo: p.developerLogo || riga?.raw_data?.developer?.logo || null,
    zonaEstesa: p.zonaEstesa || riga?.raw_data?.location?.path_name || riga?.location_full || null,
    consegna,
    fase: etichettaFase(p.fase || riga?.construction_phase),
    disponibilita: etichettaDisponibilita(p.disponibilita || riga?.raw_data?.availability),
    tipologie: p.tipologie || etichettaTipologie(riga?.bedrooms),
    lat: Number.isFinite(p.lat) ? p.lat : (coord?.lat ?? null),
    lon: Number.isFinite(p.lon) ? p.lon : (coord?.lon ?? null),
    piano,
    rendimento: calcolaRendimento({
      affittoAnnuo: p.affitto_annuo,
      prezzo,
      speseAnnue: p.spese_annue
    })
  };
}

// Istantanea dei campi che servono al PDF, presa quando si sceglie dal
// catalogo: il prezzo di oggi e' quello che il cliente ha visto, non quello
// che il catalogo avra' fra sei mesi.
export function istantaneaCatalogo(riga) {
  const coord = riga?.raw_data?.location?.coordinates;
  return {
    listing_id: riga.id,
    developer: riga.developer_name || null,
    developerLogo: riga.raw_data?.developer?.logo || null,
    zonaEstesa: riga.raw_data?.location?.path_name || riga.location_full || null,
    consegna: riga.delivery_date || null,
    fase: riga.construction_phase || null,
    disponibilita: riga.raw_data?.availability || null,
    tipologie: etichettaTipologie(riga.bedrooms),
    payment_plans: riga.payment_plans || null,
    lat: coord?.lat ?? null,
    lon: coord?.lon ?? null,
    url_scheda: riga.url || null
  };
}
