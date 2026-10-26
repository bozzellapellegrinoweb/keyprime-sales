// Design system del portale — tema chiaro, identita' KeyPrime.
//
// Due regole tengono insieme tutto il resto.
//
// 1. UN accento solo. Prima la UI usava dieci famiglie di colore (viola, rosa,
//    blu, smeraldo, ambra, arancio, ciano, rosso, porpora, verde) in quasi
//    cinquecento punti: quando e' colorato tutto non risalta niente. Qui
//    l'accento e' l'oro del marchio, la gerarchia la fanno la dimensione delle
//    card e il riempimento, non la tinta.
//
// 2. Il contrasto si misura, non si guarda. Ogni valore qui sotto e' stato
//    verificato contro le due superfici chiare (card bianca e piano pagina).
//    Il numero accanto e' il rapporto WCAG sulla card.
//
// Conseguenza pratica piu' importante: l'oro pieno #c9a84c sta a 2.29:1 sul
// bianco. Non puo' fare testo ne' tratti sottili — riempie, e sopra ci va il
// navy (7.47:1). Per scrivere in oro serve la tonalita' scura, #836a27.

export const BRAND = {
  navy: '#0f1c35',
  oro: '#c9a84c',
  oroChiaro: '#e0c478',
  oroScuro: '#a98a33'
};

// Rampa navy: scala ordinata, non una tinta categoriale. Serve dove il dato ha
// un ordine (gli stadi della pipeline), e come inchiostro. Verificata come
// rampa ordinale: luminosita' monotona, salti >= 0.06, estremo chiaro a 2.41:1.
export const RAMPA_NAVY = ['#9aa8bf', '#6f82a0', '#4d6383', '#2b3f59', '#0f1c35'];

export const theme = {
  // Superfici: piano caldo, card bianche. Il contrasto fra le due e' quello
  // che fa "staccare" le card senza bisogno di ombre pesanti.
  bg: {
    primary: '#edebe6',    // piano pagina
    secondary: '#ffffff',  // card
    tertiary: '#f6f4f0',   // superfici dentro una card
    elevated: '#faf9f7'    // hover
  },
  border: {
    subtle: '#e4e0d8',
    default: '#d8d3c9',
    strong: '#c3bcae'
  },
  text: {
    primary: '#141c2b',    // 17.06:1
    secondary: '#566274',  //  6.19:1
    tertiary: '#7d8794',   //  3.64:1 — solo etichette, mai testo lungo
    muted: '#9aa2ad'       //  decorativo
  },
  // Accento di marca. Tre ruoli distinti, perche' lo stesso oro non puo'
  // fare riempimento e testo: il primo e' troppo chiaro per leggersi.
  accento: {
    fill: '#c9a84c',       // riempimenti, barre, tratti spessi
    fillScuro: '#0f1c35',  // la card in evidenza: navy di marca, testo bianco a 17:1
    inkSuFill: '#141c2b',  // 7.47:1 sopra il riempimento oro
    mark: '#a98a33',       // tratti e punti sui grafici — 3.30:1
    text: '#836a27',       // testo e icone in oro — 5.18:1
    wash: 'rgba(201,168,76,0.12)',
    bordo: 'rgba(201,168,76,0.30)'
  },
  // Tutte le sezioni condividono l'accento: a orientare e' lo stato attivo
  // nella barra laterale, non una tinta diversa per scheda. Le chiavi restano
  // per non rompere i punti che le leggono.
  sections: new Proxy({}, {
    get: () => ({
      accent: '#a98a33',
      bg: 'rgba(201,168,76,0.12)',
      border: 'rgba(201,168,76,0.30)'
    })
  }),
  // Stadi della pipeline: hanno un ordine, quindi una rampa, non cinque tinte.
  status: {
    lead:       { color: '#4d6383', bg: 'rgba(154,168,191,0.22)', fill: RAMPA_NAVY[0], ink: '#141c2b' },
    trattativa: { color: '#4d6383', bg: 'rgba(111,130,160,0.22)', fill: RAMPA_NAVY[1], ink: '#ffffff' },
    EOI:        { color: '#2b3f59', bg: 'rgba(77,99,131,0.20)',   fill: RAMPA_NAVY[2], ink: '#ffffff' },
    prenotato:  { color: '#2b3f59', bg: 'rgba(77,99,131,0.20)',   fill: RAMPA_NAVY[2], ink: '#ffffff' }, // storico
    venduto:    { color: '#836a27', bg: 'rgba(201,168,76,0.22)',  fill: '#c9a84c',     ink: '#141c2b' },
    incassato:  { color: '#047804', bg: 'rgba(12,163,12,0.16)',   fill: '#0ca30c',     ink: '#ffffff' },
    perso:      { color: '#d03b3b', bg: 'rgba(208,59,59,0.14)',   fill: '#d03b3b',     ink: '#ffffff' }
  },
  // Stati riservati. Non sono mai una "serie in piu'": accompagnano sempre
  // un'icona e un'etichetta, perche' attenzione e serio stanno sotto 3:1 e il
  // colore da solo non basta a dire cosa sta succedendo.
  stato: {
    buono:      { fill: '#0ca30c', text: '#047804', bg: 'rgba(12,163,12,0.14)' },
    attenzione: { fill: '#fab219', text: '#8a6000', bg: 'rgba(250,178,25,0.18)' },
    serio:      { fill: '#ec835a', text: '#9c4418', bg: 'rgba(236,131,90,0.18)' },
    critico:    { fill: '#d03b3b', text: '#b32d2d', bg: 'rgba(208,59,59,0.14)' }
  },
  // Variazione rispetto al periodo precedente.
  delta: {
    su:  { text: '#047804', bg: 'rgba(12,163,12,0.14)' },
    giu: { text: '#b32d2d', bg: 'rgba(208,59,59,0.12)' },
    pari:{ text: '#566274', bg: 'rgba(86,98,116,0.10)' }
  },
  priority: {
    bassa:   { color: '#7d8794', bg: 'rgba(125,135,148,0.14)' },
    normale: { color: '#4d6383', bg: 'rgba(77,99,131,0.14)' },
    alta:    { color: '#836a27', bg: 'rgba(201,168,76,0.18)' },
    urgente: { color: '#b32d2d', bg: 'rgba(208,59,59,0.14)' }
  },
  // Quanto scotta un lead nella coda di lavoro.
  gravita: {
    critica: { color: '#b32d2d', bg: 'rgba(208,59,59,0.12)',  border: 'rgba(208,59,59,0.34)' },
    alta:    { color: '#9c4418', bg: 'rgba(236,131,90,0.14)', border: 'rgba(236,131,90,0.34)' },
    media:   { color: '#836a27', bg: 'rgba(201,168,76,0.14)', border: 'rgba(201,168,76,0.32)' },
    bassa:   { color: '#7d8794', bg: 'rgba(125,135,148,0.10)',border: 'rgba(125,135,148,0.24)' }
  },
  // Cromature dei grafici.
  grafico: {
    superficie: '#ffffff',
    griglia: '#ece8e0',
    asse: '#d8d3c9',
    deEnfasi: '#dcd8d0'
  }
};

export default theme;
