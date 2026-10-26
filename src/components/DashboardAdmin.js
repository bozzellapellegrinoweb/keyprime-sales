// Dashboard dell'amministratore.
//
// Impianto a riquadri: la gerarchia la fanno la dimensione delle card e un
// riempimento solo, non dodici tinte diverse. In alto una riga di indicatori,
// sotto il numero che guida la pagina, poi gli elenchi — perche' il lavoro
// vero (chi ha quanti lead, quali zone tirano) sono liste, e in una card
// piccola non ci stanno.
//
// Scelte di forma, nell'ordine in cui vanno prese:
//  - quattro numeri di testa  -> tessere, non un grafico a barre raggruppate;
//  - un solo numero guida      -> cifra grande, una per pagina;
//  - stadi della pipeline      -> hanno un ordine, quindi una rampa di una
//                                tinta sola, non cinque colori diversi;
//  - confronto fra agenti/zone -> e' grandezza, non identita': barre di una
//                                tinta sola con l'etichetta in punta.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp, Target, DollarSign, Printer, ChevronRight,
  AlertCircle, UserPlus, Wallet
} from 'lucide-react';
import { theme, RAMPA_NAVY } from '../lib/theme';
import { fmt } from '../lib/format';
import { pipelineStati, pipelineLabels } from '../lib/costanti';

/* ── Movimento ───────────────────────────────────────────────────────────── */

// Chi ha chiesto meno animazioni al sistema operativo le vede comparire ferme.
// Il prefisso "use" lo pretende la regola dei hook di React, non il vocabolario.
const useMovimento = () => {
  const [si, setSi] = useState(true);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const applica = () => setSi(!m.matches);
    applica();
    m.addEventListener?.('change', applica);
    return () => m.removeEventListener?.('change', applica);
  }, []);
  return si;
};

// La cifra guida sale fino al suo valore: dice "questo numero e' vivo" senza
// aggiungere un elemento in piu' alla pagina.
function useConteggio(valore, attivo) {
  const [mostrato, setMostrato] = useState(attivo ? 0 : valore);
  const precedente = useRef(valore);
  useEffect(() => {
    if (!attivo) { setMostrato(valore); return; }
    const da = precedente.current === valore ? 0 : precedente.current;
    precedente.current = valore;
    const durata = 900;
    let avvio = null, frame;
    const passo = (t) => {
      if (avvio === null) avvio = t;
      const q = Math.min(1, (t - avvio) / durata);
      const morbido = 1 - Math.pow(1 - q, 3);
      setMostrato(Math.round(da + (valore - da) * morbido));
      if (q < 1) frame = requestAnimationFrame(passo);
    };
    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [valore, attivo]);
  return mostrato;
}

/* ── Pezzi ───────────────────────────────────────────────────────────────── */

function Riquadro({ children, className = '', onClick, pieno, ritardo = 0, animato }) {
  const cliccabile = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={cliccabile ? 'button' : undefined}
      tabIndex={cliccabile ? 0 : undefined}
      onKeyDown={cliccabile ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`kp-riquadro ${cliccabile ? 'kp-cliccabile' : ''} ${className}`}
      style={{
        background: pieno ? theme.accento.fillScuro : theme.bg.secondary,
        border: `1px solid ${pieno ? 'transparent' : theme.border.subtle}`,
        animationDelay: animato ? `${ritardo}ms` : undefined
      }}
    >
      {children}
    </div>
  );
}

// Linea di tendenza: 2px, punta con anello della superficie perche' resti
// leggibile dove passa sopra la linea.
function Tendenza({ punti, colore, altezza = 34, animato }) {
  const id = useRef(`t${Math.random().toString(36).slice(2, 9)}`).current;
  if (!punti || punti.length < 2) return <div style={{ height: altezza }} />;

  const L = 108, A = altezza;
  const max = Math.max(...punti), min = Math.min(...punti);
  const campo = max - min || 1;
  const x = (i) => (i / (punti.length - 1)) * (L - 6) + 3;
  const y = (v) => A - 4 - ((v - min) / campo) * (A - 8);
  const d = punti.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ultimo = punti.length - 1;

  return (
    <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colore} stopOpacity="0.16" />
          <stop offset="100%" stopColor={colore} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${x(ultimo)},${A} L${x(0)},${A} Z`} fill={`url(#${id})`} />
      <path
        d={d} fill="none" stroke={colore} strokeWidth="2" pathLength="1"
        strokeLinecap="round" strokeLinejoin="round"
        className={animato ? 'kp-traccia' : undefined}
      />
      <circle cx={x(ultimo)} cy={y(punti[ultimo])} r="4" fill={colore} stroke={theme.bg.secondary} strokeWidth="2" />
    </svg>
  );
}

