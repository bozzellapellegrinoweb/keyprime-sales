// Generazione della presentazione immobili in PDF.
//
// Formato A4 verticale: regge tabelle, piani di pagamento e testo, si legge
// sul telefono e si stampa senza girare il foglio. La pagina viene composta
// in HTML fuori schermo, fotografata con html2canvas e impaginata con
// pdf-lib; le brochure del developer, che sono gia' PDF vettoriali, vengono
// accodate come pagine vere e non come immagini.
//
// Ogni blocco si disegna solo se ha il dato: una scheda senza piano di
// pagamento non mostra un riquadro vuoto, lo salta.

import { supabase } from './supabaseClient';
import {
  aed, aedEsteso, pct, luogo, trimestreAnno, mosaicoMappa, arricchisciProprieta
} from './offerta';

const NAVY = '#0f1c35';
const NAVY_CHIARO = '#1b3254';
const GOLD = '#c9a84c';
const INCHIOSTRO = '#16202f';
const GRIGIO = '#6b7a8d';
const FILO = '#e2e7ee';
// La barra del piano di pagamento legge come una sequenza nel tempo: l'oro
// pieno e' il primo esborso, i toni si schiariscono andando verso la consegna.
const TONI_ORO = ['#c9a84c', '#d8bd77', '#e5d2a3', '#f0e5cb'];

/* A4 verticale a 96dpi, e la stessa pagina in punti per pdf-lib. */
const W = 794, H = 1123;
const PW = 595.28, PH = 841.89;
const MARGINE = 52;
// Il riquadro della scheda e' piccolo: serve uno zoom piu' stretto, altrimenti
// mostra solo sfondo senza un riferimento riconoscibile.
const ZOOM_SCHEDA = 15;

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ripulisci = (t) => (t || '')
  .replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1');

/* ── Mattoni grafici ────────────────────────────────────────────────────── */

const occhiello = (testo, colore = GOLD) => `
  <div style="font-size:9px;letter-spacing:2.6px;text-transform:uppercase;font-weight:700;color:${colore};">
    ${esc(testo)}
  </div>`;

const titoloSezione = (testo) => `
  <div style="font-size:20px;font-weight:800;color:${INCHIOSTRO};letter-spacing:-0.3px;margin:8px 0 16px;">
    ${esc(testo)}
  </div>`;

const intestazionePagina = (logo, etichetta) => `
  <div style="height:86px;background:${NAVY};display:flex;align-items:center;justify-content:space-between;padding:0 ${MARGINE}px;box-sizing:border-box;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${logo ? `<img src="${logo}" style="height:28px;width:auto;object-fit:contain;" />` : ''}
      <div style="font-size:8px;letter-spacing:2.4px;color:#7d93ad;text-transform:uppercase;">Dubai — UAE</div>
    </div>
    ${occhiello(etichetta)}
  </div>`;

const piePagina = (offerta, etichetta, spingiInFondo = true) => `
  <div style="${spingiInFondo ? 'margin-top:auto;' : 'margin-top:16px;'}padding-top:14px;border-top:1px solid ${FILO};display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div style="font-size:9px;color:${GRIGIO};">
      ${esc(offerta.agente_nome || '')}${offerta.agente_telefono ? ` · ${esc(offerta.agente_telefono)}` : ''}
    </div>
    <div style="font-size:9px;color:#9aa7b6;letter-spacing:1px;">${esc(etichetta)}</div>
  </div>`;

// Riquadro con etichetta piccola e valore grande: l'unita' di misura di
// tutta la scheda tecnica.
const dato = (etichetta, valore, larghezza = 'flex:1') => `
  <div style="${larghezza};min-width:0;">
    <div style="font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:${GRIGIO};margin-bottom:4px;">${esc(etichetta)}</div>
    <div style="font-size:13px;font-weight:700;color:${INCHIOSTRO};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(valore)}</div>
  </div>`;

function mappaHtml(p, larghezza, altezza, tileDataUrl, stile = '', zoom = 13) {
  const mosaico = mosaicoMappa({ lat: p.lat, lon: p.lon, larghezza, altezza, zoom });
  if (!mosaico) return '';
  const livello = (chiave) => mosaico.tiles
    .map((t) => {
      const src = tileDataUrl.get(t[chiave]);
      return src
        ? `<img src="${src}" style="position:absolute;left:${t.sinistra}px;top:${t.alto}px;width:256px;height:256px;display:block;" />`
        : '';
    })
    .join('');
  return `
  <div style="position:relative;width:${larghezza}px;height:${altezza}px;overflow:hidden;border-radius:8px;border:1px solid ${FILO};background:#eef1f5;${stile}">
    ${livello('url')}
    ${livello('urlEtichette')}
    <div style="position:absolute;left:${larghezza / 2 - 8}px;top:${altezza / 2 - 8}px;width:16px;height:16px;border-radius:50%;background:${GOLD};border:3px solid #fff;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
  </div>`;
}

