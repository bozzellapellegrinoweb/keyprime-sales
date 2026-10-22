// Formattatori condivisi fra App.js e i componenti.

export const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const fmtShort = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '-';

export const getWhatsAppLink = (phone, msg = '') =>
  `https://wa.me/${(phone || '').replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;

export const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';
export const isOverdue = (d) => d && new Date(d) < new Date();
export const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();
export const getInitials = (nome, cognome) =>
  `${(nome || '')[0] || ''}${(cognome || '')[0] || ''}`.toUpperCase() || '?';
