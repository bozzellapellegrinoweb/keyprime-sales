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
