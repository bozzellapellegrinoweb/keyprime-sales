// Inbox lead dell'admin.
//
// Due problemi da risolvere a vista: i lead che non sono in mano a nessuno, e
// quelli assegnati ma che l'agente non ha ancora toccato. Da qui si assegna a
// mano, in blocco, oppure si lascia fare alla rotazione.

import React, { useMemo, useState } from 'react';
import { UserPlus, RefreshCw, Flame, Check, AlertCircle } from 'lucide-react';
import { Card, Button, Avatar, StatusBadge, EmptyState } from './ui';
import { theme } from '../lib/theme';
import { valutaLead, oreDa, eAperto, SLA_PREDEFINITO } from '../lib/leads';
import { fmt, fmtShort } from '../lib/format';

export default function LeadInbox({
  leads = [], clienti = [], agenti = [], sla = SLA_PREDEFINITO,
  onApriLead, onAssegna, onAssegnaRotazione
}) {
  const [selezionati, setSelezionati] = useState([]);
  const [agenteScelto, setAgenteScelto] = useState('');
  const [inCorso, setInCorso] = useState(false);
  const [vista, setVista] = useState(null);

  const cliente = (id) => clienti.find((c) => c.id === id);
  const nomeCliente = (id) => {
    const c = cliente(id);
    return c ? `${c.nome} ${c.cognome || ''}`.trim() : null;
  };

  const aperti = useMemo(() => leads.filter(eAperto), [leads]);

  const nonAssegnati = useMemo(
    () => aperti.filter((l) => !l.assegnato_a && !l.agente),
    [aperti]
  );

  // Assegnati ma mai contattati: il lead ha un proprietario e resta fermo.
  const nonLavorati = useMemo(
    () => aperti
      .filter((l) => (l.assegnato_a || l.agente) && !l.ultimo_contatto_at)
      .filter((l) => (oreDa(l.created_at) || 0) > (sla.primo_contatto_ore ?? 24))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [aperti, sla]
  );

  const fermi = useMemo(
    () => aperti
      .filter((l) => l.ultimo_contatto_at)
      .map((l) => ({ lead: l, diagnosi: valutaLead(l, sla) }))
      .filter((x) => x.diagnosi && x.diagnosi.motivo === 'Fermo da troppo tempo')
      .sort((a, b) => b.diagnosi.urgenza - a.diagnosi.urgenza)
      .map((x) => x.lead),
    [aperti, sla]
  );

  // Finche' l'admin non sceglie, mostro la prima vista non vuota.
  const vistaEffettiva = vista
    || (nonAssegnati.length ? 'nonAssegnati'
      : nonLavorati.length ? 'nonLavorati'
      : fermi.length ? 'fermi' : 'nonAssegnati');

  const elenco = vistaEffettiva === 'nonAssegnati' ? nonAssegnati
    : vistaEffettiva === 'nonLavorati' ? nonLavorati : fermi;

  const inverti = (id) =>
    setSelezionati((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));

  const invertiTutti = () =>
    setSelezionati((p) => (p.length === elenco.length ? [] : elenco.map((l) => l.id)));

  const assegna = async () => {
    if (!selezionati.length || !agenteScelto) return;
    setInCorso(true);
    await onAssegna(selezionati, agenteScelto);
    setInCorso(false);
    setSelezionati([]);
    setAgenteScelto('');
  };

  const rotazione = async () => {
    const ids = selezionati.length ? selezionati : nonAssegnati.map((l) => l.id);
    if (!ids.length) return;
    setInCorso(true);
    await onAssegnaRotazione(ids);
    setInCorso(false);
    setSelezionati([]);
  };

  const schede = [
    { id: 'nonAssegnati', label: 'Senza agente', conta: nonAssegnati.length, colore: theme.sections.inbox.accent },
    { id: 'nonLavorati', label: 'Mai contattati', conta: nonLavorati.length, colore: theme.sections.oggi.accent },
    { id: 'fermi', label: 'Fermi', conta: fermi.length, colore: theme.sections.dashboard.accent }
  ];

  // Quanti lead aperti ha in mano ciascun agente: serve per non caricare
  // sempre la stessa persona quando si assegna a mano.
  const carico = useMemo(() => {
    const m = {};
    for (const l of aperti) {
      const a = l.assegnato_a || l.agente;
      if (a) m[a] = (m[a] || 0) + 1;
    }
    return m;
  }, [aperti]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {schede.map((s) => (
          <button key={s.id} onClick={() => { setVista(s.id); setSelezionati([]); }}
                  className={`rounded-2xl p-4 text-left border transition-all ${
                    vistaEffettiva === s.id ? 'bg-zinc-800' : 'bg-zinc-900 hover:bg-zinc-800/60'
                  }`}
                  style={{ borderColor: vistaEffettiva === s.id ? s.colore : 'transparent' }}>
            <p className="text-zinc-500 text-xs lg:text-sm">{s.label}</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: s.conta > 0 ? s.colore : '#6f7889' }}>
              {s.conta}
            </p>
          </button>
        ))}
      </div>

      {/* Carico per agente */}
      {agenti.length > 0 && (
        <Card padding="p-4">
          <p className="text-zinc-400 text-sm mb-3">Lead aperti per agente</p>
          <div className="flex flex-wrap gap-2">
            {agenti.map((a) => (
              <div key={a.nome} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2">
                <Avatar nome={a.nome} size="sm" />
                <div>
                  <p className="text-ink text-sm leading-tight">{a.nome}</p>
                  <p className="text-zinc-500 text-xs">{carico[a.nome] || 0} {(carico[a.nome] || 0) === 1 ? 'aperto' : 'aperti'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Barra di assegnazione */}
      {elenco.length > 0 && (
        <Card padding="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer shrink-0">
              <input type="checkbox" checked={selezionati.length === elenco.length && elenco.length > 0}
                     onChange={invertiTutti} className="w-4 h-4 rounded" />
              {selezionati.length ? `${selezionati.length} selezionati` : 'Seleziona tutti'}
            </label>

            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <select value={agenteScelto} onChange={(e) => setAgenteScelto(e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-zinc-600">
                <option value="">Assegna a...</option>
                {agenti.map((a) => (
                  <option key={a.nome} value={a.nome}>{a.nome} ({carico[a.nome] || 0} {(carico[a.nome] || 0) === 1 ? 'aperto' : 'aperti'})</option>
                ))}
              </select>
              <Button onClick={assegna} icon={UserPlus} disabled={inCorso || !selezionati.length || !agenteScelto}>
                Assegna
              </Button>
              {vistaEffettiva === 'nonAssegnati' && (
                <Button variant="secondary" onClick={rotazione} icon={RefreshCw} disabled={inCorso || !agenti.length}>
                  {selezionati.length ? 'A rotazione' : 'Distribuisci tutti'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Elenco */}
      {elenco.length === 0 ? (
        <EmptyState
          icon={Check}
          title={vistaEffettiva === 'nonAssegnati' ? 'Nessun lead senza agente' : vistaEffettiva === 'nonLavorati' ? 'Nessun lead in attesa di primo contatto' : 'Nessun lead fermo'}
          description={vistaEffettiva === 'nonAssegnati'
            ? 'Tutti i lead aperti hanno un proprietario.'
            : vistaEffettiva === 'nonLavorati'
              ? `Ogni lead assegnato e' stato contattato entro ${sla.primo_contatto_ore ?? 24} ore.`
              : 'Nessuna trattativa e rimasta indietro oltre i tempi previsti.'}
        />
      ) : (
        <div className="space-y-2">
          {elenco.map((l) => {
            const diagnosi = valutaLead(l, sla);
            const gravita = theme.gravita[diagnosi?.gravita] || theme.gravita.bassa;
            const selezionato = selezionati.includes(l.id);
            const proprietario = l.assegnato_a || l.agente;

            return (
              <Card key={l.id} padding="p-4" className={selezionato ? 'border-oro-500/40' : ''}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selezionato} onChange={() => inverti(l.id)}
                         className="w-4 h-4 rounded mt-1 shrink-0" />
                  <button onClick={() => onApriLead(l)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-ink font-medium truncate">
                        {nomeCliente(l.cliente_id) || l.progetto}
                      </p>
                      <StatusBadge status={l.stato || 'lead'} />
                      {l.temperatura === 'hot' && <Flame className="w-4 h-4 text-red-400" />}
                    </div>
                    <p className="text-zinc-500 text-sm truncate mt-0.5">
                      {l.progetto}{l.zona ? ` • ${l.zona}` : ''}{l.valore > 0 ? ` • ${fmt(l.valore)} AED` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {diagnosi && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: gravita.bg, color: gravita.color }}>
                          {diagnosi.motivo}
                        </span>
                      )}
                      <span className="text-zinc-600 text-xs">
                        {l.fonte ? `${l.fonte} • ` : ''}entrato {fmtShort(l.created_at)}
                        {diagnosi ? ` • ${diagnosi.dettaglio}` : ''}
                      </span>
                    </div>
                  </button>
                  <div className="shrink-0 text-right">
                    {proprietario ? (
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm hidden sm:inline">{proprietario}</span>
                        <Avatar nome={proprietario} size="sm" />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400">
                        <AlertCircle className="w-3 h-3" />Nessuno
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