// Curva larga per la card guida: stessa forma della tendenza piccola, ma
// con l'area piena, perche' qui lo spazio c'e' e il vuoto si vedeva.
function Curva({ punti, colore, altezza = 92, animato }) {
  const id = useRef(`c${Math.random().toString(36).slice(2, 9)}`).current;
  if (!punti || punti.length < 2) return null;

  const L = 460, A = altezza;
  const max = Math.max(...punti), min = Math.min(...punti, 0);
  const campo = max - min || 1;
  const x = (i) => (i / (punti.length - 1)) * L;
  const y = (v) => A - 6 - ((v - min) / campo) * (A - 14);
  const d = punti.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" height={A} width="100%"
         aria-hidden="true" className={animato ? 'kp-tendina' : undefined}
         style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colore} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colore} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${L},${A} L0,${A} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={colore} strokeWidth="2"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Variazione({ pct, suScuro }) {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return null;
  const verso = pct > 0.5 ? 'su' : pct < -0.5 ? 'giu' : 'pari';
  // Sul fondo scuro il verde chiaro su verde chiarissimo non si legge: li'
  // la direzione la porta il segno, su una pastiglia traslucida.
  const t = suScuro
    ? { text: verso === 'giu' ? '#ffb4b4' : '#9fe6a0', bg: 'rgba(255,255,255,0.12)' }
    : theme.delta[verso];
  const segno = pct > 0 ? '+' : '';
  return (
    <span
      className="kp-variazione"
      style={{ color: t.text, background: t.bg }}
      title="rispetto al periodo precedente di pari durata"
    >
      {segno}{pct.toFixed(1)}%
    </span>
  );
}

