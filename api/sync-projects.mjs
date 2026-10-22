// Aggiornamento del catalogo progetti off-plan da PropertyFinder.
//
// La versione precedente scorreva fino a 80 pagine a ogni esecuzione e
// riscriveva ogni progetto, anche quelli gia' presenti e immutati: circa
// 2.400 chiamate al mese, che bruciano il piano RapidAPI per riscaricare un
// catalogo gia' in archivio.
//
// Qui la logica e' quella di una rilettura incrementale:
//   - ogni notte legge solo le prime pagine e si ferma appena incontra una
//     pagina senza progetti nuovi (il catalogo e' ordinato dal piu' recente,
//     quindi le novita' stanno in testa);
//   - una volta a settimana fa una passata piu' profonda, per recuperare
//     eventuali inserimenti sfuggiti;
//   - scrive solo le righe davvero cambiate;
//   - ha un tetto massimo di chiamate per esecuzione e si ferma da sola se
//     RapidAPI segnala che la quota residua sta finendo.
//
// I parametri stanno in app_settings.key='pf_sync' e si cambiano senza
// rilasciare codice.

import { serviceClient } from './_lib/supabase.mjs';

const PF_API_HOST = process.env.PF_API_HOST || 'uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com';

const PREDEFINITI = {
  attivo: true,
  pagine_giornaliere: 4,      // ~200 progetti piu' recenti
  pagine_settimanali: 20,     // passata profonda, una volta a settimana
  giorno_passata_profonda: 0, // 0 = domenica
  per_pagina: 50,
  // Dopo due pagine consecutive senza nulla di nuovo non ha senso proseguire.
  pagine_vuote_per_fermarsi: 2,
  quota_minima_residua: 50    // sotto questa soglia si ferma e lo segnala
};

function trasforma(p) {
  const brochureUrl = p.brochure?.url || p.brochure || p.documents?.brochure?.url ||
    p.documents?.brochure || p.media?.brochure?.url || p.media?.brochure || p.brochure_url || null;

  return {
    project_id: p.project_id,
    title: p.title,
    location_name: p.location?.name || null,
    location_full: p.location?.full_name || null,
    developer_name: p.developer?.name || null,
    price_from: p.price_from || null,
    bedrooms: p.bedrooms || null,
    delivery_date: p.delivery_date ? p.delivery_date.split('T')[0] : null,
    construction_phase: p.construction_phase_key || null,
    hotness_level: p.hotness_level || null,
    images: p.images || null,
    payment_plans: p.payment_plans || null,
    url: p.url || null,
    brochure_url: brochureUrl,
    raw_data: p,
    updated_at: new Date().toISOString()
  };
}

// Firma dei campi che contano: se non cambia, la riga non viene riscritta.
function firma(r) {
  return [
    r.title, r.price_from, r.delivery_date, r.construction_phase,
    r.hotness_level, r.developer_name, r.location_full, r.brochure_url
  ].join('|');
}

async function leggiArchivio(supabase) {
  const mappa = new Map();
  let da = 0;
  while (true) {
    const { data, error } = await supabase
      .from('pf_projects')
      .select('project_id, title, price_from, delivery_date, construction_phase, hotness_level, developer_name, location_full, brochure_url')
      .range(da, da + 999);
    if (error || !data || data.length === 0) break;
    for (const r of data) mappa.set(r.project_id, firma(r));
    if (data.length < 1000) break;
    da += 1000;
  }
  return mappa;
}

