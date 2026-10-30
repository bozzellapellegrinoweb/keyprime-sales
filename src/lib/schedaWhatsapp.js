// Scheda del progetto da mandare su WhatsApp.
//
// Segnalazione: «migliorare l'invio scheda descrittiva su wapp aggiungendo
// un'immagine principale di riferimento. In questo momento si vede cosi'» —
// e seguiva un muro di righe con le emoji, senza una foto.
//
// Il link wa.me porta solo testo, quindi una foto non la si puo' infilare nel
// messaggio: va mandata come file. Qui si disegna la scheda su una canvas —
// foto del progetto, prezzo, tipologie, consegna, developer, marchio — e poi
// si prova a condividerla:
//
//   1. navigator.share con il file. Sul telefono, che e' dove un agente manda
//      le schede, apre il foglio di condivisione e la foto arriva a WhatsApp
//      come immagine con didascalia. E' il caso che conta.
//   2. appunti. Su WhatsApp Web si incolla con Ctrl+V nella chat gia' aperta.
//   3. scaricamento. Resta sempre una via che funziona.
//
// La foto arriva dal CDN di PropertyFinder, che non manda i permessi CORS:
// disegnata direttamente sporcherebbe la canvas e toBlob() fallirebbe. Per
// questo passa da /api/proxy-image.

const L = 1080;          // lato della scheda
const H = 1350;          // 4:5, il formato che WhatsApp non ritaglia
const H_FOTO = 760;

const NAVY = '#0f1c35';
const ORO = '#c9a84c';
const ORO_CHIARO = '#e0c478';
const PANNA = '#f3f1ec';

/* ── Testo del messaggio ───────────────────────────────────────────────── */
export function testoScheda(listing, { bedsText, deliveryText, paymentText }) {
  const prezzo = listing.price_from > 0
    ? `da AED ${Number(listing.price_from).toLocaleString('it-IT')}`
    : 'Prezzo su richiesta';
  const righe = [
    `*${listing.title}*`,
    '',
    `📍 ${listing.location?.full_name || ''}`,
    `💰 ${prezzo}`,
    `🏠 ${bedsText}`,
    `📅 Consegna: ${deliveryText}`,
    `🏢 ${listing.developer?.name || 'Developer n/d'}`
  ];
  if (paymentText) righe.push(`💳 ${paymentText}`);
  righe.push('', '_Progetto Off-Plan Dubai_', '', '🔗 Per info: contattami!');
  return righe.join('\n');
}

/* ── Disegno ───────────────────────────────────────────────────────────── */