/* ── Pagine ─────────────────────────────────────────────────────────────── */

const sfondoSenzaFoto = (logo) => `
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
    ${logo ? `<img src="${logo}" style="height:64px;width:auto;object-fit:contain;opacity:0.1;" />` : ''}
  </div>`;

// La foto occupa tutta la pagina e il testo vive su una sfumatura che la
// spegne dove deve restare leggibile. Prima il blocco scuro aveva un'altezza
// fissa: con poche opzioni restava una fascia vuota in mezzo alla copertina.
// Cosi' lo spazio che avanza e' foto, e non sembra un errore.
function copertina(offerta, props, logo, fotoHero) {
  const righeOpzioni = props.map((p, i) => `
    <div style="display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.09);">
      <div style="width:22px;height:22px;border-radius:50%;background:${GOLD};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:${NAVY};">${i + 1}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.nome || '')}</div>
        ${p.zonaEstesa || p.zona ? `<div style="font-size:9.5px;color:#9ab4d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(luogo(p.zonaEstesa || p.zona))}</div>` : ''}
      </div>
      ${p.prezzo ? `<div style="font-size:11.5px;font-weight:700;color:${GOLD};white-space:nowrap;flex-shrink:0;">${esc(p.prezzo)}</div>` : ''}
    </div>`).join('');

  return `
<div style="position:relative;width:${W}px;height:${H}px;background:${NAVY};overflow:hidden;box-sizing:border-box;">
  ${fotoHero
    ? `<img src="${fotoHero}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" />
       <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
         rgba(15,28,53,0.80) 0%, rgba(15,28,53,0.28) 13%, rgba(15,28,53,0.14) 26%,
         rgba(15,28,53,0.72) 42%, rgba(15,28,53,0.96) 54%, ${NAVY} 62%);"></div>`
    : sfondoSenzaFoto(logo)}

  <div style="position:absolute;left:${MARGINE}px;top:42px;display:flex;align-items:center;gap:14px;">
    ${logo ? `<img src="${logo}" style="height:40px;width:auto;object-fit:contain;" />` : ''}
    <div style="width:1px;height:26px;background:rgba(255,255,255,0.22);"></div>
    <div style="font-size:8px;letter-spacing:3px;color:#c6d4e4;text-transform:uppercase;">Dubai — UAE</div>
  </div>

  <div style="position:absolute;left:${MARGINE}px;right:${MARGINE}px;bottom:46px;display:flex;flex-direction:column;">
    ${occhiello('Selezione immobili')}
    <div style="font-size:34px;font-weight:800;color:#fff;line-height:1.12;margin:10px 0 7px;">
      ${offerta.cliente_nome ? `Per ${esc(offerta.cliente_nome)}` : 'Selezione immobili'}
    </div>
    <div style="font-size:13px;color:#9ab4d0;">
      ${esc(offerta.zona_nome ? `${offerta.zona_nome} — Dubai` : 'Dubai — UAE')}
      ${offerta.budget ? ` · Budget ${esc(offerta.budget)}` : ''}
    </div>

    <div style="height:1px;background:linear-gradient(90deg,${GOLD},transparent);margin:24px 0 20px;"></div>

    <div style="font-size:8px;letter-spacing:2.4px;color:#8fa6bf;text-transform:uppercase;margin-bottom:4px;">
      ${props.length === 1 ? 'La proposta' : `Le ${props.length} opzioni selezionate`}
    </div>
    <div>${righeOpzioni}</div>

    <div style="margin-top:30px;padding-top:22px;border-top:1px solid rgba(255,255,255,0.1);display:flex;align-items:flex-end;justify-content:space-between;">
      <div>
        <div style="font-size:8px;letter-spacing:2px;color:#8fa6bf;text-transform:uppercase;margin-bottom:7px;">Il tuo consulente</div>
        ${offerta.agente_nome ? `<div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:3px;">${esc(offerta.agente_nome)}</div>` : ''}
        ${offerta.agente_email ? `<div style="font-size:10.5px;color:#9ab4d0;">${esc(offerta.agente_email)}</div>` : ''}
        ${offerta.agente_telefono ? `<div style="font-size:10.5px;color:#9ab4d0;">${esc(offerta.agente_telefono)}</div>` : ''}
      </div>
      <div style="font-size:9px;color:#7f93ac;text-align:right;">
        ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  </div>
</div>`;
}

export function puntiZona(testo) {
  return ripulisci(testo)
    .split(/\n|•/).map((s) => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
    .slice(0, 8);
}

// Quanto spazio resta sotto i punti. Serve prima di comporre la pagina,
// perche' i tile della mappa vanno scaricati alla misura giusta.
export function altezzaMappaZona(punti) {
  const perPunto = 46;   // media fra un punto su una riga e uno su due
  const fisso = 86 + 36 + 40 + 74 + 24 + 64; // fascia, margini, titolo, piede
  return Math.max(260, Math.min(600, H - fisso - punti.length * perPunto));
}

function paginaZona(offerta, logo, mappa) {
  const righe = puntiZona(offerta.zona_descrizione);

  return `
<div style="width:${W}px;height:${H}px;background:#fff;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;">
  ${intestazionePagina(logo, 'La zona')}
  <div style="flex:1;padding:36px ${MARGINE}px 40px;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
    ${occhiello(offerta.zona_nome ? `${offerta.zona_nome} — Dubai` : 'Dubai', GRIGIO)}
    ${titoloSezione(offerta.zona_nome ? `Perché ${offerta.zona_nome}` : 'Perché questa zona')}
    <div style="margin-bottom:24px;flex-shrink:0;">
      ${righe.map((r) => `
      <div style="display:flex;gap:11px;margin-bottom:12px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${GOLD};flex-shrink:0;margin-top:7px;display:inline-block;"></span>
        <span style="font-size:12.5px;color:#39485c;line-height:1.55;">${esc(r)}</span>
      </div>`).join('')}
    </div>
    ${mappa}
    ${piePagina(offerta, 'La zona')}
  </div>
</div>`;
}

function paginaConfronto(offerta, props, logo, miniature) {
  const colonne = props.slice(0, 3);
  const larghezzaCol = Math.floor((W - MARGINE * 2 - 118) / colonne.length);

  // Una rata del piano, in percentuale e in dirham.
  const rata = (chiave) => (p) => {
    const r = p.piano?.rate.find((x) => x.chiave === chiave);
    return r ? `${r.pct}%${r.importo ? ` · ${aed(r.importo)}` : ''}` : null;
  };

  // Quanto esce di tasca prima di avere le chiavi: e' la domanda che fa
  // chiunque stia confrontando due piani di pagamento diversi.
  const primaDellaConsegna = (p) => {
    const rate = (p.piano?.rate || []).filter(
      (r) => r.chiave === 'down_payment' || r.chiave === 'during_construction'
    );
    if (!rate.length) return null;
    const perc = rate.reduce((t, r) => t + r.pct, 0);
    const importo = rate.every((r) => r.importo)
      ? rate.reduce((t, r) => t + r.importo, 0) : null;
    return `${perc}%${importo ? ` · ${aed(importo)}` : ''}`;
  };

  // Una riga in cui nessuna colonna ha un valore e' una riga di trattini.
  const righe = [
    ['Prezzo da', (p) => p.prezzo, true],
    ['Zona', (p) => luogo(p.zonaEstesa || p.zona)],
    ['Developer', (p) => p.developer],
    ['Tipologie', (p) => p.tipologie],
    ['Consegna', (p) => (p.consegna ? trimestreAnno(p.consegna) : null)],
    ['Stato', (p) => [p.fase, p.disponibilita].filter(Boolean).join(' · ')],
    ['Acconto', rata('down_payment')],
    ['Durante i lavori', rata('during_construction')],
    ['Alla consegna', rata('handover')],
    ['Dopo la consegna', rata('after_handover')],
    ['Prima della consegna', primaDellaConsegna, true],
    ['Rendimento lordo', (p) => (p.rendimento ? pct(p.rendimento.lordo) : null)]
  ].filter(([, valore]) => colonne.some((p) => valore(p)));

  const riga = (etichetta, valore, forte) => `
    <div style="display:flex;border-bottom:1px solid ${FILO};">
      <div style="width:118px;flex-shrink:0;padding:17px 10px 17px 0;font-size:9px;letter-spacing:1.3px;text-transform:uppercase;color:${GRIGIO};">${esc(etichetta)}</div>
      ${colonne.map((p) => `
        <div style="width:${larghezzaCol}px;flex-shrink:0;padding:17px 12px 17px 0;font-size:${forte ? 13.5 : 11.5}px;font-weight:${forte ? 700 : 500};color:${forte ? GOLD : INCHIOSTRO};line-height:1.35;">
          ${esc(valore(p) || '—')}
        </div>`).join('')}
    </div>`;

  return `
<div style="width:${W}px;height:${H}px;background:#fff;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;">
  ${intestazionePagina(logo, 'Confronto')}
  <div style="flex:1;padding:36px ${MARGINE}px 40px;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;">
    ${occhiello('Una accanto all\'altra', GRIGIO)}
    ${titoloSezione('Le opzioni a confronto')}

    <div style="display:flex;margin-bottom:6px;">
      <div style="width:118px;flex-shrink:0;"></div>
      ${colonne.map((p, i) => `
        <div style="width:${larghezzaCol}px;flex-shrink:0;padding-right:12px;">
          <div style="height:150px;border-radius:7px;overflow:hidden;background:#eef1f5;margin-bottom:9px;">
            ${miniature[i] ? `<img src="${miniature[i]}" style="width:100%;height:100%;object-fit:cover;display:block;" />` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:17px;height:17px;border-radius:50%;background:${NAVY};color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</div>
            <div style="font-size:12px;font-weight:800;color:${INCHIOSTRO};line-height:1.2;overflow:hidden;">${esc(p.nome || '')}</div>
          </div>
        </div>`).join('')}
    </div>

    <div style="border-top:1.5px solid ${INCHIOSTRO};">
      ${righe.map(([etichetta, valore, forte]) => riga(etichetta, valore, forte)).join('')}
    </div>

    <div style="font-size:8.5px;color:#9aa7b6;margin-top:auto;padding-top:18px;line-height:1.5;">
      Importi in AED. Prezzi e disponibilità sono quelli pubblicati dal developer alla data del documento
      e restano soggetti a conferma al momento della prenotazione.
    </div>

    ${piePagina(offerta, 'Confronto', false)}
  </div>
</div>`;
}

function schedaImmobile(offerta, p, indice, totale, logo, fotoHero, fotoSecondarie, mappa) {
  const specs = (p.specs || '').split(/[;\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);

  const piano = p.piano ? `
    <div style="margin-bottom:18px;">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:9px;">
        ${occhiello('Piano di pagamento', GRIGIO)}
        ${p.piano.titolo ? `<div style="font-size:9px;color:${GRIGIO};">${esc(p.piano.titolo)}${p.piano.altriPiani > 0 ? ` · altri ${p.piano.altriPiani} disponibili` : ''}</div>` : ''}
      </div>
      <div style="display:flex;height:9px;border-radius:5px;overflow:hidden;margin-bottom:10px;background:${FILO};">
        ${p.piano.rate.map((r, i) => `
          <div style="width:${r.pct}%;background:${TONI_ORO[i % TONI_ORO.length]};"></div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;">
        ${p.piano.rate.map((r) => `
          <div style="flex:1;min-width:0;background:#f7f9fc;border:1px solid ${FILO};border-radius:7px;padding:9px 10px;box-sizing:border-box;">
            <div style="font-size:16px;font-weight:800;color:${INCHIOSTRO};line-height:1;">${r.pct}<span style="font-size:10px;font-weight:700;">%</span></div>
            <div style="font-size:9px;color:${INCHIOSTRO};font-weight:600;margin-top:5px;line-height:1.25;">${esc(r.etichetta)}</div>
            <div style="font-size:8.5px;color:${GRIGIO};margin-top:2px;line-height:1.25;">${esc(r.quando)}</div>
            ${r.importo ? `<div style="font-size:10px;font-weight:700;color:${GOLD};margin-top:5px;">${aed(r.importo)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>` : '';

  const rendimento = p.rendimento ? `
    <div style="display:flex;gap:10px;align-items:stretch;background:${NAVY};border-radius:8px;padding:12px 14px;margin-bottom:18px;box-sizing:border-box;">
      <div style="flex:1;">
        <div style="font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:#8ba6c4;margin-bottom:4px;">Affitto annuo atteso</div>
        <div style="font-size:14px;font-weight:700;color:#fff;">${aedEsteso(p.rendimento.affitto)}</div>
      </div>
      <div style="width:1px;background:rgba(255,255,255,0.12);"></div>
      <div style="flex:1;">
        <div style="font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:#8ba6c4;margin-bottom:4px;">Rendimento lordo</div>
        <div style="font-size:14px;font-weight:700;color:${GOLD};">${pct(p.rendimento.lordo)}</div>
      </div>
      ${p.rendimento.netto !== null ? `
      <div style="width:1px;background:rgba(255,255,255,0.12);"></div>
      <div style="flex:1;">
        <div style="font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:#8ba6c4;margin-bottom:4px;">Netto da spese</div>
        <div style="font-size:14px;font-weight:700;color:${GOLD};">${pct(p.rendimento.netto)}</div>
      </div>` : ''}
    </div>` : '';

  const datiChiave = [
    p.tipologie && dato('Tipologie', p.tipologie),
    p.consegna && dato('Consegna', trimestreAnno(p.consegna)),
    p.fase && dato('Stato lavori', p.fase),
    p.disponibilita && dato('Disponibilità', p.disponibilita)
  ].filter(Boolean);

  return `
<div style="width:${W}px;height:${H}px;background:#fff;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;">
  <div style="position:relative;flex:1;min-height:300px;overflow:hidden;background:${NAVY_CHIARO};">
    ${fotoHero
      ? `<img src="${fotoHero}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : sfondoSenzaFoto(logo)}
    ${fotoHero ? `<div style="position:absolute;left:0;right:0;bottom:0;height:190px;background:linear-gradient(to bottom, rgba(15,28,53,0) 0%, rgba(15,28,53,0.93) 100%);"></div>` : ''}
    <div style="position:absolute;left:${MARGINE}px;right:${MARGINE}px;bottom:26px;">
      ${occhiello(`Opzione ${indice + 1} di ${totale}`)}
      <div style="font-size:27px;font-weight:800;color:#fff;line-height:1.12;margin-top:7px;">${esc(p.nome || '')}</div>
      ${p.zonaEstesa || p.zona ? `<div style="font-size:11.5px;color:#c6d4e4;margin-top:5px;">${esc(luogo(p.zonaEstesa || p.zona))}</div>` : ''}
    </div>
  </div>

  <div style="flex-shrink:0;padding:22px ${MARGINE}px 30px;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;">
      <div>
        <div style="font-size:8px;letter-spacing:1.8px;text-transform:uppercase;color:${GRIGIO};margin-bottom:3px;">Prezzo da</div>
        <div style="font-size:26px;font-weight:800;color:${INCHIOSTRO};line-height:1;">${esc(p.prezzo || '—')}</div>
      </div>
      ${p.developerLogo
        ? `<div style="text-align:right;"><img src="${p.developerLogo}" style="height:46px;width:auto;max-width:170px;object-fit:contain;" /></div>`
        : (p.developer ? `<div style="text-align:right;"><div style="font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:${GRIGIO};margin-bottom:3px;">Developer</div><div style="font-size:13px;font-weight:700;color:${INCHIOSTRO};">${esc(p.developer)}</div></div>` : '')}
    </div>

    ${datiChiave.length ? `
    <div style="display:flex;gap:14px;padding:13px 0;border-top:1px solid ${FILO};border-bottom:1px solid ${FILO};margin-bottom:18px;">
      ${datiChiave.join('')}
    </div>` : ''}

    ${piano}
    ${rendimento}

    ${specs.length ? `
    <div style="margin-bottom:16px;">
      ${occhiello('Caratteristiche', GRIGIO)}
      <div style="display:flex;flex-wrap:wrap;margin-top:9px;">
        ${specs.map((s) => `
        <div style="width:50%;display:flex;gap:9px;margin-bottom:8px;padding-right:14px;box-sizing:border-box;">
          <span style="width:5px;height:5px;border-radius:50%;background:${GOLD};flex-shrink:0;margin-top:6px;display:inline-block;"></span>
          <span style="font-size:11.5px;color:#39485c;line-height:1.4;">${esc(s)}</span>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${(fotoSecondarie.length || mappa) ? `
    <div style="display:flex;gap:10px;height:150px;flex-shrink:0;">
      ${fotoSecondarie.map((u) => `
        <div style="flex:1;overflow:hidden;border-radius:8px;background:#eef1f5;">
          <img src="${u}" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>`).join('')}
      ${mappa}
    </div>` : ''}

    ${piePagina(offerta, `Opzione ${indice + 1} di ${totale}`, false)}
  </div>
</div>`;
}

// Ultima pagina. Come la copertina: la foto tiene il campo e il testo vive
// in fondo, cosi' quello che avanza e' immagine e non pagina vuota.
function chiusura(offerta, props, logo, foto) {
  const passi = [
    ['Chiarisci i dubbi', 'Una chiamata o un incontro per rivedere insieme le opzioni e rispondere su developer, zona e tempistiche.'],
    ['Scegli e blocca l\'unità', 'Le unità migliori si esauriscono per prime: si riserva quella scelta con il modulo di prenotazione del developer.'],
    ['Firma e registrazione', 'Contratto con il developer e registrazione dell\'acquisto. Ti seguo in ogni passaggio, anche a distanza.']
  ];

  return `
<div style="position:relative;width:${W}px;height:${H}px;background:${NAVY};overflow:hidden;box-sizing:border-box;">
  ${foto
    ? `<img src="${foto}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" />
       <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
         rgba(15,28,53,0.82) 0%, rgba(15,28,53,0.34) 12%, rgba(15,28,53,0.20) 24%,
         rgba(15,28,53,0.78) 38%, rgba(15,28,53,0.97) 50%, ${NAVY} 58%);"></div>`
    : ''}

  <div style="position:absolute;left:${MARGINE}px;top:44px;display:flex;align-items:center;gap:14px;">
    ${logo ? `<img src="${logo}" style="height:34px;width:auto;object-fit:contain;" />` : ''}
    <div style="width:1px;height:24px;background:rgba(255,255,255,0.22);"></div>
    <div style="font-size:8px;letter-spacing:3px;color:#c6d4e4;text-transform:uppercase;">Dubai — UAE</div>
  </div>

  <div style="position:absolute;left:${MARGINE}px;right:${MARGINE}px;bottom:46px;display:flex;flex-direction:column;">
    ${occhiello('Come procediamo')}
    <div style="font-size:30px;font-weight:800;color:#fff;line-height:1.14;margin:10px 0 28px;">
      I prossimi passi
    </div>

    ${passi.map(([titolo, testo], i) => `
      <div style="display:flex;gap:15px;margin-bottom:20px;">
        <div style="width:28px;height:28px;border-radius:50%;border:1.5px solid ${GOLD};color:${GOLD};font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;">${esc(titolo)}</div>
          <div style="font-size:11.5px;color:#9ab4d0;line-height:1.55;">${esc(testo)}</div>
        </div>
      </div>`).join('')}

    <div style="height:1px;background:linear-gradient(90deg,${GOLD},transparent);margin:14px 0 20px;"></div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;">
      <div>
        <div style="font-size:8px;letter-spacing:2px;color:#8fa6bf;text-transform:uppercase;margin-bottom:7px;">Scrivimi o chiamami</div>
        ${offerta.agente_nome ? `<div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:4px;">${esc(offerta.agente_nome)}</div>` : ''}
        ${offerta.agente_email ? `<div style="font-size:11px;color:#9ab4d0;">${esc(offerta.agente_email)}</div>` : ''}
        ${offerta.agente_telefono ? `<div style="font-size:11px;color:#9ab4d0;">${esc(offerta.agente_telefono)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:8px;letter-spacing:2.4px;color:${GOLD};text-transform:uppercase;font-weight:700;">KeyPrime Real Estate</div>
        <div style="font-size:8px;letter-spacing:2px;color:#7f93ac;text-transform:uppercase;margin-top:3px;">Dubai — UAE</div>
      </div>
    </div>

    <div style="font-size:8.5px;color:#7389a4;line-height:1.5;margin-top:20px;">
      Documento informativo preparato per ${esc(offerta.cliente_nome || 'il cliente')} il
      ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}.
      Prezzi, piani di pagamento, tipologie e date di consegna sono quelli pubblicati dai developer
      alla data odierna e restano soggetti a modifica e a conferma al momento della prenotazione.
      ${props.some((p) => p.rendimento) ? 'I rendimenti indicati derivano dall\'affitto annuo atteso inserito dal consulente: sono stime, non un rendimento garantito.' : ''}
    </div>
  </div>
</div>`;
}

// I loghi dei developer arrivano su una tela quadrata con molto margine
// attorno al marchio: a parita' di altezza il simbolo esce alto un terzo e
// sulla scheda sembra un puntino. Qui si ritaglia al contenuto effettivo.
// Il margine a volte e' trasparente, a volte e' bianco pieno, quindi si
// guarda sia il canale alfa sia il colore dell'angolo.
async function ritagliaMargini(dataUrl) {
  if (!dataUrl) return null;
  try {
    const img = await new Promise((risolvi, rifiuta) => {
      const i = new Image();
      i.onload = () => risolvi(i);
      i.onerror = rifiuta;
      i.src = dataUrl;
    });
    const L = img.naturalWidth, A = img.naturalHeight;
    if (!L || !A) return dataUrl;

    const c = document.createElement('canvas');
    c.width = L; c.height = A;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, L, A);

    const pixel = (x, y) => {
      const i = (y * L + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    // Il colore di sfondo lo detta l'angolo: se e' trasparente basta l'alfa.
    const [sr, sg, sb, sa] = pixel(0, 0);
    const TOLLERANZA = 12;
    const eSfondo = (x, y) => {
      const [r, g, b, a] = pixel(x, y);
      if (a < 12) return true;
      if (sa < 12) return false;
      return Math.abs(r - sr) <= TOLLERANZA
        && Math.abs(g - sg) <= TOLLERANZA
        && Math.abs(b - sb) <= TOLLERANZA;
    };

    let x0 = L, y0 = A, x1 = -1, y1 = -1;
    for (let y = 0; y < A; y++) {
      for (let x = 0; x < L; x++) {
        if (!eSfondo(x, y)) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return dataUrl;

    const larghezza = x1 - x0 + 1, altezza = y1 - y0 + 1;
    // Niente da guadagnare, o ritaglio sospetto: si tiene l'originale.
    if (larghezza > L * 0.95 && altezza > A * 0.95) return dataUrl;
    if (larghezza < L * 0.1 || altezza < A * 0.1) return dataUrl;

    // Un filo di respiro, cosi' il marchio non tocca il bordo del riquadro.
    const aria = Math.round(Math.max(larghezza, altezza) * 0.04);
    const rx = Math.max(0, x0 - aria), ry = Math.max(0, y0 - aria);
    const rl = Math.min(L - rx, larghezza + aria * 2);
    const ra = Math.min(A - ry, altezza + aria * 2);

    const ritaglio = document.createElement('canvas');
    ritaglio.width = rl; ritaglio.height = ra;
    ritaglio.getContext('2d').drawImage(c, rx, ry, rl, ra, 0, 0, rl, ra);
    return ritaglio.toDataURL('image/png');
  } catch { return dataUrl; }
}

/* ── Generatore ─────────────────────────────────────────────────────────── */

// I recapiti stampati sul documento non devono dipendere da cosa e' stato
// digitato nel modulo quel giorno: se l'offerta non li porta, si leggono
// dalla scheda della persona. Un'offerta senza recapito e' un'offerta a cui
// il cliente non puo' rispondere.
async function recapitiAgente(offerta) {
  let email = (offerta.agente_email || '').trim();
  let telefono = (offerta.agente_telefono || '').trim();
  if ((email && telefono) || !offerta.agente_nome) return { email, telefono };
  try {
    const { data } = await supabase
      .from('team_members').select('email, telefono')
      .eq('nome', offerta.agente_nome).maybeSingle();
    if (data) {
      email = email || (data.email || '').trim();
      telefono = telefono || (data.telefono || '').trim();
    }
  } catch {}
  return { email, telefono };
}

export const proprietaCompilata = (p) => !!(
  (p?.nome || '').trim() || (p?.prezzo || '').trim() ||
  (p?.specs || '').trim() || (p?.foto_urls || []).some(Boolean)
);

export async function generaOffertaPdf(offerta, { logoUrl, onStato } = {}) {
  const stato = onStato || (() => {});

  const grezze = (offerta.proprieta || []).filter(proprietaCompilata);
  if (!grezze.length) {
    return { ok: false, errore: 'Questa offerta non ha nessuna proprietà compilata.' };
  }

  const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([
    import('html2canvas'), import('pdf-lib')
  ]);

  stato('Lettura del catalogo', '', 8);
  const [props, recapiti] = await Promise.all([
    arricchisciProprieta(grezze),
    recapitiAgente(offerta)
  ]);
  offerta = { ...offerta, agente_email: recapiti.email, agente_telefono: recapiti.telefono };

  /* Immagini: tutto deve diventare data URL, altrimenti html2canvas scarta
     quello che il browser considera di un'altra origine. */
  const cache = new Map();
  const toDataUrl = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (cache.has(url)) return cache.get(url);
    const prova = async (u) => {
      try {
        const res = await fetch(u);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((risolvi) => {
          const r = new FileReader();
          r.onload = () => risolvi(r.result);
          r.onerror = () => risolvi(null);
          r.readAsDataURL(blob);
        });
      } catch { return null; }
    };
    const esito = await prova(url) || await prova(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    cache.set(url, esito);
    return esito;
  };

  if (!document.getElementById('_kpInterFont')) {
    const lnk = document.createElement('link');
    lnk.id = '_kpInterFont'; lnk.rel = 'stylesheet';
    lnk.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(lnk);
  }
  await document.fonts.ready;

  stato('Caricamento immagini', '', 16);
  const logo = await toDataUrl(logoUrl);
  const fotoPerProprieta = await Promise.all(
    props.map((p) => Promise.all((p.foto_urls || []).filter(Boolean).slice(0, 3).map(toDataUrl)))
  );
  await Promise.all(props.map(async (p, i) => {
    props[i].developerLogo = p.developerLogo
      ? await ritagliaMargini(await toDataUrl(p.developerLogo)) : null;
  }));

  stato('Caricamento mappe', '', 26);
  const tileDataUrl = new Map();
  const daScaricare = new Set();
  const riquadri = [
    ...props.map((p) => ({ p, l: 150, a: 150, z: ZOOM_SCHEDA })),
    ...(offerta.zona_descrizione && props[0]
      ? [{ p: props[0], l: W - MARGINE * 2, a: altezzaMappaZona(puntiZona(offerta.zona_descrizione)) }]
      : [])
  ];
  for (const { p, l, a, z } of riquadri) {
    const m = mosaicoMappa({ lat: p.lat, lon: p.lon, larghezza: l, altezza: a, zoom: z || 13 });
    if (m) m.tiles.forEach((t) => { daScaricare.add(t.url); daScaricare.add(t.urlEtichette); });
  }
  await Promise.all([...daScaricare].map(async (u) => {
    const d = await toDataUrl(u);
    if (d) tileDataUrl.set(u, d);
  }));

  /* Telaio fuori schermo: html2canvas fotografa quello che il browser ha
     gia' impaginato, quindi la pagina deve esistere davvero nel documento. */
  const telaio = document.createElement('div');
  telaio.style.cssText = `position:fixed;left:-${W + 60}px;top:0;width:${W}px;height:${H}px;overflow:hidden;font-family:'Inter',system-ui,sans-serif;box-sizing:border-box;background:#fff;`;
  document.body.appendChild(telaio);

  const pdf = await PDFDocument.create();

  const aggiungi = async (html, sfondo) => {
    telaio.innerHTML = html;
    telaio.style.background = sfondo;
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 220));
    const canvas = await html2canvas(telaio, {
      scale: 2, useCORS: true, allowTaint: false,
      backgroundColor: sfondo, width: W, height: H, logging: false
    });
    const b64 = canvas.toDataURL('image/jpeg', 0.93).split(',')[1];
    const img = await pdf.embedJpg(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    pdf.addPage([PW, PH]).drawImage(img, { x: 0, y: 0, width: PW, height: PH });
  };

  const tutteLeFoto = fotoPerProprieta.flat().filter(Boolean);

  stato('Composizione', 'Copertina…', 34);
  await aggiungi(copertina(offerta, props, logo, tutteLeFoto[0]), NAVY);

  if ((offerta.zona_descrizione || '').trim()) {
    stato('Composizione', 'La zona…', 42);
    const mappaGrande = mappaHtml(
      props[0], W - MARGINE * 2,
      altezzaMappaZona(puntiZona(offerta.zona_descrizione)),
      tileDataUrl, 'flex-shrink:0;'
    );
    await aggiungi(paginaZona(offerta, logo, mappaGrande), '#fff');
  }

  if (props.length > 1) {
    stato('Composizione', 'Confronto…', 50);
    await aggiungi(paginaConfronto(offerta, props, logo, fotoPerProprieta.map((f) => f[0])), '#fff');
  }

  for (let i = 0; i < props.length; i++) {
    stato('Composizione', `${props[i].nome || `Opzione ${i + 1}`}…`, 54 + Math.floor(i * 22 / props.length));
    const foto = fotoPerProprieta[i].filter(Boolean);
    await aggiungi(
      schedaImmobile(
        offerta, props[i], i, props.length, logo,
        foto[0], foto.slice(1, 3),
        mappaHtml(props[i], 150, 150, tileDataUrl, 'flex-shrink:0;', ZOOM_SCHEDA)
      ),
      '#fff'
    );
  }

  stato('Composizione', 'Contatti…', 78);
  await aggiungi(
    chiusura(offerta, props, logo, tutteLeFoto[tutteLeFoto.length - 1] || tutteLeFoto[0]),
    NAVY
  );

  document.body.removeChild(telaio);

  /* Brochure: sono gia' PDF, si accodano come pagine vettoriali. */
  const conBrochure = props.filter((p) => p.brochure_url);
  const brochureNonAllegate = [];
  for (let i = 0; i < conBrochure.length; i++) {
    stato('Allegando brochure', `${i + 1} di ${conBrochure.length}…`, 82 + Math.floor(i * 12 / conBrochure.length));
    const indirizzo = conBrochure[i].brochure_url;
    const scarica = async (u) => {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    };
    let errore = new Error('non tentato');
    for (const sorgente of [indirizzo, `/api/proxy-image?url=${encodeURIComponent(indirizzo)}`]) {
      try {
        const src = await PDFDocument.load(await scarica(sorgente), { ignoreEncryption: true });
        (await pdf.copyPages(src, src.getPageIndices())).forEach((pg) => pdf.addPage(pg));
        errore = null;
        break;
      } catch (e) { errore = e; }
    }
    if (errore) {
      console.error('Brochure non allegata:', indirizzo, errore);
      brochureNonAllegate.push(conBrochure[i].nome || indirizzo);
    }
  }

  stato('Finalizzazione', 'Generazione file…', 96);
  const blob = new Blob([await pdf.save()], { type: 'application/pdf' });
  return {
    ok: true,
    blob,
    nomeFile: `KeyPrime_${(offerta.cliente_nome || 'Cliente').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    brochureNonAllegate,
    pagine: pdf.getPageCount()
  };
}

/* Nome e numero di pagine servono anche fuori: li espone il risultato. */
export { W as LARGHEZZA_PAGINA, H as ALTEZZA_PAGINA };
