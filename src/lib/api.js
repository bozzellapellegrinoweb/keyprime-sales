// Chiamate agli endpoint serverless del portale.
// Ogni richiesta porta il token di sessione: /api/send-email, /api/send-push e
// gli endpoint GHL rifiutano chi non ha una sessione valida.

import { getToken } from './auth';

async function chiama(percorso, corpo) {
  const token = getToken();
  let risposta;
  try {
    risposta = await fetch(percorso, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-kp-token': token } : {})
      },
      body: JSON.stringify(corpo || {})
    });
  } catch {
    return { ok: false, error: 'Connessione non disponibile' };
  }

  let dati = null;
  try { dati = await risposta.json(); } catch {}

  if (!risposta.ok) {
    return {
      ok: false,
      error: estraiErrore(dati) || `Errore ${risposta.status}`,
      stato: risposta.status
    };
  }
  return { ok: true, ...dati };
}

function estraiErrore(dati) {
  if (!dati) return null;
  if (typeof dati.error === 'string') return dati.error;
  if (dati.error?.message) return dati.error.message;
  if (dati.dettaglio?.message) return dati.dettaglio.message;
  return null;
}

// --- Notifiche --------------------------------------------------------------

export function inviaEmail(to, subject, html) {
  return chiama('/api/send-email', { to, subject, html });
}

export function inviaPush(title, message, url = null, target = { type: 'admin' }) {
  return chiama('/api/send-push', { title, message, url, target });
}

// --- GoHighLevel ------------------------------------------------------------

// Allinea contatto e opportunita' su GHL. Si chiama senza bloccare la UI:
// se GHL e' giu' o non configurato, il lavoro nel portale non si ferma.
export function sincronizzaGhl({ saleId, clienteId }) {
  return chiama('/api/ghl/sync-contact', { sale_id: saleId, cliente_id: clienteId });
}

export function inviaMessaggioGhl({ saleId, clienteId, canale, testo, oggetto }) {
  return chiama('/api/ghl/send-message', {
    sale_id: saleId, cliente_id: clienteId, canale, testo, oggetto
  });
}

export function avviaSequenzaGhl({ saleId, clienteId, workflow, workflowId }) {
  return chiama('/api/ghl/trigger-workflow', {
    sale_id: saleId, cliente_id: clienteId, workflow, workflow_id: workflowId
  });
}

// Sincronizzazione "a perdere": utile quando l'esito non deve bloccare
// l'operazione dell'agente (es. cambio stato pipeline).
export function sincronizzaGhlInSilenzio(args) {
  sincronizzaGhl(args).catch(() => {});
}
