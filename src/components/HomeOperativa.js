// Home operativa — lo schema disegnato nella revisione del collaboratore.
//
// La dashboard che c'era risponde a "come sta andando". Questa risponde a
// "cosa faccio adesso": agenda, numeri grossi, un colpo d'occhio sugli
// elenchi, le scorciatoie, gli ultimi immobili, le chiamate in scadenza.
// Le due convivono: questa sta sopra, l'analisi resta sotto.
//
// Meta' dei riquadri dello schema poggia su entita' che il database non ha
// ancora: immobili propri, richieste, contratti, appuntamenti veri. Invece
// di toglierli — un riquadro che manca non insegna niente — o di riempirli
// di numeri finti — che in un gestionale dove si vende davvero mandano un
// agente a cercare tre contratti che non esistono — ci sono tutti, e quelli
// che non hanno ancora un dato lo dicono: niente cifra, un esempio marcato
// come tale, e una riga che spiega cosa conteranno.
//
// Cosi' l'agente capisce la funzione, e nessuno scambia un segnaposto per
// un numero.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Mail, Building2, UserPlus, CalendarPlus, FilePlus, Home,
  Phone, Clock, ArrowRight, Sparkles, TrendingUp, FileSignature, KeyRound
} from 'lucide-react';
import { theme } from '../lib/theme';
import { supabase } from '../lib/supabaseClient';
import { luogoLeggibile } from '../lib/offplan';
import { caricaImmobili } from '../lib/immobili';

/* ── Pezzi comuni ──────────────────────────────────────────────────────── */

const scheda = {
  background: theme.bg.secondary,
  border: `1px solid ${theme.border.subtle}`
};

function Titolo({ children, azione, onAzione }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text.tertiary }}>
        {children}
      </h3>
      {azione && (
        <button onClick={onAzione} className="text-xs font-medium flex items-center gap-1"
                style={{ color: theme.accento.text }}>
          {azione} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* Il marchio dei riquadri che non hanno ancora un dato. Tratteggio invece di
   bordo pieno, e la parola "esempio" accanto al numero: sono i due segnali
   che si leggono prima di aver letto. */
function Anteprima({ children, nota }) {
  return (
    <div className="relative rounded-2xl p-4 h-full"
         style={{ background: theme.bg.tertiary, border: `1px dashed ${theme.border.strong}` }}>
      <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: theme.accento.wash, color: theme.accento.text }}>
        In arrivo
      </span>
      {children}
      {nota && (
        <p className="text-[11px] leading-snug mt-1.5" style={{ color: theme.text.tertiary }}>{nota}</p>
      )}
    </div>
  );
}

/* Una casella del "colpo d'occhio": o un numero vero e cliccabile, o il
   segnaposto che dice cosa ci finira'. */
function Casella({ icona: Icona, etichetta, valore, onClick, esempio, nota }) {
  if (valore === null || valore === undefined) {
    return (
      <Anteprima nota={nota}>
        <Icona className="w-4 h-4 mb-2" style={{ color: theme.text.muted }} />
        <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>{etichetta}</p>
        <p className="text-2xl font-semibold mt-0.5 tabular-nums" style={{ color: theme.text.muted }}>
          —<span className="text-[11px] font-normal ml-1.5">esempio: {esempio}</span>
        </p>
      </Anteprima>
    );
  }
  return (
    <button onClick={onClick} disabled={!onClick}
            className="rounded-2xl p-4 text-left h-full transition-colors disabled:cursor-default hover:bg-[#faf9f7]"
            style={scheda}>
      <Icona className="w-4 h-4 mb-2" style={{ color: theme.accento.text }} />
      <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>{etichetta}</p>
      <p className="text-2xl font-semibold mt-0.5 tabular-nums" style={{ color: theme.text.primary }}>
        {valore.toLocaleString('it-IT')}
      </p>
      {nota && <p className="text-[11px] leading-snug mt-1.5" style={{ color: theme.text.tertiary }}>{nota}</p>}
    </button>
  );
}

function Contatore({ etichetta, valore, dettaglio, icona: Icona }) {
  return (
    <div className="rounded-2xl p-5" style={scheda}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text.tertiary }}>
          {etichetta}
        </p>
        <Icona className="w-4 h-4" style={{ color: theme.accento.fill }} />
      </div>
      <p className="text-4xl font-semibold mt-2 tabular-nums" style={{ color: theme.text.primary }}>
        {valore === null ? '—' : valore.toLocaleString('it-IT')}
      </p>
      {dettaglio && <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>{dettaglio}</p>}
    </div>
  );
}

