export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, message, url } = req.body;

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic os_v2_org_smhi42kgobfc3j2hrydqjbsdgnpywruusi5ezzuyl6zgh3hjjmjl7whervr34juizss3emayoctdt2c6hpbt7rkovk3uwjbmdodg2ky'
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
