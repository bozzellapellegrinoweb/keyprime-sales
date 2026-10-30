// Vocabolario del gestionale, in un posto solo.

export const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
export const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
export const commissions = [2, 4, 5, 6];

export const pipelineStati = ['lead', 'trattativa', 'EOI', 'venduto', 'incassato'];
export const pipelineLabels = {
  lead: 'Lead',
  trattativa: 'Trattativa',
  EOI: 'EOI',
  venduto: 'Venduto (SPA)',
  incassato: 'Incassato',
  perso: 'Perso'
};

export const clienteStati = ['nuovo', 'contattato', 'interessato', 'trattativa', 'acquistato', 'perso'];
export const taskPriorita = ['bassa', 'normale', 'alta', 'urgente'];

// Perche' un lead e' stato perso: serve a capire dove si rompe la pipeline.
export const motiviPerdita = [
  'Budget non compatibile',
  'Ha comprato altrove',
  'Non risponde piu',
  'Solo curiosita',
  'Tempistiche non compatibili',
  'Contatto non valido',
  'Altro'
];

/* Categorie del contatto in rubrica.
   Un contatto puo' averne piu' di una: il proprietario che poi compra resta
   proprietario, e il collaboratore puo' essere anche informatore. Per questo
   sul database e' un array e non una colonna sola — "o entrambi" era nella
   richiesta, ed e' la ragione della forma. */
export const clienteTipi = [
  { id: 'acquirente',   label: 'Acquirente',   breve: 'Acq.',  descrizione: 'Cerca casa: e\' la domanda.' },
  { id: 'proprietario', label: 'Proprietario', breve: 'Prop.', descrizione: 'Ha un immobile: e\' l\'offerta.' },
  { id: 'agente',       label: 'Agente',       breve: 'Ag.',   descrizione: 'Agente di un\'altra agenzia.' },
  { id: 'collaboratore',label: 'Collaboratore',breve: 'Coll.', descrizione: 'Lavora con noi su una pratica.' },
  { id: 'informatore',  label: 'Informatore',  breve: 'Info.', descrizione: 'Segnala occasioni, non tratta.' },
  { id: 'servizi',      label: 'Servizi',      breve: 'Serv.', descrizione: 'Notaio, banca, arredo, manutenzione.' }
];

export const clienteTipoLabel = (id) =>
  clienteTipi.find((t) => t.id === id)?.label || id;
