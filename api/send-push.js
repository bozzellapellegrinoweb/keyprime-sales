export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { title, message, url } = req.body;
  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer os_v2_app_a4onfq2khvgs7dpl7jlvv3cxrxrqsndhpffui24npxugdjqnltcduawer4odsts27y7lwhao6uzdyqamepmoeattxq7hdtvc3k6khvq'
      },
      body: JSON.stringify({
        app_id: '071cd2c3-4a3d-4d2f-8deb-fa575aec578d',
        contents: { en: message },
        headings: { en: title },
        included_segments: ['All'],
        url: url || 'https://keyprime-sales-1npw.vercel.app'
      })
    });
    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
