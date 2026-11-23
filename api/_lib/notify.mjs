// Notifiche verso il team: push OneSignal + email Resend.
// Usato dagli handler server (webhook GHL, reminder follow-up) senza passare
// per /api/send-push e /api/send-email, che sono pensati per il client.

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '071cd2c3-4a3d-4d2f-8deb-fa575aec578d';
export const APP_URL = process.env.APP_URL || 'https://portal.keyprimere.com';
const MAIL_FROM = process.env.MAIL_FROM || 'KeyPrime <notifiche@keyprimere.com>';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || 'info@keyprimere.com';

export async function push({ titolo, messaggio, url, username, tutti = false }) {
  const key = process.env.ONESIGNAL_REST_API_KEY;
  if (!key) { console.warn('ONESIGNAL_REST_API_KEY non configurata: push saltata'); return null; }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: titolo, it: titolo },
    contents: { en: messaggio, it: messaggio },
    url: url || APP_URL,
    chrome_web_icon: `${APP_URL}/icon-192.png`,
    firefox_icon: `${APP_URL}/icon-192.png`
  };

  if (username) {
    payload.include_external_user_ids = [username];
    payload.channel_for_external_user_ids = 'push';
  } else if (tutti) {
    payload.included_segments = ['All'];
  } else {
    payload.filters = [
      { field: 'tag', key: 'ruolo', relation: '=', value: 'admin' },
      { operator: 'OR' },
      { field: 'tag', key: 'ruolo', relation: '=', value: 'agente_admin' }
    ];
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { Authorization: `Basic ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) console.error('OneSignal:', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('Push fallita:', err.message);
    return null;
  }
}

export async function email({ a, oggetto, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn('RESEND_API_KEY non configurata: email saltata'); return null; }
  if (!a) return null;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        reply_to: MAIL_REPLY_TO,
        to: Array.isArray(a) ? a : [a],
        subject: oggetto,
        html
      })
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend:', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('Email fallita:', err.message);
    return null;
  }
}

// Template email: stessa impaginazione usata dal client, tenuta in un posto solo.
export function template({ accento = '#c9a84c', badge, titolo, righe = '', nota, url = APP_URL }) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1c35;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="background:#0f1c35;padding:24px 28px">
      <div style="color:${accento};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">${badge || 'KeyPrime'}</div>
      <div style="color:#ffffff;font-size:20px;font-weight:600;margin-top:6px">${titolo || ''}</div>
    </div>
    <div style="padding:24px 28px">
      ${righe}
      ${nota ? `<p style="color:#64748b;font-size:13px;line-height:1.5;margin:16px 0 0">${nota}</p>` : ''}
      <a href="${url}" style="display:inline-block;margin-top:20px;background:${accento};color:#0f1c35;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">Apri il portale</a>
    </div>
  </div>
</div>`;
}

/* Template per chi NON e' del team: il lead che ha appena lasciato i dati.
 *
 * Separato da `template` e non un suo parametro perche' le due email non si
 * somigliano: quella interna finisce con "Apri il portale" e puo' elencare la
 * richiesta per esteso, questa parla a un estraneo e deve portarlo a un'unica
 * azione. Riusare l'altra significherebbe mandare a un cliente il pulsante del
 * gestionale.
 *
 * L'oro pieno sta a 2,29:1 col bianco: il pulsante porta inchiostro navy, non
 * testo bianco. E' la stessa regola del portale.
 */
export function templateCliente({ titolo, corpo, azione, urlAzione, poscritto }) {
  const oro = '#c9a84c';
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f2ed;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e0d8">
    <div style="background:#0f1c35;padding:26px 28px">
      <div style="color:${oro};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">KeyPrime Real Estate</div>
      <div style="color:#ffffff;font-size:21px;font-weight:600;margin-top:8px">${titolo}</div>
    </div>
    <div style="padding:26px 28px">
      <div style="color:#334155;font-size:15px;line-height:1.65">${corpo}</div>
      ${azione && urlAzione ? `<a href="${urlAzione}" style="display:inline-block;margin-top:22px;background:${oro};color:#0f1c35;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:600;font-size:15px">${azione}</a>` : ''}
      ${poscritto ? `<p style="color:#64748b;font-size:13px;line-height:1.55;margin:22px 0 0;padding-top:16px;border-top:1px solid #e4e0d8">${poscritto}</p>` : ''}
    </div>
    <div style="padding:16px 28px;background:#faf9f6;color:#94a3b8;font-size:11px;line-height:1.5">
      KeyPrime Real Estate Brokerage &middot; Dubai, EAU &middot; info@keyprimere.com<br>
      Ricevi questa email perché hai lasciato i tuoi dati su un nostro annuncio o sul nostro sito.
    </div>
  </div>
</div>`;
}

export function riga(etichetta, valore) {
  if (valore === null || valore === undefined || valore === '') return '';
  return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0">
    <span style="color:#64748b;font-size:13px">${etichetta}</span>
    <span style="color:#0f1c35;font-size:14px;font-weight:500">${valore}</span>
  </div>`;
}

export function evidenza(valore, colore = '#0f1c35') {
  return `<div style="font-size:28px;font-weight:700;color:${colore};margin:4px 0 16px">${valore}</div>`;
}
