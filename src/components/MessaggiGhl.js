// Messaggi al lead dai canali GHL di KeyPrime.
//
// L'agente scrive da qui: il messaggio parte dal numero e dal mittente
// dell'agenzia, non dal telefono personale, e resta attaccato al lead. Vale
// anche come attivita' registrata, quindi aggiorna "ultimo contatto".

import React, { useEffect, useState } from 'react';
import { Send, MessageCircle, Mail, Phone, Sparkles } from 'lucide-react';
import { Card, Button } from './ui';
import { supabase } from '../lib/supabaseClient';
import { inviaMessaggioGhl, avviaSequenzaGhl } from '../lib/api';
import { fmtDateTime } from '../lib/format';

const CANALI = [
  { id: 'whatsapp', label: 'WhatsApp', icona: MessageCircle, colore: '#25D366' },
  { id: 'sms', label: 'SMS', icona: Phone, colore: '#60A5FA' },
  { id: 'email', label: 'Email', icona: Mail, colore: '#A78BFA' }
];

export default function MessaggiGhl({ sale, cliente, utente, onMessaggioInviato, onToast }) {
  const [canale, setCanale] = useState('whatsapp');
  const [testo, setTesto] = useState('');
  const [oggetto, setOggetto] = useState('');
  const [inviando, setInviando] = useState(false);
  const [storico, setStorico] = useState([]);
  const [sequenze, setSequenze] = useState({});

  const caricaStorico = async () => {
    if (!sale?.id && !cliente?.id) return;
    const query = supabase.from('ghl_messages').select('*').order('created_at', { ascending: false }).limit(30);
    const { data } = sale?.id
      ? await query.eq('sale_id', sale.id)
      : await query.eq('cliente_id', cliente.id);
    setStorico(data || []);
  };

  useEffect(() => {
    caricaStorico();
    // Le sequenze disponibili sono quelle mappate in app_settings: l'agente
    // sceglie un nome leggibile, non un id GHL.
    (async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'ghl').maybeSingle();
      setSequenze(data?.value?.workflows || {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale?.id, cliente?.id]);

  const invia = async () => {
    if (!testo.trim()) return;
    if (canale === 'email' && !oggetto.trim()) { onToast?.('Per le email serve un oggetto', 'error'); return; }

    setInviando(true);
    const esito = await inviaMessaggioGhl({
      saleId: sale?.id, clienteId: cliente?.id, canale, testo, oggetto
    });
    setInviando(false);

    if (!esito.ok) { onToast?.(esito.error || 'Invio non riuscito', 'error'); return; }

    setTesto(''); setOggetto('');
    onToast?.('Messaggio inviato');
    await caricaStorico();
    onMessaggioInviato?.();
  };

  const avviaSequenza = async (nome) => {
    const esito = await avviaSequenzaGhl({ saleId: sale?.id, clienteId: cliente?.id, workflow: nome });
    onToast?.(esito.ok ? `Sequenza "${nome}" avviata` : (esito.error || 'Non riuscito'), esito.ok ? 'success' : 'error');
    if (esito.ok) onMessaggioInviato?.();
  };

  const nomiSequenze = Object.keys(sequenze);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {CANALI.map((c) => (
          <button key={c.id} onClick={() => setCanale(c.id)}
                  className={`flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                    canale === c.id ? 'text-ink' : 'bg-zinc-800/60 text-zinc-400 hover:text-ink'
                  }`}
                  style={canale === c.id ? { background: `${c.colore}26`, color: c.colore } : {}}>
            <c.icona className="w-4 h-4" />{c.label}
          </button>
        ))}
      </div>

      {canale === 'email' && (
        <input value={oggetto} onChange={(e) => setOggetto(e.target.value)} placeholder="Oggetto"
               className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />
      )}

      <textarea value={testo} onChange={(e) => setTesto(e.target.value)} rows={3}
                placeholder={`Scrivi a ${cliente?.nome || 'il cliente'} su ${CANALI.find(c => c.id === canale)?.label}...`}
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2 text-ink text-sm resize-none placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600" />

      <Button onClick={invia} icon={Send} disabled={inviando || !testo.trim()} className="w-full">
        {inviando ? 'Invio...' : 'Invia dai canali KeyPrime'}
      </Button>

      {nomiSequenze.length > 0 && (
        <div>
          <p className="text-zinc-500 text-xs mb-2">Avvia una sequenza automatica</p>
          <div className="flex gap-2 flex-wrap">
            {nomiSequenze.map((n) => (
              <button key={n} onClick={() => avviaSequenza(n)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />{n.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {storico.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
          <p className="text-zinc-500 text-xs">Conversazione</p>
          {storico.map((m) => (
            <div key={m.id}
                 className={`p-3 rounded-xl text-sm ${
                   m.direzione === 'uscita' ? 'bg-zinc-800/60 ml-4' : 'bg-blue-500/10 mr-4'
                 }`}>
              <p className="text-ink whitespace-pre-wrap break-words">{m.corpo}</p>
              <p className="text-zinc-600 text-xs mt-1">
                {m.canale} • {m.direzione === 'uscita' ? (m.inviato_da || 'portale') : 'cliente'} • {fmtDateTime(m.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {storico.length === 0 && (
        <Card padding="p-3" className="bg-zinc-800/40">
          <p className="text-zinc-500 text-xs">
            Nessun messaggio inviato da qui. Se l'integrazione GHL non e' ancora configurata,
            l'invio restituira' un avviso e puoi usare i pulsanti WhatsApp e Chiama.
          </p>
        </Card>
      )}
    </div>
  );
}