function Tessera({ etichetta, valore, suffisso, pct, punti, icona: Icona, pieno, onClick, ritardo, animato }) {
  const ink = pieno ? '#ffffff' : theme.text.primary;
  const inkDebole = pieno ? 'rgba(255,255,255,0.62)' : theme.text.tertiary;
  const tinta = pieno ? theme.accento.fill : theme.accento.mark;

  return (
    <Riquadro onClick={onClick} pieno={pieno} ritardo={ritardo} animato={animato} className="kp-tessera">
      <div className="kp-tessera-testa">
        <span style={{ color: inkDebole }}>{etichetta}</span>
        {Icona && (
          <span
            className="kp-pastiglia"
            style={{ background: pieno ? 'rgba(255,255,255,0.14)' : theme.accento.wash, color: pieno ? theme.accento.fill : theme.accento.text }}
          >
            <Icona className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="kp-tessera-corpo">
        <div className="kp-tessera-valore" style={{ color: ink }}>
          {valore}
          {suffisso && <span className="kp-suffisso" style={{ color: inkDebole }}>{suffisso}</span>}
        </div>
        <Tendenza punti={punti} colore={tinta} animato={animato} />
      </div>
      <Variazione pct={pct} suScuro={pieno} />
    </Riquadro>
  );
}

// Gli stadi hanno un ordine: una tinta sola che si scurisce, e 2px di
// superficie a separare i segmenti invece di un bordo attorno a ciascuno.
function Imbuto({ byStato, totale, onVai }) {
  const stadi = pipelineStati.map((st, i) => ({
    st,
    n: (byStato[st] || []).length,
    fill: RAMPA_NAVY[i] || RAMPA_NAVY[RAMPA_NAVY.length - 1]
  }));
  const conValori = stadi.filter((s) => s.n > 0);

  return (
    <div>
      <div className="kp-barra-impilata" role="img"
           aria-label={stadi.map((s) => `${pipelineLabels[s.st] || s.st}: ${s.n}`).join(', ')}>
        {conValori.length === 0 ? (
          <div style={{ flex: 1, background: theme.grafico.deEnfasi }} />
        ) : conValori.map((s) => (
          <div key={s.st} style={{ flexGrow: s.n, background: s.fill }} title={`${pipelineLabels[s.st] || s.st}: ${s.n}`} />
        ))}
      </div>
      <div className="kp-legenda">
        {stadi.map((s) => (
          <button key={s.st} onClick={() => onVai?.('pipeline')} className="kp-voce-legenda">
            <span className="kp-chiave" style={{ background: s.fill }} />
            <span className="kp-chiave-testo" style={{ color: theme.text.secondary }}>
              {pipelineLabels[s.st] || s.st}
            </span>
            <span className="kp-chiave-n" style={{ color: theme.text.primary }}>{s.n}</span>
          </button>
        ))}
      </div>
      <p className="kp-nota" style={{ color: theme.text.tertiary }}>
        {totale} lead nel periodo
      </p>
    </div>
  );
}

// Confronto di grandezza: una tinta sola, valore in punta, nessuna etichetta
// dentro la barra (a larghezze piccole verrebbe tagliata).
function Classifica({ dati, vuoto, onVai, animato }) {
  const righe = Object.entries(dati).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = righe.length ? righe[0][1] : 1;

  if (!righe.length) {
    return <p className="kp-vuoto" style={{ color: theme.text.tertiary }}>{vuoto}</p>;
  }

  return (
    <div className="kp-classifica">
      {righe.map(([nome, valore], i) => (
        <button key={nome} onClick={() => onVai?.()} className="kp-riga-classifica">
          <span className="kp-nome" style={{ color: (nome || '').trim() ? theme.text.primary : theme.text.tertiary }}>
            {(nome || '').trim() || 'Non indicata'}
          </span>
          <span className="kp-pista" style={{ background: theme.grafico.griglia }}>
            <span
              className={`kp-barra ${animato ? 'kp-barra-cresce' : ''}`}
              style={{
                width: `${Math.max(4, (valore / max) * 100)}%`,
                background: theme.accento.fill,
                animationDelay: animato ? `${i * 70}ms` : undefined
              }}
            />
          </span>
          <span className="kp-valore-riga" style={{ color: theme.text.secondary }}>{fmt(valore)}</span>
        </button>
      ))}
    </div>
  );
}

function Avviso({ icona: Icona, titolo, dettaglio, tono, onClick }) {
  const t = theme.stato[tono] || theme.stato.attenzione;
  return (
    <button onClick={onClick} className="kp-avviso" style={{ background: t.bg, borderColor: t.fill }}>
      <span className="kp-avviso-icona" style={{ background: t.fill, color: tono === 'attenzione' ? '#141c2b' : '#ffffff' }}>
        <Icona className="w-4 h-4" />
      </span>
      <span className="kp-avviso-testo">
        <span style={{ color: theme.text.primary }}>{titolo}</span>
        <span style={{ color: t.text }}>{dettaglio}</span>
      </span>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: theme.text.tertiary }} />
    </button>
  );
}

/* ── Serie temporali ─────────────────────────────────────────────────────── */

// Dodici punti sul periodo scelto. Se i lead non hanno data utilizzabile la
// linea non si disegna: meglio niente che una tendenza inventata.
function serie(elenco, leggiValore) {
  const conData = elenco
    .map((s) => ({ t: new Date(s.data || s.created_at).getTime(), v: leggiValore(s) }))
    .filter((x) => Number.isFinite(x.t));
  if (conData.length < 2) return null;

  const da = Math.min(...conData.map((x) => x.t));
  const a = Math.max(...conData.map((x) => x.t));
  if (a === da) return null;

  const N = 12;
  const secchi = new Array(N).fill(0);
  for (const x of conData) {
    const i = Math.min(N - 1, Math.floor(((x.t - da) / (a - da)) * N));
    secchi[i] += x.v;
  }
  // Cumulata: una tessera mostra dove si e' arrivati, non il rumore settimanale.
  let somma = 0;
  return secchi.map((v) => (somma += v));
}

