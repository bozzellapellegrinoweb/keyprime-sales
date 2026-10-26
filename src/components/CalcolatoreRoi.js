// Calcolatore di rendimento immobiliare UAE.
//
// Ogni voce porta la sua spiegazione: il tool lo si usa davanti a un cliente,
// e un numero che non si sa da dove viene non si puo' difendere.
//
// Correzione importante rispetto alla versione precedente. Il "Launch
// Discount" veniva sottratto al prezzo digitato, e l'apprezzamento calcolato
// su quel prezzo ridotto: il "Profitto" mostrato era il guadagno rispetto a
// una cifra che il cliente non paga. Sui valori predefiniti (Business Bay,
// 1BR, 1.200.000 AED) il tool diceva 190.080 AED di profitto quando per chi
// paga 1.200.000 il guadagno e' 46.080 — quattro volte tanto. Qui
// l'apprezzamento si calcola sul prezzo che si paga, e lo sconto di lancio
// resta come informazione di contesto sulla zona.

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { theme } from '../lib/theme';

/* ── Dati di riferimento per zona ────────────────────────────────────────
   Stime di mercato, non il preventivo di un immobile specifico.
     lt      rendimento lordo tipico della zona (riferimento)
     rent    canone annuo medio per un 1BR
     occ     occupazione media nell'affitto breve
     night   tariffa media a notte per un 1BR
     opAppr  apprezzamento atteso di un off-plan entro la consegna
     opDisc  sconto medio di lancio rispetto al prezzo di mercato
     opHand  mesi alla consegna
     secAppr apprezzamento atteso sul mercato secondario
     scNew/scOld  service charge in AED per piede quadro
     dewa    utenze annue stimate per un 1BR                              */
