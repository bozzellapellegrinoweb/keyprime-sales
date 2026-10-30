// Categoria del contatto: scelta, etichette, filtro.
//
// Tre pezzi che vanno tenuti insieme perche' parlano della stessa cosa e si
// sono gia' visti divergere altrove: la scelta nel modulo, le pastiglie in
// elenco e il filtro della rubrica.
//
// La scelta e' multipla di proposito. La richiesta diceva «acquirenti,
// proprietari (o entrambi)»: quel "o entrambi" e' il motivo per cui sul
// database c'e' un array e non una colonna sola.

import React from 'react';
import { Check, Tag } from 'lucide-react';
import { clienteTipi } from '../lib/costanti';
import { theme } from '../lib/theme';

/* ── Scelta nel modulo ─────────────────────────────────────────────────── */
export function SceltaTipiCliente({ valore = [], onCambia, label = 'Tipo di contatto' }) {
  const scelti = Array.isArray(valore) ? valore : [];
  const alterna = (id) =>
    onCambia(scelti.includes(id) ? scelti.filter((x) => x !== id) : [...scelti, id]);

  return (
    <div>
      {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {clienteTipi.map((t) => {
          const attivo = scelti.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => alterna(t.id)}
              title={t.descrizione}
              aria-pressed={attivo}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border"
              style={attivo
                ? { background: theme.accento.wash, borderColor: theme.accento.bordo, color: theme.accento.text }
                : { background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.secondary }}
            >
              {attivo && <Check className="w-3.5 h-3.5" />}
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: theme.text.tertiary }}>
        Se ne possono scegliere più di una: chi vende e ricompra è proprietario e acquirente insieme.
      </p>
    </div>
  );
}

/* ── Pastiglie in elenco ───────────────────────────────────────────────── */
export function PastiglieTipi({ tipi = [], massimo = 2, breve = false }) {
  const elenco = (Array.isArray(tipi) ? tipi : []).filter(Boolean);
  if (elenco.length === 0) return null;
  const mostrati = elenco.slice(0, massimo);
  const resto = elenco.length - mostrati.length;

  return (
    <span className="inline-flex items-center gap-1 flex-wrap align-middle">
      {mostrati.map((id) => {
        const t = clienteTipi.find((x) => x.id === id);
        return (
          <span key={id} title={t?.descrizione}
                className="px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
                style={{ background: theme.accento.wash, color: theme.accento.text }}>
            {breve ? (t?.breve || id) : (t?.label || id)}
          </span>
        );
      })}
      {resto > 0 && (
        <span className="text-[11px]" style={{ color: theme.text.tertiary }}
              title={elenco.map((id) => clienteTipi.find((x) => x.id === id)?.label || id).join(', ')}>
          +{resto}
        </span>
      )}
    </span>
  );
}

/* ── Filtro della rubrica ──────────────────────────────────────────────────
   La «bandiera per andare a selezionare le categorie» della richiesta. E' in
   OR: scegliendo Proprietario e Informatore si vede chi e' almeno una delle
   due, che e' quello che serve quando si cerca "chi puo' portarmi un
   immobile". Un AND darebbe quasi sempre zero righe. */
export function FiltroTipiCliente({ scelti = [], onCambia, conteggi = {} }) {
  const alterna = (id) =>
    onCambia(scelti.includes(id) ? scelti.filter((x) => x !== id) : [...scelti, id]);

  // Finche' nessuno ha una categoria la fila di pastiglie spente sembra rotta.
  // Meglio dire cos'e' e come si riempie.
  const ancoraVuoto = clienteTipi.every((t) => !conteggi[t.id]);
  if (ancoraVuoto && scelti.length === 0) {
    return (
      <p className="text-xs flex items-center gap-1.5" style={{ color: theme.text.tertiary }}>
        <Tag className="w-3.5 h-3.5 shrink-0" />
        Nessun contatto ha ancora una categoria (acquirente, proprietario, agente…).
        Si assegna aprendo un contatto e modificandolo: poi i filtri compaiono qui.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: theme.text.tertiary }} />
      {clienteTipi.map((t) => {
        const attivo = scelti.includes(t.id);
        const quanti = conteggi[t.id] || 0;
        return (
          <button
            key={t.id}
            onClick={() => alterna(t.id)}
            title={`${t.descrizione} — ${quanti} in rubrica`}
            aria-pressed={attivo}
            disabled={quanti === 0 && !attivo}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={attivo
              ? { background: theme.text.primary, color: '#ffffff' }
              : { background: theme.bg.tertiary, color: theme.text.secondary }}
          >
            {t.label}{quanti > 0 && <span className="ml-1 tabular-nums opacity-70">{quanti}</span>}
          </button>
        );
      })}
      {scelti.length > 0 && (
        <button onClick={() => onCambia([])} className="text-xs underline px-1"
                style={{ color: theme.text.tertiary }}>
          azzera
        </button>
      )}
    </div>
  );
}
