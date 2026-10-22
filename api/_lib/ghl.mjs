// Client minimale per le API GoHighLevel v2 (LeadConnector).
//
// Le versioni dell'header `Version` non sono uniformi tra gli endpoint:
// contatti, conversazioni e opportunita' usano "v3", l'iscrizione ai workflow
// usa ancora "2023-02-21". Per questo la versione viaggia per chiamata.

const BASE = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';

export const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || null;

export function ghlConfigured() {
  return Boolean(process.env.GHL_API_KEY && GHL_LOCATION_ID);
}

async function ghlFetch(path, { method = 'POST', body, version = 'v3' } = {}) {
  const token = process.env.GHL_API_KEY;
  if (!token) throw new Error('GHL_API_KEY non configurata');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: version,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }

  if (!res.ok) {
    const err = new Error(`GHL ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

// --- Contatti ---------------------------------------------------------------

// Crea o aggiorna il contatto facendo match su email/telefono secondo le
// regole anti-duplicato della location.
export function upsertContact({ nome, cognome, email, telefono, tags, source, assignedTo, customFields }) {
  const body = {
    locationId: GHL_LOCATION_ID,
    firstName: nome || undefined,
    lastName: cognome || undefined,
    email: email || undefined,
    phone: telefono || undefined,
    source: source || 'KeyPrime Portal',
    tags: tags && tags.length ? tags : undefined,
    assignedTo: assignedTo || undefined,
    customFields: customFields && customFields.length ? customFields : undefined
  };
  return ghlFetch('/contacts/upsert', { body, version: 'v3' });
}

export function addContactTags(contactId, tags) {
  return ghlFetch(`/contacts/${contactId}/tags`, { body: { tags }, version: 'v3' });
}

// --- Opportunita' -----------------------------------------------------------

export function createOpportunity({ pipelineId, pipelineStageId, nome, contactId, valore, status = 'open' }) {
  const body = {
    pipelineId,
    locationId: GHL_LOCATION_ID,
    name: nome,
    status,
    contactId,
    pipelineStageId: pipelineStageId || undefined,
    monetaryValue: valore ? Number(valore) : undefined
  };
  return ghlFetch('/opportunities/', { body, version: 'v3' });
}

export function updateOpportunity(opportunityId, { pipelineStageId, nome, valore, status }) {
  const body = {
    pipelineStageId: pipelineStageId || undefined,
    name: nome || undefined,
    monetaryValue: valore === undefined || valore === null ? undefined : Number(valore),
    status: status || undefined
  };
  return ghlFetch(`/opportunities/${opportunityId}`, { method: 'PUT', body, version: 'v3' });
}

// --- Conversazioni ----------------------------------------------------------

// `type` ammette SMS | Email | WhatsApp | IG | FB | Custom | Live_Chat.
// Nota: la documentazione marca `status` come obbligatorio, ma descrive lo
// stato di consegna, che non spetta al mittente dichiarare. Se GHL rispondesse
// 422 lamentando `status`, basta passarlo dal chiamante.
export function sendMessage({ tipo, contactId, testo, oggetto, html, fromNumber, toNumber, status }) {
  const body = {
    type: tipo,
    contactId,
    message: testo || undefined,
    subject: oggetto || undefined,
    html: html || undefined,
    fromNumber: fromNumber || undefined,
    toNumber: toNumber || undefined,
    status: status || undefined
  };
  return ghlFetch('/conversations/messages', { body, version: 'v3' });
}

// --- Workflow ---------------------------------------------------------------

export function addContactToWorkflow(contactId, workflowId, eventStartTime) {
  return ghlFetch(`/contacts/${contactId}/workflow/${workflowId}`, {
    body: eventStartTime ? { eventStartTime } : {},
    version: '2023-02-21'
  });
}

// --- Log --------------------------------------------------------------------

// Ogni scambio con GHL finisce in ghl_sync_log: quando qualcosa non torna,
// la risposta completa di GHL e' la' dentro invece che in un log di Vercel.
export async function logSync(supabase, row) {
  try {
    await supabase.from('ghl_sync_log').insert([row]);
  } catch (err) {
    console.error('ghl_sync_log insert fallito:', err.message);
  }
}