function Scorciatoia({ icona: Icona, label, onClick, inArrivo, nota }) {
  if (inArrivo) {
    return (
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
           style={{ background: theme.bg.tertiary, border: `1px dashed ${theme.border.strong}` }}
           title={nota}>
        <Icona className="w-4 h-4 shrink-0" style={{ color: theme.text.muted }} />
        <span className="text-sm" style={{ color: theme.text.muted }}>{label}</span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide shrink-0"
              style={{ color: theme.accento.text }}>In arrivo</span>
      </div>
    );
  }
  return (
    <button onClick={onClick} className="rounded-xl px-4 py-3 flex items-center gap-3 transition-colors hover:bg-[#faf9f7]"
            style={scheda}>
      <Icona className="w-4 h-4 shrink-0" style={{ color: theme.accento.text }} />
      <span className="text-sm font-medium" style={{ color: theme.text.primary }}>{label}</span>
    </button>
  );
}

/* ── Date ──────────────────────────────────────────────────────────────── */

const soloData = (d) => (d ? String(d).slice(0, 10) : '');
const oggiIso = () => new Date().toISOString().slice(0, 10);

function fraSetteGiorni(iso) {
  if (!iso) return false;
  const g = soloData(iso);
  const oggi = oggiIso();
  const fra7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return g >= oggi && g <= fra7;
}

const oraCorta = (t) => (t ? String(t).slice(0, 5) : null);

/* ── Home ──────────────────────────────────────────────────────────────── */

