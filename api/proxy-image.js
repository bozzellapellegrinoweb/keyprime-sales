export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).end();
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
