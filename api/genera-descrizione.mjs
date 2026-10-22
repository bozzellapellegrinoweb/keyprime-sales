// Testo della sezione "Perche' questa zona" della presentazione immobili.
//
// La versione precedente chiedeva cinque bullet generici su una zona di
// Dubai, senza sapere nulla del cliente ne' degli immobili proposti: usciva
// un testo che andava bene per chiunque, e che quindi non serviva a nessuno.
// Qui il modello riceve il contesto che l'agente ha gia' nel modulo - budget,
// immobili selezionati, developer, consegna - e scrive per quel cliente.

import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

const ISTRUZIONI = `Scrivi la sezione "Perché questa zona" di una presentazione
immobiliare che un consulente di KeyPrime Real Estate (Dubai) consegna a un
cliente italiano che sta valutando un acquisto.

Regole:
- Da 5 a 7 punti, uno per riga, ciascuno introdotto da "• ".
- Niente titoli, niente introduzione, niente chiusura: solo i punti.
- Ogni punto è una frase piena, 15-30 parole. Un'affermazione concreta, non uno slogan.
- Scrivi di questa zona in particolare: collegamenti, chi ci vive o ci investe,
  che tipo di prodotto immobiliare offre, come si è mossa negli ultimi anni,
  cosa è in costruzione. Quello che un consulente che ci lavora saprebbe dire.
- Se citi un numero (rendimento, distanza, prezzo al piede quadro) usa un
  ordine di grandezza prudente e segnalalo come indicativo. Mai una cifra
  precisa che non puoi verificare: finisce su un documento che il cliente usa
  per decidere.
- Niente superlativi da brochure ("opportunità unica", "lusso senza pari"),
  niente emoji, niente "Dubai è una città in crescita".
- Italiano corrente, tono da professionista che espone fatti, non da venditore.`;

function contesto({ zona, budget, cliente, proprieta }) {
  const righe = [`Zona: ${zona}`];
  if (budget) righe.push(`Budget indicato dal cliente: ${budget}`);
  if (cliente) righe.push(`Il documento è intestato a: ${cliente}`);

  const elenco = (Array.isArray(proprieta) ? proprieta : [])
    .filter((p) => p && p.nome)
    .slice(0, 3)
    .map((p) => {
      const parti = [p.nome];
      if (p.prezzo) parti.push(`da ${p.prezzo}`);
      if (p.developer) parti.push(`developer ${p.developer}`);
      if (p.tipologie) parti.push(p.tipologie);
      if (p.consegna) parti.push(`consegna ${String(p.consegna).slice(0, 7)}`);
      return `- ${parti.join(', ')}`;
    });

  if (elenco.length) {
    righe.push('', 'Immobili proposti in questa presentazione:', ...elenco);
  }
  return righe.join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { zona } = req.body || {};
  if (!zona) return res.status(400).json({ error: 'zona required' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata' });
  }

  try {
    const client = new Anthropic();
    const risposta = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 1600,
      output_config: { effort: 'medium' },
      system: ISTRUZIONI,
      messages: [{ role: 'user', content: contesto(req.body) }]
    });

    if (risposta.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'Richiesta rifiutata dal modello' });
    }

    const descrizione = risposta.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!descrizione) return res.status(502).json({ error: 'Nessun testo generato' });
    return res.status(200).json({ descrizione });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'Chiave Anthropic non valida' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Troppe richieste, riprova fra poco' });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Servizio non disponibile (${err.status})` });
    }
    console.error('genera-descrizione:', err);
    return res.status(500).json({ error: err.message });
  }
}
