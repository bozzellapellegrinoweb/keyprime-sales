// Immobili propri: il back-end dell'agente, con l'interruttore della vetrina.
//
// L'Off-Plan e' il catalogo di PropertyFinder: roba di altri, da consultare.
// Qui invece ci sono gli immobili che l'agenzia ha in mano, scritti a mano
// con le proprie foto. L'interruttore "In vetrina" li manda sul sito
// pubblico di KeyPrime, e li toglie.
//
// Pubblicare non e' salvare: mette una pagina sotto il dominio dell'agenzia.
// Per questo il database rifiuta un annuncio senza prezzo, zona, foto o
// descrizione, e dice quale manca — qui quel messaggio si mostra, non si
// nasconde dietro un "errore".

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Home, Pencil, Trash2, Globe, EyeOff, ExternalLink, Upload, X,
  Star, AlertCircle, Search, ImageOff
} from 'lucide-react';
import { Card, Button, Input, Select, Modal, CampoNumero, EmptyState } from './ui';
import Paginazione, { usePaginazione } from './Paginazione';
import { theme } from '../lib/theme';
import {
  CONTRATTI, TIPOLOGIE, STATI, ARREDATO, DOTAZIONI,
  caricaImmobili, salvaImmobile, pubblicaImmobile, eliminaImmobile, caricaFoto,
  etichettaPrezzo, prezzoLeggibile, primaFoto, linkVetrina
} from '../lib/immobili';

const EMIRATI = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah'];

const VUOTO = {
  titolo: '', descrizione: '', contratto: 'vendita', tipologia: 'Appartamento',
  stato: 'disponibile', emirato: 'Dubai', zona: '', indirizzo: '',
  prezzo: null, trattabile: false, spese_annue: null,
  camere: null, bagni: null, superficie: null, piano: '', arredato: 'no', anno: null,
  dotazioni: [], proprietario_id: '', foto: [], planimetria: '', video: ''
};

/* ── Scheda in elenco ──────────────────────────────────────────────────── */