function carica(src) {
  return new Promise((risolvi) => {
    if (!src) { risolvi(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => risolvi(img);
    img.onerror = () => risolvi(null);
    img.src = src;
  });
}

/* Prima l'indirizzo cosi' com'e' (se un giorno il CDN mandasse i permessi,
   si risparmia un salto), poi il ponte. */
async function caricaConPonte(url) {
  if (!url) return null;
  return (await carica(url)) || (await carica(`/api/proxy-image?url=${encodeURIComponent(url)}`));
}

/* Riempie il riquadro senza deformare: si ritaglia, non si schiaccia. */
function disegnaCoprendo(ctx, img, x, y, w, h) {
  const scala = Math.max(w / img.width, h / img.height);
  const lw = img.width * scala;
  const lh = img.height * scala;
  ctx.drawImage(img, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
}

/* Manda a capo rispettando le parole, e tronca con i puntini all'ultima riga
   concessa: un titolo lungo non deve mangiarsi il prezzo. */
function scriviAvvolto(ctx, testo, x, y, larghezza, altezzaRiga, righeMax) {
  const parole = String(testo || '').split(/\s+/).filter(Boolean);
  const righe = [];
  let riga = '';
  for (const parola of parole) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (ctx.measureText(prova).width <= larghezza || !riga) riga = prova;
    else { righe.push(riga); riga = parola; }
  }
  if (riga) righe.push(riga);

  const mostrate = righe.slice(0, righeMax);
  if (righe.length > righeMax && mostrate.length) {
    let ultima = mostrate[mostrate.length - 1];
    while (ultima.length > 1 && ctx.measureText(`${ultima}…`).width > larghezza) {
      ultima = ultima.slice(0, -1);
    }
    mostrate[mostrate.length - 1] = `${ultima}…`;
  }
  mostrate.forEach((r, i) => ctx.fillText(r, x, y + i * altezzaRiga));
  return y + mostrate.length * altezzaRiga;
}

function pastiglia(ctx, testo, x, y) {
  ctx.font = '500 30px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  const larghezza = ctx.measureText(testo).width + 44;
  const altezza = 58;
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.roundRect(x, y, larghezza, altezza, 29);
  ctx.fill();
  ctx.fillStyle = PANNA;
  ctx.textBaseline = 'middle';
  ctx.fillText(testo, x + 22, y + altezza / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  return x + larghezza + 14;
}

/**
 * Disegna la scheda e la restituisce come Blob PNG.
 * Torna null se la canvas non e' disponibile o resta sporca.
 */
export async function creaImmagineScheda(listing, { bedsText, deliveryText, paymentText, logoUrl = '/logo.png' } = {}) {
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = H;
  const ctx = tela.getContext('2d');
  if (!ctx || !ctx.roundRect) return null;

  const urlFoto = listing.images?.[0]?.medium_image_url || listing.images?.[0]?.small_image_url;
  const [foto, logo] = await Promise.all([caricaConPonte(urlFoto), carica(logoUrl)]);

  // Fondo
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, L, H);

  if (foto) {
    disegnaCoprendo(ctx, foto, 0, 0, L, H_FOTO);
    // Sfumatura verso il basso: il titolo deve restare leggibile su qualsiasi
    // foto, anche una facciata bianca in pieno sole.
    const sfuma = ctx.createLinearGradient(0, H_FOTO - 320, 0, H_FOTO);
    sfuma.addColorStop(0, 'rgba(15,28,53,0)');
    sfuma.addColorStop(1, NAVY);
    ctx.fillStyle = sfuma;
    ctx.fillRect(0, H_FOTO - 320, L, 320);
  } else {
    ctx.fillStyle = 'rgba(201,168,76,0.08)';
    ctx.fillRect(0, 0, L, H_FOTO);
  }

  // Filo d'oro sotto la foto
  ctx.fillStyle = ORO;
  ctx.fillRect(0, H_FOTO - 4, L, 4);

  const M = 64;              // margine
  let y = H_FOTO + 86;

  // Zona
  ctx.fillStyle = ORO_CHIARO;
  ctx.font = '600 30px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  const zona = (listing.location?.full_name || '').split(',').map((p) => p.trim()).filter(Boolean).slice(0, 2).join(' · ');
  ctx.fillText(zona.toUpperCase(), M, y);
  y += 54;

  // Titolo
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 62px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  y = scriviAvvolto(ctx, listing.title, M, y, L - M * 2, 70, 2) + 26;

  // Prezzo
  ctx.fillStyle = ORO;
  ctx.font = '700 56px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  ctx.fillText(
    listing.price_from > 0 ? `da AED ${Number(listing.price_from).toLocaleString('it-IT')}` : 'Prezzo su richiesta',
    M, y
  );
  y += 54;

  // Pastiglie
  let x = M;
  for (const voce of [bedsText, deliveryText && `Consegna ${deliveryText}`, paymentText].filter(Boolean)) {
    const larghezza = ctx.measureText(voce).width + 44;
    if (x + larghezza > L - M) break;      // una riga sola: meglio tagliare che accavallare
    x = pastiglia(ctx, voce, x, y);
  }
  y += 92;

  // Developer a sinistra, marchio a destra, sulla stessa riga: il piede della
  // scheda e' una riga sola, non due con in mezzo una fascia di navy vuoto.
  const yPiede = H - 96;

  ctx.fillStyle = 'rgba(243,241,236,0.72)';
  ctx.font = '400 30px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
  ctx.fillText(listing.developer?.name || '', M, yPiede);

  if (logo) {
    const hLogo = 74;
    const wLogo = (logo.width / logo.height) * hLogo;
    ctx.drawImage(logo, L - M - wLogo, yPiede - hLogo * 0.74, wLogo, hLogo);
  } else {
    ctx.fillStyle = PANNA;
    ctx.font = '700 36px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('KEYPRIME', L - M, yPiede);
    ctx.textAlign = 'left';
  }

  return new Promise((risolvi) => {
    try { tela.toBlob((b) => risolvi(b), 'image/png', 0.92); }
    catch { risolvi(null); }   // canvas sporca: si va avanti col solo testo
  });
}

/* ── Invio ─────────────────────────────────────────────────────────────── */

/**
 * Prova le tre strade, dalla migliore alla piu' rozza.
 * Torna come e' andata, cosi' chi chiama puo' dirlo all'utente.
 */
export async function condividiScheda(listing, testo, immagine) {
  const nome = `${(listing.title || 'progetto').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.png`;

  if (immagine) {
    const file = new File([immagine], nome, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: testo });
        return { via: 'condivisione' };
      } catch (e) {
        // L'utente ha annullato: non si ripiega, ha deciso lui.
        if (e?.name === 'AbortError') return { via: 'annullato' };
      }
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': immagine })]);
      window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
      return { via: 'appunti' };
    } catch { /* niente appunti: si scarica */ }

    const url = URL.createObjectURL(immagine);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
    return { via: 'scaricata' };
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank');
  return { via: 'solo testo' };
}
