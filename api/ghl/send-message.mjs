// L'agente scrive al lead dal gestionale; il messaggio parte dai canali GHL
// di KeyPrime (numero e mittente aziendali) e resta tracciato sul lead.

import { serviceClient } from '../_lib/supabase.mjs';
import { requireSession } from '../_lib/auth.mjs';
import { ghlConfigured, upsertContact, sendMessage, logSync } from '../_lib/ghl.mjs';

const CANALI = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const utente = await requireSession(req, res, supabase);
  if (!utente) return;

  if (!ghlConfigured()) {
    return res.status(503).json({ error: 'GHL non configurato (GHL_API_KEY / GHL_LOCATION_ID)' });
  }

  const { sale_id, cliente_id, canale, testo, oggetto } = req.body || {};
  const tipo = CANALI[String(canale || '').toLowerCase()];

  if (!tipo) return res.status(400).json({ error: 'canale deve essere whatsapp, sms o email' });
  if (!testo || !String(testo).trim()) return res.status(400).json({ error: 'Il messaggio e vuoto' });
  if (tipo === 'Email' && !oggetto) return res.status(400).json({ error: 'Per email serve un oggetto' });

  try {
    let sale = null;
    let cliente = null;

    if (sale_id) {
      const { data } = await supabase.from('sales').select('*').eq('id', sale_id).maybeSingle();
      sale = data;
    }
    const idCliente = cliente_id || sale?.cliente_id;
    if (idCliente) {
      const { data } = await supabase.from('clienti').select('*').eq('id', idCliente).maybeSingle();
      cliente = data;
    }
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    // Un agente puo' scrivere solo ai lead che gli appartengono.
    if (sale && !['admin', 'agente_admin'].includes(utente.ruolo)) {
      const suo = [sale.assegnato_a, sale.agente, sale.segnalatore].includes(utente.nome);
      if (!suo) return res.status(403).json({ error: 'Questo lead non e assegnato a te' });
    }

    // Serve il contact id GHL: se manca, il contatto viene creato ora.
    let contactId = sale?.ghl_contact_id || cliente.ghl_contact_id;
    if (!contactId) {
      const creato = await upsertContact({
        nome: cliente.nome, cognome: cliente.cognome, email: cliente.email,
        telefono: cliente.telefono, source: cliente.fonte || 'KeyPrime Portal'
      });
      contactId = creato?.contact?.id || creato?.id || null;
      if (!contactId) return res.status(502).json({ error: 'GHL non ha restituito un contact id' });
      await supabase.from('clienti').update({ ghl_contact_id: contactId }).eq('id', cliente.id);
      if (sale) await supabase.from('sales').update({ ghl_contact_id: contactId }).eq('id', sale.id);
    }

    const esito = await sendMessage({
      tipo, contactId, testo: String(testo),
      oggetto: tipo === 'Email' ? oggetto : undefined,
      toNumber: tipo === 'Email' ? undefined : (cliente.whatsapp || cliente.telefono) || undefined
    });

    const messageId = esito?.messageId || esito?.id || esito?.msg?.id || null;
    const conversationId = esito?.conversationId || esito?.conversation?.id || null;

    await supabase.from('ghl_messages').insert([{
      sale_id: sale?.id || null,
      cliente_id: cliente.id,
      ghl_contact_id: contactId,
      ghl_message_id: messageId,
      ghl_conversation_id: conversationId,
      canale: tipo,
      direzione: 'uscita',
      corpo: String(testo),
      stato: 'inviato',
      inviato_da: utente.nome
    }]);

    // Il messaggio conta come contatto: entra nel diario del lead, e il trigger
    // sul database aggiorna da se' "ultimo contatto".
    if (sale) {
      const tipoAttivita = tipo === 'Email' ? 'email' : (tipo === 'WhatsApp' ? 'whatsapp' : 'call');
      await supabase.from('lead_activities').insert([{
        sale_id: sale.id, tipo: tipoAttivita, created_by: utente.nome,
        contenuto: `${tipo} inviato: ${String(testo).slice(0, 240)}`
      }]);
    }

    await logSync(supabase, {
      direzione: 'out', evento: 'messaggio', entita: 'conversation', entita_id: conversationId,
      sale_id: sale?.id || null, cliente_id: cliente.id,
      payload: { canale: tipo, message_id: messageId, inviato_da: utente.nome }
    });

    return res.status(200).json({ ok: true, message_id: messageId, conversation_id: conversationId });
  } catch (err) {
    console.error('Invio messaggio GHL:', err);
    await logSync(supabase, {
      direzione: 'out', evento: 'messaggio', entita: 'conversation',
      sale_id: sale_id || null, cliente_id: cliente_id || null,
      esito: 'errore', errore: err.message, payload: err.body || null
    });
    return res.status(502).json({ error: err.message, dettaglio: err.body || null });
  }
}
