// Palette del portale — tema chiaro, identita' KeyPrime.
//
// Viveva dentro public/index.html perche' Tailwind girava da CDN, cioe' il
// compilatore stava nel browser e ricompilava il CSS a ogni cambio di classe:
// misurato, era meta' del costo di ogni interazione. Ora il CSS si genera al
// build e il browser riceve solo le classi davvero usate.
//
// I valori sono gli stessi di prima, nessuno escluso. Due principi, misurati:
// un accento solo (l'oro del marchio), e ogni riempimento che porta testo
// bianco sopra 4.5:1 — l'oro, che a 2.29:1 non lo reggerebbe, porta il navy.
//
// Le scale neutre sono rovesciate di proposito: l'app usa text-zinc-400/500
// per il testo e bg-zinc-700/800 per le superfici tenui, quindi su fondo
// chiaro servono grigi medi in basso e tinte chiarissime in alto.

const NEUTRI = {
  50:  '#141c2b', 100: '#1f2937', 200: '#33404f', 300: '#45525f',
  400: '#566274',  // testo secondario   6.19:1
  500: '#6b7684',  // testo attenuato    4.33:1
  600: '#7d8794',  // etichette          3.64:1
  700: '#e4e0d8',  // bordi e fondi tenui
  800: '#f3f1ec',  // superfici
  900: '#faf9f7',
  950: '#ffffff'
};
// Marchio: l'oro riempie, il navy ci scrive sopra.
const ORO = {
  50: '#fbf8ef', 100: '#f6eed6', 200: '#ecdcac', 300: '#a98a33',
  400: '#836a27',  // testo in oro       5.18:1
  500: '#c9a84c',  // riempimento        (testo navy, 7.47:1)
  600: '#a98a33', 700: '#836a27', 800: '#5c4a1c', 900: '#3a2f12'
};
// Inchiostro e ordine: tutto cio' che prima era viola, blu, ciano,
// indaco o porpora, cioe' decorativo, arriva qui.
const NAVY = {
  50: '#eef1f6', 100: '#c9d2df', 200: '#9aa8bf', 300: '#6f82a0',
  400: '#4d6383',  // testo              6.13:1
  500: '#2b3f59',  // riempimento        (bianco sopra, 10.73:1)
  600: '#1d2e45', 700: '#15243a', 800: '#0f1c35', 900: '#0a1424'
};
const BUONO = {
  50: '#eefaee', 100: '#d2f0d2', 200: '#8ad98a', 300: '#3cb83c',
  400: '#047804',  // testo              5.69:1
  500: '#078507',  // riempimento        (bianco sopra, 4.81:1)
  600: '#066b06', 700: '#045404', 800: '#033d03', 900: '#022902'
};
const CRITICO = {
  50: '#fdf1f1', 100: '#f8dcdc', 200: '#eeaaaa', 300: '#e07373',
  400: '#b32d2d',  // testo              6.49:1
  500: '#d03b3b',  // riempimento        (bianco sopra, 4.80:1)
  600: '#b32d2d', 700: '#922424', 800: '#701b1b', 900: '#4e1313'
};
const CALDO = {
  50: '#fdf3ee', 100: '#fce7dc', 200: '#f6bfa5', 300: '#ec835a',
  400: '#9c4418',  // testo              6.13:1
  500: '#b04e1f',  // riempimento        (bianco sopra, 5.31:1)
  600: '#9c4418', 700: '#7d3613', 800: '#5e280e', 900: '#3f1b09'
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#141c2b',      // inchiostro primario   17.06:1
        oro: ORO,
        navy: NAVY,
        zinc: NEUTRI, slate: NEUTRI, gray: NEUTRI, neutral: NEUTRI, stone: NEUTRI,
        violet: NAVY, purple: NAVY, indigo: NAVY, blue: NAVY, cyan: NAVY, sky: NAVY,
        amber: ORO, yellow: ORO,
        emerald: BUONO, green: BUONO, teal: BUONO, lime: BUONO,
        red: CRITICO, rose: CRITICO,
        orange: CALDO, pink: CALDO, fuchsia: CALDO
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};
