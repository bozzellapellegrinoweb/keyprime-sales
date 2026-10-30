// Ponte CORS per le immagini.
//
// Serve perche' il CDN di PropertyFinder non manda Access-Control-Allow-Origin:
// un'immagine caricata da li' si vede in pagina, ma disegnata su una canvas la
// sporca, e canvas.toBlob() smette di funzionare. La usano il PDF dell'offerta
// e la scheda WhatsApp, che la canvas la usano per forza.
//
// Prima questa funzione scaricava QUALUNQUE url le venisse passato e lo
// rispediva con Access-Control-Allow-Origin: *. Cioe' chiunque, da fuori e
// senza autenticarsi, poteva usare portal.keyprimere.com per farsi leggere
// indirizzi raggiungibili solo dall'interno del datacenter — 127.0.0.1,
// 10.x.x.x, i metadati dell'infrastruttura. E' la famiglia di difetti che si
// chiama SSRF, ed era aperta sul dominio di produzione.
//
// Non si puo' chiudere con una lista di host e basta: nell'offerta l'agente
// puo' incollare l'indirizzo di una foto qualsiasi, e una lista stretta
// toglierebbe le foto dai PDF. Quindi si lascia passare il web pubblico e si
// chiude quello che pubblico non e': si risolve il nome e si guarda dove
// punta davvero, perche' "interno.azienda.local" e un nome comprato apposta
// che risponde 127.0.0.1 si distinguono solo cosi'.

import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX_BYTE = 12 * 1024 * 1024;
const TIMEOUT_MS = 15000;

/* Host del catalogo: passano senza risoluzione, e' la via calda. */
const HOST_NOTI = new Set([
  'new-projects-media.propertyfinder.com',
  'media.propertyfinder.com',
  'www.propertyfinder.ae',
  'propertyfinder.ae'
]);

/* Indirizzi che non devono mai essere raggiunti da qui. */
function indirizzoPrivato(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;          // questa rete, privata, loopback
    if (a === 169 && b === 254) return true;                     // link-local: i metadati stanno qui
    if (a === 172 && b >= 16 && b <= 31) return true;            // privata
    if (a === 192 && b === 168) return true;                     // privata
    if (a === 100 && b >= 64 && b <= 127) return true;           // CGNAT
    if (a >= 224) return true;                                   // multicast e riservati
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1') return true;
    if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
    // IPv4 incapsulato in IPv6: si ricontrolla la parte v4.
    const dentro = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dentro) return indirizzoPrivato(dentro[1]);
    return false;
  }
  return true;   // non si e' capito cos'e': non si va
}

async function puntaFuori(hostname) {
  if (HOST_NOTI.has(hostname.toLowerCase())) return true;
  try {
    const indirizzi = await lookup(hostname, { all: true });
    if (!indirizzi.length) return false;
    // Basta un indirizzo privato per rifiutare: un nome che ne ha due e' il
    // trucco, non la distrazione.
    return !indirizzi.some((i) => indirizzoPrivato(i.address));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url required' });

  let indirizzo;
  try { indirizzo = new URL(url); } catch { return res.status(400).json({ error: 'url non valido' }); }

  if (indirizzo.protocol !== 'https:') return res.status(400).json({ error: 'solo https' });
  if (!(await puntaFuori(indirizzo.hostname))) {
    return res.status(403).json({ error: 'host non consentito' });
  }

  try {
    const risposta = await fetch(indirizzo.toString(), {
      // Nessun redirect: un host pubblico che rimanda a 127.0.0.1 farebbe
      // saltare il controllo appena fatto.
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!risposta.ok) return res.status(risposta.status).end();

    const tipo = risposta.headers.get('content-type') || '';
    if (!tipo.startsWith('image/')) return res.status(415).json({ error: 'non e\' un\'immagine' });

    if (Number(risposta.headers.get('content-length') || 0) > MAX_BYTE) {
      return res.status(413).json({ error: 'immagine troppo grande' });
    }
    const buffer = Buffer.from(await risposta.arrayBuffer());
    if (buffer.length > MAX_BYTE) return res.status(413).json({ error: 'immagine troppo grande' });

    res.setHeader('Content-Type', tipo);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(buffer);
  } catch {
    res.status(502).json({ error: 'immagine non raggiungibile' });
  }
}
