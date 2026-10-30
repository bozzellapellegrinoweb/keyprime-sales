// Barra di ricerca del catalogo off-plan.
//
// Segnalazione del collaboratore: «nella schermata degli off plan project non
// si puo' ricercare per nome del progetto ma si ferma solo a nome dei
// developers, cosi' con un Binghatti che ha mille progetti dobbiamo scorrere
// fino a trovare quello cercato».
//
// Il filtro SQL in realta' il titolo lo cercava gia'. Quello che mancava era
// che succedesse qualcosa: il campo faceva partire la ricerca solo con Invio
// o col pulsante Cerca, quindi uno scrive "Lunara", non vede muoversi niente,
// conclude che per nome non si cerca e torna a scorrere la tendina dei
// developer. Il difetto era nella risposta, non nella query.
//
// Qui il campo risponde mentre si scrive e propone: i progetti si aprono con
// un clic senza passare dalla griglia, developer e zone riempiono il filtro
// corrispondente.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Search, Building2, MapPin, Hammer, X, CornerDownLeft } from 'lucide-react';
import { theme } from '../lib/theme';
import { cercaSuggerimenti, zonaDi } from '../lib/offplan';

const ATTESA_MS = 250;   // tempo di quiete prima di interrogare il database

export default function RicercaProgetti({
  supabase, valore, onCambia, onCerca, onApriProgetto, onScegliDeveloper, onScegliZona,
  soloAttivi = true, placeholder = 'Cerca progetto, zona o developer...'
}) {
  const [suggerimenti, setSuggerimenti] = useState(null);
  const [aperto, setAperto] = useState(false);
  const [caricando, setCaricando] = useState(false);
  const [evidenziato, setEvidenziato] = useState(-1);
  const contenitore = useRef(null);
  const idElenco = useId();
  const campo = useRef(null);
  // Le risposte possono tornare fuori ordine: vale solo l'ultima partita.
  const richiesta = useRef(0);

  useEffect(() => {
    const testo = (valore || '').trim();
    if (testo.length < 2) { setSuggerimenti(null); setCaricando(false); return; }

    const mia = ++richiesta.current;
    setCaricando(true);
    const t = setTimeout(async () => {
      const esito = await cercaSuggerimenti(supabase, testo, { soloAttivi });
      if (mia !== richiesta.current) return;
      setSuggerimenti(esito);
      setCaricando(false);
      setEvidenziato(-1);
    }, ATTESA_MS);
    return () => clearTimeout(t);
  }, [valore, supabase, soloAttivi]);

  // Un clic fuori chiude, senza toccare quello che si e' scritto.
  useEffect(() => {
    const fuori = (e) => { if (!contenitore.current?.contains(e.target)) setAperto(false); };
    document.addEventListener('mousedown', fuori);
    return () => document.removeEventListener('mousedown', fuori);
  }, []);

  const righe = [
    ...(suggerimenti?.progetti || []).map((p) => ({ tipo: 'progetto', dato: p })),
    ...(suggerimenti?.developer || []).map((d) => ({ tipo: 'developer', dato: d })),
    ...(suggerimenti?.zone || []).map((z) => ({ tipo: 'zona', dato: z }))
  ];

  const scegli = useCallback((riga) => {
    setAperto(false);
    if (riga.tipo === 'progetto') { onApriProgetto?.(riga.dato); return; }
    if (riga.tipo === 'developer') { onCambia(''); onScegliDeveloper?.(riga.dato.nome); return; }
    onCambia(''); onScegliZona?.(riga.dato.nome);
  }, [onApriProgetto, onScegliDeveloper, onScegliZona, onCambia]);

  const tasti = (e) => {
    if (e.key === 'Escape') { setAperto(false); return; }
    if (!aperto || righe.length === 0) {
      if (e.key === 'Enter') onCerca?.();
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setEvidenziato((i) => (i + 1) % righe.length); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setEvidenziato((i) => (i <= 0 ? righe.length - 1 : i - 1)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (evidenziato >= 0) scegli(righe[evidenziato]);
      else { setAperto(false); onCerca?.(); }
    }
  };

  const prezzo = (n) => (n > 0 ? `da AED ${Number(n).toLocaleString('it-IT')}` : 'Prezzo su richiesta');

  // Evidenzia nel nome il pezzo che si sta scrivendo: senza, in un elenco di
  // sei titoli simili si deve rileggere tutto per capire perche' sono li'.
  const conEvidenza = (nome) => {
    const cerca = (valore || '').trim();
    const i = (nome || '').toLowerCase().indexOf(cerca.toLowerCase());
    if (i < 0 || !cerca) return nome;
    return (
      <>
        {nome.slice(0, i)}
        <mark style={{ background: theme.accento.wash, color: theme.accento.text, padding: 0 }}>
          {nome.slice(i, i + cerca.length)}
        </mark>
        {nome.slice(i + cerca.length)}
      </>
    );
  };

  const riga = (r, i) => {
    const attiva = i === evidenziato;
    const stile = { background: attiva ? theme.bg.tertiary : 'transparent' };
    const comune = 'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors';

    if (r.tipo === 'progetto') {
      const p = r.dato;
      const foto = p.images?.[0]?.small_image_url || p.images?.[0]?.medium_image_url;
      return (
        <button key={`p${p.project_id}`} className={comune} style={stile} role="option" aria-selected={attiva}
                onMouseEnter={() => setEvidenziato(i)} onClick={() => scegli(r)}>
          {foto
            ? <img src={foto} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            : <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: theme.bg.tertiary }}>
                <Building2 className="w-4 h-4" style={{ color: theme.text.tertiary }} />
              </span>}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold truncate" style={{ color: theme.text.primary }}>
              {conEvidenza(p.title)}
            </span>
            <span className="block text-xs truncate" style={{ color: theme.text.tertiary }}>
              {p.developer?.name || 'Developer n/d'} · {zonaDi(p.location?.full_name, p.location?.name, p.title)}
            </span>
          </span>
          <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.accento.text }}>
            {prezzo(p.price_from)}
          </span>
        </button>
      );
    }

    const { nome, quanti } = r.dato;
    const Icona = r.tipo === 'developer' ? Hammer : MapPin;
    return (
      <button key={`${r.tipo}${nome}`} className={comune} style={stile} role="option" aria-selected={attiva}
              onMouseEnter={() => setEvidenziato(i)} onClick={() => scegli(r)}>
        <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: theme.bg.tertiary }}>
          <Icona className="w-4 h-4" style={{ color: theme.text.tertiary }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm truncate" style={{ color: theme.text.primary }}>{conEvidenza(nome)}</span>
          <span className="block text-xs" style={{ color: theme.text.tertiary }}>
            {r.tipo === 'developer' ? 'Developer' : 'Zona'} · filtra i risultati
          </span>
        </span>
        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.text.tertiary }}>{quanti}+</span>
      </button>
    );
  };

  const mostra = aperto && (valore || '').trim().length >= 2;
  const vuoto = mostra && !caricando && suggerimenti && righe.length === 0;

  return (
    <div className="relative" ref={contenitore}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: theme.text.tertiary }} />
      <input
        ref={campo}
        type="text"
        value={valore}
        placeholder={placeholder}
        onChange={(e) => { onCambia(e.target.value); setAperto(true); }}
        onFocus={() => setAperto(true)}
        onKeyDown={tasti}
        role="combobox"
        aria-expanded={mostra}
        aria-controls={idElenco}
        aria-autocomplete="list"
        className="w-full rounded-xl pl-10 pr-10 py-3 text-sm border focus:outline-none"
        style={{ background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.primary }}
      />
      {valore && (
        <button onClick={() => { onCambia(''); setAperto(false); campo.current?.focus(); }}
                aria-label="Svuota la ricerca"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5">
          <X className="w-4 h-4" style={{ color: theme.text.tertiary }} />
        </button>
      )}

      {mostra && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl overflow-hidden"
             style={{ background: theme.bg.secondary, border: `1px solid ${theme.border.default}`,
                      boxShadow: '0 18px 40px rgba(15,28,53,0.18)' }}>
          {caricando && righe.length === 0 && (
            <p className="px-3 py-3 text-sm" style={{ color: theme.text.tertiary }}>Cerco...</p>
          )}
          {vuoto && (
            <p className="px-3 py-3 text-sm" style={{ color: theme.text.tertiary }}>
              Nessun progetto, developer o zona con «{valore}».
            </p>
          )}
          <div id={idElenco} role="listbox" className="max-h-[22rem] overflow-y-auto">{righe.map(riga)}</div>
          {righe.length > 0 && (
            <div className="px-3 py-2 text-xs flex items-center gap-1.5 border-t"
                 style={{ borderColor: theme.border.subtle, color: theme.text.tertiary }}>
              <CornerDownLeft className="w-3 h-3" />
              Invio cerca fra tutti i risultati · ↑↓ per scorrere
            </div>
          )}
        </div>
      )}
    </div>
  );
}
