// Impaginazione degli elenchi.
//
// Prima ogni tabella rendeva tutte le righe in un unico rotolo: con trenta
// contatti si scorre e basta, con trecento diventa impraticabile — e il conto
// di quante righe ci siano davvero non si legge da nessuna parte.
//
// Due pezzi: un hook che taglia l'elenco e un componente che disegna i
// comandi. Chi li usa non deve preoccuparsi dei casi limite — filtro che
// riduce i risultati mentre si e' a pagina 5, cambio di quante righe
// mostrare, elenco che si svuota: li gestisce l'hook.

import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { theme } from '../lib/theme';

export const RIGHE_PER_PAGINA = [25, 50, 100];

// Il prefisso "use" lo pretende la regola dei hook di React, non il vocabolario.
export function usePaginazione(elenco, perPaginaIniziale = 25) {
  const [pagina, setPagina] = useState(1);
  const [perPagina, impostaPerPagina] = useState(perPaginaIniziale);

  const totale = elenco.length;
  const totalePagine = Math.max(1, Math.ceil(totale / perPagina));

  // Si blocca durante il rendering invece che in un effetto: se un filtro
  // riduce i risultati mentre si e' a pagina 5, l'utente vede subito l'ultima
  // pagina valida e non un elenco vuoto per un fotogramma.
  const paginaValida = Math.min(pagina, totalePagine);

  const inizio = (paginaValida - 1) * perPagina;
  const elementi = useMemo(
    () => elenco.slice(inizio, inizio + perPagina),
    [elenco, inizio, perPagina]
  );

  const setPerPagina = (n) => { impostaPerPagina(n); setPagina(1); };

  return {
    elementi,
    pagina: paginaValida,
    totalePagine,
    totale,
    perPagina,
    da: totale === 0 ? 0 : inizio + 1,
    a: Math.min(inizio + perPagina, totale),
    vaiA: (n) => setPagina(Math.min(Math.max(1, n), totalePagine)),
    setPerPagina
  };
}

// I numeri di pagina da mostrare: al massimo cinque, centrati su quella
// corrente, senza mai sporgere dagli estremi.
function numeriVisibili(pagina, totalePagine) {
  const quanti = Math.min(5, totalePagine);
  let primo = Math.max(1, pagina - Math.floor(quanti / 2));
  if (primo + quanti - 1 > totalePagine) primo = totalePagine - quanti + 1;
  return Array.from({ length: quanti }, (_, i) => primo + i);
}

export default function Paginazione({
  pagina, totalePagine, totale, da, a, perPagina, vaiA, setPerPagina,
  nome = 'elementi', className = ''
}) {
  const radice = useRef(null);

  // I comandi stanno in fondo all'elenco: dopo il salto le righe nuove sono
  // tutte sopra, e chi ha scorso fino in fondo resterebbe a guardare il bordo
  // di una tabella che e' gia' cambiata. Si risale all'inizio dell'elenco,
  // ma solo se si era piu' in basso.
  const cambia = (n) => {
    vaiA(n);
    const contenitore = radice.current?.parentElement;
    if (!contenitore) return;
    const cima = contenitore.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > cima) window.scrollTo({ top: Math.max(0, cima), behavior: 'smooth' });
  };

  // Con una pagina sola i comandi non servono: resta solo il conto, che e'
  // comunque un'informazione ("quanti ne ho?").
  if (totale === 0) return null;

  const freccia = (verso, disabilitata, onClick, etichetta) => (
    <button
      onClick={onClick}
      disabled={disabilitata}
      aria-label={etichetta}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
      style={{ background: theme.bg.tertiary, color: theme.text.secondary }}
    >
      {verso === 'giu' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );

  return (
    <div ref={radice}
         className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ${className}`}
         style={{ borderColor: theme.border.subtle }}>
      <p className="text-sm tabular-nums" style={{ color: theme.text.tertiary }}>
        {da}–{a} di <span style={{ color: theme.text.secondary, fontWeight: 600 }}>{totale}</span> {nome}
      </p>

      <div className="flex items-center gap-3 ml-auto">
        {totale > RIGHE_PER_PAGINA[0] && (
          <label className="flex items-center gap-2 text-sm" style={{ color: theme.text.tertiary }}>
            <span className="hidden sm:inline">Per pagina</span>
            <select
              value={perPagina}
              onChange={(e) => setPerPagina(Number(e.target.value))}
              className="rounded-lg px-2 py-1.5 text-sm border-none"
              style={{ background: theme.bg.tertiary, color: theme.text.primary }}
            >
              {RIGHE_PER_PAGINA.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}

        {totalePagine > 1 && (
          <div className="flex items-center gap-1.5">
            {freccia('giu', pagina === 1, () => cambia(pagina - 1), 'Pagina precedente')}

            {/* I numeri occupano spazio: su telefono resta "3 / 12". */}
            <div className="hidden sm:flex items-center gap-1.5">
              {numeriVisibili(pagina, totalePagine).map((n) => (
                <button
                  key={n}
                  onClick={() => cambia(n)}
                  aria-current={n === pagina ? 'page' : undefined}
                  className="w-9 h-9 rounded-lg text-sm font-semibold transition-colors tabular-nums"
                  style={n === pagina
                    ? { background: theme.text.primary, color: '#ffffff' }
                    : { background: theme.bg.tertiary, color: theme.text.secondary }}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="sm:hidden text-sm tabular-nums px-1" style={{ color: theme.text.secondary }}>
              {pagina} / {totalePagine}
            </span>

            {freccia('su', pagina === totalePagine, () => cambia(pagina + 1), 'Pagina successiva')}
          </div>
        )}
      </div>
    </div>
  );
}
