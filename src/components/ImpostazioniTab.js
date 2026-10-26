// Pannello Impostazioni (solo admin).
//
// Qui si collega GoHighLevel senza toccare codice o database: la chiave API
// vive nelle variabili ambiente di Vercel, mentre pipeline, stage, sequenze e
// tempi di SLA si scelgono da qui. Il pulsante di verifica interroga GHL e
// riporta esattamente cosa ha risposto, scope sbagliati compresi.

import React, { useEffect, useState } from 'react';
import { RefreshCw, Check, AlertCircle, Copy, Link2, Clock, Users } from 'lucide-react';
import { Card, Button, Input } from './ui';
import { theme } from '../lib/theme';
import { leggiConfigGhl } from '../lib/api';
import { salvaImpostazioni, SLA_PREDEFINITO } from '../lib/leads';
import { getBaseUrl } from '../lib/format';

// Sequenze di nurturing richiamabili dal portale: nome leggibile -> workflow GHL.
const SEQUENZE = [
  { chiave: 'benvenuto', label: 'Benvenuto nuovo lead', nota: 'Parte quando il lead entra da GHL' },
  { chiave: 'recupero_freddo', label: 'Recupero lead freddo', nota: 'Per chi non risponde da giorni' },
  { chiave: 'post_visita', label: 'Dopo la visita', nota: 'Follow-up a chi ha visto l\'immobile' },
  { chiave: 'nurturing_lungo', label: 'Nurturing lungo', nota: 'Chi compra fra mesi, non ora' }
];

const STATI_PIPELINE = [
  { id: 'lead', label: 'Lead' },
  { id: 'trattativa', label: 'Trattativa' },
  { id: 'EOI', label: 'EOI' },
  { id: 'venduto', label: 'Venduto (SPA)' },
  { id: 'incassato', label: 'Incassato' }
];

