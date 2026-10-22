// Controllo accessi (solo admin).
//
// Risponde a tre domande che prima non avevano risposta dentro il portale:
// che cosa vede ciascun ruolo, chi e' collegato in questo momento, e quanto
// sta maturando ogni persona. La tabella dei permessi non e' decorativa:
// descrive il comportamento reale del codice, scheda per scheda.

import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Monitor, Wallet, LogOut, Check, X as Ics, RefreshCw } from 'lucide-react';
import { Card, Button, Avatar } from './ui';
import { theme } from '../lib/theme';
import { sessioniAttive, chiudiSessioni } from '../lib/auth';
import { percentualeAgente } from '../lib/leads';
import { fmt, fmtDateTime } from '../lib/format';

const RUOLI = [
  { id: 'admin',        label: 'Admin',        nota: 'Pellegrino, Giovanni' },
  { id: 'agente_admin', label: 'Agente Admin', nota: 'quota societaria' },
  { id: 'agente',       label: 'Agente',       nota: 'i 3 nuovi sales' },
  { id: 'segnalatore',  label: 'Segnalatore',  nota: 'porta nominativi' }
];

// si = consentito, no = non consentito, 'suoi' = limitato ai propri dati
const PERMESSI = [
  { cosa: 'Scheda Oggi (coda di lavoro)',   admin: 'si',   agente_admin: 'suoi', agente: 'suoi', segnalatore: 'suoi' },
  { cosa: 'Vedere i lead',                  admin: 'si',   agente_admin: 'suoi', agente: 'suoi', segnalatore: 'suoi' },
  { cosa: 'Creare lead e clienti',          admin: 'si',   agente_admin: 'si',   agente: 'si',   segnalatore: 'si' },
  { cosa: 'Eliminare lead',                 admin: 'si',   agente_admin: 'si',   agente: 'si',   segnalatore: 'si' },
  { cosa: 'Vedere i clienti',               admin: 'si',   agente_admin: 'suoi', agente: 'suoi', segnalatore: 'suoi' },
  { cosa: 'Inbox Lead e assegnazioni',      admin: 'si',   agente_admin: 'no',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Assegnare lead ad altri',        admin: 'si',   agente_admin: 'si',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Commissioni di tutto il team',   admin: 'si',   agente_admin: 'no',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Le proprie commissioni',         admin: 'si',   agente_admin: 'si',   agente: 'si',   segnalatore: 'si' },
  { cosa: 'Dashboard e fatturato globale',  admin: 'si',   agente_admin: 'no',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Catalogo Off-Plan e offerte',    admin: 'si',   agente_admin: 'si',   agente: 'si',   segnalatore: 'si' },
  { cosa: 'Messaggi GHL al cliente',        admin: 'si',   agente_admin: 'si',   agente: 'suoi', segnalatore: 'suoi' },
  { cosa: 'Gestione team e accessi',        admin: 'si',   agente_admin: 'no',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Impostazioni e collegamento GHL',admin: 'si',   agente_admin: 'no',   agente: 'no',   segnalatore: 'no' },
  { cosa: 'Inviare notifiche ad altri',     admin: 'si',   agente_admin: 'si',   agente: 'no',   segnalatore: 'no' }
];

export default function ControlloAccessi({ users = [], sales = [], onToast, onModificaUtente }) {
  const [sessioni, setSessioni] = useState([]);
  const [caricando, setCaricando] = useState(false);
  const [scheda, setScheda] = useState('permessi');

  // useCallback invece di sopprimere l'avviso: cosi' la dipendenza dell'effetto
  // e' dichiarata davvero, e la funzione non viene ricreata a ogni render.
  const carica = useCallback(async () => {
    setCaricando(true);
    const esito = await sessioniAttive();
    setCaricando(false);
    if (!esito.ok) { onToast?.(esito.error || 'Non riuscito', 'error'); return; }
    setSessioni(esito.sessioni);
  }, [onToast]);

  useEffect(() => { carica(); }, [carica]);

  const disconnetti = async (u) => {
    if (!window.confirm(`Disconnettere ${u.nome} da tutti i dispositivi? Dovra' rientrare con le sue credenziali.`)) return;
    const esito = await chiudiSessioni(u.user_id);
    onToast?.(esito.ok ? `${u.nome} disconnesso (${esito.chiuse} sessioni)` : (esito.error || 'Non riuscito'),
              esito.ok ? 'success' : 'error');
    if (esito.ok) carica();
  };

  const schede = [
    { id: 'permessi', label: 'Chi vede cosa', icona: Shield },
    { id: 'sessioni', label: `Collegati ora (${sessioni.length})`, icona: Monitor },
    { id: 'compensi', label: 'Compensi', icona: Wallet }
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {schede.map(s => (
          <button key={s.id} onClick={() => setScheda(s.id)}
                  className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                    scheda === s.id ? 'bg-oro-500 text-[#0d1116] font-semibold' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                  }`}>
            <s.icona className="w-4 h-4" />{s.label}
          </button>
        ))}
      </div>

      {scheda === 'permessi' && <TabellaPermessi users={users} />}
      {scheda === 'sessioni' && (
        <Sessioni sessioni={sessioni} caricando={caricando} onAggiorna={carica} onDisconnetti={disconnetti} />
      )}
      {scheda === 'compensi' && (
        <Compensi users={users} sales={sales} onModificaUtente={onModificaUtente} />
      )}
    </div>
  );
}

function Segno({ valore }) {
  if (valore === 'si') return <Check className="w-4 h-4 mx-auto" style={{ color: '#34D399' }} />;
  if (valore === 'no') return <Ics className="w-4 h-4 mx-auto" style={{ color: '#6f7889' }} />;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">solo suoi</span>;
}

function TabellaPermessi({ users }) {
  const conta = (r) => users.filter(u => u.ruolo === r && u.attivo).length;

  return (
    <Card padding="p-0" className="overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-white font-semibold">Cosa vede e cosa puo' fare ciascun ruolo</h3>
        <p className="text-zinc-500 text-sm mt-1">
          "Solo suoi" significa che la persona vede esclusivamente i lead e i clienti
          assegnati a lei. Il ruolo si cambia dalla scheda Team.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">Funzione</th>
              {RUOLI.map(r => (
                <th key={r.id} className="py-3 px-3 text-center min-w-[110px]">
                  <div className="text-white font-medium">{r.label}</div>
                  <div className="text-zinc-600 text-xs font-normal">{conta(r.id)} attivi</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {PERMESSI.map(p => (
              <tr key={p.cosa} className="hover:bg-white/[0.02]">
                <td className="py-2.5 px-4 text-zinc-300">{p.cosa}</td>
                {RUOLI.map(r => (
                  <td key={r.id} className="py-2.5 px-3 text-center"><Segno valore={p[r.id]} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-zinc-800 bg-amber-500/5">
        <p className="text-amber-300/90 text-sm">
          Questi limiti vivono nell'interfaccia. Chi estraesse la chiave pubblica dal
          codice dell'app potrebbe comunque leggere i dati scavalcandola: per chiudere
          anche quella strada serve spostare l'autenticazione su Supabase Auth, il
          passo che resta da fare.
        </p>
      </div>
    </Card>
  );
}

function Sessioni({ sessioni, caricando, onAggiorna, onDisconnetti }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-sm">
          Una sessione dura 30 giorni e si rinnova a ogni utilizzo. Cambiando la
          password di qualcuno, le sue sessioni decadono da sole.
        </p>
        <Button variant="secondary" icon={RefreshCw} onClick={onAggiorna} disabled={caricando}>
          {caricando ? 'Leggo...' : 'Aggiorna'}
        </Button>
      </div>

      {sessioni.length === 0 ? (
        <Card className="text-center py-10">
          <Monitor className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400">Nessuno collegato in questo momento</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessioni.map(s => (
            <Card key={s.user_id} padding="p-4">
              <div className="flex items-center gap-4">
                <Avatar nome={s.nome} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium truncate">{s.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300">{s.ruolo}</span>
                    {s.sessioni > 1 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                        {s.sessioni} dispositivi
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm mt-0.5">
                    Ultimo utilizzo {fmtDateTime(s.ultimo_accesso)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={() => onDisconnetti(s)}
                        title="Disconnetti da tutti i dispositivi">
                  Disconnetti
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Compensi({ users, sales, onModificaUtente }) {
  const venduti = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');

  const righe = users
    .filter(u => ['agente', 'agente_admin', 'segnalatore'].includes(u.ruolo))
    .map(u => {
      const suoi = venduti.filter(s =>
        u.ruolo === 'segnalatore' ? s.segnalatore === u.nome : s.agente === u.nome);

      const maturato = suoi.reduce((t, s) => {
        const totale = Number(s.valore || 0) * (s.commission_pct || 5) / 100;
        const pct = u.ruolo === 'segnalatore' ? 30 : percentualeAgente(s, u);
        return t + totale * pct / 100;
      }, 0);

      const pagato = suoi.filter(s => s.pagato).reduce((t, s) => {
        const totale = Number(s.valore || 0) * (s.commission_pct || 5) / 100;
        const pct = u.ruolo === 'segnalatore' ? 30 : percentualeAgente(s, u);
        return t + totale * pct / 100;
      }, 0);

      const regola = u.ruolo === 'segnalatore' ? '30% fisso'
        : u.ruolo === 'agente_admin' ? 'quota societaria'
        : `${u.commission_pct ?? 70}%${u.commission_pct == null ? ' (standard)' : ' (personalizzata)'}`;

      return { u, vendite: suoi.length, maturato, pagato, regola };
    })
    .sort((a, b) => b.maturato - a.maturato);

  return (
    <div className="space-y-3">
      <p className="text-zinc-500 text-sm">
        Calcolato sulle sole vendite chiuse. La percentuale di un agente si cambia
        dalla sua scheda; vuota significa 70%, lo standard.
      </p>
      {righe.map(({ u, vendite, maturato, pagato, regola }) => (
        <Card key={u.id} padding="p-4" className={u.attivo ? '' : 'opacity-60'}>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar nome={u.nome} size="md" />
            <div className="flex-1 min-w-[160px]">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{u.nome}</p>
                {!u.attivo && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">disattivato</span>}
              </div>
              <p className="text-zinc-500 text-sm">{regola} • {vendite} vendite</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Maturato</p>
              <p className="font-semibold" style={{ color: theme.sections.dashboard.accent }}>{fmt(maturato)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Gia pagato</p>
              <p className="text-emerald-400 font-semibold">{fmt(pagato)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">Da pagare</p>
              <p className={maturato - pagato > 0 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
                {fmt(maturato - pagato)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onModificaUtente?.(u)}>Modifica</Button>
          </div>
        </Card>
      ))}
      {righe.length === 0 && (
        <Card className="text-center py-10"><p className="text-zinc-500">Nessun agente o segnalatore nel team</p></Card>
      )}
    </div>
  );
}
