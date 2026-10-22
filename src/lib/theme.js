// Design system del portale.
//
// I colori seguono l'identita' KeyPrime: navy profondo come superficie e oro
// come accento di marca (gli stessi usati nelle offerte PDF). Prima la UI
// mescolava viola, grigio zinc e ambra senza legame con il marchio.
//
// La scala neutra e' ridefinita anche nella configurazione Tailwind dentro
// public/index.html: le classi zinc-* di tutta l'app prendono da la' le
// tonalita' navy, quindi un cambio di palette si fa in un posto solo.

export const BRAND = {
  navy: '#0f1c35',
  oro: '#c9a84c',
  oroChiaro: '#e0c478',
  oroScuro: '#a98a33'
};

export const theme = {
  // Tela neutra scura: il blu saturo a tutto schermo affatica la vista e
  // spegne l'oro invece di farlo risaltare.
  bg: {
    primary: '#0d1116',    // pagina
    secondary: '#141920',  // card e barre laterali
    tertiary: '#1b212b',   // superfici sopraelevate
    elevated: '#222935'    // hover
  },
  border: {
    subtle: '#2b323d',
    default: '#3d4858',
    strong: '#4c5464'
  },
  text: {
    primary: '#f2f5f8',
    secondary: '#9aa3b2',
    tertiary: '#6f7889',
    muted: '#4c5464'
  },
  // Un accento per sezione: serve a orientarsi a colpo d'occhio fra le schede.
  sections: {
    dashboard:   { accent: BRAND.oro, bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.24)' },
    oggi:        { accent: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.24)' },
    inbox:       { accent: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.24)' },
    vendite:     { accent: '#34D399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.24)' },
    pipeline:    { accent: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.24)' },
    crm:         { accent: '#A78BFA', bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.24)' },
    tasks:       { accent: '#F472B6', bg: 'rgba(244,114,182,0.10)',border: 'rgba(244,114,182,0.24)' },
    utenti:      { accent: '#94A3B8', bg: 'rgba(148,163,184,0.10)',border: 'rgba(148,163,184,0.24)' },
    offplan:     { accent: '#22D3EE', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.24)' },
    calculator:  { accent: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.24)' },
    commissioni: { accent: '#34D399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.24)' },
    offerte:     { accent: '#06B6D4', bg: 'rgba(6,182,212,0.10)',  border: 'rgba(6,182,212,0.24)' },
    ghl:         { accent: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.24)' }
  },
  status: {
    lead:        { color: '#9aa3b2', bg: 'rgba(154,163,178,0.16)' },
    trattativa:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.16)' },
    EOI:         { color: BRAND.oro, bg: 'rgba(201,168,76,0.16)' },
    prenotato:   { color: BRAND.oro, bg: 'rgba(201,168,76,0.16)' }, // storico
    venduto:     { color: '#34D399', bg: 'rgba(52,211,153,0.16)' },
    incassato:   { color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
    perso:       { color: '#ef4444', bg: 'rgba(239,68,68,0.16)' }
  },
  priority: {
    bassa:   { color: '#9aa3b2', bg: 'rgba(154,163,178,0.16)' },
    normale: { color: '#60A5FA', bg: 'rgba(96,165,250,0.16)' },
    alta:    { color: BRAND.oro, bg: 'rgba(201,168,76,0.16)' },
    urgente: { color: '#EF4444', bg: 'rgba(239,68,68,0.16)' }
  },
  // Quanto scotta un lead nella coda di lavoro.
  gravita: {
    critica: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)' },
    alta:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.32)' },
    media:   { color: BRAND.oro, bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.28)' },
    bassa:   { color: '#9aa3b2', bg: 'rgba(154,163,178,0.10)',border: 'rgba(154,163,178,0.24)' }
  }
};

export default theme;
