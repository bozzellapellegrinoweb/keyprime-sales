// La coda di lavoro dell'agente.
//
// Risponde a una sola domanda: cosa faccio adesso. Non e' l'elenco dei lead,
// e' l'elenco delle azioni in ordine di urgenza: follow-up in ritardo, lead
// mai chiamati fuori SLA, trattative ferme. Ogni riga si chiude da sola:
// chiami, registri com'e' andata, fissi il passo successivo.

import React, { useState } from 'react';
import { Phone, MessageCircle, Check, Clock, ChevronRight, Flame, Plus } from 'lucide-react';
import { Card, Button, Avatar, EmptyState } from './ui';
import { theme } from '../lib/theme';
import { TIPI_ATTIVITA } from '../lib/leads';
import { getWhatsAppLink } from '../lib/format';

const RIMANDA = [
  { giorni: 1, label: 'Domani' },
  { giorni: 3, label: '+3 giorni' },
  { giorni: 7, label: '+1 settimana' }
];

export default function WorkQueue({
  coda = [], clienti = [], onApriLead, onEseguito, onRimanda, onApriTuttiLead
}) {
  const [aperta, setAperta] = useState(null);

  const cliente = (id) => clienti.find((c) => c.id === id);
  const critici = coda.filter((v) => v.gravita === 'critica').length;

  if (!coda.length) {
    return (
      <div className="space-y-5">
        <RiepilogoTesta coda={coda} />
        <EmptyState
          icon={Check}
          title="Nessun lead in attesa"
          description="Tutti i follow-up sono in regola e nessun lead e' fermo oltre i tempi. Quando arrivera' qualcosa da fare lo trovi qui."
          action="Vedi tutti i lead"
          onAction={onApriTuttiLead}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <RiepilogoTesta coda={coda} />

      {critici > 0 && (
        <div className="rounded-2xl px-4 py-3 border flex items-center gap-3"
             style={{ background: theme.gravita.critica.bg, borderColor: theme.gravita.critica.border }}>
          <Flame className="w-5 h-5 shrink-0" style={{ color: theme.gravita.critica.color }} />
          <p className="text-sm" style={{ color: theme.gravita.critica.color }}>
            {critici === 1 ? '1 lead da recuperare subito' : `${critici} lead da recuperare subito`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {coda.map((voce) => {
          const c = cliente(voce.lead?.cliente_id ?? voce.followUp?.cliente_id);
          const gravita = theme.gravita[voce.gravita] || theme.gravita.bassa;
          const espansa = aperta === voce.chiave;

          return (
            <Card key={voce.chiave} padding="p-0" className="overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0" style={{ background: gravita.color }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar nome={c?.nome || voce.titolo} cognome={c?.cognome} size="md" />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => voce.lead && onApriLead(voce.lead)} className="text-left block w-full">
                        <p className="text-white font-medium truncate">{voce.titolo}</p>
                        {voce.sottotitolo && voce.sottotitolo !== voce.titolo && (
                          <p className="text-zinc-500 text-sm truncate">{voce.sottotitolo}</p>
                        )}
                      </button>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: gravita.bg, color: gravita.color }}>
                          {voce.motivo}
                        </span>
                        <span className="text-zinc-600 text-xs">{voce.dettaglio}</span>
                      </div>
                    </div>
                    {voce.lead && (
                      <button onClick={() => onApriLead(voce.lead)} className="text-zinc-600 hover:text-white shrink-0 p-1">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Azioni dirette: la telefonata parte da qui, non da tre schermate dopo */}
                  <div className="flex gap-2 mt-3">
                    {c?.telefono && (
                      <a href={`tel:${c.telefono}`}
                         className="flex-1 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm transition-colors">
                        <Phone className="w-4 h-4" />Chiama
                      </a>
                    )}
                    {(c?.whatsapp || c?.telefono) && (
                      <a href={getWhatsAppLink(c.whatsapp || c.telefono, c.nome ? `Ciao ${c.nome}, ` : '')}
                         target="_blank" rel="noopener noreferrer"
                         className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm transition-colors">
                        <MessageCircle className="w-4 h-4" />WhatsApp
                      </a>
                    )}
                    <button onClick={() => setAperta(espansa ? null : voce.chiave)}
                            className={`flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm transition-colors ${
                              espansa ? 'bg-oro-500 text-navy-950 font-medium' : 'bg-oro-500/10 hover:bg-oro-500/20 text-oro-400'
                            }`}>
                      <Check className="w-4 h-4" />Esito
                    </button>
                  </div>

                  {espansa && (
                    <PannelloEsito
                      voce={voce}
                      onEseguito={async (dati) => { await onEseguito(voce, dati); setAperta(null); }}
                      onRimanda={async (giorni) => { await onRimanda(voce, giorni); setAperta(null); }}
                    />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Registra com'e' andato il contatto e fissa il passo successivo in un colpo.
function PannelloEsito({ voce, onEseguito, onRimanda }) {
  const [tipo, setTipo] = useState(voce.followUp?.tipo || 'call');
  const [nota, setNota] = useState('');
  const [prossimo, setProssimo] = useState(3);
  const [salvando, setSalvando] = useState(false);

  const conferma = async (conFollowUp) => {
    setSalvando(true);
    await onEseguito({ tipo, nota, prossimoFollowUp: conFollowUp ? prossimo : null });
    setSalvando(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TIPI_ATTIVITA.map((t) => (
          <button key={t.id} onClick={() => setTipo(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                    tipo === t.id ? 'bg-oro-500 text-navy-950 font-medium' : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
                  }`}>
            {t.icona} {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={nota} onChange={(e) => setNota(e.target.value)}
        placeholder="Com'e' andata? (budget, tempi, obiezioni...)"
        rows={2}
        className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm resize-none placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
      />

      <div>
        <p className="text-zinc-500 text-xs mb-2">Prossimo contatto</p>
        <div className="flex gap-2">
          {RIMANDA.map((r) => (
            <button key={r.giorni} onClick={() => setProssimo(r.giorni)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                      prossimo === r.giorni ? 'bg-zinc-700 text-white font-medium' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                    }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => conferma(false)} disabled={salvando} className="flex-1">
          Chiudi senza seguito
        </Button>
        <Button onClick={() => conferma(true)} disabled={salvando} icon={Plus} className="flex-1">
          {salvando ? 'Salvo...' : 'Salva e rifissa'}
        </Button>
      </div>

      <button onClick={() => onRimanda(1)} disabled={salvando}
              className="w-full text-zinc-500 hover:text-white text-xs py-1 flex items-center justify-center gap-1.5 transition-colors">
        <Clock className="w-3 h-3" /> Non ora, ricordamelo domani
      </button>
    </div>
  );
}

function RiepilogoTesta({ coda }) {
  const conta = (g) => coda.filter((v) => v.gravita === g).length;
  const followUp = coda.filter((v) => v.genere === 'follow-up').length;

  const celle = [
    { label: 'Da fare oggi', valore: coda.length, colore: theme.sections.oggi.accent },
    { label: 'Urgenti', valore: conta('critica'), colore: theme.gravita.critica.color },
    { label: 'Follow-up', valore: followUp, colore: theme.sections.crm.accent },
    { label: 'Da recuperare', valore: coda.length - followUp, colore: theme.sections.pipeline.accent }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {celle.map((c) => (
        <Card key={c.label} padding="p-4">
          <p className="text-zinc-500 text-sm">{c.label}</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: c.valore > 0 ? c.colore : '#6d7d98' }}>
            {c.valore}
          </p>
        </Card>
      ))}
    </div>
  );
}