function variazione(elenco, leggiValore) {
  const conData = elenco
    .map((s) => ({ t: new Date(s.data || s.created_at).getTime(), v: leggiValore(s) }))
    .filter((x) => Number.isFinite(x.t));
  if (conData.length < 4) return null;

  const da = Math.min(...conData.map((x) => x.t));
  const a = Math.max(...conData.map((x) => x.t));
  const meta = da + (a - da) / 2;
  const prima = conData.filter((x) => x.t < meta).reduce((s, x) => s + x.v, 0);
  const dopo = conData.filter((x) => x.t >= meta).reduce((s, x) => s + x.v, 0);
  if (!prima) return null;
  return ((dopo - prima) / prima) * 100;
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export default function DashboardAdmin({
  sales = [], periodSales = [], vendite = [], totals = {}, byStato = {},
  byAgente = {}, byZona = {}, volTrattativa = 0,
  periodFilter = 'all', onPeriodo, onVai, onEsporta,
  overdueTasks = [], todayTasks = [], daAssegnare = 0
}) {
  const animato = useMovimento();
  const uno = () => 1;
  const valore = (s) => Number(s.valore || 0);

  const serieLead = useMemo(() => serie(periodSales, uno), [periodSales]);
  const serieTratt = useMemo(() => serie(periodSales.filter((s) => s.stato === 'trattativa'), valore), [periodSales]);
  const serieVendite = useMemo(() => serie(vendite, uno), [vendite]);
  const serieVolume = useMemo(() => serie(periodSales, valore), [periodSales]);
  const serieComm = useMemo(
    () => serie(vendite, (s) => Number(s.valore || 0) * (s.commission_pct || 5) / 100),
    [vendite]
  );

  const commissioni = Number(totals.comm || 0);
  const commissioniMostrate = useConteggio(commissioni, animato);

  const periodi = [
    { id: 'all', label: 'Tutto' },
    { id: '30', label: '30 giorni' },
    { id: '60', label: '60 giorni' },
    { id: '90', label: '90 giorni' }
  ];

  const incassate = vendite.filter((s) => s.stato === 'incassato').length;
  const quota = vendite.length ? Math.round((incassate / vendite.length) * 100) : 0;

  return (
    <div className={`kp-dashboard ${animato ? 'kp-animata' : ''}`}>
      <style>{CSS_DASHBOARD}</style>

      {/* Periodo + esportazione */}
      <div className="kp-barra-filtri">
        <div className="kp-periodi" role="group" aria-label="Periodo">
          {periodi.map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriodo?.(p.id)}
              aria-pressed={periodFilter === p.id}
              className="kp-periodo"
              style={periodFilter === p.id
                ? { background: theme.text.primary, color: '#ffffff' }
                : { color: theme.text.secondary }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={onEsporta} className="kp-bottone-chiaro" style={{ color: theme.text.primary, borderColor: theme.border.default }}>
          <Printer className="w-4 h-4" /> Esporta report
        </button>
      </div>

      {/* Cose che vogliono una mano, oggi */}
      {(overdueTasks.length > 0 || todayTasks.length > 0 || daAssegnare > 0) && (
        <div className="kp-avvisi">
          {overdueTasks.length > 0 && (
            <Avviso icona={AlertCircle} tono="critico" onClick={() => onVai?.('tasks')}
                    titolo="Task scaduti" dettaglio={`${overdueTasks.length} da recuperare`} />
          )}
          {todayTasks.length > 0 && (
            <Avviso icona={AlertCircle} tono="attenzione" onClick={() => onVai?.('tasks')}
                    titolo="Task di oggi" dettaglio={`${todayTasks.length} in scadenza`} />
          )}
          {daAssegnare > 0 && (
            <Avviso icona={UserPlus} tono="serio" onClick={() => onVai?.('inbox')}
                    titolo="Lead senza agente" dettaglio={`${daAssegnare} da assegnare`} />
          )}
        </div>
      )}

      {/* Quattro numeri di testa */}
      <div className="kp-griglia-tessere">
        <Tessera etichetta="Lead nel periodo" valore={periodSales.length} icona={Target}
                 pct={variazione(periodSales, uno)} punti={serieLead} ritardo={0} animato={animato}
                 onClick={() => onVai?.('pipeline')} />
        <Tessera etichetta="Volume in trattativa" valore={fmt(volTrattativa)} suffisso="AED" icona={TrendingUp}
                 pct={variazione(periodSales.filter((s) => s.stato === 'trattativa'), valore)}
                 punti={serieTratt} ritardo={60} animato={animato} onClick={() => onVai?.('pipeline')} />
        <Tessera etichetta="Vendite chiuse" valore={vendite.length} icona={DollarSign}
                 pct={variazione(vendite, uno)} punti={serieVendite} ritardo={120} animato={animato}
                 onClick={() => onVai?.('vendite')} />
        <Tessera etichetta="Volume potenziale" valore={fmt(totals.valore)} suffisso="AED" icona={Wallet}
                 pct={variazione(periodSales, valore)} punti={serieVolume} pieno ritardo={180} animato={animato}
                 onClick={() => onVai?.('vendite')} />
      </div>

      {/* Il numero che guida la pagina, la pipeline, lo split */}
      <div className="kp-griglia-media">
        <Riquadro className="kp-eroe" ritardo={240} animato={animato}>
          <p className="kp-etichetta" style={{ color: theme.text.tertiary }}>Commissioni maturate</p>
          <p className="kp-cifra-eroe" style={{ color: theme.text.primary }}>
            {fmt(commissioniMostrate)}<span className="kp-eroe-unita" style={{ color: theme.text.tertiary }}>AED</span>
          </p>
          <p className="kp-eroe-nota" style={{ color: theme.text.secondary }}>
            su {vendite.length} {vendite.length === 1 ? 'vendita chiusa' : 'vendite chiuse'}
            {quota > 0 && <> · {quota}% già incassate</>}
          </p>
          <div className="kp-eroe-curva">
            <Curva punti={serieComm} colore={theme.accento.text} animato={animato} />
          </div>
          <div className="kp-eroe-split">
            {[
              ['Netto KeyPrime', totals.netto],
              ['Agenti', totals.ag],
              ['Segnalatori', totals.sg]
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ color: theme.text.tertiary }}>{k}</span>
                <span style={{ color: theme.text.primary }}>{fmt(v)}</span>
              </div>
            ))}
          </div>
        </Riquadro>

        <Riquadro onClick={() => onVai?.('pipeline')} ritardo={300} animato={animato}>
          <div className="kp-testa-card">
            <h3 style={{ color: theme.text.primary }}>Pipeline</h3>
            <ChevronRight className="w-4 h-4" style={{ color: theme.text.tertiary }} />
          </div>
          <Imbuto byStato={byStato} totale={periodSales.length} onVai={onVai} />
        </Riquadro>

        <Riquadro ritardo={360} animato={animato}>
          <div className="kp-testa-card">
            <h3 style={{ color: theme.text.primary }}>Quote soci</h3>
            <span className="kp-unita" style={{ color: theme.text.tertiary }}>AED</span>
          </div>
          <div className="kp-soci">
            {(() => {
              const quote = [
                (totals.pell || 0) + (totals.agPell || 0),
                (totals.giov || 0) + (totals.agGiov || 0)
              ];
              const tot = quote[0] + quote[1];
              if (tot <= 0) return null;
              return (
                <div className="kp-barra-impilata" role="img"
                     aria-label={`Pellegrino ${fmt(quote[0])}, Giovanni ${fmt(quote[1])}`}>
                  <div style={{ flexGrow: quote[0], background: RAMPA_NAVY[4] }} />
                  <div style={{ flexGrow: quote[1], background: theme.accento.fill }} />
                </div>
              );
            })()}
            {[
              ['Pellegrino', (totals.pell || 0) + (totals.agPell || 0), totals.pell, totals.agPell, RAMPA_NAVY[4]],
              ['Giovanni', (totals.giov || 0) + (totals.agGiov || 0), totals.giov, totals.agGiov, theme.accento.fill]
            ].map(([nome, tot, kp, ag, tinta]) => (
              <div key={nome} className="kp-socio">
                <div className="kp-socio-testa">
                  <span style={{ color: theme.text.secondary }}>
                    <span className="kp-chiave" style={{ background: tinta, marginRight: 7 }} />
                    {nome}
                  </span>
                  <strong style={{ color: theme.text.primary }}>{fmt(tot)}</strong>
                </div>
                <div className="kp-socio-dettaglio" style={{ color: theme.text.tertiary }}>
                  KeyPrime {fmt(kp)}{Number(ag) > 0 ? ` · come agente ${fmt(ag)}` : ''}
                </div>
              </div>
            ))}
          </div>
        </Riquadro>
      </div>

      {/* Gli elenchi: e' qui che sta il lavoro */}
      <div className="kp-griglia-elenchi">
        <Riquadro ritardo={420} animato={animato}>
          <div className="kp-testa-card">
            <h3 style={{ color: theme.text.primary }}>Agenti per volume</h3>
            <span className="kp-unita" style={{ color: theme.text.tertiary }}>AED</span>
          </div>
          <Classifica dati={byAgente} vuoto="Nessun lead assegnato nel periodo."
                      onVai={() => onVai?.('utenti')} animato={animato} />
        </Riquadro>

        <Riquadro ritardo={480} animato={animato}>
          <div className="kp-testa-card">
            <h3 style={{ color: theme.text.primary }}>Zone per volume</h3>
            <span className="kp-unita" style={{ color: theme.text.tertiary }}>AED</span>
          </div>
          <Classifica dati={byZona} vuoto="Nessuna zona registrata nel periodo."
                      onVai={() => onVai?.('pipeline')} animato={animato} />
        </Riquadro>

        <Riquadro onClick={() => onVai?.('oggi')} ritardo={540} animato={animato} className="kp-invito">
          <div>
            <p className="kp-etichetta" style={{ color: theme.text.tertiary }}>Il lavoro di oggi</p>
            <p className="kp-invito-titolo" style={{ color: theme.text.primary }}>
              {sales.length} lead in archivio
            </p>
            <p className="kp-invito-nota" style={{ color: theme.text.secondary }}>
              La coda di lavoro ordina chi va richiamato prima, per tempo di attesa
              e per quanto vale la trattativa.
            </p>
          </div>
          <span className="kp-invito-bottone" style={{ background: theme.text.primary, color: '#ffffff' }}>
            Apri la coda <ChevronRight className="w-4 h-4" />
          </span>
        </Riquadro>
      </div>
    </div>
  );
}