export default function ImpostazioniTab({ impostazioni, onRicarica, onToast, agentiAttivi = [] }) {
  const [ghl, setGhl] = useState(impostazioni.ghl || {});
  const [sla, setSla] = useState(impostazioni.sla || SLA_PREDEFINITO);
  const [rotazione, setRotazione] = useState(impostazioni.round_robin || { attivo: true });
  const [config, setConfig] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [salvando, setSalvando] = useState(null);
  const [copiato, setCopiato] = useState(null);

  useEffect(() => {
    setGhl(impostazioni.ghl || {});
    setSla(impostazioni.sla || SLA_PREDEFINITO);
    setRotazione(impostazioni.round_robin || { attivo: true });
  }, [impostazioni]);

  const verifica = async () => {
    setVerificando(true);
    const esito = await leggiConfigGhl();
    setVerificando(false);
    setConfig(esito);
    if (!esito.ok && esito.error) onToast?.(esito.error, 'error');
  };

  const salva = async (chiave, valore) => {
    setSalvando(chiave);
    const esito = await salvaImpostazioni(chiave, valore);
    setSalvando(null);
    onToast?.(esito.ok ? 'Impostazioni salvate' : (esito.error || 'Non riuscito'), esito.ok ? 'success' : 'error');
    if (esito.ok) onRicarica?.();
  };

  const copia = (testo, id) => {
    navigator.clipboard.writeText(testo);
    setCopiato(id);
    setTimeout(() => setCopiato(null), 2000);
  };

  const pipelines = config?.pipelines || [];
  const workflows = config?.workflows || [];
  const pipelineScelta = pipelines.find((p) => p.id === ghl.pipeline_id);
  const urlWebhook = `${getBaseUrl()}/api/ghl/webhook`;

  return (
    <div className="space-y-5">
      {/* ---------- Collegamento GHL ---------- */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-ink font-semibold flex items-center gap-2">
              <Link2 className="w-5 h-5" style={{ color: theme.sections.ghl.accent }} />
              GoHighLevel
            </h3>
            <p className="text-zinc-500 text-sm mt-1">
              La chiave API sta nelle variabili ambiente di Vercel. Da qui si scelgono pipeline e sequenze.
            </p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={verifica} disabled={verificando}>
            {verificando ? 'Verifico...' : 'Verifica'}
          </Button>
        </div>

        {config && <StatoCollegamento config={config} />}

        {!config && (
          <p className="text-zinc-500 text-sm">
            Premi Verifica per leggere pipeline e sequenze dalla location KeyPrime.
          </p>
        )}
      </Card>

      {/* ---------- Webhook in ingresso ---------- */}
      <Card>
        <h3 className="text-ink font-semibold mb-1">Lead in ingresso da GHL</h3>
        <p className="text-zinc-500 text-sm mb-4">
          In GHL, nel workflow che raccoglie i lead, aggiungi un'azione <strong>Webhook</strong> con questo
          indirizzo e l'header indicato. Ogni lead che arriva viene aperto nel portale, assegnato a rotazione
          e messo in coda con il primo follow-up.
        </p>
        <div className="space-y-2">
          <RigaCopiabile etichetta="URL (metodo POST)" valore={urlWebhook}
                         onCopia={() => copia(urlWebhook, 'url')} copiato={copiato === 'url'} />
          <RigaCopiabile etichetta="Header" valore="x-kp-secret: <il valore di GHL_WEBHOOK_SECRET>"
                         onCopia={() => copia('x-kp-secret', 'hdr')} copiato={copiato === 'hdr'} />
        </div>
      </Card>

      {/* ---------- Mappatura pipeline ---------- */}
      <Card>
        <h3 className="text-ink font-semibold mb-1">Pipeline e stage</h3>
        <p className="text-zinc-500 text-sm mb-4">
          Collegando gli stage, ogni cambio di stato nel portale sposta l'opportunita' anche su GHL.
          Senza mappatura il portale applica solo i tag, e le automazioni GHL possono reagire a quelli.
        </p>

        {pipelines.length === 0 ? (
          <p className="text-zinc-600 text-sm">Premi Verifica per caricare le pipeline disponibili.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Pipeline KeyPrime</label>
              <select value={ghl.pipeline_id || ''}
                      onChange={(e) => setGhl({ ...ghl, pipeline_id: e.target.value || null, stage_map: {} })}
                      className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm focus:outline-none focus:border-[#d8d3c9]">
                <option value="">Nessuna (solo tag)</option>
                {pipelines.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            {pipelineScelta && (
              <div className="space-y-2">
                {STATI_PIPELINE.map((st) => (
                  <div key={st.id} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400 w-32 shrink-0">{st.label}</span>
                    <select value={(ghl.stage_map || {})[st.id] || ''}
                            onChange={(e) => setGhl({ ...ghl, stage_map: { ...(ghl.stage_map || {}), [st.id]: e.target.value || undefined } })}
                            className="flex-1 bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:outline-none focus:border-[#d8d3c9]">
                      <option value="">Non mappato</option>
                      {pipelineScelta.stages.map((sg) => <option key={sg.id} value={sg.id}>{sg.nome}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- Sequenze ---------- */}
        {workflows.length > 0 && (
          <div className="mt-5 pt-5 border-t border-zinc-800 space-y-2">
            <p className="text-ink font-medium mb-2">Sequenze di nurturing</p>
            {SEQUENZE.map((sq) => (
              <div key={sq.chiave} className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <p className="text-sm text-zinc-300">{sq.label}</p>
                  <p className="text-xs text-zinc-600">{sq.nota}</p>
                </div>
                <select value={(ghl.workflows || {})[sq.chiave] || ''}
                        onChange={(e) => setGhl({ ...ghl, workflows: { ...(ghl.workflows || {}), [sq.chiave]: e.target.value || undefined } })}
                        className="flex-1 bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:outline-none focus:border-[#d8d3c9]">
                  <option value="">Non collegata</option>
                  {workflows.map((w) => <option key={w.id} value={w.id}>{w.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {(pipelines.length > 0 || workflows.length > 0) && (
          <Button onClick={() => salva('ghl', { ...ghl, attivo: true })} disabled={salvando === 'ghl'} className="w-full mt-5">
            {salvando === 'ghl' ? 'Salvataggio...' : 'Salva collegamento GHL'}
          </Button>
        )}
      </Card>

      {/* ---------- SLA ---------- */}
      <Card>
        <h3 className="text-ink font-semibold flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5" style={{ color: theme.sections.oggi.accent }} />
          Tempi di reazione
        </h3>
        <p className="text-zinc-500 text-sm mb-4">
          Oltre questi tempi il lead compare fra gli urgenti nella coda di lavoro, nell'inbox e nel
          promemoria giornaliero.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Primo contatto (ore)" type="number" min="1" value={sla.primo_contatto_ore ?? 24}
                 onChange={(e) => setSla({ ...sla, primo_contatto_ore: Number(e.target.value) })} />
          <Input label="Lead fermo (giorni)" type="number" min="1" value={sla.lead_fermo_giorni ?? 7}
                 onChange={(e) => setSla({ ...sla, lead_fermo_giorni: Number(e.target.value) })} />
          <Input label="Trattativa ferma (giorni)" type="number" min="1" value={sla.trattativa_ferma_giorni ?? 14}
                 onChange={(e) => setSla({ ...sla, trattativa_ferma_giorni: Number(e.target.value) })} />
        </div>
        <Button onClick={() => salva('sla', sla)} disabled={salvando === 'sla'} className="w-full mt-4">
          {salvando === 'sla' ? 'Salvataggio...' : 'Salva tempi'}
        </Button>
      </Card>

      {/* ---------- Rotazione ---------- */}
      <Card>
        <h3 className="text-ink font-semibold flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" style={{ color: theme.sections.pipeline.accent }} />
          Distribuzione automatica
        </h3>
        <p className="text-zinc-500 text-sm mb-4">
          Con la rotazione attiva, i lead che arrivano da GHL vengono assegnati a turno fra gli agenti
          attivi. Disattivandola restano senza proprietario nell'Inbox Lead, da assegnare a mano.
        </p>
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <input type="checkbox" checked={rotazione.attivo !== false}
                 onChange={(e) => setRotazione({ ...rotazione, attivo: e.target.checked })}
                 className="w-4 h-4 rounded" />
          <span className="text-zinc-300 text-sm">Rotazione attiva</span>
        </label>
        <div className="bg-zinc-800/50 rounded-xl p-3 mb-4">
          <p className="text-zinc-500 text-xs mb-2">In rotazione ora ({agentiAttivi.length})</p>
          {agentiAttivi.length ? (
            <p className="text-zinc-300 text-sm">{agentiAttivi.map((a) => a.nome).join(' → ')} → ...</p>
          ) : (
            <p className="text-amber-400 text-sm">Nessun agente attivo: i lead inbound resteranno da assegnare.</p>
          )}
        </div>
        <Button onClick={() => salva('round_robin', { ...rotazione, ultimo_indice: rotazione.ultimo_indice ?? -1 })}
                disabled={salvando === 'round_robin'} className="w-full">
          {salvando === 'round_robin' ? 'Salvataggio...' : 'Salva distribuzione'}
        </Button>
      </Card>
    </div>
  );
}

function StatoCollegamento({ config }) {
  if (!config.ok) {
    return (
      <div className="rounded-xl px-4 py-3 border bg-red-500/10 border-red-500/25">
        <p className="text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {config.messaggio || config.error || 'GHL non raggiungibile'}
        </p>
        {config.diagnostica && (
          <pre className="text-zinc-500 text-xs mt-2 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(config.diagnostica, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl px-4 py-3 border bg-emerald-500/10 border-emerald-500/25">
      <p className="text-emerald-400 text-sm flex items-center gap-2">
        <Check className="w-4 h-4 shrink-0" />
        Collegato — {config.pipelines?.length || 0} pipeline, {config.workflows?.length || 0} sequenze
      </p>
      <p className="text-zinc-500 text-xs mt-1">Location {config.location_id}</p>
      {config.diagnostica && (config.diagnostica.pipeline?.esito === 'errore' || config.diagnostica.workflow?.esito === 'errore') && (
        <p className="text-amber-400/80 text-xs mt-2">
          Una delle due letture non e' riuscita: controlla gli scope del token
          (serve opportunities.readonly e workflows.readonly).
        </p>
      )}
    </div>
  );
}

function RigaCopiabile({ etichetta, valore, onCopia, copiato }) {
  return (
    <div className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-zinc-500 text-xs">{etichetta}</p>
        <p className="text-zinc-200 text-sm font-mono truncate">{valore}</p>
      </div>
      <button onClick={onCopia} className="p-2 text-zinc-500 hover:text-ink transition-colors shrink-0">
        {copiato ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
