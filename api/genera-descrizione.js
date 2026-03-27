export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { zona } = req.body;
  if (!zona) return res.status(400).json({ error: 'zona required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Scrivi una descrizione breve (4-5 punti bullet) per un prospetto immobiliare in italiano su perché investire o vivere a ${zona}, Dubai / UAE. Tono professionale, conciso. Evidenzia: rendimento locativo, tipologie immobili, domanda, stile di vita. Usa bullet points con •. Niente intestazioni, solo i bullet points.`,
        }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return res.status(200).json({ descrizione: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