function SchedaImmobile({ immobile, onModifica, onVetrina, onElimina, occupato, puoPubblicare = true }) {
  const foto = primaFoto(immobile);
  const stato = STATI.find((s) => s.id === immobile.stato);
  const link = linkVetrina(immobile);

  return (
    <Card padding="p-0" className="overflow-hidden flex flex-col">
      <div className="relative h-40" style={{ background: theme.bg.tertiary }}>
        {foto
          ? <img src={foto} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-7 h-7" style={{ color: theme.text.muted }} />
            </div>}

        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold"
              style={immobile.pubblicato
                ? { background: theme.accento.fill, color: theme.accento.inkSuFill }
                : { background: 'rgba(255,255,255,0.92)', color: theme.text.secondary }}>
          {immobile.pubblicato ? 'In vetrina' : 'Bozza'}
        </span>
        <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-medium tabular-nums"
              style={{ background: 'rgba(255,255,255,0.92)', color: theme.text.secondary }}>
          {immobile.riferimento}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-ink leading-snug line-clamp-2">{immobile.titolo}</p>
          <span className="text-[11px] px-1.5 py-0.5 rounded shrink-0"
                style={{ background: theme.bg.tertiary, color: theme.text.secondary }}>
            {immobile.contratto === 'affitto' ? 'Affitto' : 'Vendita'}
          </span>
        </div>

        <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>
          {[immobile.zona, immobile.emirato].filter(Boolean).join(' · ') || 'Zona non indicata'}
        </p>

        <p className="text-lg font-semibold mt-2 tabular-nums" style={{ color: theme.accento.text }}>
          {prezzoLeggibile(immobile)}
        </p>

        <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>
          {[
            immobile.camere != null && `${immobile.camere} camere`,
            immobile.bagni != null && `${immobile.bagni} bagni`,
            immobile.superficie && `${Number(immobile.superficie).toLocaleString('it-IT')} sqft`
          ].filter(Boolean).join(' · ') || '—'}
        </p>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: theme.border.subtle }}>
          <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: theme.bg.tertiary, color: theme.text.secondary }}>
            {stato?.label || immobile.stato}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {immobile.pubblicato && link && (
              <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Apri sulla vetrina"
                 className="p-1.5 rounded-lg" style={{ background: theme.bg.tertiary, color: theme.text.secondary }}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {puoPubblicare && (
            <button onClick={() => onVetrina(immobile)} disabled={occupato}
                    aria-label={immobile.pubblicato ? 'Togli dalla vetrina' : 'Metti in vetrina'}
                    title={immobile.pubblicato ? 'Togli dalla vetrina' : 'Metti in vetrina'}
                    className="p-1.5 rounded-lg disabled:opacity-40"
                    style={immobile.pubblicato
                      ? { background: theme.accento.wash, color: theme.accento.text }
                      : { background: theme.bg.tertiary, color: theme.text.secondary }}>
              {immobile.pubblicato ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            </button>
            )}
            <button onClick={() => onModifica(immobile)} aria-label="Modifica"
                    className="p-1.5 rounded-lg" style={{ background: theme.bg.tertiary, color: theme.text.secondary }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onElimina(immobile)} aria-label="Elimina"
                    className="p-1.5 rounded-lg"
                    style={{ background: theme.stato.critico.bg, color: theme.stato.critico.text }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

function Galleria({ foto, onCambia }) {
  const [caricando, setCaricando] = useState(0);
  const [errore, setErrore] = useState(null);
  const campo = useRef(null);

  const aggiungi = async (files) => {
    const elenco = Array.from(files || []).slice(0, 20);
    if (!elenco.length) return;
    setErrore(null);
    setCaricando(elenco.length);
    const nuove = [];
    for (const f of elenco) {
      const esito = await caricaFoto(f);
      if (esito.ok) nuove.push({ url: esito.url, ordine: 0 });
      else setErrore(esito.error);
      setCaricando((n) => n - 1);
    }
    if (nuove.length) {
      onCambia([...foto, ...nuove].map((x, i) => ({ ...x, ordine: i })));
    }
  };

  const togli = (i) => onCambia(foto.filter((_, j) => j !== i).map((x, k) => ({ ...x, ordine: k })));
  const primaria = (i) => {
    const copia = [...foto];
    const [scelta] = copia.splice(i, 1);
    onCambia([scelta, ...copia].map((x, k) => ({ ...x, ordine: k })));
  };

  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-2">
        Foto {foto.length > 0 && <span style={{ color: theme.text.tertiary }}>· la prima è quella di copertina</span>}
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {foto.map((f, i) => (
          <div key={f.url} className="relative group rounded-lg overflow-hidden"
               style={{ background: theme.bg.tertiary, aspectRatio: '4/3' }}>
            <img src={f.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: theme.accento.fill, color: theme.accento.inkSuFill }}>
                Copertina
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                 style={{ background: 'rgba(15,28,53,0.55)' }}>
              {i !== 0 && (
                <button type="button" onClick={() => primaria(i)} aria-label="Usa come copertina"
                        className="p-1.5 rounded-lg bg-white/90">
                  <Star className="w-3.5 h-3.5" style={{ color: theme.accento.text }} />
                </button>
              )}
              <button type="button" onClick={() => togli(i)} aria-label="Togli la foto"
                      className="p-1.5 rounded-lg bg-white/90">
                <X className="w-3.5 h-3.5" style={{ color: theme.stato.critico.text }} />
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={() => campo.current?.click()} disabled={caricando > 0}
                className="rounded-lg flex flex-col items-center justify-center gap-1 text-xs disabled:opacity-50"
                style={{ aspectRatio: '4/3', border: `1px dashed ${theme.border.strong}`,
                         background: theme.bg.tertiary, color: theme.text.tertiary }}>
          <Upload className="w-4 h-4" />
          {caricando > 0 ? `${caricando}…` : 'Aggiungi'}
        </button>
      </div>

      <input ref={campo} type="file" accept="image/*" multiple className="hidden"
             onChange={(e) => { aggiungi(e.target.files); e.target.value = ''; }} />

      {errore && (
        <p className="text-xs mt-2" style={{ color: theme.stato.critico.text }}>
          Una foto non è stata caricata: {errore}
        </p>
      )}
    </div>
  );
}

/* ── Modulo ────────────────────────────────────────────────────────────── */

function ModuloImmobile({ immobile, clienti, puoPubblicare = true, onChiudi, onSalvato }) {
  const [form, setForm] = useState({ ...VUOTO, ...(immobile || {}) });
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState(null);

  const campo = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const testo = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Solo i contatti marcati come proprietari: la rubrica sa chi lo e' da
  // quando le categorie esistono.
  const proprietari = useMemo(
    () => clienti.filter((c) => (c.tipi || []).includes('proprietario')),
    [clienti]
  );

  const alternaDotazione = (d) => setForm((f) => ({
    ...f,
    dotazioni: (f.dotazioni || []).includes(d)
      ? f.dotazioni.filter((x) => x !== d)
      : [...(f.dotazioni || []), d]
  }));

  const salva = async () => {
    setErrore(null);
    setSalvando(true);
    try {
      const esito = await salvaImmobile({
        ...form,
        id: immobile?.id,
        prezzo: form.prezzo ?? '',
        spese_annue: form.spese_annue ?? '',
        camere: form.camere ?? '',
        bagni: form.bagni ?? '',
        superficie: form.superficie ?? '',
        anno: form.anno ?? ''
      });
      if (!esito?.ok) { setErrore(esito?.error || 'Salvataggio non riuscito'); return; }
      onSalvato(esito.immobile);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen onClose={onChiudi} size="2xl"
           title={immobile?.id ? `Modifica ${immobile.riferimento}` : 'Nuovo immobile'}>
      <div className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Contratto" value={form.contratto} onChange={testo('contratto')}>
            {CONTRATTI.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
          <Select label="Tipologia" value={form.tipologia || ''} onChange={testo('tipologia')}>
            {TIPOLOGIE.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Stato" value={form.stato} onChange={testo('stato')}>
            {STATI.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </div>

        <Input label="Titolo dell'annuncio *" value={form.titolo} onChange={testo('titolo')}
               placeholder="es. Trilocale con vista canale, Business Bay" />

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Descrizione</label>
          <textarea value={form.descrizione || ''} onChange={testo('descrizione')} rows={4}
                    placeholder="Cosa vede chi entra, cosa ha intorno, perché vale il prezzo."
                    className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none"
                    style={{ background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.primary }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Emirato" value={form.emirato || ''} onChange={testo('emirato')}>
            {EMIRATI.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Input label="Zona *" value={form.zona || ''} onChange={testo('zona')} placeholder="es. Business Bay" />
          <Input label="Indirizzo / edificio" value={form.indirizzo || ''} onChange={testo('indirizzo')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CampoNumero aspetto="modulo" label={etichettaPrezzo(form.contratto) + ' *'}
                       value={form.prezzo} onChange={campo('prezzo')} separatori min={0} />
          <CampoNumero aspetto="modulo" label="Spese annue (AED)" value={form.spese_annue}
                       onChange={campo('spese_annue')} separatori min={0} />
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: theme.text.secondary }}>
              <input type="checkbox" checked={!!form.trattabile}
                     onChange={(e) => setForm((f) => ({ ...f, trattabile: e.target.checked }))}
                     className="w-4 h-4 rounded" />
              Trattabile
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CampoNumero aspetto="modulo" label="Camere" value={form.camere} onChange={campo('camere')} min={0} />
          <CampoNumero aspetto="modulo" label="Bagni" value={form.bagni} onChange={campo('bagni')} min={0} />
          <CampoNumero aspetto="modulo" label="Superficie" suffisso="sqft" value={form.superficie}
                       onChange={campo('superficie')} min={0} />
          <Input label="Piano" value={form.piano || ''} onChange={testo('piano')} placeholder="es. 14" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Arredamento" value={form.arredato || 'no'} onChange={testo('arredato')}>
            {ARREDATO.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
          <CampoNumero aspetto="modulo" label="Anno di consegna" value={form.anno} onChange={campo('anno')} min={1980} />
          <Select label="Proprietario" value={form.proprietario_id || ''} onChange={testo('proprietario_id')}>
            <option value="">—</option>
            {proprietari.map((c) => (
              <option key={c.id} value={c.id}>{`${c.nome} ${c.cognome || ''}`.trim()}</option>
            ))}
          </Select>
        </div>

        {proprietari.length === 0 && (
          <p className="text-xs flex items-start gap-1.5 rounded-lg px-3 py-2"
             style={{ background: theme.bg.tertiary, color: theme.text.tertiary }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Nessun contatto in rubrica è marcato come <strong>proprietario</strong>: la tendina
            resta vuota finché non assegni quella categoria a qualcuno.
          </p>
        )}

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Dotazioni</label>
          <div className="flex flex-wrap gap-2">
            {DOTAZIONI.map((d) => {
              const attiva = (form.dotazioni || []).includes(d);
              return (
                <button key={d} type="button" onClick={() => alternaDotazione(d)} aria-pressed={attiva}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
                        style={attiva
                          ? { background: theme.accento.wash, borderColor: theme.accento.bordo, color: theme.accento.text }
                          : { background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.secondary }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <Galleria foto={form.foto || []} onCambia={campo('foto')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Planimetria (URL)" value={form.planimetria || ''} onChange={testo('planimetria')} />
          <Input label="Video (URL)" value={form.video || ''} onChange={testo('video')} />
        </div>

        {errore && (
          <p className="text-sm rounded-lg px-3 py-2 flex items-start gap-2"
             style={{ background: theme.stato.critico.bg, color: theme.stato.critico.text }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {errore}
          </p>
        )}

        <p className="text-xs" style={{ color: theme.text.tertiary }}>
          {puoPubblicare
            ? <>Salvare non pubblica. Per mandarlo sul sito di KeyPrime serve l&apos;interruttore <strong>In vetrina</strong> dall&apos;elenco, e lì servono prezzo, zona, descrizione e almeno una foto.</>
            : <>Salvare non pubblica. La pubblicazione sul sito la fa un agente o l&apos;amministratore: tu puoi inserire l&apos;immobile e segnalarlo.</>}
        </p>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" onClick={onChiudi} className="flex-1">Annulla</Button>
          <Button onClick={salva} disabled={salvando} className="flex-1">
            {salvando ? 'Salvataggio…' : 'Salva'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Scheda principale ─────────────────────────────────────────────────── */

export default function ImmobiliTab({ clienti = [], user, onToast }) {
  const [elenco, setElenco] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [modulo, setModulo] = useState(null);      // null | {} | immobile
  const [occupato, setOccupato] = useState(null);  // id in corso di pubblicazione
  const [filtri, setFiltri] = useState({ cerca: '', contratto: '', vetrina: '' });

  const ricarica = async () => {
    setCaricamento(true);
    const esito = await caricaImmobili();
    if (!esito.ok) onToast?.(esito.error, 'error');
    setElenco(esito.elenco);
    setCaricamento(false);
  };

  // Una volta sola all'apertura della scheda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ricarica(); }, []);

  const filtrati = useMemo(() => elenco.filter((i) => {
    if (filtri.contratto && i.contratto !== filtri.contratto) return false;
    if (filtri.vetrina === 'si' && !i.pubblicato) return false;
    if (filtri.vetrina === 'no' && i.pubblicato) return false;
    if (filtri.cerca) {
      const q = filtri.cerca.toLowerCase();
      const dove = `${i.titolo} ${i.zona || ''} ${i.riferimento || ''} ${i.emirato || ''}`.toLowerCase();
      if (!dove.includes(q)) return false;
    }
    return true;
  }), [elenco, filtri]);

  const pag = usePaginazione(filtrati, 25);

  const cambiaVetrina = async (immobile) => {
    setOccupato(immobile.id);
    const esito = await pubblicaImmobile(immobile.id, !immobile.pubblicato);
    setOccupato(null);
    if (!esito?.ok) { onToast?.(esito?.error || 'Non riuscito', 'error'); return; }
    setElenco((e) => e.map((x) => (x.id === immobile.id ? esito.immobile : x)));
    onToast?.(esito.immobile.pubblicato ? 'Pubblicato sulla vetrina' : 'Tolto dalla vetrina', 'success');
  };

  const elimina = async (immobile) => {
    if (!window.confirm(`Eliminare ${immobile.riferimento} — ${immobile.titolo}?`)) return;
    const esito = await eliminaImmobile(immobile.id);
    if (!esito?.ok) { onToast?.(esito?.error || 'Non riuscito', 'error'); return; }
    setElenco((e) => e.filter((x) => x.id !== immobile.id));
    onToast?.('Immobile eliminato', 'success');
  };

  const inVetrina = elenco.filter((i) => i.pubblicato).length;
  // Il database lo impedisce comunque; qui si evita di mostrare un pulsante
  // che risponderebbe solo "non puoi".
  const puoPubblicare = user?.ruolo !== 'segnalatore';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-ink font-semibold text-lg">Annunci KP</h2>
          <p className="text-zinc-500 text-sm">
            {elenco.length} in portafoglio · {inVetrina} sulla vetrina pubblica
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModulo({})}>Nuovo immobile</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.text.tertiary }} />
          <input type="text" placeholder="Cerca per titolo, zona o riferimento…"
                 value={filtri.cerca} onChange={(e) => setFiltri((f) => ({ ...f, cerca: e.target.value }))}
                 className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm border focus:outline-none"
                 style={{ background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.primary }} />
        </div>
        <select value={filtri.contratto} onChange={(e) => setFiltri((f) => ({ ...f, contratto: e.target.value }))}
                className="rounded-xl px-3 py-2.5 text-sm border"
                style={{ background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.primary }}>
          <option value="">Vendita e affitto</option>
          {CONTRATTI.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filtri.vetrina} onChange={(e) => setFiltri((f) => ({ ...f, vetrina: e.target.value }))}
                className="rounded-xl px-3 py-2.5 text-sm border"
                style={{ background: theme.bg.secondary, borderColor: theme.border.subtle, color: theme.text.primary }}>
          <option value="">Vetrina e bozze</option>
          <option value="si">Solo in vetrina</option>
          <option value="no">Solo bozze</option>
        </select>
      </div>

      {caricamento ? (
        <Card className="text-center py-12"><p className="text-zinc-500 text-sm">Caricamento…</p></Card>
      ) : elenco.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Nessun immobile in portafoglio"
          description="Qui vanno gli immobili che gestisci tu, non il catalogo off-plan. Quando ne pubblichi uno finisce sul sito di KeyPrime."
          action="Aggiungi il primo"
          onAction={() => setModulo({})}
        />
      ) : filtrati.length === 0 ? (
        <Card className="text-center py-12"><p className="text-zinc-500 text-sm">Nessun immobile con questi filtri.</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pag.elementi.map((i) => (
              <SchedaImmobile key={i.id} immobile={i} occupato={occupato === i.id} puoPubblicare={puoPubblicare}
                              onModifica={setModulo} onVetrina={cambiaVetrina} onElimina={elimina} />
            ))}
          </div>
          <Card padding="p-0"><Paginazione {...pag} nome="immobili" /></Card>
        </>
      )}

      {modulo && (
        <ModuloImmobile
          immobile={modulo.id ? modulo : null}
          clienti={clienti}
          puoPubblicare={puoPubblicare}
          onChiudi={() => setModulo(null)}
          onSalvato={(salvato) => {
            setElenco((e) => {
              const c = e.some((x) => x.id === salvato.id);
              return c ? e.map((x) => (x.id === salvato.id ? salvato : x)) : [salvato, ...e];
            });
            setModulo(null);
            onToast?.('Immobile salvato', 'success');
          }}
        />
      )}
    </div>
  );
}
