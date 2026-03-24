// OneSignal Push Notification serverless endpoint
// target.type: 'admin' | 'user' | 'all'
// target.username: username utente (per tipo 'user')

const ONESIGNAL_APP_ID = '071cd2c3-4a3d-4d2f-8deb-fa575aec578d';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
  if (!ONESIGNAL_REST_API_KEY) {
    console.error('ONESIGNAL_REST_API_KEY not set');
    return res.status(500).json({ error: 'Push not configured' });
  }

  const { title, message, url, target } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message are required' });

  const appUrl = url || 'https://portal.keyprimere.com';

  let payload = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title, it: title },
    contents: { en: message, it: message },
    url: appUrl,
    chrome_web_icon: 'https://portal.keyprimere.com/icon-192.png',
    firefox_icon: 'https://portal.keyprimere.com/icon-192.png',
  };

  if (target?.type === 'user' && target.username) {
    // Notifica utente specifico tramite external_id (impostato al login)
    payload.include_external_user_ids = [target.username];
    payload.channel_for_external_user_ids = 'push';
  } else if (target?.type === 'admin') {
    // Solo utenti con tag ruolo=admin o ruolo=agente_admin
    payload.filters = [
      { field: 'tag', key: 'ruolo', relation: '=', value: 'admin' },
      { operator: 'OR' },
      { field: 'tag', key: 'ruolo', relation: '=', value: 'agente_admin' }
    ];
  } else {
    // Tutti gli iscritti
    payload.included_segments = ['All'];
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OneSignal error:', data);
      return res.status(response.status).json({ error: data });
    }
    return res.status(200).json({ success: true, recipients: data.recipients, id: data.id });
  } catch (error) {
    console.error('Push error:', error);
    return res.status(500).json({ error: error.message });
  }
}