/* ── Stili ───────────────────────────────────────────────────────────────── */

const CSS_DASHBOARD = `
.kp-dashboard { display: flex; flex-direction: column; gap: 18px; }

.kp-riquadro {
  border-radius: 20px; padding: 20px;
  transition: transform .22s cubic-bezier(.2,.7,.3,1), box-shadow .22s ease, border-color .22s ease;
  box-shadow: 0 1px 2px rgba(20,28,43,.04);
}
.kp-animata .kp-riquadro { opacity: 0; animation: kp-entra .5s cubic-bezier(.2,.7,.3,1) forwards; }
@keyframes kp-entra { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.kp-cliccabile { cursor: pointer; }
.kp-cliccabile:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(20,28,43,.09); }
.kp-cliccabile:focus-visible { outline: 2px solid #836a27; outline-offset: 2px; }

.kp-barra-filtri { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.kp-periodi { display: inline-flex; gap: 2px; padding: 3px; border-radius: 14px; background: rgba(20,28,43,.05); }
.kp-periodo { padding: 7px 14px; border-radius: 11px; font-size: 13px; font-weight: 600; background: transparent; transition: background .18s ease, color .18s ease; }
.kp-periodo:hover[aria-pressed="false"] { background: rgba(20,28,43,.06); }
.kp-bottone-chiaro { display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 13px; border: 1px solid; background: #fff; font-size: 13px; font-weight: 600; transition: background .18s ease; }
.kp-bottone-chiaro:hover { background: #faf9f7; }

.kp-avvisi { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.kp-avviso { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 15px; border: 1px solid; text-align: left; transition: transform .2s ease; }
.kp-avviso:hover { transform: translateY(-2px); }
.kp-avviso-icona { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kp-avviso-testo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.kp-avviso-testo > span:first-child { font-size: 13.5px; font-weight: 600; }
.kp-avviso-testo > span:last-child { font-size: 12px; }

.kp-griglia-tessere { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.kp-tessera { display: flex; flex-direction: column; gap: 12px; }
.kp-tessera-testa { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; font-weight: 500; }
.kp-pastiglia { width: 26px; height: 26px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kp-tessera-corpo { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.kp-tessera-valore { font-size: 27px; font-weight: 700; letter-spacing: -.5px; line-height: 1; }
.kp-suffisso { font-size: 12px; font-weight: 600; margin-left: 5px; letter-spacing: 0; }
.kp-variazione { align-self: flex-start; font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 8px; }

.kp-griglia-media { display: grid; gap: 14px; grid-template-columns: 1fr; }
@media (min-width: 1100px) { .kp-griglia-media { grid-template-columns: 1.5fr 1fr 1fr; } }
.kp-eroe { display: flex; flex-direction: column; }
.kp-etichetta { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
.kp-cifra-eroe { font-size: 50px; font-weight: 700; letter-spacing: -1.6px; line-height: 1.04; margin-top: 8px; }
.kp-eroe-unita { font-size: 16px; font-weight: 600; letter-spacing: 0; margin-left: 9px; }
.kp-eroe-nota { font-size: 13px; margin-top: 7px; }
.kp-eroe-curva { margin: 16px -20px 0; flex: 1; min-height: 92px; display: flex; align-items: flex-end; }
.kp-eroe-split { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 0; padding-top: 18px; border-top: 1px solid #efece5; }
.kp-eroe-split > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.kp-eroe-split span:first-child { font-size: 10.5px; letter-spacing: .4px; text-transform: uppercase; }
.kp-eroe-split span:last-child { font-size: 15px; font-weight: 700; }

.kp-testa-card { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
.kp-testa-card h3 { font-size: 15px; font-weight: 700; }
.kp-unita { font-size: 10.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }

.kp-barra-impilata { display: flex; height: 11px; border-radius: 6px; overflow: hidden; gap: 2px; background: #fff; }
.kp-legenda { display: flex; flex-direction: column; gap: 1px; margin-top: 13px; }
.kp-voce-legenda { display: flex; align-items: center; gap: 9px; padding: 5px 0; text-align: left; }
.kp-chiave { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.kp-chiave-testo { flex: 1; font-size: 12.5px; }
.kp-chiave-n { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.kp-nota { font-size: 11.5px; margin-top: 10px; }

.kp-soci { display: flex; flex-direction: column; gap: 15px; }
.kp-socio-testa { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.kp-socio-testa > span:first-child { display: inline-flex; align-items: center; }
.kp-socio-testa span { font-size: 12.5px; }
.kp-socio-testa strong { font-size: 18px; font-weight: 700; }
.kp-socio-dettaglio { font-size: 11px; margin-top: 2px; }

.kp-griglia-elenchi { display: grid; gap: 14px; grid-template-columns: 1fr; }
@media (min-width: 1100px) { .kp-griglia-elenchi { grid-template-columns: 1.15fr 1fr 1fr; } }
.kp-classifica { display: flex; flex-direction: column; gap: 3px; }
.kp-riga-classifica { display: grid; grid-template-columns: minmax(74px, 34%) 1fr auto; align-items: center; gap: 11px; padding: 7px 0; text-align: left; }
.kp-riga-classifica:hover .kp-nome { text-decoration: underline; }
.kp-nome { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kp-pista { display: block; height: 9px; border-radius: 5px; overflow: hidden; }
.kp-barra { display: block; height: 100%; border-radius: 5px; }
.kp-barra-cresce { animation: kp-cresce .75s cubic-bezier(.2,.7,.3,1) both; transform-origin: left center; }
@keyframes kp-cresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.kp-valore-riga { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.kp-vuoto { font-size: 12.5px; line-height: 1.5; }

.kp-invito { display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
.kp-invito-titolo { font-size: 22px; font-weight: 700; letter-spacing: -.4px; margin-top: 7px; }
.kp-invito-nota { font-size: 12.5px; line-height: 1.55; margin-top: 7px; }
.kp-invito-bottone { display: inline-flex; align-items: center; justify-content: center; gap: 7px; align-self: flex-start; padding: 10px 16px; border-radius: 13px; font-size: 13px; font-weight: 600; }

.kp-traccia { stroke-dasharray: 1; stroke-dashoffset: 1; animation: kp-disegna 1.1s cubic-bezier(.3,.7,.3,1) forwards; }
@keyframes kp-disegna { to { stroke-dashoffset: 0; } }
.kp-tendina { animation: kp-scopri 1.1s cubic-bezier(.3,.7,.3,1) forwards; }
@keyframes kp-scopri { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 -2% 0 0); } }

@media (prefers-reduced-motion: reduce) {
  .kp-riquadro, .kp-avviso, .kp-cliccabile:hover { transition: none; transform: none; }
  .kp-traccia, .kp-barra-cresce, .kp-tendina { animation: none; stroke-dashoffset: 0; transform: none; clip-path: none; }
}
`;