export const roiZones = {
  // DUBAI
  'Palm Jumeirah': { emirate: 'Dubai', cat: 'Ultra Premium', e: '🌴', lt: 5.5, rent: 180000, sqft: 2800, occ: 78, night: 1200, opAppr: 15, opDisc: 10, opHand: 30, secAppr: 8, scNew: 22, scOld: 30, dewa: 8000, ageNew: '2020+', ageMid: '2010-19', ageOld: '2005-09' },
  'Emirates Hills': { emirate: 'Dubai', cat: 'Ultra Premium', e: '⛳', lt: 4.0, rent: 250000, sqft: 3500, occ: 50, night: 2500, opAppr: 8, opDisc: 5, opHand: 36, secAppr: 5, scNew: 5, scOld: 7, dewa: 15000, ageNew: '2020+', ageMid: '2008-19', ageOld: '2003-07' },
  'Bluewaters Island': { emirate: 'Dubai', cat: 'Ultra Premium', e: '🎡', lt: 5.2, rent: 160000, sqft: 3000, occ: 75, night: 1100, opAppr: 12, opDisc: 8, opHand: 24, secAppr: 7, scNew: 25, scOld: 32, dewa: 7500, ageNew: '2020+', ageMid: '2018-19', ageOld: null },
  'Downtown Dubai': { emirate: 'Dubai', cat: 'Premium', e: '🏙️', lt: 5.8, rent: 130000, sqft: 2400, occ: 82, night: 900, opAppr: 18, opDisc: 12, opHand: 30, secAppr: 8, scNew: 18, scOld: 28, dewa: 7500, ageNew: '2020+', ageMid: '2010-19', ageOld: '2006-09' },
  'Dubai Marina': { emirate: 'Dubai', cat: 'Premium', e: '⛵', lt: 6.2, rent: 105000, sqft: 1700, occ: 82, night: 700, opAppr: 12, opDisc: 10, opHand: 24, secAppr: 6, scNew: 15, scOld: 22, dewa: 6500, ageNew: '2018+', ageMid: '2008-17', ageOld: '2003-07' },
  'DIFC': { emirate: 'Dubai', cat: 'Premium', e: '🏦', lt: 5.0, rent: 150000, sqft: 3200, occ: 65, night: 950, opAppr: 10, opDisc: 8, opHand: 30, secAppr: 6, scNew: 28, scOld: 38, dewa: 8000, ageNew: '2020+', ageMid: '2010-19', ageOld: '2005-09' },
  'Jumeirah': { emirate: 'Dubai', cat: 'Premium', e: '🏖️', lt: 4.8, rent: 140000, sqft: 2600, occ: 60, night: 1000, opAppr: 8, opDisc: 5, opHand: 30, secAppr: 5, scNew: 8, scOld: 12, dewa: 9000, ageNew: '2015+', ageMid: '2000-14', ageOld: '1990-99' },
  'Al Wasl': { emirate: 'Dubai', cat: 'Premium', e: '🌇', lt: 5.0, rent: 135000, sqft: 2500, occ: 55, night: 900, opAppr: 7, opDisc: 5, opHand: 28, secAppr: 5, scNew: 8, scOld: 12, dewa: 8500, ageNew: '2018+', ageMid: '2005-17', ageOld: '1995-04' },
  'JBR': { emirate: 'Dubai', cat: 'High-End', e: '🏖️', lt: 6.0, rent: 110000, sqft: 1900, occ: 85, night: 800, opAppr: 10, opDisc: 8, opHand: 24, secAppr: 5, scNew: 14, scOld: 18, dewa: 6000, ageNew: '2018+', ageMid: '2008-17', ageOld: '2005-07' },
  'Dubai Creek Harbour': { emirate: 'Dubai', cat: 'High-End', e: '🌊', lt: 6.5, rent: 95000, sqft: 1600, occ: 70, night: 600, opAppr: 25, opDisc: 15, opHand: 30, secAppr: 12, scNew: 14, scOld: 18, dewa: 6000, ageNew: '2020+', ageMid: '2018-19', ageOld: null },
  'Dubai Hills Estate': { emirate: 'Dubai', cat: 'High-End', e: '🌳', lt: 6.5, rent: 100000, sqft: 1700, occ: 60, night: 650, opAppr: 20, opDisc: 12, opHand: 28, secAppr: 10, scNew: 12, scOld: 16, dewa: 6500, ageNew: '2020+', ageMid: '2017-19', ageOld: null },
  'MBR City': { emirate: 'Dubai', cat: 'High-End', e: '👑', lt: 6.8, rent: 90000, sqft: 1500, occ: 65, night: 550, opAppr: 22, opDisc: 15, opHand: 30, secAppr: 12, scNew: 11, scOld: 15, dewa: 6000, ageNew: '2020+', ageMid: '2016-19', ageOld: null },
  'City Walk': { emirate: 'Dubai', cat: 'High-End', e: '🛍️', lt: 5.5, rent: 120000, sqft: 2200, occ: 72, night: 750, opAppr: 12, opDisc: 8, opHand: 24, secAppr: 7, scNew: 18, scOld: 24, dewa: 7000, ageNew: '2020+', ageMid: '2015-19', ageOld: null },
  'Sobha Hartland': { emirate: 'Dubai', cat: 'High-End', e: '🌿', lt: 6.2, rent: 95000, sqft: 1650, occ: 62, night: 580, opAppr: 18, opDisc: 12, opHand: 28, secAppr: 10, scNew: 13, scOld: 17, dewa: 6200, ageNew: '2020+', ageMid: '2018-19', ageOld: null },
  'Arabian Ranches': { emirate: 'Dubai', cat: 'High-End', e: '🐎', lt: 5.5, rent: 120000, sqft: 1800, occ: 50, night: 700, opAppr: 10, opDisc: 8, opHand: 28, secAppr: 6, scNew: 4, scOld: 6, dewa: 8000, ageNew: '2020+', ageMid: '2008-19', ageOld: '2004-07' },
  'Wasl Gate': { emirate: 'Dubai', cat: 'High-End', e: '🚪', lt: 6.5, rent: 85000, sqft: 1400, occ: 68, night: 520, opAppr: 15, opDisc: 10, opHand: 26, secAppr: 8, scNew: 12, scOld: 16, dewa: 5800, ageNew: '2020+', ageMid: '2016-19', ageOld: null },
  'Business Bay': { emirate: 'Dubai', cat: 'Mid-Market', e: '💼', lt: 7.2, rent: 78000, sqft: 1350, occ: 75, night: 500, opAppr: 15, opDisc: 12, opHand: 24, secAppr: 8, scNew: 14, scOld: 20, dewa: 5500, ageNew: '2020+', ageMid: '2012-19', ageOld: '2008-11' },
  'JLT': { emirate: 'Dubai', cat: 'Mid-Market', e: '🏢', lt: 7.5, rent: 68000, sqft: 1050, occ: 70, night: 420, opAppr: 8, opDisc: 8, opHand: 24, secAppr: 5, scNew: 11, scOld: 16, dewa: 5000, ageNew: '2018+', ageMid: '2008-17', ageOld: '2006-07' },
  'JVC': { emirate: 'Dubai', cat: 'Mid-Market', e: '🏘️', lt: 8.0, rent: 55000, sqft: 850, occ: 78, night: 350, opAppr: 18, opDisc: 15, opHand: 22, secAppr: 10, scNew: 9, scOld: 14, dewa: 4500, ageNew: '2020+', ageMid: '2015-19', ageOld: '2010-14' },
  'JVT': { emirate: 'Dubai', cat: 'Mid-Market', e: '📐', lt: 7.8, rent: 52000, sqft: 820, occ: 72, night: 330, opAppr: 16, opDisc: 14, opHand: 22, secAppr: 9, scNew: 9, scOld: 13, dewa: 4400, ageNew: '2020+', ageMid: '2015-19', ageOld: '2010-14' },
  'Al Barsha': { emirate: 'Dubai', cat: 'Mid-Market', e: '🏬', lt: 7.0, rent: 65000, sqft: 1100, occ: 68, night: 400, opAppr: 8, opDisc: 6, opHand: 24, secAppr: 4, scNew: 10, scOld: 15, dewa: 5000, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  'Tecom': { emirate: 'Dubai', cat: 'Mid-Market', e: '💻', lt: 7.3, rent: 62000, sqft: 1000, occ: 68, night: 400, opAppr: 8, opDisc: 8, opHand: 24, secAppr: 5, scNew: 10, scOld: 15, dewa: 4800, ageNew: '2018+', ageMid: '2005-17', ageOld: '2002-04' },
  'Sports City': { emirate: 'Dubai', cat: 'Value', e: '⚽', lt: 8.5, rent: 48000, sqft: 700, occ: 72, night: 320, opAppr: 12, opDisc: 12, opHand: 20, secAppr: 7, scNew: 8, scOld: 12, dewa: 4200, ageNew: '2020+', ageMid: '2012-19', ageOld: '2008-11' },
  'Arjan': { emirate: 'Dubai', cat: 'Value', e: '🦋', lt: 7.8, rent: 50000, sqft: 800, occ: 65, night: 300, opAppr: 18, opDisc: 15, opHand: 20, secAppr: 10, scNew: 8, scOld: 12, dewa: 4300, ageNew: '2020+', ageMid: '2016-19', ageOld: null },
  'Al Furjan': { emirate: 'Dubai', cat: 'Value', e: '🏡', lt: 7.3, rent: 58000, sqft: 950, occ: 62, night: 350, opAppr: 14, opDisc: 12, opHand: 22, secAppr: 8, scNew: 8, scOld: 11, dewa: 4800, ageNew: '2020+', ageMid: '2015-19', ageOld: '2012-14' },
  'Motor City': { emirate: 'Dubai', cat: 'Value', e: '🏎️', lt: 7.5, rent: 52000, sqft: 850, occ: 58, night: 320, opAppr: 10, opDisc: 10, opHand: 22, secAppr: 6, scNew: 9, scOld: 13, dewa: 4600, ageNew: '2018+', ageMid: '2008-17', ageOld: '2005-07' },
  'Mudon': { emirate: 'Dubai', cat: 'Value', e: '🏠', lt: 7.2, rent: 60000, sqft: 1000, occ: 55, night: 380, opAppr: 12, opDisc: 10, opHand: 24, secAppr: 7, scNew: 5, scOld: 7, dewa: 5000, ageNew: '2020+', ageMid: '2015-19', ageOld: null },
  'Mirdif': { emirate: 'Dubai', cat: 'Value', e: '🌺', lt: 6.8, rent: 55000, sqft: 950, occ: 55, night: 350, opAppr: 8, opDisc: 8, opHand: 24, secAppr: 5, scNew: 7, scOld: 10, dewa: 5000, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  'Silicon Oasis': { emirate: 'Dubai', cat: 'Affordable', e: '💻', lt: 9.0, rent: 45000, sqft: 650, occ: 68, night: 280, opAppr: 15, opDisc: 12, opHand: 22, secAppr: 8, scNew: 7, scOld: 11, dewa: 4000, ageNew: '2020+', ageMid: '2012-19', ageOld: '2008-11' },
  'International City': { emirate: 'Dubai', cat: 'Affordable', e: '🌍', lt: 9.5, rent: 35000, sqft: 480, occ: 65, night: 220, opAppr: 8, opDisc: 8, opHand: 20, secAppr: 5, scNew: 5, scOld: 8, dewa: 3500, ageNew: '2018+', ageMid: '2008-17', ageOld: '2005-07' },
  'Discovery Gardens': { emirate: 'Dubai', cat: 'Affordable', e: '🌻', lt: 9.2, rent: 38000, sqft: 520, occ: 60, night: 240, opAppr: 5, opDisc: 5, opHand: 20, secAppr: 3, scNew: 6, scOld: 10, dewa: 3800, ageNew: '2015+', ageMid: '2008-14', ageOld: '2005-07' },
  'DIP': { emirate: 'Dubai', cat: 'Affordable', e: '🏭', lt: 9.8, rent: 32000, sqft: 420, occ: 55, night: 200, opAppr: 8, opDisc: 8, opHand: 22, secAppr: 4, scNew: 5, scOld: 8, dewa: 3200, ageNew: '2018+', ageMid: '2008-17', ageOld: '2005-07' },
  'Al Nahda Dubai': { emirate: 'Dubai', cat: 'Affordable', e: '🏠', lt: 8.5, rent: 40000, sqft: 580, occ: 62, night: 250, opAppr: 6, opDisc: 6, opHand: 22, secAppr: 4, scNew: 6, scOld: 10, dewa: 3600, ageNew: '2015+', ageMid: '2005-14', ageOld: '1998-04' },
  'Deira': { emirate: 'Dubai', cat: 'Affordable', e: '🕌', lt: 8.2, rent: 42000, sqft: 620, occ: 65, night: 280, opAppr: 6, opDisc: 5, opHand: 24, secAppr: 3, scNew: 7, scOld: 12, dewa: 3800, ageNew: '2015+', ageMid: '2000-14', ageOld: '1990-99' },
  'Bur Dubai': { emirate: 'Dubai', cat: 'Affordable', e: '🛶', lt: 7.8, rent: 45000, sqft: 700, occ: 70, night: 320, opAppr: 5, opDisc: 5, opHand: 24, secAppr: 3, scNew: 8, scOld: 14, dewa: 4000, ageNew: '2015+', ageMid: '2000-14', ageOld: '1985-99' },
  'Jebel Ali': { emirate: 'Dubai', cat: 'Affordable', e: '🚢', lt: 8.8, rent: 38000, sqft: 550, occ: 58, night: 240, opAppr: 10, opDisc: 10, opHand: 24, secAppr: 6, scNew: 6, scOld: 10, dewa: 3600, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  'Dubai South': { emirate: 'Dubai', cat: 'Emerging', e: '✈️', lt: 8.5, rent: 40000, sqft: 600, occ: 55, night: 250, opAppr: 25, opDisc: 20, opHand: 28, secAppr: 15, scNew: 7, scOld: 10, dewa: 3800, ageNew: '2022+', ageMid: '2018-21', ageOld: null },
  'Expo City': { emirate: 'Dubai', cat: 'Emerging', e: '🎪', lt: 7.5, rent: 55000, sqft: 900, occ: 60, night: 350, opAppr: 30, opDisc: 18, opHand: 30, secAppr: 18, scNew: 10, scOld: 14, dewa: 4500, ageNew: '2022+', ageMid: null, ageOld: null },
  'Damac Hills': { emirate: 'Dubai', cat: 'Emerging', e: '🏌️', lt: 7.8, rent: 52000, sqft: 820, occ: 62, night: 320, opAppr: 18, opDisc: 15, opHand: 24, secAppr: 10, scNew: 8, scOld: 12, dewa: 4300, ageNew: '2020+', ageMid: '2017-19', ageOld: null },
  'Damac Hills 2': { emirate: 'Dubai', cat: 'Emerging', e: '🏡', lt: 8.5, rent: 42000, sqft: 620, occ: 55, night: 280, opAppr: 20, opDisc: 18, opHand: 22, secAppr: 12, scNew: 6, scOld: 9, dewa: 4000, ageNew: '2021+', ageMid: '2019-20', ageOld: null },
  'Town Square': { emirate: 'Dubai', cat: 'Emerging', e: '🏪', lt: 8.2, rent: 48000, sqft: 720, occ: 58, night: 290, opAppr: 15, opDisc: 12, opHand: 22, secAppr: 9, scNew: 7, scOld: 10, dewa: 4100, ageNew: '2020+', ageMid: '2017-19', ageOld: null },
  'Tilal Al Ghaf': { emirate: 'Dubai', cat: 'Emerging', e: '🌴', lt: 6.5, rent: 85000, sqft: 1400, occ: 50, night: 500, opAppr: 25, opDisc: 15, opHand: 30, secAppr: 15, scNew: 5, scOld: 7, dewa: 6000, ageNew: '2022+', ageMid: null, ageOld: null },
  'The Valley': { emirate: 'Dubai', cat: 'Emerging', e: '🏞️', lt: 7.0, rent: 55000, sqft: 900, occ: 48, night: 350, opAppr: 28, opDisc: 20, opHand: 32, secAppr: 15, scNew: 6, scOld: 8, dewa: 4500, ageNew: '2024+', ageMid: null, ageOld: null },
  // RAK
  'Al Marjan Island': { emirate: 'RAK', cat: 'Premium', e: '🏝️', lt: 7.5, rent: 70000, sqft: 1200, occ: 72, night: 550, opAppr: 25, opDisc: 15, opHand: 28, secAppr: 15, scNew: 14, scOld: 18, dewa: 4500, ageNew: '2022+', ageMid: '2018-21', ageOld: null },
  'Mina Al Arab': { emirate: 'RAK', cat: 'High-End', e: '🌊', lt: 7.0, rent: 65000, sqft: 1000, occ: 68, night: 480, opAppr: 20, opDisc: 12, opHand: 26, secAppr: 12, scNew: 12, scOld: 16, dewa: 4200, ageNew: '2020+', ageMid: '2016-19', ageOld: null },
  'Al Hamra Village': { emirate: 'RAK', cat: 'Mid-Market', e: '⛳', lt: 7.8, rent: 55000, sqft: 850, occ: 65, night: 380, opAppr: 15, opDisc: 10, opHand: 24, secAppr: 10, scNew: 10, scOld: 14, dewa: 3800, ageNew: '2018+', ageMid: '2008-17', ageOld: '2005-07' },
  'Yasmin Village RAK': { emirate: 'RAK', cat: 'Affordable', e: '🌸', lt: 11.0, rent: 35000, sqft: 450, occ: 70, night: 250, opAppr: 10, opDisc: 8, opHand: 20, secAppr: 6, scNew: 6, scOld: 9, dewa: 3000, ageNew: '2015+', ageMid: '2008-14', ageOld: '2005-07' },
  'Hayat Island': { emirate: 'RAK', cat: 'Emerging', e: '🏖️', lt: 7.2, rent: 60000, sqft: 950, occ: 62, night: 420, opAppr: 22, opDisc: 15, opHand: 28, secAppr: 14, scNew: 11, scOld: 15, dewa: 4000, ageNew: '2023+', ageMid: null, ageOld: null },
  // ABU DHABI
  'Saadiyat Island': { emirate: 'Abu Dhabi', cat: 'Ultra Premium', e: '🏛️', lt: 5.0, rent: 180000, sqft: 2800, occ: 60, night: 1100, opAppr: 12, opDisc: 8, opHand: 30, secAppr: 7, scNew: 20, scOld: 28, dewa: 8000, ageNew: '2020+', ageMid: '2015-19', ageOld: null },
  'Yas Island': { emirate: 'Abu Dhabi', cat: 'Premium', e: '🎢', lt: 6.0, rent: 95000, sqft: 1500, occ: 70, night: 650, opAppr: 15, opDisc: 10, opHand: 28, secAppr: 8, scNew: 14, scOld: 18, dewa: 5500, ageNew: '2020+', ageMid: '2012-19', ageOld: null },
  'Al Reem Island': { emirate: 'Abu Dhabi', cat: 'High-End', e: '🌆', lt: 7.0, rent: 75000, sqft: 1200, occ: 72, night: 500, opAppr: 12, opDisc: 10, opHand: 26, secAppr: 7, scNew: 12, scOld: 16, dewa: 5000, ageNew: '2018+', ageMid: '2010-17', ageOld: '2008-09' },
  'Al Raha Beach': { emirate: 'Abu Dhabi', cat: 'High-End', e: '🏖️', lt: 6.5, rent: 85000, sqft: 1350, occ: 65, night: 550, opAppr: 10, opDisc: 8, opHand: 26, secAppr: 6, scNew: 13, scOld: 17, dewa: 5200, ageNew: '2018+', ageMid: '2008-17', ageOld: null },
  'Khalifa City': { emirate: 'Abu Dhabi', cat: 'Mid-Market', e: '🏘️', lt: 7.5, rent: 55000, sqft: 850, occ: 68, night: 380, opAppr: 8, opDisc: 8, opHand: 24, secAppr: 5, scNew: 8, scOld: 12, dewa: 4200, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  'Masdar City': { emirate: 'Abu Dhabi', cat: 'Emerging', e: '🌱', lt: 7.8, rent: 58000, sqft: 900, occ: 65, night: 400, opAppr: 18, opDisc: 15, opHand: 28, secAppr: 10, scNew: 10, scOld: 14, dewa: 4500, ageNew: '2020+', ageMid: '2015-19', ageOld: null },
  // SHARJAH
  'Al Mamzar SHJ': { emirate: 'Sharjah', cat: 'Mid-Market', e: '🏖️', lt: 8.0, rent: 42000, sqft: 650, occ: 65, night: 300, opAppr: 8, opDisc: 6, opHand: 24, secAppr: 5, scNew: 6, scOld: 10, dewa: 3500, ageNew: '2015+', ageMid: '2005-14', ageOld: '1995-04' },
  'Al Nahda SHJ': { emirate: 'Sharjah', cat: 'Affordable', e: '🏢', lt: 9.0, rent: 35000, sqft: 500, occ: 75, night: 250, opAppr: 5, opDisc: 5, opHand: 22, secAppr: 3, scNew: 5, scOld: 8, dewa: 3000, ageNew: '2015+', ageMid: '2000-14', ageOld: '1990-99' },
  'Aljada': { emirate: 'Sharjah', cat: 'Emerging', e: '🏗️', lt: 7.8, rent: 52000, sqft: 800, occ: 60, night: 350, opAppr: 18, opDisc: 15, opHand: 26, secAppr: 10, scNew: 9, scOld: 12, dewa: 4000, ageNew: '2022+', ageMid: null, ageOld: null },
  // AJMAN
  'Ajman Downtown': { emirate: 'Ajman', cat: 'Affordable', e: '🏙️', lt: 10.5, rent: 28000, sqft: 380, occ: 70, night: 200, opAppr: 8, opDisc: 8, opHand: 20, secAppr: 5, scNew: 4, scOld: 7, dewa: 2500, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  'Ajman Corniche': { emirate: 'Ajman', cat: 'Mid-Market', e: '🌅', lt: 9.0, rent: 35000, sqft: 500, occ: 65, night: 250, opAppr: 10, opDisc: 8, opHand: 22, secAppr: 6, scNew: 5, scOld: 9, dewa: 3000, ageNew: '2018+', ageMid: '2008-17', ageOld: '2000-07' },
  // UAQ
  'UAQ Marina': { emirate: 'UAQ', cat: 'Affordable', e: '⛵', lt: 9.5, rent: 30000, sqft: 420, occ: 55, night: 220, opAppr: 12, opDisc: 10, opHand: 24, secAppr: 7, scNew: 5, scOld: 8, dewa: 2800, ageNew: '2020+', ageMid: '2015-19', ageOld: null },
};

// Correttivi per tipologia: un bilocale non affitta il doppio di un monolocale.
const roiBrMult = { rent: [0.55, 1, 1.55, 2.1, 2.8], night: [0.65, 1, 1.45, 1.9, 2.5], dewa: [0.6, 1, 1.4, 1.8, 2.3] };

// Correttivi per eta' dell'edificio.
const roiAgeMult = {
  new: { sc: 1,   maint: 0,     rent: 1.05, appr: 1.2 },
  mid: { sc: 1.2, maint: 5000,  rent: 1,    appr: 1   },
  old: { sc: 1.5, maint: 12000, rent: 0.92, appr: 0.7 }
};

/* Costi d'acquisto una tantum: non entrano nel rendimento annuo, ma vanno
   detti. La tassa di registrazione cambia da emirato a emirato — a Dubai e'
   il 4% del Land Department, altrove il 2% del registro locale — quindi non
   si puo' usare una percentuale sola per tutti. */
const REGISTRAZIONE = {
  'Dubai':     { pct: 4, ente: 'Dubai Land Department' },
  'Abu Dhabi': { pct: 2, ente: 'Abu Dhabi Municipality' },
  'RAK':       { pct: 2, ente: 'RAK Municipality' },
  'Sharjah':   { pct: 2, ente: 'Sharjah Real Estate Registration' },
  'Ajman':     { pct: 2, ente: 'Ajman Municipality' },
  'UAQ':       { pct: 2, ente: 'UAQ Municipality' }
};
const AGENZIA_PCT = 2;

/* ── Voce con spiegazione ────────────────────────────────────────────────
   Ogni riga puo' aprire il proprio "perche'": davanti a un cliente un
   numero che non si sa da dove viene non si puo' difendere.               */
function Voce({ etichetta, valore, coloreValore, spiegazione, formula, forte }) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="border-b border-[#e4e0d8] last:border-0">
      <div className={`flex justify-between items-center gap-3 py-2.5 ${forte ? 'font-semibold' : ''}`}>
        <span className="flex items-center gap-1.5 min-w-0" style={{ color: forte ? theme.text.primary : theme.text.secondary }}>
          <span className="truncate">{etichetta}</span>
          {spiegazione && (
            <button type="button" onClick={() => setAperta(!aperta)} aria-expanded={aperta}
                    aria-label={`Spiegazione: ${etichetta}`}
                    className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-[#f0ede6]"
                    style={{ color: aperta ? theme.accento.text : theme.text.tertiary }}>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
        <span className="shrink-0 tabular-nums" style={{ color: coloreValore || theme.text.primary }}>{valore}</span>
      </div>
      {aperta && spiegazione && (
        <div className="pb-3 pr-6 text-xs leading-relaxed" style={{ color: theme.text.secondary }}>
          {spiegazione}
          {formula && (
            <div className="mt-1.5 font-mono text-[11px] px-2 py-1.5 rounded-md inline-block"
                 style={{ background: theme.bg.tertiary, color: theme.text.primary }}>
              {formula}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dato({ valore, etichetta, tinta, spiegazione }) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="rounded-xl p-4 border" style={{ background: theme.bg.secondary, borderColor: theme.border.subtle }}>
      <p className="text-3xl font-bold tabular-nums" style={{ color: tinta || theme.text.primary }}>{valore}</p>
      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.text.tertiary }}>
        <span>{etichetta}</span>
        {spiegazione && (
          <button type="button" onClick={() => setAperta(!aperta)} aria-expanded={aperta}
                  aria-label={`Spiegazione: ${etichetta}`} style={{ color: aperta ? theme.accento.text : theme.text.tertiary }}>
            <HelpCircle className="w-3 h-3" />
          </button>
        )}
      </p>
      {aperta && <p className="text-xs mt-2 leading-relaxed" style={{ color: theme.text.secondary }}>{spiegazione}</p>}
    </div>
  );
}

/* ── Calcolatore ─────────────────────────────────────────────────────────── */

export default function CalcolatoreRoi() {
  const [emirate, setEmirate] = useState('all');
  const [z, setZ] = useState('Business Bay');
  const [price, setPrice] = useState(1200000);
  const [sqft, setSqft] = useState(850);
  const [br, setBr] = useState(1);
  const [mkt, setMkt] = useState('offplan');
  const [age, setAge] = useState('new');
  const [tab, setTab] = useState('overview');

  const d = roiZones[z];
  const a = roiAgeMult[age];
  const nomeEta = { new: 'nuovo', mid: 'intermedio', old: 'datato' }[age];

  /* Costi ricorrenti annui */
  const sc = mkt === 'offplan' ? d.scNew : (age === 'old' ? d.scOld : d.scNew);
  const costoSc = sc * sqft * a.sc;
  const costoDewa = d.dewa * roiBrMult.dewa[br];
  const COSTO_ASSICURAZIONE = 1000;
  const costs = costoSc + costoDewa + COSTO_ASSICURAZIONE + a.maint;

  /* Affitto lungo termine */
  const rent = d.rent * roiBrMult.rent[br] * a.rent;
  const ltNet = rent - costs;
  const ltLordo = rent / price * 100;
  const ltYield = (ltNet / price * 100).toFixed(1);

  /* Affitto breve */
  const QUOTA_GESTIONE = 0.28;     // gestione + Tourism Dirham + permesso
  const LICENZA_ANNUA = 2500;
  const stGross = d.night * roiBrMult.night[br] * 365 * d.occ / 100;
  const stCommissioni = stGross * QUOTA_GESTIONE;
  const stNet = stGross - costs - LICENZA_ANNUA - stCommissioni;
  const stYield = (stNet / price * 100).toFixed(1);

  /* Rivalutazione.
     L'apprezzamento si applica al prezzo che si paga. Prima veniva applicato
     a un prezzo scontato che il compratore non paga, e il profitto mostrato
     era molte volte quello reale. */
  const apprBase = mkt === 'offplan' ? d.opAppr : d.secAppr;
  const appr = apprBase * a.appr;
  const orizzonte = mkt === 'offplan' ? `entro la consegna (${d.opHand} mesi)` : 'su 3 anni';
  const futVal = price * (1 + appr / 100);
  const profit = futVal - price;
  const scontoLancio = mkt === 'offplan' ? d.opDisc : 0;

  /* Costi d'acquisto: fuori dal rendimento, ma dichiarati. */
  const reg = REGISTRAZIONE[d.emirate] || { pct: 2, ente: 'registro locale' };
  const costiAcquisto = price * (reg.pct + AGENZIA_PCT) / 100;

  /* ROI complessivo: affitto per gli anni fino alla consegna, piu' la
     rivalutazione sullo stesso orizzonte. Prima sommava 3 anni di affitto a
     una rivalutazione di durata diversa a seconda della zona. */
  const anni = mkt === 'offplan' ? Math.max(1, Math.round(d.opHand / 12)) : 3;
  const roiTotale = (ltNet * anni + profit) / price * 100;

  const fmt = (n) => new Intl.NumberFormat('it-IT').format(Math.round(n));
  const pct = (n) => `${Number(n).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;

  const grouped = {};
  Object.entries(roiZones).forEach(([name, data]) => {
    if (!grouped[data.emirate]) grouped[data.emirate] = {};
    if (!grouped[data.emirate][data.cat]) grouped[data.emirate][data.cat] = [];
    grouped[data.emirate][data.cat].push({ name, ...data });
  });
  const filteredZones = emirate === 'all' ? grouped : { [emirate]: grouped[emirate] };

  const pillola = (attiva) => attiva
    ? { background: theme.text.primary, color: '#ffffff' }
    : { background: theme.bg.tertiary, color: theme.text.secondary };

  const scheda = { background: theme.bg.secondary, borderColor: theme.border.subtle };

  return (
    <div className="space-y-4">
      {/* Emirato */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setEmirate('all')} style={pillola(emirate === 'all')}
                className="py-1.5 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all">
          🇦🇪 Tutti
        </button>
        {['Dubai', 'Abu Dhabi', 'RAK', 'Sharjah', 'Ajman', 'UAQ'].map((em) => (
          <button key={em} onClick={() => setEmirate(em)} style={pillola(emirate === em)}
                  className="py-1.5 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all">
            {em === 'RAK' ? '🏝️' : em === 'Dubai' ? '🌆' : em === 'Abu Dhabi' ? '🏛️' : em === 'Sharjah' ? '📚' : em === 'Ajman' ? '🏠' : '⛵'} {em}
          </button>
        ))}
      </div>

      {/* Dati dell'immobile */}
      <div className="rounded-xl p-4 border" style={scheda}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2">
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Zona</label>
            <select value={z} onChange={(e) => setZ(e.target.value)}
                    className="w-full border-none rounded-lg px-3 py-2 text-sm"
                    style={{ background: theme.bg.tertiary, color: theme.text.primary }}>
              {Object.entries(filteredZones).map(([em, cats]) => (
                <optgroup key={em} label={`━━ ${em} ━━`}>
                  {Object.entries(cats || {}).map(([cat, list]) => (
                    <React.Fragment key={cat}>
                      <option disabled>── {cat} ──</option>
                      {(list || []).map((item) => <option key={item.name} value={item.name}>{item.e} {item.name}</option>)}
                    </React.Fragment>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Prezzo che paghi (AED)</label>
            <input type="number" value={price} onChange={(e) => setPrice(+e.target.value)}
                   className="w-full border-none rounded-lg px-3 py-2 text-sm"
                   style={{ background: theme.bg.tertiary, color: theme.text.primary }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Sqft</label>
            <input type="number" value={sqft} onChange={(e) => setSqft(+e.target.value)}
                   className="w-full border-none rounded-lg px-3 py-2 text-sm"
                   style={{ background: theme.bg.tertiary, color: theme.text.primary }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Camere</label>
            <select value={br} onChange={(e) => setBr(+e.target.value)}
                    className="w-full border-none rounded-lg px-3 py-2 text-sm"
                    style={{ background: theme.bg.tertiary, color: theme.text.primary }}>
              {['Studio', '1BR', '2BR', '3BR', '4+BR'].map((l, i) => <option key={i} value={i}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Mercato</label>
            <select value={mkt} onChange={(e) => setMkt(e.target.value)}
                    className="w-full border-none rounded-lg px-3 py-2 text-sm"
                    style={{ background: theme.bg.tertiary, color: theme.text.primary }}>
              <option value="offplan">Off-plan</option>
              <option value="secondary">Secondario</option>
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: theme.text.tertiary }}>Edificio</label>
            <select value={age} onChange={(e) => setAge(e.target.value)}
                    className="w-full border-none rounded-lg px-3 py-2 text-sm"
                    style={{ background: theme.bg.tertiary, color: theme.text.primary }}>
              <option value="new">Nuovo {d.ageNew ? `(${d.ageNew})` : ''}</option>
              <option value="mid">Intermedio {d.ageMid ? `(${d.ageMid})` : ''}</option>
              <option value="old">Datato {d.ageOld ? `(${d.ageOld})` : ''}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
          <div className="rounded-lg p-2" style={{ background: theme.bg.tertiary }}>
            <p className="text-xs" style={{ color: theme.text.tertiary }}>{d.emirate} • {d.cat}</p>
            <p className="font-medium" style={{ color: theme.text.primary }}>{d.e} {z}</p>
          </div>
          <div className="rounded-lg p-2 text-center border" style={{ background: theme.accento.wash, borderColor: theme.accento.bordo }}>
            <p className="text-xs" style={{ color: theme.accento.text }}>Service charge</p>
            <p className="font-bold" style={{ color: theme.text.primary }}>{sc} AED/sqft</p>
          </div>
          <div className="rounded-lg p-2 text-center border" style={{ background: theme.bg.tertiary, borderColor: theme.border.subtle }}>
            <p className="text-xs" style={{ color: theme.text.tertiary }}>Rendimento lordo tipico</p>
            <p className="font-bold" style={{ color: theme.text.primary }}>{pct(d.lt)}</p>
          </div>
          {mkt === 'offplan' ? (
            <div className="rounded-lg p-2 text-center border" style={{ background: theme.bg.tertiary, borderColor: theme.border.subtle }}>
              <p className="text-xs" style={{ color: theme.text.tertiary }}>Consegna</p>
              <p className="font-bold" style={{ color: theme.text.primary }}>{d.opHand} mesi</p>
            </div>
          ) : (
            <div className="rounded-lg p-2 text-center border" style={{ background: theme.bg.tertiary, borderColor: theme.border.subtle }}>
              <p className="text-xs" style={{ color: theme.text.tertiary }}>Manutenzione</p>
              <p className="font-bold" style={{ color: theme.text.primary }}>{fmt(a.maint)}/anno</p>
            </div>
          )}
        </div>
      </div>

      {/* Schede */}
      <div className="flex gap-2 overflow-x-auto">
        {[['overview', '📊 Sintesi'], ['rental', '🏠 Affitto'], ['capital', '📈 Rivalutazione'], ['costs', '💰 Costi']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={pillola(tab === t)}
                  className="py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap">{l}</button>
        ))}
      </div>

      {/* SINTESI */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Dato valore={pct(ltYield)} etichetta="Rendimento netto, affitto lungo" tinta={theme.text.primary}
                spiegazione="Quanto rende l'immobile in un anno, dopo aver pagato service charge, utenze e assicurazione, diviso il prezzo che paghi. È il numero da confrontare con un investimento alternativo." />
          <Dato valore={pct(stYield)} etichetta="Rendimento netto, affitto breve" tinta={theme.text.primary}
                spiegazione="Stesso calcolo per l'affitto turistico: ricavo delle notti vendute meno i costi, la gestione e la licenza. Rende di più ma richiede gestione, e l'occupazione non è garantita." />
          <Dato valore={`+${pct(appr)}`} etichetta={`Rivalutazione ${orizzonte}`} tinta={theme.stato.buono.text}
                spiegazione={`Crescita di valore attesa per questa zona ${mkt === 'offplan' ? 'per un off-plan fino alla consegna' : 'sul mercato secondario, su tre anni'}, corretta per l'età dell'edificio. È una stima di mercato, non una garanzia.`} />
          <Dato valore={fmt(costs)} etichetta="Costi fissi all'anno" tinta={theme.stato.critico.text}
                spiegazione="Service charge, utenze, assicurazione e, per un edificio non nuovo, la manutenzione. Si pagano anche se l'immobile resta sfitto." />

          <div className="col-span-2 rounded-xl p-4 border" style={scheda}>
            <p className="text-xs mb-2" style={{ color: theme.text.tertiary }}>REDDITO NETTO ANNUO</p>
            <Voce etichetta="🏠 Affitto lungo termine" valore={`${fmt(ltNet)} AED`}
                  spiegazione="Canone annuo della zona meno i costi fissi." formula={`${fmt(rent)} − ${fmt(costs)}`} />
            <Voce etichetta="🏖️ Affitto breve" valore={`${fmt(stNet)} AED`}
                  spiegazione="Ricavo delle notti meno costi fissi, gestione e licenza."
                  formula={`${fmt(stGross)} − ${fmt(costs)} − ${fmt(stCommissioni)} − ${fmt(LICENZA_ANNUA)}`} />
          </div>

          <div className="col-span-2 rounded-xl p-4 border" style={scheda}>
            <p className="text-xs mb-2" style={{ color: theme.text.tertiary }}>RIVALUTAZIONE</p>
            <Voce etichetta="Valore futuro stimato" valore={`${fmt(futVal)} AED`}
                  spiegazione={`Prezzo pagato più la rivalutazione attesa ${orizzonte}.`}
                  formula={`${fmt(price)} × (1 + ${pct(appr)})`} />
            <Voce etichetta="Guadagno sul valore" valore={`+${fmt(profit)} AED`} coloreValore={theme.stato.buono.text}
                  spiegazione="Differenza fra il valore futuro stimato e quello che hai pagato. Si realizza solo rivendendo." />
          </div>

          <div className="col-span-full rounded-xl p-4 border" style={scheda}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs" style={{ color: theme.text.tertiary }}>
                RITORNO COMPLESSIVO SU {anni} {anni === 1 ? 'ANNO' : 'ANNI'} — AFFITTO + RIVALUTAZIONE
              </p>
              <span className="text-xl font-bold tabular-nums" style={{ color: theme.text.primary }}>{pct(roiTotale)}</span>
            </div>
            <div className="rounded-full h-3 overflow-hidden" style={{ background: theme.bg.tertiary }}>
              <div className="h-full transition-all" style={{ width: `${Math.min(Math.max(roiTotale, 0), 100)}%`, background: theme.accento.fill }} />
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: theme.text.secondary }}>
              {anni} {anni === 1 ? 'anno' : 'anni'} di affitto netto ({fmt(ltNet * anni)} AED) più la rivalutazione
              ({fmt(profit)} AED), sul prezzo pagato. {mkt === 'offplan' && `L'orizzonte segue la consegna: ${d.opHand} mesi.`}
              {' '}Non include i costi d'acquisto.
            </p>
          </div>
        </div>
      )}

      {/* AFFITTO */}
      {tab === 'rental' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 border" style={scheda}>
            <h3 className="font-semibold mb-4" style={{ color: theme.text.primary }}>🏠 Affitto a lungo termine</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Dato valore={pct(ltLordo)} etichetta="Lordo"
                    spiegazione={`Affitto diviso il prezzo, senza togliere i costi. Il riferimento tipico della zona è ${pct(d.lt)}: se il tuo è molto più basso, stai pagando sopra mercato per quella resa.`} />
              <Dato valore={pct(ltYield)} etichetta="Netto" tinta={theme.stato.buono.text}
                    spiegazione="Quello che resta davvero in tasca, dopo i costi fissi." />
            </div>
            <Voce etichetta="Affitto annuo" valore={`${fmt(rent)} AED`}
                  spiegazione={`Canone medio della zona per questa tipologia, corretto per l'età dell'edificio (${nomeEta}).`}
                  formula={`${fmt(d.rent)} × ${roiBrMult.rent[br]} (${['Studio', '1BR', '2BR', '3BR', '4+BR'][br]}) × ${a.rent} (${nomeEta})`} />
            <Voce etichetta="Al mese" valore={`${fmt(rent / 12)} AED`}
                  spiegazione="L'annuo diviso dodici. A Dubai di solito si incassa in una o poche soluzioni, non mensilmente." />
            <Voce etichetta="(−) Costi fissi" valore={`−${fmt(costs)} AED`} coloreValore={theme.stato.critico.text}
                  spiegazione="Service charge, utenze, assicurazione e manutenzione. Dettaglio nella scheda Costi." />
            <Voce etichetta="= Netto annuo" valore={`${fmt(ltNet)} AED`} coloreValore={theme.stato.buono.text} forte
                  spiegazione="Il reddito che l'immobile produce in un anno, al netto delle spese ricorrenti." />
          </div>

          <div className="rounded-xl p-4 border" style={scheda}>
            <h3 className="font-semibold mb-4" style={{ color: theme.text.primary }}>🏖️ Affitto breve (turistico)</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Dato valore={pct(stGross / price * 100)} etichetta="Lordo"
                    spiegazione="Ricavo delle notti diviso il prezzo, prima di qualunque costo." />
              <Dato valore={pct(stYield)} etichetta="Netto" tinta={theme.stato.buono.text}
                    spiegazione="Dopo costi fissi, gestione e licenza." />
            </div>
            <Voce etichetta="Tariffa a notte" valore={`${fmt(d.night * roiBrMult.night[br])} AED`}
                  spiegazione="Tariffa media di zona per questa tipologia. In alta stagione sale, d'estate scende parecchio."
                  formula={`${fmt(d.night)} × ${roiBrMult.night[br]} (${['Studio', '1BR', '2BR', '3BR', '4+BR'][br]})`} />
            <Voce etichetta="Occupazione media" valore={`${d.occ}%`}
                  spiegazione="Quante notti all'anno risulta affittato, in media di zona. Il resto dell'anno l'immobile è vuoto ma i costi fissi corrono." />
            <Voce etichetta="Ricavo lordo" valore={`${fmt(stGross)} AED`}
                  spiegazione="Tariffa per le notti effettivamente vendute."
                  formula={`${fmt(d.night * roiBrMult.night[br])} × 365 × ${d.occ}%`} />
            <Voce etichetta="(−) Gestione, Tourism Dirham, permesso" valore={`−${fmt(stCommissioni)} AED`} coloreValore={theme.stato.critico.text}
                  spiegazione="Stima complessiva del 28% del lordo: commissione dell'agenzia di gestione, la tassa di soggiorno e il permesso per l'affitto breve. Se gestisci in proprio la quota scende parecchio." />
            <Voce etichetta="(−) Licenza e pratiche" valore={`−${fmt(LICENZA_ANNUA)} AED`} coloreValore={theme.stato.critico.text}
                  spiegazione="Stima fissa annua per licenza turistica e adempimenti. Non include l'arredo, che è un investimento iniziale a parte." />
            <Voce etichetta="(−) Costi fissi" valore={`−${fmt(costs)} AED`} coloreValore={theme.stato.critico.text}
                  spiegazione="Gli stessi dell'affitto lungo: service charge, utenze, assicurazione." />
            <Voce etichetta="= Netto annuo" valore={`${fmt(stNet)} AED`} coloreValore={theme.stato.buono.text} forte
                  spiegazione="Quello che resta dall'affitto breve in un anno medio." />
          </div>
        </div>
      )}

      {/* RIVALUTAZIONE */}
      {tab === 'capital' && (
        <div className="rounded-xl p-4 border" style={scheda}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text.primary }}>
            📈 Rivalutazione — {mkt === 'offplan' ? 'off-plan' : 'secondario'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Dato valore={`+${pct(appr)}`} etichetta={`Rivalutazione ${orizzonte}`} tinta={theme.stato.buono.text}
                  spiegazione={`Stima di zona: ${pct(apprBase)}, corretta per l'età dell'edificio (${nomeEta}, ×${a.appr}). È un'attesa di mercato, non un rendimento garantito.`} />
            <Dato valore={fmt(profit)} etichetta="Guadagno (AED)"
                  spiegazione="Differenza fra valore futuro stimato e prezzo pagato. Si realizza solo alla rivendita, e la rivendita ha i suoi costi." />
            <Dato valore={fmt(futVal)} etichetta="Valore futuro (AED)"
                  spiegazione="Prezzo pagato più la rivalutazione attesa." />
            {mkt === 'offplan' && (
              <Dato valore={`${d.opHand} mesi`} etichetta="Alla consegna"
                    spiegazione="Tempo medio di consegna per i progetti di questa zona. Fino ad allora l'immobile non produce affitto." />
            )}
          </div>

          <Voce etichetta="Prezzo che paghi" valore={`${fmt(price)} AED`}
                spiegazione="Quello che hai scritto sopra: il prezzo dell'immobile come da preventivo. Tutti i calcoli partono da qui." />
          <Voce etichetta={`(+) Rivalutazione ${pct(appr)}`} valore={`+${fmt(profit)} AED`} coloreValore={theme.stato.buono.text}
                spiegazione={`Crescita attesa del valore ${orizzonte}.`}
                formula={`${fmt(price)} × ${pct(appr)}`} />
          <Voce etichetta="= Valore futuro stimato" valore={`${fmt(futVal)} AED`} coloreValore={theme.stato.buono.text} forte
                spiegazione="Quanto potrebbe valere l'immobile alla fine dell'orizzonte considerato." />

          {mkt === 'offplan' && (
            <div className="mt-4 p-3 rounded-lg border" style={{ background: theme.accento.wash, borderColor: theme.accento.bordo }}>
              <p className="text-xs font-semibold mb-1" style={{ color: theme.accento.text }}>
                Sconto di lancio tipico in questa zona: {pct(scontoLancio)}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: theme.text.secondary }}>
                In {z} le unità off-plan escono in fase di lancio mediamente il {pct(scontoLancio)} sotto il prezzo
                di mercato dell'equivalente già consegnato. È un riferimento per capire se il prezzo che hai in mano
                è un vero prezzo di lancio — <strong>non viene sottratto</strong> dai calcoli qui sopra, che partono
                dalla cifra che paghi davvero.
              </p>
            </div>
          )}
        </div>
      )}

      {/* COSTI */}
      {tab === 'costs' && (
        <div className="rounded-xl p-4 border" style={scheda}>
          <h3 className="font-semibold mb-4" style={{ color: theme.text.primary }}>💰 Costi ricorrenti annui</h3>
          <Voce etichetta={`Service charge (${sc} AED/sqft × ${sqft} sqft)`} valore={`${fmt(costoSc)} AED`}
                spiegazione={`Quota annua al building management per aree comuni, piscina, palestra, sicurezza e manutenzione dell'edificio. Si paga per piede quadro e si versa ogni anno, anche se l'immobile è sfitto. In ${z} la tariffa è ${sc} AED/sqft: ${sc > 20 ? 'alta, tipica dei progetti con molti servizi' : sc > 12 ? 'nella media di Dubai' : 'bassa, tipica di comunità con pochi servizi condivisi'}.`}
                formula={`${sc} × ${sqft}${a.sc !== 1 ? ` × ${a.sc} (edificio ${nomeEta})` : ''}`} />
          <Voce etichetta="DEWA (acqua ed elettricità)" valore={`${fmt(costoDewa)} AED`}
                spiegazione="Stima delle utenze annue con l'immobile occupato. Scala con la metratura: un monolocale consuma circa il 40% in meno di un bilocale. Nell'affitto lungo spesso le paga l'inquilino — in quel caso questa voce si può ignorare."
                formula={`${fmt(d.dewa)} × ${roiBrMult.dewa[br]} (${['Studio', '1BR', '2BR', '3BR', '4+BR'][br]})`} />
          <Voce etichetta="Assicurazione" valore={`${fmt(COSTO_ASSICURAZIONE)} AED`}
                spiegazione="Stima forfettaria della polizza sul contenuto e sulla responsabilità civile. Il fabbricato è di norma già coperto dalla polizza condominiale pagata col service charge." />
          {a.maint > 0 && (
            <Voce etichetta={`Manutenzione (edificio ${nomeEta})`} valore={`${fmt(a.maint)} AED`} coloreValore={theme.stato.critico.text}
                  spiegazione="Accantonamento per riparazioni e sostituzioni: climatizzatori, elettrodomestici, rifacimenti. Su un edificio nuovo è zero perché c'è la garanzia del developer; cresce con l'età." />
          )}
          <Voce etichetta="= Totale annuo" valore={`${fmt(costs)} AED`} coloreValore={theme.stato.critico.text} forte
                spiegazione="La somma delle voci sopra. È quello che l'immobile costa ogni anno a prescindere dall'affitto." />
          <Voce etichetta="Al mese" valore={`${fmt(costs / 12)} AED`}
                spiegazione="Il totale annuo diviso dodici, per confrontarlo con un canone mensile." />

          <div className="mt-4 p-3 rounded-lg border" style={{ background: theme.stato.attenzione.bg, borderColor: theme.stato.attenzione.fill }}>
            <p className="text-xs font-semibold mb-1" style={{ color: theme.stato.attenzione.text }}>
              Non inclusi: i costi d'acquisto, circa {fmt(costiAcquisto)} AED
            </p>
            <p className="text-xs leading-relaxed" style={{ color: theme.text.secondary }}>
              Registrazione ({reg.ente}, {reg.pct}%), commissione d'agenzia (circa {AGENZIA_PCT}%), più spese di
              pratica e, se c'è un mutuo, i costi di istruttoria. Sono una tantum e non entrano nel rendimento annuo,
              ma sul primo anno pesano: su {fmt(price)} AED sono circa {fmt(costiAcquisto)} AED.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-center leading-relaxed" style={{ color: theme.text.tertiary }}>
        ⚠️ Canoni, tariffe, occupazione e rivalutazioni sono <strong>medie di zona</strong> basate su dati pubblici
        (RERA, DLD, portali di annunci), non il preventivo di uno specifico immobile. Servono a confrontare
        alternative, non a promettere un risultato. Prima di investire, verifica i numeri sul singolo progetto.
      </p>
    </div>
  );
}
