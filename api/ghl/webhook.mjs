// Ingresso dei lead da GoHighLevel.
//
// Da configurare in GHL come azione "Webhook" di un workflow:
//   POST https://portal.keyprimere.com/api/ghl/webhook
//   header  x-kp-secret: <GHL_WEBHOOK_SECRET>
//
// Cosa fa, in ordine: riconosce o crea il cliente, apre il lead, lo assegna
// a rotazione, programma il primo follow-up secondo lo SLA e avvisa l'agente.

import { serviceClient } from '../_lib/supabase.mjs';
import { checkSecret } from '../_lib/auth.mjs';
import { logSync } from '../_lib/ghl.mjs';
import { push, email, template, riga, APP_URL } from '../_lib/notify.mjs';

// I payload dei workflow GHL non hanno una forma fissa: ogni campo puo'
// arrivare in camelCase, snake_case o annidato sotto "contact".
function pesca(payload, ...chiavi) {
  const fonti = [payload, payload?.contact, payload?.customData, payload?.custom_data].filter(Boolean);
  for (const fonte of fonti) {
    for (const chiave of chiavi) {
      const v = fonte[chiave];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return null;
}

function normalizza(payload) {
  const contactId = pesca(payload, 'contact_id', 'contactId', 'id');
  let nome = pesca(payload, 'first_name', 'firstName');
  let cognome = pesca(payload, 'last_name', 'lastName');
  const completo = pesca(payload, 'full_name', 'fullName', 'name', 'contact_name');

  if (!nome && completo) {
    const parti = completo.split(/\s+/);
    nome = parti.shift();
    cognome = cognome || (parti.length ? parti.join(' ') : null);
  }

  const tagsRaw = payload?.tags ?? payload?.contact?.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String)
    : (typeof tagsRaw === 'string' ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []);

  const budget = pesca(payload, 'budget', 'budget_max', 'budgetMax');

  return {
    ghlContactId: contactId,
    nome: nome || 'Lead',
    cognome: cognome || '',
    email: pesca(payload, 'email'),
    telefono: pesca(payload, 'phone', 'telefono', 'phone_number'),
    fonte: pesca(payload, 'source', 'fonte', 'utm_source') || 'GHL',
    zona: pesca(payload, 'zona', 'zone', 'area', 'location', 'interesse_zona'),
    progetto: pesca(payload, 'progetto', 'project', 'property', 'immobile'),
    note: pesca(payload, 'message', 'note', 'notes', 'messaggio', 'richiesta'),
    budgetMax: budget && /^[\d.,\s]+$/.test(budget) ? Number(budget.replace(/[.,\s]/g, '')) : null,
    tags
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

  const auth = checkSecret(req, 'GHL_WEBHOOK_SECRET');
  if (!auth.ok) return res.status(401).json({ error: auth.error });

  let supabase;
  try { supabase = serviceClient(); }
  catch (err) { return res.status(500).json({ error: err.message }); }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const lead = normalizza(payload);

  if (!lead.email && !lead.telefono && !lead.ghlContactId) {
    await logSync(supabase, {
      direzione: 'in', evento: 'lead', entita: 'contact', esito: 'errore',
      errore: 'Payload senza email, telefono o contact id', payload
    });
    return res.status(400).json({ error: 'Serve almeno email, telefono o contact id' });
  }

  try {
    // 1. Cliente: prima per id GHL, poi per email, poi per telefono.
    let cliente = await trovaCliente(supabase, lead);

    if (!cliente) {
      const { data, error } = await supabase.from('clienti').insert([{
        nome: lead.nome,
        cognome: lead.cognome,
        email: lead.email,
        telefono: lead.telefono,
        whatsapp: lead.telefono,
        note: lead.note,
        budget_max: lead.budgetMax,
        zone_interesse: lead.zona ? [lead.zona] : null,
        fonte: lead.fonte,
        stato: 'nuovo',
        created_by: 'GHL',
        ghl_contact_id: lead.ghlContactId
      }]).select().single();
      if (error) throw error;
      cliente = data;
    } else if (lead.ghlContactId && !cliente.ghl_contact_id) {
      await supabase.from('clienti').update({ ghl_contact_id: lead.ghlContactId }).eq('id', cliente.id);
    }

    // 2. Niente doppioni: se lo stesso contatto ha gia' un lead aperto creato
    // nell'ultima ora, registro l'evento sul lead esistente e mi fermo.
    const unOraFa = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: esistenti } = await supabase
      .from('sales')
      .select('id, progetto, assegnato_a')
      .eq('cliente_id', cliente.id)
      .gte('created_at', unOraFa)
      .limit(1);

    if (esistenti && esistenti.length) {
      const sale = esistenti[0];
      await supabase.from('lead_activities').insert([{
        sale_id: sale.id, tipo: 'note', created_by: 'GHL',
        contenuto: `Nuovo contatto da GHL (${lead.fonte})${lead.note ? `: ${lead.note}` : ''}`
      }]);
      await logSync(supabase, {
        direzione: 'in', evento: 'lead_duplicato', entita: 'contact',
        entita_id: lead.ghlContactId, sale_id: sale.id, cliente_id: cliente.id, payload
      });
      return res.status(200).json({ ok: true, duplicato: true, sale_id: sale.id });
    }

    // 3. Apertura del lead.
    const { data: sale, error: errSale } = await supabase.from('sales').insert([{
      data: new Date().toISOString().split('T')[0],
      developer: 'Da qualificare',
      progetto: lead.progetto || `Richiesta ${lead.fonte}`,
      zona: lead.zona || 'Da definire',
      valore: 0,
      stato: 'lead',
      temperatura: 'hot',
      fonte: lead.fonte,
      note: lead.note,
      cliente_id: cliente.id,
      inserted_by: 'GHL',
      inserted_as: 'admin',
      ghl_contact_id: lead.ghlContactId
    }]).select().single();
    if (errSale) throw errSale;

    // 4. Assegnazione a rotazione.
    let agente = null;
    const { data: rr } = await supabase.rpc('app_assign_round_robin', {
      p_sale_id: sale.id, p_eseguito_da: 'webhook GHL'
    });
    if (rr && rr.ok) agente = rr.agente;

    // 5. Primo follow-up entro lo SLA concordato.
    const { data: impostazioni } = await supabase
      .from('app_settings').select('value').eq('key', 'sla').maybeSingle();
    const ore = Number(impostazioni?.value?.primo_contatto_ore ?? 24);
    const scadenza = new Date(Date.now() + ore * 60 * 60 * 1000);

    await supabase.from('follow_ups').insert([{
      sale_id: sale.id,
      cliente_id: cliente.id,
      data_reminder: scadenza.toISOString().split('T')[0],
      ora_reminder: scadenza.toTimeString().slice(0, 5),
      tipo: 'call',
      nota: `Primo contatto lead ${lead.fonte} (SLA ${ore}h)`,
      assegnato_a: agente,
      creato_da: 'sistema'
    }]);

    await supabase.from('sales')
      .update({ prossima_azione_at: scadenza.toISOString() })
      .eq('id', sale.id);

    await supabase.from('lead_activities').insert([{
      sale_id: sale.id, tipo: 'note', created_by: 'GHL',
      contenuto: `Lead entrato da ${lead.fonte}${agente ? ` e assegnato a ${agente}` : ' (nessun agente attivo in rotazione)'}`
    }]);

    // 6. Avviso all'agente: un lead caldo non deve aspettare che qualcuno apra l'app.
    if (agente) {
      const { data: utente } = await supabase
        .from('team_members').select('username, email').eq('nome', agente).maybeSingle();
      const nominativo = `${cliente.nome} ${cliente.cognome || ''}`.trim();

      await push({
        titolo: `Nuovo lead: ${nominativo}`,
        messaggio: `${lead.fonte} • chiamalo entro ${ore}h`,
        url: APP_URL,
        username: utente?.username
      });

      if (utente?.email) {
        await email({
          a: utente.email,
          oggetto: `Nuovo lead assegnato: ${nominativo}`,
          html: template({
            badge: 'Nuovo lead', titolo: nominativo, accento: '#ef4444',
            righe: riga('Fonte', lead.fonte) + riga('Telefono', lead.telefono) +
                   riga('Email', lead.email) + riga('Zona', lead.zona) +
                   riga('Richiesta', lead.note),
            nota: `Primo contatto da fare entro ${ore} ore.`
          })
        });
      }
    } else {
      await push({ titolo: 'Lead non assegnato', messaggio: `${lead.fonte}: nessun agente attivo in rotazione`, url: APP_URL });
    }

    await logSync(supabase, {
      direzione: 'in', evento: 'lead_creato', entita: 'contact',
      entita_id: lead.ghlContactId, sale_id: sale.id, cliente_id: cliente.id, payload
    });

    return res.status(200).json({ ok: true, sale_id: sale.id, cliente_id: cliente.id, assegnato_a: agente });
  } catch (err) {
    console.error('Webhook GHL:', err);
    await logSync(supabase, {
      direzione: 'in', evento: 'lead', entita: 'contact', entita_id: lead.ghlContactId,
      esito: 'errore', errore: err.message, payload
    });
    return res.status(500).json({ error: err.message });
  }
}

async function trovaCliente(supabase, lead) {
  if (lead.ghlContactId) {
    const { data } = await supabase.from('clienti').select('*').eq('ghl_contact_id', lead.ghlContactId).maybeSingle();
    if (data) return data;
  }
  if (lead.email) {
    const { data } = await supabase.from('clienti').select('*').ilike('email', lead.email).limit(1);
    if (data && data.length) return data[0];
  }
  if (lead.telefono) {
    const cifre = lead.telefono.replace(/\D/g, '').slice(-9);
    if (cifre.length >= 6) {
      const { data } = await supabase.from('clienti').select('*').ilike('telefono', `%${cifre}%`).limit(1);
      if (data && data.length) return data[0];
    }
  }
  return null;
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