export default function HomeOperativa({
  clienti = [], sales = [], tasks = [], followUps = [], offerte = [],
  onVai, onNuovoCliente
}) {
  // Il catalogo non e' in memoria: lo conta il database, e sono due numeri.
  const [catalogo, setCatalogo] = useState({ totale: null, offplan: null, recenti: [] });
  // Il portafoglio proprio: da ieri esiste, quindi i suoi riquadri non sono
  // piu' segnaposto.
  const [portafoglio, setPortafoglio] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [tutti, offplan, ultimi] = await Promise.all([
        supabase.from('pf_projects').select('project_id', { count: 'exact', head: true }),
        supabase.from('pf_projects').select('project_id', { count: 'exact', head: true })
          .neq('construction_phase', 'completed'),
        supabase.from('pf_projects')
          .select('project_id, title, location_name, location_full, price_from, developer_name, images, construction_phase')
          .order('created_at', { ascending: false, nullsFirst: false })
          .limit(5)
      ]);
      if (!vivo) return;
      setCatalogo({
        totale: tutti.count ?? null,
        offplan: offplan.count ?? null,
        recenti: ultimi.data || []
      });
    })();
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    let vivo = true;
    caricaImmobili().then((esito) => {
      if (vivo && esito.ok) setPortafoglio(esito.elenco);
    });
    return () => { vivo = false; };
  }, []);

  const oggi = oggiIso();

  // L'agenda di oggi: i promemoria e le scadenze che ci sono davvero.
  const agendaOggi = useMemo(() => {
    const voci = [
      ...followUps
        .filter((f) => !f.completato && soloData(f.data_reminder) === oggi)
        .map((f) => ({
          id: `f${f.id}`, ora: oraCorta(f.ora_reminder), titolo: f.nota || 'Promemoria',
          tipo: f.tipo || 'follow-up', chi: f.assegnato_a, vai: 'followups'
        })),
      ...tasks
        .filter((t) => t.stato !== 'completato' && soloData(t.scadenza) === oggi)
        .map((t) => ({
          id: `t${t.id}`, ora: t.scadenza ? new Date(t.scadenza).toTimeString().slice(0, 5) : null,
          titolo: t.titolo, tipo: 'task', chi: t.assegnato_a, vai: 'tasks'
        }))
    ];
    return voci.sort((a, b) => (a.ora || '99:99').localeCompare(b.ora || '99:99'));
  }, [followUps, tasks, oggi]);

  const appuntamentiSettimana = useMemo(
    () => followUps.filter((f) => !f.completato && fraSetteGiorni(f.data_reminder)).length,
    [followUps]
  );

  const nuoviClienti30 = useMemo(() => {
    const soglia = new Date(Date.now() - 30 * 86400000).toISOString();
    return clienti.filter((c) => c.created_at && c.created_at >= soglia).length;
  }, [clienti]);

  const inTrattativa = useMemo(() => sales.filter((s) => s.stato === 'trattativa').length, [sales]);

  const daFollowUp = useMemo(() => {
    const scaduti = followUps.filter((f) => !f.completato && soloData(f.data_reminder) <= oggi).length;
    const taskAperti = tasks.filter((t) => t.stato !== 'completato').length;
    return scaduti + taskAperti;
  }, [followUps, tasks, oggi]);

  // Le prossime chiamate, ordinate per quando scadono.
  const prossimeChiamate = useMemo(() => {
    const perId = {};
    for (const c of clienti) perId[c.id] = c;
    return followUps
      .filter((f) => !f.completato && f.data_reminder)
      .sort((a, b) => String(a.data_reminder).localeCompare(String(b.data_reminder)))
      .slice(0, 6)
      .map((f) => ({ ...f, cliente: perId[f.cliente_id] }));
  }, [followUps, clienti]);

  // Finche' il portafoglio non e' arrivato i riquadri restano a null, cioe'
  // in attesa: meglio nessun numero che uno zero che poi cambia.
  const quantiImmobili = (contratto) =>
    portafoglio === null ? null : portafoglio.filter((i) => i.contratto === contratto).length;

  const prezzo = (n) => (n > 0 ? `da AED ${Number(n).toLocaleString('it-IT')}` : 'Prezzo su richiesta');

  return (
    <div className="space-y-5 mb-8">

      {/* Agenda e posta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={scheda}>
          <Titolo azione="Tutti i follow-up" onAzione={() => onVai?.('followups')}>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Agenda di oggi
            </span>
          </Titolo>
          {agendaOggi.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: theme.text.tertiary }}>
              Oggi non c'è niente in calendario.
            </p>
          ) : (
            <ul className="space-y-1">
              {agendaOggi.slice(0, 6).map((v) => (
                <li key={v.id}>
                  <button onClick={() => onVai?.(v.vai)}
                          className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-[#f6f4f0]">
                    <span className="text-sm font-semibold tabular-nums w-12 shrink-0"
                          style={{ color: v.ora ? theme.accento.text : theme.text.muted }}>
                      {v.ora || '—'}
                    </span>
                    <span className="text-sm truncate flex-1" style={{ color: theme.text.primary }}>{v.titolo}</span>
                    <span className="text-xs shrink-0" style={{ color: theme.text.tertiary }}>{v.chi || v.tipo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] mt-3 pt-3 border-t" style={{ borderColor: theme.border.subtle, color: theme.text.tertiary }}>
            Oggi mostra promemoria e task. Gli appuntamenti veri — con ora di inizio, durata
            e luogo — arrivano con l'agenda.
          </p>
        </div>

        <Anteprima nota="Mostrerà le email scambiate con i clienti, agganciate alla loro scheda: oggi il portale le manda ma non le conserva.">
          <Mail className="w-4 h-4 mb-2" style={{ color: theme.text.muted }} />
          <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Posta</p>
          <p className="text-2xl font-semibold mt-0.5" style={{ color: theme.text.muted }}>
            —<span className="text-[11px] font-normal ml-1.5">esempio: 4 non lette</span>
          </p>
        </Anteprima>
      </div>

      {/* I tre numeri grossi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Contatore etichetta="Immobili totali" valore={catalogo.totale} icona={Building2}
                   dettaglio="progetti nel catalogo Off-Plan" />
        <Contatore etichetta="Nuovi clienti" valore={nuoviClienti30} icona={UserPlus}
                   dettaglio={`negli ultimi 30 giorni · ${clienti.length} in rubrica`} />
        <Contatore etichetta="Appuntamenti settimana" valore={appuntamentiSettimana} icona={Clock}
                   dettaglio="promemoria nei prossimi 7 giorni" />
      </div>

      {/* In un colpo d'occhio */}
      <div>
        <Titolo>In un colpo d'occhio</Titolo>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Casella icona={Building2} etichetta="Off-plan projects" valore={catalogo.offplan}
                   onClick={() => onVai?.('offplan')}
                   nota="Progetti non ancora consegnati. I pronti si filtrano dal catalogo." />
          <Casella icona={Home} etichetta="Immobili in vendita" valore={quantiImmobili('vendita')}
                   onClick={() => onVai?.('immobili')}
                   nota="Il portafoglio dell'agenzia, non il catalogo dei developer." />
          <Casella icona={KeyRound} etichetta="Immobili in affitto" valore={quantiImmobili('affitto')}
                   onClick={() => onVai?.('immobili')}
                   nota="Gli immobili dati in locazione." />
          <Casella icona={FilePlus} etichetta="Richieste vendita" valore={null} esempio="8"
                   nota="Chi ti ha chiesto di vendere casa sua." />
          <Casella icona={FilePlus} etichetta="Richieste affitto" valore={null} esempio="5"
                   nota="Chi cerca in affitto, con budget e zona." />
          <Casella icona={TrendingUp} etichetta="Trattativa in corso" valore={inTrattativa}
                   onClick={() => onVai?.('pipeline')}
                   nota="Lead che hanno superato il primo contatto." />
          <Casella icona={Phone} etichetta="Attività da follow up" valore={daFollowUp}
                   onClick={() => onVai?.('followups')}
                   nota="Promemoria scaduti o di oggi, più i task aperti." />
          <Casella icona={FileSignature} etichetta="Contratti in scadenza" valore={null} esempio="3"
                   nota="Locazioni in scadenza nei 90 giorni, da rinnovare." />
        </div>
      </div>

      {/* Scorciatoie */}
      <div>
        <Titolo>Scorciatoie</Titolo>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Scorciatoia icona={UserPlus} label="Nuovo cliente" onClick={onNuovoCliente} />
          <Scorciatoia icona={Home} label="Nuovo immobile" onClick={() => onVai?.('immobili')} />
          <Scorciatoia icona={CalendarPlus} label="Nuovo appuntamento" inArrivo
                       nota="Arriva con l'agenda." />
          <Scorciatoia icona={FilePlus} label="Nuova richiesta" inArrivo
                       nota="Arriva con le richieste di vendita e affitto." />
        </div>
      </div>

      {/* Immobili recenti e chiamate in scadenza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={scheda}>
          <Titolo azione="Vai al catalogo" onAzione={() => onVai?.('offplan')}>Immobili recenti</Titolo>
          {catalogo.recenti.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: theme.text.tertiary }}>Caricamento…</p>
          ) : (
            <ul className="space-y-1">
              {catalogo.recenti.map((p) => {
                const foto = p.images?.[0]?.small_image_url || p.images?.[0]?.medium_image_url;
                return (
                  <li key={p.project_id} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                    {foto
                      ? <img src={foto} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <span className="w-10 h-10 rounded-lg shrink-0" style={{ background: theme.bg.tertiary }} />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate" style={{ color: theme.text.primary }}>
                        {p.title}
                      </span>
                      <span className="block text-xs truncate" style={{ color: theme.text.tertiary }}>
                        {luogoLeggibile(p.location_full, p.location_name)}
                      </span>
                    </span>
                    <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.accento.text }}>
                      {prezzo(p.price_from)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[11px] mt-3 pt-3 border-t" style={{ borderColor: theme.border.subtle, color: theme.text.tertiary }}>
            Ultimi arrivati nel catalogo Off-Plan. Quando ci sarà il portafoglio, qui
            compariranno i tuoi.
          </p>
        </div>

        <div className="rounded-2xl p-5" style={scheda}>
          <Titolo azione="Tutti" onAzione={() => onVai?.('followups')}>CRM clienti · follow up</Titolo>
          {prossimeChiamate.length === 0 ? (
            <div className="py-8 text-center">
              <Phone className="w-6 h-6 mx-auto mb-2" style={{ color: theme.text.muted }} />
              <p className="text-sm" style={{ color: theme.text.tertiary }}>Nessuna chiamata in programma.</p>
              <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: theme.text.muted }}>
                I promemoria si fissano dalla scheda di un cliente o dalla coda di lavoro:
                da lì finiscono qui, ordinati per scadenza.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {prossimeChiamate.map((f) => {
                const scaduta = soloData(f.data_reminder) < oggi;
                return (
                  <li key={f.id} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                    <Phone className="w-3.5 h-3.5 shrink-0"
                           style={{ color: scaduta ? theme.stato.critico.text : theme.text.tertiary }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate" style={{ color: theme.text.primary }}>
                        {f.cliente ? `${f.cliente.nome} ${f.cliente.cognome || ''}`.trim() : (f.nota || 'Contatto')}
                      </span>
                      {f.nota && f.cliente && (
                        <span className="block text-xs truncate" style={{ color: theme.text.tertiary }}>{f.nota}</span>
                      )}
                    </span>
                    <span className="text-xs shrink-0 tabular-nums font-medium"
                          style={{ color: scaduta ? theme.stato.critico.text : theme.text.secondary }}>
                      {new Date(f.data_reminder).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                      {oraCorta(f.ora_reminder) ? ` · ${oraCorta(f.ora_reminder)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Cosa sono i riquadri tratteggiati */}
      <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
           style={{ background: theme.accento.wash, border: `1px solid ${theme.accento.bordo}` }}>
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.accento.text }} />
        <p className="text-xs leading-relaxed" style={{ color: theme.text.secondary }}>
          I riquadri <strong>tratteggiati</strong> non sono ancora attivi: mostrano cosa conterranno,
          con un esempio marcato come tale. Nessun numero lì dentro è reale — dove c'è un dato vero,
          il riquadro è pieno e si può cliccare.
        </p>
      </div>
    </div>
  );
}
