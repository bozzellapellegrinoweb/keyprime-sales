// Pagina di prova, non entra nel bundle dell'app: serve a guardare i
// componenti senza passare dal login.
import React from 'react';
import CalcolatoreRoi from './components/CalcolatoreRoi';
import { theme } from './lib/theme';

export default function Anteprima() {
  return (
    <div style={{ minHeight: '100vh', background: theme.bg.primary, padding: 26 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text.primary, marginBottom: 4 }}>
          Calcolatore ROI
        </h1>
        <p style={{ fontSize: 14, color: theme.text.secondary, marginBottom: 20 }}>
          Calcola rendimenti immobiliari UAE
        </p>
        <CalcolatoreRoi />
      </div>
    </div>
  );
}