export default async function handler(req, res) {
  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ success: false, error: err.message }); }

  const PF_API_KEY = process.env.PF_API_KEY;
  if (!PF_API_KEY) {
    return res.status(500).json({ success: false, error: 'PF_API_KEY non configurata' });
  }

  const inizio = Date.now();

  try {
    const { data: cfgRow } = await supabase
      .from('app_settings').select('value').eq('key', 'pf_sync').maybeSingle();
    const cfg = { ...PREDEFINITI, ...(cfgRow?.value || {}) };

    if (cfg.attivo === false) {
      return res.status(200).json({ success: true, saltato: 'sincronizzazione disattivata' });
    }

    // Passata profonda solo nel giorno scelto, oppure su richiesta esplicita.
    const profonda = req.query?.profonda === '1' ||
      new Date().getUTCDay() === Number(cfg.giorno_passata_profonda);
    const tettoPagine = profonda ? cfg.pagine_settimanali : cfg.pagine_giornaliere;

    const archivio = await leggiArchivio(supabase);

    let offset = 0;
    let chiamate = 0;
    let nuovi = 0;
    let aggiornati = 0;
    let invariati = 0;
    let completatiSaltati = 0;
    let pagineSenzaNovita = 0;
    let quotaResidua = null;
    let fermatoPerche = 'fine catalogo';
    const errori = [];

    for (let pagina = 0; pagina < tettoPagine; pagina++) {
      const url = `https://${PF_API_HOST}/projects?limit=${cfg.per_pagina}&offset=${offset}`;
      const risposta = await fetch(url, {
        headers: { 'x-rapidapi-host': PF_API_HOST, 'x-rapidapi-key': PF_API_KEY }
      });
      chiamate++;

      const residua = risposta.headers.get('x-ratelimit-requests-remaining');
      if (residua !== null) quotaResidua = Number(residua);

      if (!risposta.ok) {
        const corpo = await risposta.text().catch(() => '');
        errori.push(`HTTP ${risposta.status} a offset ${offset}: ${corpo.slice(0, 200)}`);
        fermatoPerche = risposta.status === 429 ? 'quota RapidAPI esaurita' : 'errore API';
        break;
      }

      const dati = await risposta.json();
      const progetti = dati.data || [];
      if (progetti.length === 0) { fermatoPerche = 'fine catalogo'; break; }

      const attivi = progetti.filter(p => p.construction_phase_key !== 'completed');
      completatiSaltati += progetti.length - attivi.length;

      const daScrivere = [];
      let novitaInPagina = 0;

      for (const p of attivi) {
        const riga = trasforma(p);
        const precedente = archivio.get(p.project_id);
        if (precedente === undefined) {
          daScrivere.push(riga);
          archivio.set(p.project_id, firma(riga));
          nuovi++;
          novitaInPagina++;
        } else if (precedente !== firma(riga)) {
          daScrivere.push(riga);
          archivio.set(p.project_id, firma(riga));
          aggiornati++;
          novitaInPagina++;
        } else {
          invariati++;
        }
      }

      if (daScrivere.length > 0) {
        const { error } = await supabase
          .from('pf_projects').upsert(daScrivere, { onConflict: 'project_id' });
        if (error) errori.push(`scrittura: ${error.message}`);
      }

      // Catalogo ordinato dal piu' recente: se una pagina non porta nulla di
      // nuovo, quelle successive sono ancora piu' vecchie.
      pagineSenzaNovita = novitaInPagina === 0 ? pagineSenzaNovita + 1 : 0;
      if (!profonda && pagineSenzaNovita >= cfg.pagine_vuote_per_fermarsi) {
        fermatoPerche = 'nessuna novita nelle ultime pagine';
        break;
      }

      if (quotaResidua !== null && quotaResidua < cfg.quota_minima_residua) {
        fermatoPerche = `quota residua bassa (${quotaResidua})`;
        break;
      }

      if (!dati.pagination || !dati.pagination.has_next) { fermatoPerche = 'fine catalogo'; break; }
      offset += cfg.per_pagina;
      await new Promise(r => setTimeout(r, 150));
    }

    if (chiamate >= tettoPagine) fermatoPerche = 'tetto pagine raggiunto';

    const conteggio = await supabase
      .from('pf_projects').select('*', { count: 'exact', head: true });

    const esito = {
      success: errori.length === 0,
      passata: profonda ? 'profonda' : 'giornaliera',
      chiamate_api: chiamate,
      nuovi,
      aggiornati,
      invariati,
      completati_saltati: completatiSaltati,
      quota_residua: quotaResidua,
      fermato_perche: fermatoPerche,
      totale_in_archivio: conteggio.count,
      durata: ((Date.now() - inizio) / 1000).toFixed(1) + 's',
      errori
    };

    // Traccia dei consumi, per vedere l'andamento senza aprire RapidAPI.
    await supabase.from('ghl_sync_log').insert([{
      direzione: 'out', evento: 'sync_propertyfinder', entita: 'pf_projects',
      esito: errori.length ? 'errore' : 'ok',
      errore: errori.length ? errori.join(' | ').slice(0, 500) : null,
      payload: esito
    }]).then(() => {}, () => {});

    console.log('Sync PropertyFinder:', JSON.stringify(esito));
    return res.status(errori.length ? 500 : 200).json(esito);
  } catch (err) {
    console.error('Sync PropertyFinder, errore grave:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
