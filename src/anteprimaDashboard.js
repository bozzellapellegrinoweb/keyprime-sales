// Pagina di prova, non entra in produzione: serve a guardare la dashboard
// con i numeri veri prima di collegarla al portale.
import React from 'react';
import DashboardAdmin from './components/DashboardAdmin';
import { theme } from './lib/theme';

const giorniFa = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

// Ricostruzione dei lead reali: stati, valori, agenti e zone dal database.
const lead = [
  ...Array.from({ length: 21 }, (_, i) => ({
    id: 100 + i, stato: 'lead', valore: [0, 1000000, 2481293, 2000000, 850000][i % 5],
    agente: ['Giovanni Aguit', 'Domenico Calderone', 'Sara Tufo'][i % 3],
    zona: ['Downtown', 'Business Bay', 'MAJAN', 'AL MARJAN ISLAND', ''][i % 5],
    data: giorniFa(88 - i * 4)
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    id: 200 + i, stato: 'trattativa', valore: [16000000, 3775000, 2622068][i],
    agente: ['Giovanni Aguit', 'Domenico Calderone', 'Giovanni Aguit'][i],
    zona: ['Palm Jumeirah', 'Business Bay', 'Sharja'][i], data: giorniFa(40 - i * 9)
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    id: 300 + i, stato: 'incassato', valore: [5452749, 2481293, 2000000, 1800000, 1600000, 1200000, 980000][i],
    agente: ['Giovanni Aguit', 'Domenico Calderone', 'Giovanni Aguit', 'Domenico Calderone',
             'Giovanni Aguit', 'Sara Tufo', 'Giovanni Aguit'][i],
    zona: ['Downtown', 'AL MARJAN ISLAND', '2bed', 'Palm Jumeirah', 'Downtown', 'Business Bay', 'Sharja'][i],
    commission_pct: 5, data: giorniFa(75 - i * 10)
  }))
];

const vendite = lead.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
const somma = (l, f) => l.reduce((t, s) => t + f(s), 0);
const perChiave = (l, k) => l.reduce((a, s) => { if (s[k]) a[s[k]] = (a[s[k]] || 0) + Number(s.valore || 0); return a; }, {});

const comm = somma(vendite, s => Number(s.valore) * (s.commission_pct || 5) / 100);
const ag = comm * 0.7, netto = comm - ag;

const dati = {
  sales: lead,
  periodSales: lead,
  vendite,
  totals: { valore: somma(lead, s => Number(s.valore || 0)), comm, ag, sg: 0, netto,
            pell: netto * 0.7, giov: netto * 0.3, agPell: 0, agGiov: 0 },
  byStato: ['lead', 'trattativa', 'EOI', 'venduto', 'incassato']
    .reduce((a, st) => { a[st] = lead.filter(s => (s.stato || 'lead') === st); return a; }, {}),
  byAgente: { ...perChiave(lead, 'agente'), 'Alessandro Banfi': -2 },
  byZona: perChiave(lead, 'zona'),
  volTrattativa: somma(lead.filter(s => s.stato === 'trattativa'), s => Number(s.valore || 0)),
  periodFilter: 'all',
  overdueTasks: [{ id: 1 }, { id: 2 }],
  todayTasks: [{ id: 3 }],
  daAssegnare: 21
};

export default function AnteprimaDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: theme.bg.primary, padding: '26px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.text.primary, letterSpacing: '-.5px' }}>
            Ciao Pellegrino
          </h1>
          <p style={{ fontSize: 14, color: theme.text.secondary, marginTop: 4 }}>
            Ecco come sta andando KeyPrime
          </p>
        </div>
        <DashboardAdmin {...dati} onVai={() => {}} onPeriodo={() => {}} onEsporta={() => {}} />
      </div>
    </div>
  );
}
