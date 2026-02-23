import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus, Search, Phone, Mail, X, Edit2, TrendingUp, DollarSign, Target, Users, Menu, Key, CheckSquare, Square, Bell, MapPin, Award, User, MessageCircle, Filter, ChevronLeft, ChevronRight, Clock, FileText, Plus, Send, LayoutDashboard, PieChart, ListTodo, Settings, Building2, Briefcase, ArrowUpRight, ArrowDownRight, MoreHorizontal, Sparkles, Command, Printer, Map, List, Grid, Play, Layers } from 'lucide-react';

const supabase = createClient('https://wqtylxrrerhbxagdzftn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ');

// Config
const RESEND_API_KEY = 're_jCpLJKfw_MfWu2jbSzPPgz6pLHQXMAXJb';
const EMAIL_FROM = 'onboarding@resend.dev';
const ADMIN_EMAIL = 'bozzellapellegrino@gmail.com';
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwc3Byb2plY3RrZXkiLCJhIjoiY21sdHl4aDM5MDRvbDNmczRtYXR6ZWp4cyJ9.HpQdRN36TYMnNCs1VtwtKA'; // Keep for future use

// Leaflet Config (no token needed - free!)
const LEAFLET_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// PropertyFinder API Config
const PF_API_HOST = 'uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com';
const PF_API_KEY = '726ac8a1f8msh5ec783ecc467b76p1e1338jsn88a853551916';

// Dubai Areas with coordinates for map
const DUBAI_AREAS_COORDS = {
  'Dubai Marina': { lat: 25.0805, lng: 55.1403, zoom: 14 },
  'Palm Jumeirah': { lat: 25.1124, lng: 55.1390, zoom: 13 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744, zoom: 14 },
  'Business Bay': { lat: 25.1851, lng: 55.2628, zoom: 14 },
  'JBR': { lat: 25.0780, lng: 55.1340, zoom: 15 },
  'Dubai Hills Estate': { lat: 25.1026, lng: 55.2427, zoom: 13 },
  'Dubai Hills': { lat: 25.1026, lng: 55.2427, zoom: 13 },
  'Mohammed Bin Rashid City': { lat: 25.1695, lng: 55.3147, zoom: 13 },
  'MBR City': { lat: 25.1695, lng: 55.3147, zoom: 13 },
  'Dubai Creek Harbour': { lat: 25.2048, lng: 55.3461, zoom: 14 },
  'Dubai Creek': { lat: 25.2048, lng: 55.3461, zoom: 14 },
  'Jumeirah Village Circle': { lat: 25.0655, lng: 55.2094, zoom: 14 },
  'JVC': { lat: 25.0655, lng: 55.2094, zoom: 14 },
  'JLT': { lat: 25.0750, lng: 55.1550, zoom: 14 },
  'Dubai South': { lat: 24.8966, lng: 55.1581, zoom: 12 },
  'DAMAC Hills': { lat: 25.0285, lng: 55.2430, zoom: 13 },
  'DAMAC Hills 2': { lat: 25.0050, lng: 55.2750, zoom: 13 },
  'Arabian Ranches': { lat: 25.0597, lng: 55.2671, zoom: 13 },
  'Meydan': { lat: 25.1606, lng: 55.2958, zoom: 13 },
  'DIFC': { lat: 25.2104, lng: 55.2796, zoom: 15 },
  'Al Marjan Island': { lat: 25.7955, lng: 55.7283, zoom: 13 },
  'Dubai Islands': { lat: 25.2750, lng: 55.3150, zoom: 12 },
  'Expo City': { lat: 24.9600, lng: 55.1580, zoom: 13 },
  'Yas Island': { lat: 24.4957, lng: 54.6030, zoom: 13 },
  'Saadiyat Island': { lat: 24.5465, lng: 54.4330, zoom: 13 },
  'Al Reem Island': { lat: 24.4950, lng: 54.4050, zoom: 13 },
  'Sobha Hartland': { lat: 25.1850, lng: 55.3250, zoom: 14 },
  'Tilal Al Ghaf': { lat: 25.0350, lng: 55.2100, zoom: 13 },
  'Emaar Beachfront': { lat: 25.0850, lng: 55.1350, zoom: 14 },
  'Bluewaters Island': { lat: 25.0800, lng: 55.1200, zoom: 14 },
  'City Walk': { lat: 25.2050, lng: 55.2600, zoom: 14 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773, zoom: 11 },
  'Sharjah': { lat: 25.3463, lng: 55.4209, zoom: 11 },
  'Ajman': { lat: 25.4052, lng: 55.5136, zoom: 11 },
  'Ras Al Khaimah': { lat: 25.7895, lng: 55.9432, zoom: 11 },
};

const DUBAI_CENTER = { lat: 25.1972, lng: 55.2744 };
const DEFAULT_ZOOM = 10;

// Get coordinates for location name
const getLocationCoords = (locationName) => {
  if (!locationName) return null;
  const locLower = locationName.toLowerCase();
  for (const [area, coords] of Object.entries(DUBAI_AREAS_COORDS)) {
    if (locLower.includes(area.toLowerCase())) return coords;
  }
  for (const [area, coords] of Object.entries(DUBAI_AREAS_COORDS)) {
    const areaWords = area.toLowerCase().split(' ');
    if (areaWords.some(word => word.length > 3 && locLower.includes(word))) return coords;
  }
  return null;
};

// Data
const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];
const pipelineStati = ['lead', 'trattativa', 'prenotato', 'venduto', 'incassato'];
const clienteStati = ['nuovo', 'contattato', 'interessato', 'trattativa', 'acquistato', 'perso'];
const taskPriorita = ['bassa', 'normale', 'alta', 'urgente'];

// Theme Colors - Section Based
const theme = {
  bg: { primary: '#09090B', secondary: '#0F0F11', tertiary: '#18181B', elevated: '#1F1F23' },
  border: { subtle: '#27272A', default: '#3F3F46', strong: '#52525B' },
  text: { primary: '#FAFAFA', secondary: '#A1A1AA', tertiary: '#71717A', muted: '#52525B' },
  sections: {
    dashboard: { accent: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
    vendite: { accent: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
    pipeline: { accent: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
    crm: { accent: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
    tasks: { accent: '#F472B6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
    utenti: { accent: '#22D3EE', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
    offplan: { accent: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' }
  },
  status: {
    lead: { color: '#71717A', bg: 'rgba(113,113,122,0.15)' },
    trattativa: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
    prenotato: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    venduto: { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    incassato: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' }
  },
  priority: {
    bassa: { color: '#71717A', bg: 'rgba(113,113,122,0.15)' },
    normale: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
    alta: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    urgente: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
  }
};

// Utilities
const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '-';
const getWhatsAppLink = (phone, msg = '') => `https://wa.me/${(phone || '').replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';
const isOverdue = (d) => d && new Date(d) < new Date();
const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();
const getInitials = (nome, cognome) => `${(nome || '')[0] || ''}${(cognome || '')[0] || ''}`.toUpperCase() || '?';

// Email Functions
const sendEmail = async (to, subject, html) => { try { await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }) }); return true; } catch (e) { return false; } };
const notifyTaskCompleted = async (task, agentName) => { await sendEmail(ADMIN_EMAIL, `✅ Task completato: ${task.titolo}`, `<div style="font-family:-apple-system,sans-serif;padding:20px"><h2>Task Completato</h2><p><strong>${task.titolo}</strong></p><p>Completato da: ${agentName}</p></div>`); };
const notifyTaskNote = async (task, agentName, note) => { await sendEmail(ADMIN_EMAIL, `💬 Nota: ${task.titolo}`, `<div style="font-family:-apple-system,sans-serif;padding:20px"><h2>Nuova Nota</h2><p><strong>${task.titolo}</strong></p><p>Da: ${agentName}</p><p>Nota: ${note}</p></div>`); };

// PDF Generator
const generateClientePDF = (cliente, sales, tasks) => { const tv = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((sum, s) => sum + Number(s.valore || 0), 0); const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cliente.nome}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}h1{font-size:28px;font-weight:600;margin-bottom:8px}h2{font-size:14px;font-weight:600;color:#666;margin:24px 0 12px;text-transform:uppercase;letter-spacing:0.5px}.stats{display:flex;gap:16px;margin:24px 0}.stat{flex:1;background:#f5f5f7;padding:16px;border-radius:12px;text-align:center}.stat-val{font-size:24px;font-weight:600}.stat-label{font-size:12px;color:#666;margin-top:4px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.item{background:#f5f5f7;padding:12px 16px;border-radius:8px}.item-label{font-size:11px;color:#666;margin-bottom:2px}.item-value{font-size:14px;font-weight:500}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:10px 12px;text-align:left;font-size:13px}th{background:#f5f5f7;font-weight:500}tr:not(:last-child) td{border-bottom:1px solid #e5e5e5}</style></head><body><h1>${cliente.nome} ${cliente.cognome||''}</h1><p style="color:#666">${cliente.telefono||''} ${cliente.email?'• '+cliente.email:''}</p><div class="stats"><div class="stat"><div class="stat-val">${sales.length}</div><div class="stat-label">Lead</div></div><div class="stat"><div class="stat-val">${fmt(tv)}</div><div class="stat-label">Valore AED</div></div><div class="stat"><div class="stat-val">${cliente.stato}</div><div class="stat-label">Stato</div></div></div><h2>Informazioni</h2><div class="grid"><div class="item"><div class="item-label">Budget</div><div class="item-value">${cliente.budget_max?fmt(cliente.budget_max)+' AED':'N/A'}</div></div><div class="item"><div class="item-label">Agente</div><div class="item-value">${cliente.agente_riferimento||'N/A'}</div></div></div>${sales.length>0?'<h2>Storico Lead</h2><table><tr><th>Data</th><th>Progetto</th><th>Valore</th><th>Stato</th></tr>'+sales.map(s=>'<tr><td>'+fmtShort(s.data)+'</td><td>'+s.progetto+'</td><td>'+(s.valore>0?fmt(s.valore):'TBD')+'</td><td>'+s.stato+'</td></tr>').join('')+'</table>':''}</body></html>`; const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),500); };

// ==================== UI COMPONENTS ====================

// Toast
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500' };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${colors[type]} text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slideUp`}>
      <Check className="w-4 h-4" /><span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Avatar
const Avatar = ({ nome, cognome, size = 'md', color }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-14 h-14 text-lg' };
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
  const bgColor = color || colors[Math.abs((nome || '').charCodeAt(0) || 0) % colors.length];
  return <div className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}>{getInitials(nome, cognome)}</div>;
};

// Status Badge
const StatusBadge = ({ status, type = 'pipeline' }) => {
  const config = type === 'pipeline' ? theme.status[status] : type === 'priority' ? theme.priority[status] : theme.status[status];
  if (!config) return null;
  return <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: config.bg, color: config.color }}>{status}</span>;
};

// Card Component
const Card = ({ children, className = '', hover = false, onClick, padding = 'p-5' }) => (
  <div onClick={onClick} className={`bg-[#18181B] border border-[#27272A] rounded-2xl ${padding} ${hover ? 'hover:border-[#3F3F46] hover:bg-[#1F1F23] cursor-pointer transition-all duration-200' : ''} ${className}`}>
    {children}
  </div>
);

// Section Header
const SectionHeader = ({ icon: Icon, title, accent, action, actionLabel, onAction }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(${accent}, 0.15)` }}>
        <Icon className="w-5 h-5" style={{ color: `rgb(${accent})` }} />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    {action && (
      <button onClick={onAction} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: `rgb(${accent})` }}>
        {actionLabel} <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

// Metric Card
const MetricCard = ({ label, value, subValue, icon: Icon, color, trend, onClick }) => (
  <Card hover={!!onClick} onClick={onClick} className="relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-zinc-500 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white">{typeof value === 'number' ? fmt(value) : value}</p>
        {subValue && <p className="text-sm text-zinc-500 mt-1">{subValue}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(trend)}% vs last month
      </div>
    )}
    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-5" style={{ background: color }} />
  </Card>
);

// Progress Bar
const ProgressBar = ({ value, max, color = '#A78BFA', height = 'h-2', showLabel = false }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="relative">
      <div className={`${height} bg-zinc-800 rounded-full overflow-hidden`}>
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className="absolute right-0 -top-6 text-xs text-zinc-500">{pct.toFixed(0)}%</span>}
    </div>
  );
};

// Empty State
const EmptyState = ({ icon: Icon, title, description, action, onAction }) => (
  <Card className="text-center py-12">
    <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-zinc-600" />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
    {action && <button onClick={onAction} className="px-5 py-2.5 bg-white text-zinc-900 rounded-xl font-medium text-sm hover:bg-zinc-100 transition-colors">{action}</button>}
  </Card>
);

// Input
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
    <input {...props} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] focus:ring-1 focus:ring-[#3F3F46] transition-all" />
  </div>
);

// Select
const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
    <select {...props} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3F3F46] transition-all appearance-none cursor-pointer">
      {children}
    </select>
  </div>
);

// Button
const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-white text-zinc-900 hover:bg-zinc-100',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button {...props} className={`${variants[variant]} ${sizes[size]} rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}{children}
    </button>
  );
};

// Modal
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#18181B] border border-[#27272A] rounded-2xl w-full ${sizes[size]} max-h-[85vh] overflow-hidden animate-scaleIn`}>
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

// Bottom Sheet
const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 md:relative md:max-w-lg md:w-full bg-[#18181B] border-t md:border border-[#27272A] rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

// Sidebar Nav Item
const NavItem = ({ icon: Icon, label, active, onClick, accent, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
    <Icon className="w-5 h-5" style={active ? { color: accent } : {}} />
    <span className="font-medium flex-1">{label}</span>
    {badge > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{badge}</span>}
  </button>
);

// Quick Actions Row
const QuickActions = ({ phone, whatsapp, email, clienteName }) => (
  <div className="flex gap-2">
    {phone && <a href={`tel:${phone}`} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Phone className="w-4 h-4" />Chiama</a>}
    {(whatsapp || phone) && <a href={getWhatsAppLink(whatsapp || phone, clienteName ? `Ciao ${clienteName}, ` : '')} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><MessageCircle className="w-4 h-4" />WhatsApp</a>}
    {email && <a href={`mailto:${email}`} className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Mail className="w-4 h-4" />Email</a>}
  </div>
);

// Global Search Modal (CMD+K)
const GlobalSearch = ({ isOpen, onClose, sales, clienti, tasks, onSelectSale, onSelectCliente, onSelectTask, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) setQuery('');
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const q = query.toLowerCase();
  const filteredSales = q.length >= 2 ? sales.filter(s => 
    `${s.progetto} ${s.developer} ${s.zona} ${s.cliente_nome} ${s.agente}`.toLowerCase().includes(q)
  ).slice(0, 5) : [];
  const filteredClienti = q.length >= 2 ? clienti.filter(c => 
    `${c.nome} ${c.cognome} ${c.telefono} ${c.email}`.toLowerCase().includes(q)
  ).slice(0, 5) : [];
  const filteredTasks = q.length >= 2 ? tasks.filter(t => 
    `${t.titolo} ${t.descrizione}`.toLowerCase().includes(q)
  ).slice(0, 3) : [];
  
  const hasResults = filteredSales.length > 0 || filteredClienti.length > 0 || filteredTasks.length > 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#27272A]">
          <Search className="w-5 h-5 text-zinc-500" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca lead, clienti, task..." className="flex-1 bg-transparent text-white text-lg placeholder:text-zinc-600 focus:outline-none" />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-500">ESC</kbd>
        </div>
        
        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center">
              <Command className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Digita almeno 2 caratteri per cercare</p>
              <p className="text-zinc-600 text-sm mt-2">Premi <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">⌘K</kbd> ovunque per aprire</p>
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-zinc-500">Nessun risultato per "{query}"</div>
          ) : (
            <div className="p-2">
              {/* Sales Results */}
              {filteredSales.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Lead / Vendite</div>
                  {filteredSales.map(s => (
                    <button key={s.id} onClick={() => { onSelectSale(s); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <div className="w-2 h-8 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
                        <p className="text-zinc-500 text-xs truncate">{s.developer} • {s.cliente_nome || 'No cliente'}</p>
                      </div>
                      <StatusBadge status={s.stato || 'lead'} />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Clienti Results */}
              {filteredClienti.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Clienti</div>
                  {filteredClienti.map(c => (
                    <button key={c.id} onClick={() => { onSelectCliente(c); setActiveTab('crm'); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <Avatar nome={c.nome} cognome={c.cognome} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.nome} {c.cognome}</p>
                        <p className="text-zinc-500 text-xs truncate">{c.telefono || c.email || 'No contatto'}</p>
                      </div>
                      <span className="text-amber-400 text-xs">{c.stato}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Tasks Results */}
              {filteredTasks.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Task</div>
                  {filteredTasks.map(t => (
                    <button key={t.id} onClick={() => { setActiveTab('tasks'); onClose(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.stato === 'completato' ? 'bg-emerald-500/20' : 'bg-pink-500/20'}`}>
                        <ListTodo className={`w-4 h-4 ${t.stato === 'completato' ? 'text-emerald-400' : 'text-pink-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-white text-sm font-medium truncate ${t.stato === 'completato' ? 'line-through opacity-50' : ''}`}>{t.titolo}</p>
                        <p className="text-zinc-500 text-xs truncate">{t.assegnato_a || 'Non assegnato'}</p>
                      </div>
                      <StatusBadge status={t.priorita} type="priority" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#27272A] flex items-center justify-between text-xs text-zinc-600">
          <span>KeyPrime Search</span>
          <div className="flex items-center gap-2">
            <span>Naviga con</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd>
            <span>Seleziona con</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↵</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard PDF Export
const generateDashboardPDF = (totals, sales, vendite, byAgente, byZona) => {
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const topAgenti = Object.entries(byAgente).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topZone = Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const conversionRate = sales.length > 0 ? ((vendite.length / sales.length) * 100).toFixed(1) : 0;
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KeyPrime Report - ${today}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: 700; color: #18181B; }
    .logo span { color: #A78BFA; }
    .date { color: #666; font-size: 14px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    h2 { font-size: 16px; font-weight: 600; color: #666; margin: 32px 0 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%); padding: 20px; border-radius: 12px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #18181B; }
    .stat-value.purple { color: #A78BFA; }
    .stat-value.green { color: #34D399; }
    .stat-value.blue { color: #60A5FA; }
    .stat-value.amber { color: #FBBF24; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card { background: #f8f8f8; border-radius: 12px; padding: 20px; }
    .card-title { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #333; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #666; }
    .row-value { font-weight: 600; }
    .commission-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
    .commission-item { background: white; padding: 12px; border-radius: 8px; text-align: center; }
    .commission-value { font-size: 18px; font-weight: 700; }
    .commission-label { font-size: 11px; color: #666; margin-top: 2px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Key<span>Prime</span></div>
      <h1>Report Dashboard</h1>
    </div>
    <div class="date">${today}</div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value purple">${fmt(totals.valore)}</div>
      <div class="stat-label">Volume Totale AED</div>
    </div>
    <div class="stat">
      <div class="stat-value blue">${sales.length}</div>
      <div class="stat-label">Lead Totali</div>
    </div>
    <div class="stat">
      <div class="stat-value green">${vendite.length}</div>
      <div class="stat-label">Vendite Chiuse</div>
    </div>
    <div class="stat">
      <div class="stat-value amber">${conversionRate}%</div>
      <div class="stat-label">Tasso Conversione</div>
    </div>
  </div>
  
  <h2>Commissioni</h2>
  <div class="commission-grid">
    <div class="commission-item">
      <div class="commission-value" style="color: #34D399">${fmt(totals.comm)}</div>
      <div class="commission-label">Totali</div>
    </div>
    <div class="commission-item">
      <div class="commission-value" style="color: #60A5FA">${fmt(totals.ag)}</div>
      <div class="commission-label">Agenti 70%</div>
    </div>
    <div class="commission-item">
      <div class="commission-value" style="color: #22C55E">${fmt(totals.pell)}</div>
      <div class="commission-label">Pellegrino</div>
    </div>
    <div class="commission-item">
      <div class="commission-value" style="color: #F97316">${fmt(totals.giov)}</div>
      <div class="commission-label">Giovanni</div>
    </div>
  </div>
  
  <div class="grid">
    <div>
      <h2>Top Agenti</h2>
      <div class="card">
        ${topAgenti.length > 0 ? topAgenti.map(([name, value], i) => `
          <div class="row">
            <span class="row-label">${i + 1}. ${name}</span>
            <span class="row-value">${fmt(value)} AED</span>
          </div>
        `).join('') : '<p style="color: #999; text-align: center; padding: 20px;">Nessun dato</p>'}
      </div>
    </div>
    <div>
      <h2>Top Zone</h2>
      <div class="card">
        ${topZone.length > 0 ? topZone.map(([zone, value], i) => `
          <div class="row">
            <span class="row-label">${i + 1}. ${zone}</span>
            <span class="row-value">${fmt(value)} AED</span>
          </div>
        `).join('') : '<p style="color: #999; text-align: center; padding: 20px;">Nessun dato</p>'}
      </div>
    </div>
  </div>
  
  <div class="footer">
    KeyPrime Real Estate CRM • Report generato automaticamente • ${today}
  </div>
</body>
</html>`;
  
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

// ==================== MAIN APP ====================
export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modals
  const [showForm, setShowForm] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(null);
  const [showClienteDetail, setShowClienteDetail] = useState(null);
  const [showClienteModal, setShowClienteModal] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(null);
  const [showUserModal, setShowUserModal] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [convertingSale, setConvertingSale] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({ search: '', stato: '' });
  const [clienteFilters, setClienteFilters] = useState({ search: '', stato: '' });
  const [periodFilter, setPeriodFilter] = useState('all'); // all, 30, 60, 90
  const [showAgentDetail, setShowAgentDetail] = useState(null);
  
  // Saved Listings (PropertyFinder)
  const [savedListings, setSavedListings] = useState([]);
  
  // Global Search
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  
  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Notifications
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const saved = localStorage.getItem('keyprime_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Auth
  useEffect(() => {
    const s = localStorage.getItem('keyprime_user');
    if (s) { const u = JSON.parse(s); setUser(u); setActiveTab(u.ruolo === 'admin' ? 'dashboard' : 'home'); setView(u.ruolo === 'admin' ? 'admin' : u.ruolo); }
  }, []);
  
  // Data Loading
  const loadSales = async () => { setLoading(true); const { data } = await supabase.from('sales_with_commissions').select('*').order('created_at', { ascending: false }); setSales(data || []); setLoading(false); };
  const loadUsers = async () => { const { data } = await supabase.from('user_credentials').select('*').order('created_at', { ascending: false }); setUsers(data || []); };
  const loadClienti = async () => { const { data } = await supabase.from('clienti').select('*').order('created_at', { ascending: false }); setClienti(data || []); };
  const loadTasks = async () => { const { data } = await supabase.from('tasks').select('*').order('scadenza', { ascending: true }); setTasks(data || []); };
  const loadSavedListings = async () => { const { data } = await supabase.from('saved_listings').select('*').order('created_at', { ascending: false }); setSavedListings(data || []); };
  
  useEffect(() => { if (user) { loadSales(); loadClienti(); loadTasks(); loadSavedListings(); if (user.ruolo === 'admin') loadUsers(); }}, [user]);

  // Auth Handlers
  const handleLogin = async (username, password) => {
    setLoading(true); setError(null);
    const { data } = await supabase.from('user_credentials').select('*').eq('username', username).eq('password', password).eq('attivo', true).single();
    if (!data) { setError('Credenziali non valide'); setLoading(false); return; }
    setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data));
    setActiveTab(data.ruolo === 'admin' ? 'dashboard' : 'home');
    setView(data.ruolo === 'admin' ? 'admin' : data.ruolo); setLoading(false);
  };
  
  const handleLogout = () => { setUser(null); localStorage.removeItem('keyprime_user'); setView('login'); setMobileMenuOpen(false); };
  
  const changePassword = async (np) => {
    await supabase.from('user_credentials').update({ password: np }).eq('id', user.id);
    const u = { ...user, password: np }; setUser(u); localStorage.setItem('keyprime_user', JSON.stringify(u));
    setShowPasswordModal(false); showToast('Password aggiornata');
  };

  // Saved Listings Handlers
  const saveListing = async (listing) => {
    const { error } = await supabase.from('saved_listings').insert([{
      property_id: listing.project_id, // Use project_id for off-plan projects
      title: listing.title,
      price: parseFloat(listing.price_from) || 0,
      location_full: listing.location?.full_name,
      location_path: listing.location?.path_name || listing.location?.name,
      property_type: 'off-plan',
      size: null,
      bedrooms: listing.bedrooms?.available?.join(',') || null,
      bathrooms: null,
      furnished: null,
      image_url: listing.images?.[0]?.medium_image_url,
      pf_url: null, // No external URL
      completion_status: listing.construction_phase_key,
      agent_name: listing.developer?.name,
      agent_email: null,
      description: listing.title,
      created_by: user?.nome
    }]);
    if (error) {
      console.error('Save error:', error);
      showToast('Errore nel salvataggio');
    } else {
      loadSavedListings();
      showToast('Progetto salvato ✓');
    }
  };
  
  const removeListing = async (propertyId) => {
    await supabase.from('saved_listings').delete().eq('property_id', propertyId);
    loadSavedListings(); showToast('Annuncio rimosso');
  };
  
  const createLeadFromListing = async (leadData) => {
    // If creating new cliente first
    let cliente_id = leadData.cliente_id;
    if (leadData.newCliente && leadData.newCliente.nome) {
      const { data: cd } = await supabase.from('clienti').insert([{
        nome: leadData.newCliente.nome,
        cognome: leadData.newCliente.cognome || '',
        telefono: leadData.newCliente.telefono || '',
        email: leadData.newCliente.email || '',
        stato: 'nuovo',
        fonte: 'Off-Plan',
        agente_riferimento: user?.nome,
        created_by: user?.nome,
        referente: user?.referente
      }]).select().single();
      if (cd) {
        cliente_id = cd.id;
        leadData.cliente_nome = `${cd.nome} ${cd.cognome}`;
        loadClienti();
      }
    }
    
    // Create lead
    await supabase.from('sales').insert([{
      data: new Date().toISOString().split('T')[0],
      developer: leadData.developer,
      progetto: leadData.progetto,
      zona: leadData.zona,
      valore: leadData.valore || 0,
      stato: 'lead',
      agente: user?.nome,
      referente: user?.referente,
      cliente_id: cliente_id,
      inserted_by: user?.nome,
      inserted_as: user?.ruolo
    }]);
    
    loadSales();
    showToast('Lead creato da Off-Plan');
  };

  // Sales Handlers
  const addLead = async (ld) => {
    try {
      let cliente_id = ld.cliente_id;
      if (!cliente_id && ld.cliente_nome) {
        const { data: cd, error: clienteError } = await supabase.from('clienti').insert([{
          nome: ld.cliente_nome, cognome: ld.cliente_cognome, email: ld.cliente_email, telefono: ld.cliente_telefono,
          whatsapp: ld.cliente_whatsapp, nazionalita: ld.cliente_nazionalita, budget_min: ld.cliente_budget_min ? parseFloat(ld.cliente_budget_min) : null,
          budget_max: ld.cliente_budget_max ? parseFloat(ld.cliente_budget_max) : null, note: ld.cliente_note,
          stato: 'nuovo', fonte: 'Agente', agente_riferimento: user?.nome, created_by: user?.nome, referente: user?.referente
        }]).select().single();
        if (clienteError) { console.error('Cliente error:', clienteError); }
        if (cd) cliente_id = cd.id;
      }
      const { error } = await supabase.from('sales').insert([{
        data: ld.data, developer: ld.developer, progetto: ld.progetto, zona: ld.zona, valore: ld.valore || 0,
        agente: ld.agente, segnalatore: ld.segnalatore, referente: user?.referente, commission_pct: 5,
        inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: ld.stato || 'lead', cliente_id
      }]);
      if (error) { console.error('Insert error:', error); showToast('Errore: ' + error.message); return; }
      showToast('Lead aggiunto'); setShowForm(null); loadSales(); loadClienti();
    } catch (err) { console.error('addLead error:', err); showToast('Errore salvataggio'); }
  };

  const addSale = async (sd) => {
    try {
      let cliente_id = sd.cliente_id;
      if (!cliente_id && sd.nuovo_cliente_nome) {
        const { data: cd, error: clienteError } = await supabase.from('clienti').insert([{
          nome: sd.nuovo_cliente_nome, cognome: sd.nuovo_cliente_cognome || '', telefono: sd.nuovo_cliente_telefono || '',
          email: sd.nuovo_cliente_email || '', stato: 'acquistato', fonte: 'Vendita',
          agente_riferimento: user?.nome, created_by: user?.nome, referente: user?.referente
        }]).select().single();
        if (clienteError) { console.error('Cliente error:', clienteError); }
        if (cd) cliente_id = cd.id;
      }
      if (sd.cliente_id) await supabase.from('clienti').update({ stato: 'acquistato' }).eq('id', sd.cliente_id);
      const { error } = await supabase.from('sales').insert([{
        data: sd.data, developer: sd.developer, progetto: sd.progetto, zona: sd.zona, valore: sd.valore,
        agente: sd.agente, segnalatore: sd.segnalatore, cliente_id,
        referente: user?.referente, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: 'venduto'
      }]);
      if (error) { console.error('Insert error:', error); showToast('Errore: ' + error.message); return; }
      showToast('Vendita registrata'); setShowForm(null); loadSales(); loadClienti();
    } catch (err) { console.error('addSale error:', err); showToast('Errore salvataggio'); }
  };

  const convertLeadToSale = async (id, v) => {
    const sale = sales.find(s => s.id === id);
    if (sale?.cliente_id) await supabase.from('clienti').update({ stato: 'acquistato' }).eq('id', sale.cliente_id);
    await supabase.from('sales').update({ stato: 'venduto', valore: v }).eq('id', id);
    setConvertingSale(null); setShowLeadDetail(null); showToast('Vendita confermata!'); loadSales(); loadClienti();
  };

  const updateSale = async (id, u) => {
    const s = sales.find(x => x.id === id);
    if (u.pagato === true && !s?.pagato) {
      const tn = s.agente || s.segnalatore;
      if (tn) {
        const { data: tu } = await supabase.from('user_credentials').select('*').eq('nome', tn).single();
        if (tu?.email) {
          const ca = Number(s.valore) * (s.commission_pct || 5) / 100 * (s.agente ? 0.7 : 0.3);
          await sendEmail(tu.email, '💰 Commissione', `<div style="font-family:-apple-system,sans-serif;padding:20px"><h2>Commissione Pagata!</h2><p>${s.progetto}: ${fmt(ca)} AED</p></div>`);
        }
      }
    }
    await supabase.from('sales').update(u).eq('id', id); loadSales();
  };

  const deleteSale = async (id) => { if (!window.confirm('Eliminare questo lead?')) return; await supabase.from('sales').delete().eq('id', id); showToast('Eliminato'); loadSales(); };

  // Cliente Handlers
  const createCliente = async (d) => { await supabase.from('clienti').insert([{ ...d, created_by: user?.nome, referente: user?.referente }]); loadClienti(); setShowClienteModal(null); showToast('Cliente creato'); };
  const updateCliente = async (id, d) => { await supabase.from('clienti').update(d).eq('id', id); loadClienti(); setShowClienteModal(null); if (showClienteDetail?.id === id) setShowClienteDetail({ ...showClienteDetail, ...d }); showToast('Salvato'); };
  const deleteCliente = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('clienti').delete().eq('id', id); loadClienti(); setShowClienteDetail(null); };

  // Task Handlers
  const createTask = async (d) => { await supabase.from('tasks').insert([{ ...d, created_by: user?.nome }]); loadTasks(); setShowTaskModal(null); showToast('Task creato'); };
  const updateTask = async (id, d) => { await supabase.from('tasks').update(d).eq('id', id); loadTasks(); setShowTaskModal(null); showToast('Salvato'); };
  const completeTask = async (id) => { const task = tasks.find(t => t.id === id); await supabase.from('tasks').update({ stato: 'completato', completed_at: new Date().toISOString() }).eq('id', id); if (task && user?.ruolo !== 'admin') await notifyTaskCompleted(task, user?.nome); showToast('Completato!'); loadTasks(); };
  const addTaskNote = async (id, note) => { const task = tasks.find(t => t.id === id); await supabase.from('tasks').update({ note }).eq('id', id); if (task && user?.ruolo !== 'admin') await notifyTaskNote(task, user?.nome, note); loadTasks(); setShowNoteModal(null); showToast('Nota inviata'); };
  const deleteTask = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('tasks').delete().eq('id', id); loadTasks(); };

  // User Handlers
  const createUser = async (d) => { await supabase.from('user_credentials').insert([d]); loadUsers(); setShowUserModal(null); showToast('Utente creato'); };
  const updateUser = async (id, d) => { await supabase.from('user_credentials').update(d).eq('id', id); loadUsers(); setShowUserModal(null); showToast('Salvato'); };
  const deleteUser = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('user_credentials').delete().eq('id', id); loadUsers(); };

  // Computed Data
  const filteredSales = sales.filter(s => {
    if (filters.search && !`${s.progetto} ${s.developer} ${s.agente} ${s.cliente_nome}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.stato && s.stato !== filters.stato) return false;
    return true;
  });
  
  const filteredClienti = clienti.filter(c => {
    if (clienteFilters.search && !`${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase().includes(clienteFilters.search.toLowerCase())) return false;
    if (clienteFilters.stato && c.stato !== clienteFilters.stato) return false;
    return true;
  });

  const myPendingTasks = tasks.filter(t => t.stato === 'pending' && (user?.ruolo === 'admin' || t.assegnato_a === user?.nome));
  const overdueTasks = myPendingTasks.filter(t => isOverdue(t.scadenza));
  const todayTasks = myPendingTasks.filter(t => isToday(t.scadenza));
  const notificationTasks = myPendingTasks.filter(t => isOverdue(t.scadenza) || isToday(t.scadenza));
  
  // Recent sales notifications (last 24 hours for admin)
  const recentSalesNotifications = user?.ruolo === 'admin' ? sales.filter(s => {
    const created = new Date(s.created_at);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff <= 24 && !readNotificationIds.includes('sale_' + s.id);
  }) : [];
  
  const unreadNotificationIds = [
    ...notificationTasks.filter(t => !readNotificationIds.includes(t.id)).map(t => t.id),
    ...recentSalesNotifications.map(s => 'sale_' + s.id)
  ];
  const notificationCount = unreadNotificationIds.length;

  const markNotificationsAsRead = () => {
    const taskIds = notificationTasks.map(t => t.id);
    const saleIds = recentSalesNotifications.map(s => 'sale_' + s.id);
    const allIds = [...new Set([...readNotificationIds, ...taskIds, ...saleIds])];
    setReadNotificationIds(allIds);
    localStorage.setItem('keyprime_read_notifications', JSON.stringify(allIds));
  };

  // ==================== LOGIN VIEW ====================
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="KeyPrime" className="h-20 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Real Estate CRM</p>
          </div>
          
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}
          
          <LoginForm onLogin={handleLogin} loading={loading} />
        </div>
      </div>
    );
  }

  // ==================== AGENT/SEGNALATORE VIEW ====================
  if (view === 'agente' || view === 'segnalatore') {
    const type = view;
    const mySales = sales.filter(s => type === 'agente' ? s.agente === user?.nome : s.segnalatore === user?.nome);
    const myTasks = tasks.filter(t => t.assegnato_a === user?.nome && t.stato === 'pending');
    const myClienti = clienti.filter(c => c.created_by === user?.nome || c.agente_riferimento === user?.nome);
    const rate = type === 'agente' ? 0.7 : 0.3;
    const myVendite = mySales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totalComm = myVendite.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const pagate = myVendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const byStato = pipelineStati.reduce((acc, st) => { acc[st] = mySales.filter(s => (s.stato || 'lead') === st); return acc; }, {});

    const tabs = [
      { id: 'home', icon: LayoutDashboard, label: 'Home', accent: theme.sections.dashboard.accent },
      { id: 'leads', icon: Target, label: 'Lead', accent: theme.sections.pipeline.accent },
      { id: 'offplan', icon: Building2, label: 'Off-Plan', accent: theme.sections.offplan.accent },
      { id: 'tasks', icon: ListTodo, label: 'Task', accent: theme.sections.tasks.accent, badge: myTasks.length },
      { id: 'settings', icon: Settings, label: 'Account', accent: theme.sections.utenti.accent }
    ];

    // Form View (same for mobile/desktop)
    if (showForm) {
      return (
        <div className="min-h-screen bg-[#09090B]">
          <div className="sticky top-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A] px-4 py-4">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <button onClick={() => setShowForm(null)} className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
                <ChevronLeft className="w-5 h-5" />Indietro
              </button>
              <span className="text-white font-semibold">{showForm === 'lead' ? 'Nuovo Lead' : 'Nuova Vendita'}</span>
              <div className="w-20" />
            </div>
          </div>
          <div className="p-4 pb-32 max-w-lg mx-auto">
            {showForm === 'lead' && <LeadForm type={type} userName={user?.nome} clienti={myClienti} onSubmit={addLead} />}
            {showForm === 'vendita' && <SaleForm type={type} userName={user?.nome} clienti={myClienti} onSubmit={addSale} />}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#09090B]/95 backdrop-blur-xl border-t border-[#27272A]">
            <Button onClick={() => document.getElementById('submitBtn')?.click()} className="w-full py-4">
              {showForm === 'lead' ? 'Salva Lead' : 'Registra Vendita'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#09090B] lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#27272A] bg-[#0F0F11] p-4 fixed h-full">
          <div className="mb-8">
            <img src="/logo.png" alt="KeyPrime" className="h-16" />
          </div>
          <nav className="space-y-1 flex-1">
            {tabs.map(t => (
              <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} accent={t.accent} badge={t.badge} />
            ))}
          </nav>
          <div className="pt-4 border-t border-[#27272A]">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar nome={user?.nome} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-zinc-500 text-xs capitalize">{type}</p>
              </div>
              <button onClick={handleLogout} className="text-zinc-500 hover:text-white"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 pb-24 lg:pb-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A]">
            <div className="flex items-center justify-between px-4 py-4">
              <img src="/logo.png" alt="KeyPrime" className="h-12" />
              <div className="flex items-center gap-3">
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <Avatar nome={user?.nome} size="sm" />
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block sticky top-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A]">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold text-white capitalize">{activeTab === 'home' ? `Ciao, ${user?.nome}` : tabs.find(t => t.id === activeTab)?.label}</h1>
                <p className="text-zinc-500 text-sm">
                  {activeTab === 'home' && 'Il tuo riepilogo'}
                  {activeTab === 'leads' && `${mySales.length} lead totali`}
                  {activeTab === 'offplan' && 'Progetti Off-Plan'}
                  {activeTab === 'tasks' && `${myTasks.length} task pendenti`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-white bg-[#27272A] rounded-xl">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <Button onClick={() => setShowForm('lead')} icon={Plus}>Nuovo Lead</Button>
                <Button onClick={() => setShowForm('vendita')} variant="secondary" icon={DollarSign}>Vendita</Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <>
                <div className="lg:hidden grid grid-cols-2 gap-3">
                  <button onClick={() => setShowForm('lead')} className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5 text-left">
                    <Target className="w-6 h-6 text-blue-400 mb-3" />
                    <span className="text-white font-medium block">Nuovo Lead</span>
                  </button>
                  <button onClick={() => setShowForm('vendita')} className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5 text-left">
                    <DollarSign className="w-6 h-6 text-emerald-400 mb-3" />
                    <span className="text-white font-medium block">Vendita</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MetricCard label="Lead Attivi" value={mySales.filter(s => s.stato !== 'venduto' && s.stato !== 'incassato').length} icon={Target} color="#60A5FA" onClick={() => setActiveTab('leads')} />
                  <MetricCard label="Vendite" value={myVendite.length} icon={TrendingUp} color="#34D399" />
                  <MetricCard label="Commissioni" value={fmt(totalComm)} icon={DollarSign} color="#FBBF24" />
                  <MetricCard label="Task" value={myTasks.length} icon={ListTodo} color="#F472B6" onClick={() => setActiveTab('tasks')} />
                </div>

                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white font-medium">Commissioni</span>
                    <span className="text-zinc-400 text-sm">{fmt(totalComm)} AED totali</span>
                  </div>
                  <ProgressBar value={pagate} max={totalComm || 1} color="#34D399" />
                  <div className="flex justify-between mt-3 text-sm">
                    <span className="text-emerald-400">Pagate: {fmt(pagate)} AED</span>
                    <span className="text-zinc-500">Pending: {fmt(totalComm - pagate)} AED</span>
                  </div>
                </Card>

                {myTasks.length > 0 && (
                  <Card hover onClick={() => setActiveTab('tasks')} className="border-pink-500/20 bg-pink-500/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <ListTodo className="w-6 h-6 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{myTasks.length} task da completare</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </div>
                  </Card>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Lead Recenti</h2>
                    <button onClick={() => setActiveTab('leads')} className="text-sm text-violet-400">Tutti →</button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {mySales.slice(0, 6).map(s => (
                      <Card key={s.id} hover onClick={() => setShowLeadDetail(s)} padding="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-12 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{s.progetto}</p>
                            <p className="text-zinc-500 text-sm">{s.developer}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-400 font-medium">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
                            <StatusBadge status={s.stato || 'lead'} />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {pipelineStati.map(st => (
                    <button key={st} className="px-4 py-2 rounded-xl text-sm whitespace-nowrap" style={{ background: theme.status[st]?.bg, color: theme.status[st]?.color }}>
                      {st} ({byStato[st]?.length || 0})
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {mySales.map(s => (
                    <Card key={s.id} hover onClick={() => setShowLeadDetail(s)} padding="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-14 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{s.progetto}</p>
                          <p className="text-zinc-500 text-sm">{s.developer} • {s.zona}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-semibold">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
                          <StatusBadge status={s.stato || 'lead'} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'tasks' && <AgentTasksTab tasks={myTasks} allTasks={tasks.filter(t => t.assegnato_a === user?.nome)} clienti={clienti} onComplete={completeTask} onAddNote={(t) => setShowNoteModal(t)} />}
            {activeTab === 'offplan' && <OffPlanTab clienti={myClienti} onCreateLead={createLeadFromListing} savedListings={savedListings} onSaveListing={saveListing} onRemoveListing={removeListing} user={user} />}
            
            {activeTab === 'settings' && (
              <Card className="max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar nome={user?.nome} size="lg" />
                  <div>
                    <p className="text-xl font-semibold text-white">{user?.nome}</p>
                    <p className="text-zinc-500">{type}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="secondary" icon={Key} onClick={() => setShowPasswordModal(true)} className="w-full justify-start">Cambia Password</Button>
                  <Button variant="danger" icon={LogOut} onClick={handleLogout} className="w-full justify-start">Esci</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Mobile Bottom Nav */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#09090B]/95 backdrop-blur-xl border-t border-[#27272A] px-4 py-2 z-30">
            <div className="flex justify-around">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center py-2 px-3 ${activeTab === t.id ? 'text-white' : 'text-zinc-500'}`}>
                  <t.icon className="w-6 h-6" style={activeTab === t.id ? { color: t.accent } : {}} />
                  <span className="text-xs mt-1">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {showLeadDetail && <LeadDetailSheet sale={showLeadDetail} cliente={clienti.find(c => c.id === showLeadDetail?.cliente_id)} rate={rate} onClose={() => setShowLeadDetail(null)} onUpdateSale={updateSale} onConvert={() => setConvertingSale(showLeadDetail)} />}
        {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
        {showNotifications && <NotificationsPanel tasks={notificationTasks} unreadIds={unreadNotificationIds} recentSales={recentSalesNotifications} onClose={() => { setShowNotifications(false); markNotificationsAsRead(); }} onGoToTask={() => { setShowNotifications(false); setActiveTab('tasks'); }} />}
        {showPasswordModal && <PasswordModal currentPassword={user?.password} onSave={changePassword} onClose={() => setShowPasswordModal(false)} />}
        {showNoteModal && <NoteModal task={showNoteModal} onSave={addTaskNote} onClose={() => setShowNoteModal(null)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ==================== ADMIN VIEW ====================
  if (view === 'admin') {
    // Period filter logic
    const getFilteredByPeriod = (salesData) => {
      if (periodFilter === 'all') return salesData;
      const days = parseInt(periodFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return salesData.filter(s => s.data && new Date(s.data) >= cutoff);
    };
    
    const periodSales = getFilteredByPeriod(sales);
    const vendite = periodSales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totals = periodSales.reduce((a, s) => {
      const c = Number(s.valore) * (s.commission_pct || 5) / 100;
      const ag = s.agente ? c * 0.7 : 0;
      const sg = s.segnalatore ? c * 0.3 : 0;
      const n = c - ag - sg;
      const p = s.referente === 'Pellegrino' ? n * 0.7 : (s.referente === 'Giovanni' ? n * 0.3 : 0);
      const g = s.referente === 'Giovanni' ? n * 0.7 : (s.referente === 'Pellegrino' ? n * 0.3 : 0);
      return { valore: a.valore + Number(s.valore), comm: a.comm + c, ag: a.ag + ag, sg: a.sg + sg, netto: a.netto + n, pell: a.pell + p, giov: a.giov + g };
    }, { valore: 0, comm: 0, ag: 0, sg: 0, netto: 0, pell: 0, giov: 0 });
    
    const byStato = pipelineStati.reduce((a, st) => { a[st] = periodSales.filter(s => (s.stato || 'lead') === st); return a; }, {});
    const byMonth = periodSales.reduce((a, s) => { const m = s.data?.substring(0, 7) || 'N/A'; a[m] = (a[m] || 0) + Number(s.valore); return a; }, {});
    const byAgente = periodSales.reduce((a, s) => { if (s.agente) a[s.agente] = (a[s.agente] || 0) + Number(s.valore); return a; }, {});
    const byZona = periodSales.reduce((a, s) => { if (s.zona) a[s.zona] = (a[s.zona] || 0) + Number(s.valore); return a; }, {});
    const pendingTasks = tasks.filter(t => t.stato === 'pending');

    const tabs = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', accent: theme.sections.dashboard.accent },
      { id: 'vendite', icon: DollarSign, label: 'Vendite', accent: theme.sections.vendite.accent },
      { id: 'pipeline', icon: PieChart, label: 'Pipeline', accent: theme.sections.pipeline.accent },
      { id: 'crm', icon: Users, label: 'CRM', accent: theme.sections.crm.accent },
      { id: 'offplan', icon: Building2, label: 'Off-Plan', accent: theme.sections.offplan.accent },
      { id: 'tasks', icon: ListTodo, label: 'Task', accent: theme.sections.tasks.accent, badge: pendingTasks.length },
      { id: 'utenti', icon: Settings, label: 'Team', accent: theme.sections.utenti.accent }
    ];

    return (
      <div className="min-h-screen bg-[#09090B] flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#27272A] bg-[#0F0F11] p-4">
          <div className="mb-8">
            <img src="/logo.png" alt="KeyPrime" className="h-20" />
          </div>
          
          <nav className="space-y-1 flex-1">
            {tabs.map(t => (
              <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => { setActiveTab(t.id); setShowClienteDetail(null); }} accent={t.accent} badge={t.badge} />
            ))}
          </nav>
          
          <div className="border-t border-[#27272A] pt-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar nome={user?.nome} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
                <p className="text-xs text-zinc-500">Admin</p>
              </div>
              <button onClick={handleLogout} className="text-zinc-500 hover:text-white transition-colors"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A]">
            <div className="flex items-center justify-between px-4 py-4">
              <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-400"><Menu className="w-6 h-6" /></button>
              <img src="/logo.png" alt="KeyPrime" className="h-16" />
              <button onClick={() => setShowNotifications(true)} className="relative text-zinc-400">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notificationCount}</span>}
              </button>
            </div>
            {/* Mobile Tabs */}
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setShowClienteDetail(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'text-white' : 'text-zinc-500 hover:text-white'}`} style={activeTab === t.id ? { background: `${t.accent}20`, color: t.accent } : {}}>
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {t.badge > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{t.badge}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 max-w-7xl mx-auto">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-white capitalize">{activeTab}</h1>
                <p className="text-zinc-500 text-sm mt-1">
                  {activeTab === 'dashboard' && 'Panoramica generale'}
                  {activeTab === 'vendite' && `${sales.length} transazioni totali`}
                  {activeTab === 'pipeline' && 'Gestisci il flusso di vendita'}
                  {activeTab === 'crm' && `${clienti.length} clienti in database`}
                  {activeTab === 'offplan' && `Progetti Off-Plan • ${savedListings.length} salvati`}
                  {activeTab === 'tasks' && `${pendingTasks.length} task da completare`}
                  {activeTab === 'utenti' && `${users.length} membri del team`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowGlobalSearch(true)} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 text-sm transition-colors">
                  <Search className="w-4 h-4" />
                  <span>Cerca...</span>
                  <kbd className="ml-2 px-1.5 py-0.5 bg-zinc-700 rounded text-xs">⌘K</kbd>
                </button>
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <Button variant="secondary" icon={RefreshCw} onClick={() => { loadSales(); loadClienti(); loadTasks(); loadUsers(); }}>Aggiorna</Button>
              </div>
            </div>

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Period Filter + Export */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'Tutto' },
                      { id: '30', label: '30 giorni' },
                      { id: '60', label: '60 giorni' },
                      { id: '90', label: '90 giorni' }
                    ].map(p => (
                      <button key={p.id} onClick={() => setPeriodFilter(p.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${periodFilter === p.id ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="secondary" icon={Printer} onClick={() => generateDashboardPDF(totals, periodSales, vendite, byAgente, byZona)}>
                    Esporta Report
                  </Button>
                </div>
                
                {/* Alerts */}
                {(todayTasks.length > 0 || overdueTasks.length > 0) && (
                  <Card hover onClick={() => setActiveTab('tasks')} className="border-pink-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Task in scadenza</p>
                        <p className="text-zinc-500 text-sm">
                          {overdueTasks.length > 0 && <span className="text-red-400">{overdueTasks.length} scaduti</span>}
                          {overdueTasks.length > 0 && todayTasks.length > 0 && ' • '}
                          {todayTasks.length > 0 && <span>{todayTasks.length} oggi</span>}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </div>
                  </Card>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard label="Volume Totale" value={totals.valore} subValue="AED" icon={DollarSign} color="#A78BFA" onClick={() => setActiveTab('vendite')} />
                  <MetricCard label="Lead Totali" value={sales.length} icon={Target} color="#60A5FA" onClick={() => setActiveTab('pipeline')} />
                  <MetricCard label="Vendite Chiuse" value={vendite.length} icon={TrendingUp} color="#34D399" onClick={() => setActiveTab('vendite')} />
                  <MetricCard label="Netto KeyPrime" value={totals.netto} subValue="AED" icon={Sparkles} color="#FBBF24" />
                </div>

                {/* Commission Split */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card><p className="text-zinc-500 text-sm">Commissioni Tot</p><p className="text-xl font-semibold text-emerald-400 mt-1">{fmt(totals.comm)}</p></Card>
                  <Card><p className="text-zinc-500 text-sm">Agenti 70%</p><p className="text-xl font-semibold text-blue-400 mt-1">{fmt(totals.ag)}</p></Card>
                  <Card className="border-green-500/20"><p className="text-zinc-500 text-sm">Pellegrino</p><p className="text-xl font-semibold text-green-400 mt-1">{fmt(totals.pell)}</p></Card>
                  <Card className="border-orange-500/20"><p className="text-zinc-500 text-sm">Giovanni</p><p className="text-xl font-semibold text-orange-400 mt-1">{fmt(totals.giov)}</p></Card>
                </div>

                {/* Pipeline Overview */}
                <Card hover onClick={() => setActiveTab('pipeline')}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Pipeline</h3>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(byStato).map(([st, items]) => (
                      <div key={st} className="text-center p-3 rounded-xl" style={{ background: theme.status[st]?.bg }}>
                        <div className="text-xl font-semibold text-white">{items.length}</div>
                        <div className="text-xs capitalize" style={{ color: theme.status[st]?.color }}>{st}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top Performers */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Top Agenti - Clickable */}
                  <Card>
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" />Top Agenti</h3>
                    <div className="space-y-3">
                      {Object.entries(byAgente).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], i) => (
                        <div key={name} onClick={() => setShowAgentDetail({ name, type: 'agente' })} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{i + 1}</div>
                          <Avatar nome={name} size="sm" />
                          <div className="flex-1">
                            <p className="text-white text-sm">{name}</p>
                            <ProgressBar value={value} max={Object.values(byAgente).sort((a,b) => b-a)[0] || 1} color={i === 0 ? '#FBBF24' : '#52525B'} height="h-1" />
                          </div>
                          <span className="text-zinc-400 text-sm">{fmt(value)}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-600" />
                        </div>
                      ))}
                      {Object.keys(byAgente).length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Nessun dato</p>}
                    </div>
                  </Card>
                  
                  {/* Top Zone */}
                  <Card>
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" />Top Zone</h3>
                    <div className="space-y-3">
                      {Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([zona, value], i) => (
                        <div key={zona} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{i + 1}</div>
                          <div className="flex-1">
                            <p className="text-white text-sm">{zona}</p>
                            <ProgressBar value={value} max={Object.values(byZona).sort((a,b) => b-a)[0] || 1} color={i === 0 ? '#34D399' : '#52525B'} height="h-1" />
                          </div>
                          <span className="text-zinc-400 text-sm">{fmt(value)}</span>
                        </div>
                      ))}
                      {Object.keys(byZona).length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Nessun dato</p>}
                    </div>
                  </Card>
                  
                  {/* Trend Mensile */}
                  <Card>
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-violet-400" />Trend Mensile</h3>
                    <div className="space-y-3">
                      {Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-5).map(([month, value]) => (
                        <div key={month} className="flex items-center gap-3">
                          <span className="text-zinc-500 text-sm w-16">{month}</span>
                          <div className="flex-1"><ProgressBar value={value} max={Math.max(...Object.values(byMonth)) || 1} color="#A78BFA" /></div>
                          <span className="text-white text-sm w-20 text-right">{fmt(value)}</span>
                        </div>
                      ))}
                      {Object.keys(byMonth).length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Nessun dato</p>}
                    </div>
                  </Card>
                </div>
              </div>
            )}
            
            {/* AGENT DETAIL VIEW */}
            {activeTab === 'dashboard' && showAgentDetail && (
              <AgentDetailView 
                agent={showAgentDetail} 
                sales={periodSales} 
                onBack={() => setShowAgentDetail(null)} 
              />
            )}

            {/* VENDITE */}
            {activeTab === 'vendite' && <VenditeTab sales={filteredSales} filters={filters} setFilters={setFilters} updateSale={updateSale} deleteSale={deleteSale} loading={loading} />}

            {/* PIPELINE */}
            {activeTab === 'pipeline' && <PipelineTab byStato={byStato} onSelectLead={setShowLeadDetail} onUpdateSaleStatus={(id, stato) => updateSale(id, { stato })} />}

            {/* CRM */}
            {activeTab === 'crm' && (showClienteDetail ? <ClienteDetailView cliente={showClienteDetail} sales={sales.filter(s => s.cliente_id === showClienteDetail.id)} tasks={tasks.filter(t => t.cliente_id === showClienteDetail.id)} onBack={() => setShowClienteDetail(null)} onEdit={() => setShowClienteModal(showClienteDetail)} onDelete={() => deleteCliente(showClienteDetail.id)} updateCliente={updateCliente} onAddTask={() => setShowTaskModal({ cliente_id: showClienteDetail.id })} onCompleteTask={completeTask} onDeleteTask={deleteTask} onExportPDF={() => generateClientePDF(showClienteDetail, sales.filter(s => s.cliente_id === showClienteDetail.id), tasks.filter(t => t.cliente_id === showClienteDetail.id))} /> : <CRMTab clienti={filteredClienti} filters={clienteFilters} setFilters={setClienteFilters} sales={sales} onSelect={setShowClienteDetail} onCreate={() => setShowClienteModal({})} />)}

            {/* OFF-PLAN */}
            {activeTab === 'offplan' && <OffPlanTab clienti={clienti} onCreateLead={createLeadFromListing} savedListings={savedListings} onSaveListing={saveListing} onRemoveListing={removeListing} user={user} />}

            {/* TASKS */}
            {activeTab === 'tasks' && <AdminTasksTab tasks={tasks} clienti={clienti} users={users} onComplete={completeTask} onDelete={deleteTask} onEdit={setShowTaskModal} onCreate={() => setShowTaskModal({})} />}

            {/* TEAM */}
            {activeTab === 'utenti' && <TeamTab users={users} onCreate={() => setShowUserModal({})} onEdit={setShowUserModal} onDelete={deleteUser} />}
          </div>
        </main>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0F0F11] p-4 animate-slideRight">
              <div className="flex items-center justify-between mb-8">
                <img src="/logo.png" alt="KeyPrime" className="h-16" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-1">
                {tabs.map(t => (
                  <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); setShowClienteDetail(null); }} accent={t.accent} badge={t.badge} />
                ))}
              </nav>
              <div className="absolute bottom-4 left-4 right-4">
                <Button variant="danger" icon={LogOut} onClick={handleLogout} className="w-full">Esci</Button>
              </div>
            </aside>
          </div>
        )}

        {/* Modals */}
        {showLeadDetail && <LeadDetailSheet sale={showLeadDetail} cliente={clienti.find(c => c.id === showLeadDetail?.cliente_id)} rate={0.7} onClose={() => setShowLeadDetail(null)} onUpdateSale={updateSale} onConvert={() => setConvertingSale(showLeadDetail)} isAdmin />}
        {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
        {showClienteModal && <ClienteModal cliente={showClienteModal.id ? showClienteModal : null} onSave={showClienteModal.id ? (d) => updateCliente(showClienteModal.id, d) : createCliente} onClose={() => setShowClienteModal(null)} />}
        {showTaskModal && <TaskModal task={showTaskModal.id ? showTaskModal : null} clienti={clienti} users={users} onSave={showTaskModal.id ? (d) => updateTask(showTaskModal.id, d) : createTask} onClose={() => setShowTaskModal(null)} />}
        {showUserModal && <UserModal user={showUserModal.id ? showUserModal : null} onSave={showUserModal.id ? (d) => updateUser(showUserModal.id, d) : createUser} onClose={() => setShowUserModal(null)} />}
        {showNotifications && <NotificationsPanel tasks={notificationTasks} unreadIds={unreadNotificationIds} recentSales={recentSalesNotifications} onClose={() => { setShowNotifications(false); markNotificationsAsRead(); }} onGoToTask={() => { setShowNotifications(false); setActiveTab('tasks'); }} />}
        {showGlobalSearch && <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} sales={sales} clienti={clienti} tasks={tasks} onSelectSale={setShowLeadDetail} onSelectCliente={setShowClienteDetail} onSelectTask={() => setActiveTab('tasks')} setActiveTab={setActiveTab} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return null;
}

// ==================== TAB COMPONENTS ====================

// Vendite Tab
function VenditeTab({ sales, filters, setFilters, updateSale, deleteSale, loading }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Cerca progetto, cliente, agente..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50">
          <option value="">Tutti gli stati</option>
          {pipelineStati.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Data</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Progetto</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Agente</th>
                <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Valore</th>
                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">%</th>
                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Stato</th>
                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Ref</th>
                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Pag</th>
                <th className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-400">{fmtShort(s.data)}</td>
                  <td className="px-4 py-3"><span className="text-white text-sm font-medium">{s.progetto}</span><br /><span className="text-xs text-zinc-500">{s.developer}</span></td>
                  <td className="px-4 py-3 text-sm text-blue-400">{s.cliente_nome || '-'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.agente || s.segnalatore || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-white">{s.valore > 0 ? fmt(s.valore) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-zinc-800 rounded px-2 py-1 text-xs text-white w-14 focus:outline-none">
                      {commissions.map(c => <option key={c} value={c}>{c}%</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.stato || 'lead'} onChange={(e) => updateSale(s.id, { stato: e.target.value })} className="rounded px-2 py-1 text-xs text-white w-20 focus:outline-none" style={{ background: theme.status[s.stato || 'lead']?.bg, color: theme.status[s.stato || 'lead']?.color }}>
                      {pipelineStati.map(st => <option key={st} value={st} className="bg-zinc-900">{st}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className="bg-zinc-800 rounded px-2 py-1 text-xs text-white w-12 focus:outline-none">
                      <option value="">-</option>
                      <option value="Pellegrino">P</option>
                      <option value="Giovanni">G</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                      {s.pagato ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteSale(s.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length === 0 && <div className="text-center py-12 text-zinc-500">Nessuna vendita trovata</div>}
      </Card>
    </div>
  );
}

// Pipeline Tab
function PipelineTab({ byStato, onSelectLead, onUpdateSaleStatus }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  const handleDragStart = (e, sale) => {
    setDraggedItem(sale);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverColumn(null);
  };
  
  const handleDragOver = (e, stato) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(stato);
  };
  
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (e, newStato) => {
    e.preventDefault();
    if (draggedItem && draggedItem.stato !== newStato) {
      onUpdateSaleStatus(draggedItem.id, newStato);
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-sm">Trascina le card per cambiare stato</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {pipelineStati.map(st => (
          <div key={st} className="space-y-3" onDragOver={(e) => handleDragOver(e, st)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, st)}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: theme.status[st]?.color }} />
                <span className="text-sm font-medium text-white capitalize">{st}</span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{byStato[st]?.length || 0}</span>
            </div>
            <div className={`space-y-2 min-h-[200px] rounded-xl p-2 transition-all ${dragOverColumn === st ? 'bg-white/5 ring-2 ring-violet-500/50' : ''}`}>
              {byStato[st]?.map(s => (
                <div key={s.id} draggable onDragStart={(e) => handleDragStart(e, s)} onDragEnd={handleDragEnd} className={`cursor-grab active:cursor-grabbing ${draggedItem?.id === s.id ? 'opacity-50' : ''}`}>
                  <Card hover onClick={() => onSelectLead(s)} padding="p-3" className="border-l-2" style={{ borderLeftColor: theme.status[st]?.color }}>
                    <p className="text-white text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
                    <p className="text-zinc-500 text-xs truncate">{s.developer}</p>
                    {s.cliente_nome && <p className="text-blue-400 text-xs mt-1">{s.cliente_nome}</p>}
                    {s.valore > 0 && <p className="text-emerald-400 text-sm font-medium mt-2">{fmt(s.valore)} AED</p>}
                  </Card>
                </div>
              ))}
              {!byStato[st]?.length && <div className="text-center py-8 text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-xl">Trascina qui</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CRM Tab
function CRMTab({ clienti, filters, setFilters, sales, onSelect, onCreate }) {
  const getClientStats = (id) => {
    const cs = sales.filter(s => s.cliente_id === id);
    const vendite = cs.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    return { leads: cs.length, value: vendite.reduce((sum, s) => sum + Number(s.valore || 0), 0) };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Cerca cliente..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
          <option value="">Tutti gli stati</option>
          {clienteStati.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button icon={UserPlus} onClick={onCreate}>Nuovo Cliente</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clienti.map(c => {
          const stats = getClientStats(c.id);
          return (
            <Card key={c.id} hover onClick={() => onSelect(c)} padding="p-4">
              <div className="flex items-start gap-3">
                <Avatar nome={c.nome} cognome={c.cognome} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-medium truncate">{c.nome} {c.cognome}</p>
                    <StatusBadge status={c.stato} type="cliente" />
                  </div>
                  {c.telefono && <p className="text-zinc-500 text-sm">{c.telefono}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {stats.leads > 0 && <span className="text-blue-400">{stats.leads} lead</span>}
                    {stats.value > 0 && <span className="text-emerald-400">{fmt(stats.value)} AED</span>}
                    {c.budget_max && <span className="text-amber-400">Budget: {fmt(c.budget_max)}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
            </Card>
          );
        })}
      </div>
      {clienti.length === 0 && <EmptyState icon={Users} title="Nessun cliente" description="Aggiungi il tuo primo cliente" action="Nuovo Cliente" onAction={onCreate} />}
    </div>
  );
}

// Cliente Detail View
function ClienteDetailView({ cliente, sales, tasks, onBack, onEdit, onDelete, updateCliente, onAddTask, onCompleteTask, onDeleteTask, onExportPDF }) {
  const [tab, setTab] = useState('info');
  const totalValue = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((sum, s) => sum + Number(s.valore || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Indietro</Button>
        <div className="flex-1" />
        <Button variant="ghost" icon={FileText} onClick={onExportPDF}>PDF</Button>
        <Button variant="ghost" icon={Edit2} onClick={onEdit}>Modifica</Button>
        <Button variant="danger" icon={Trash2} onClick={onDelete} />
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Avatar nome={cliente.nome} cognome={cliente.cognome} size="xl" />
          <div>
            <h1 className="text-2xl font-semibold text-white">{cliente.nome} {cliente.cognome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={cliente.stato} type="cliente" />
              {cliente.nazionalita && <span className="text-zinc-500 text-sm">{cliente.nazionalita}</span>}
            </div>
          </div>
        </div>
        <QuickActions phone={cliente.telefono} whatsapp={cliente.whatsapp || cliente.telefono} email={cliente.email} clienteName={cliente.nome} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-4" className="text-center border-amber-500/20">
          <p className="text-2xl font-semibold text-amber-400">{sales.length}</p>
          <p className="text-zinc-500 text-sm">Lead</p>
        </Card>
        <Card padding="p-4" className="text-center border-emerald-500/20">
          <p className="text-2xl font-semibold text-emerald-400">{fmt(totalValue)}</p>
          <p className="text-zinc-500 text-sm">Valore</p>
        </Card>
        <Card padding="p-4" className="text-center border-pink-500/20">
          <p className="text-2xl font-semibold text-pink-400">{tasks.filter(t => t.stato === 'pending').length}</p>
          <p className="text-zinc-500 text-sm">Task</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#27272A]">
        {['info', 'lead', 'task'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-white border-amber-500' : 'text-zinc-500 border-transparent hover:text-white'}`}>
            {t === 'info' ? 'Informazioni' : t === 'lead' ? `Lead (${sales.length})` : `Task (${tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-zinc-500 text-xs mb-1">Telefono</p><p className="text-white">{cliente.telefono || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Email</p><p className="text-white truncate">{cliente.email || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Budget Min</p><p className="text-amber-400">{cliente.budget_min ? fmt(cliente.budget_min) : '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Budget Max</p><p className="text-amber-400">{cliente.budget_max ? fmt(cliente.budget_max) : '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Agente</p><p className="text-white">{cliente.agente_riferimento || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Fonte</p><p className="text-white">{cliente.fonte || '-'}</p></div>
          </div>
          {cliente.note && <div className="mt-4 pt-4 border-t border-[#27272A]"><p className="text-zinc-500 text-xs mb-1">Note</p><p className="text-white text-sm">{cliente.note}</p></div>}
          <div className="mt-4 pt-4 border-t border-[#27272A]">
            <p className="text-zinc-500 text-xs mb-2">Stato</p>
            <div className="flex flex-wrap gap-2">
              {clienteStati.map(s => (
                <button key={s} onClick={() => updateCliente(cliente.id, { stato: s })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cliente.stato === s ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>{s}</button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {tab === 'lead' && (
        <div className="space-y-2">
          {sales.length === 0 ? <EmptyState icon={Target} title="Nessun lead" description="Non ci sono lead per questo cliente" /> : sales.map(s => (
            <Card key={s.id} padding="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2"><p className="text-white font-medium">{s.progetto}</p><StatusBadge status={s.stato || 'lead'} /></div>
                  <p className="text-zinc-500 text-sm">{s.developer} • {s.zona}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
                  <p className="text-zinc-500 text-xs">{fmtShort(s.data)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'task' && (
        <div className="space-y-3">
          <Button icon={Plus} onClick={onAddTask} className="w-full" variant="secondary">Nuovo Task</Button>
          {tasks.length === 0 ? <EmptyState icon={ListTodo} title="Nessun task" description="Non ci sono task per questo cliente" /> : tasks.map(t => (
            <Card key={t.id} padding="p-4" className={t.stato === 'completato' ? 'opacity-50' : isOverdue(t.scadenza) ? 'border-red-500/30' : ''}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
                    <StatusBadge status={t.priorita} type="priority" />
                  </div>
                  {t.scadenza && <p className={`text-sm mt-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-zinc-500'}`}>{fmtDateTime(t.scadenza)}</p>}
                </div>
                <div className="flex gap-1">
                  {t.stato !== 'completato' && <Button variant="ghost" size="sm" icon={Check} onClick={() => onCompleteTask(t.id)} />}
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onDeleteTask(t.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin Tasks Tab
function AdminTasksTab({ tasks, clienti, users, onComplete, onDelete, onEdit, onCreate }) {
  const [filter, setFilter] = useState('pending');
  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.stato === 'pending';
    if (filter === 'overdue') return t.stato === 'pending' && isOverdue(t.scadenza);
    if (filter === 'today') return t.stato === 'pending' && isToday(t.scadenza);
    if (filter === 'completed') return t.stato === 'completato';
    return true;
  });
  const getCliente = (id) => clienti.find(c => c.id === id);
  const counts = {
    pending: tasks.filter(t => t.stato === 'pending').length,
    overdue: tasks.filter(t => t.stato === 'pending' && isOverdue(t.scadenza)).length,
    today: tasks.filter(t => t.stato === 'pending' && isToday(t.scadenza)).length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Button icon={Plus} onClick={onCreate}>Nuovo Task</Button>
        <div className="flex-1" />
        <div className="flex gap-2">
          {[
            { id: 'pending', label: 'Pending', count: counts.pending, color: '#60A5FA' },
            { id: 'overdue', label: 'Scaduti', count: counts.overdue, color: '#EF4444' },
            { id: 'today', label: 'Oggi', count: counts.today, color: '#FBBF24' },
            { id: 'completed', label: 'Fatto', color: '#34D399' }
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'text-white' : 'text-zinc-500 hover:text-white'}`} style={filter === f.id ? { background: `${f.color}20`, color: f.color } : {}}>
              {f.label} {f.count !== undefined && `(${f.count})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon={ListTodo} title="Nessun task" description={filter === 'pending' ? 'Tutti i task sono completati!' : 'Nessun task in questa categoria'} />
        ) : filtered.map(t => {
          const cliente = getCliente(t.cliente_id);
          return (
            <Card key={t.id} padding="p-4" className={`${t.stato === 'completato' ? 'opacity-50' : ''} ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'border-red-500/30 bg-red-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
                    <StatusBadge status={t.priorita} type="priority" />
                    {isOverdue(t.scadenza) && t.stato !== 'completato' && <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 animate-pulse">Scaduto</span>}
                  </div>
                  {t.descrizione && <p className="text-zinc-500 text-sm">{t.descrizione}</p>}
                  {t.note && <p className="text-blue-400 text-sm mt-1 bg-blue-500/10 px-2 py-1 rounded">📝 {t.note}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {t.scadenza && <span className={`flex items-center gap-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-zinc-500'}`}><Clock className="w-3 h-3" />{fmtDateTime(t.scadenza)}</span>}
                    {t.assegnato_a && <span className="text-blue-400 flex items-center gap-1"><User className="w-3 h-3" />{t.assegnato_a}</span>}
                    {cliente && <span className="text-amber-400">{cliente.nome}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {t.stato !== 'completato' && (
                    <>
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEdit(t)} />
                      <Button variant="ghost" size="sm" icon={Check} onClick={() => onComplete(t.id)} />
                    </>
                  )}
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onDelete(t.id)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Agent Tasks Tab
function AgentTasksTab({ tasks, allTasks, clienti, onComplete, onAddNote }) {
  const [filter, setFilter] = useState('pending');
  const completedTasks = allTasks.filter(t => t.stato === 'completato');
  const displayTasks = filter === 'completed' ? completedTasks : tasks.filter(t => filter === 'overdue' ? isOverdue(t.scadenza) : true);
  const getCliente = (id) => clienti.find(c => c.id === id);

  return (
    <>
      <SectionHeader icon={ListTodo} title="I tuoi Task" accent="244,114,182" />
      
      <div className="flex gap-2 mb-4">
        {[
          { id: 'pending', label: 'Da fare', count: tasks.length },
          { id: 'overdue', label: 'Scaduti', count: tasks.filter(t => isOverdue(t.scadenza)).length },
          { id: 'completed', label: 'Completati', count: completedTasks.length }
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500 hover:text-white'}`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayTasks.length === 0 ? (
          <EmptyState icon={Check} title={filter === 'pending' ? 'Tutto fatto!' : 'Nessun task'} description="Non ci sono task in questa categoria" />
        ) : displayTasks.map(t => {
          const cliente = getCliente(t.cliente_id);
          return (
            <Card key={t.id} padding="p-4" className={t.stato === 'completato' ? 'opacity-50' : isOverdue(t.scadenza) ? 'border-red-500/30' : ''}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
                    <StatusBadge status={t.priorita} type="priority" />
                    {isOverdue(t.scadenza) && t.stato !== 'completato' && <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Scaduto</span>}
                  </div>
                  {t.descrizione && <p className="text-zinc-500 text-sm">{t.descrizione}</p>}
                  {t.note && <p className="text-blue-400 text-sm mt-2 bg-blue-500/10 px-3 py-2 rounded-lg">📝 {t.note}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {t.scadenza && <span className={`flex items-center gap-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-zinc-500'}`}><Clock className="w-3 h-3" />{fmtDateTime(t.scadenza)}</span>}
                    {cliente && <span className="text-amber-400">{cliente.nome}</span>}
                  </div>
                </div>
                {t.stato !== 'completato' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onAddNote(t)} className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors"><MessageCircle className="w-5 h-5" /></button>
                    <button onClick={() => onComplete(t.id)} className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"><Check className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// Team Tab
function TeamTab({ users, onCreate, onEdit, onDelete }) {
  const [copiedId, setCopiedId] = useState(null);
  const copy = (u) => {
    navigator.clipboard.writeText(`KeyPrime\n${getBaseUrl()}\n${u.username} / ${u.password}`);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-zinc-500">{users.length} membri</p>
        <Button icon={UserPlus} onClick={onCreate}>Nuovo Utente</Button>
      </div>

      <div className="space-y-2">
        {users.map(u => (
          <Card key={u.id} padding="p-4">
            <div className="flex items-center gap-4">
              <Avatar nome={u.nome} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{u.nome}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.ruolo === 'admin' ? 'bg-violet-500/20 text-violet-400' : u.ruolo === 'agente' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.ruolo}</span>
                  {!u.attivo && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Disattivo</span>}
                </div>
                <p className="text-zinc-500 text-sm mt-1">{u.username} / {u.password}{u.email && ` • ${u.email}`}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={copiedId === u.id ? Check : Copy} onClick={() => copy(u)} />
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEdit(u)} />
                {u.ruolo !== 'admin' && <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onDelete(u.id)} />}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Agent Detail View
function AgentDetailView({ agent, sales, onBack }) {
  const agentSales = sales.filter(s => 
    agent.type === 'agente' ? s.agente === agent.name : s.segnalatore === agent.name
  );
  const vendite = agentSales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
  const totalVolume = agentSales.reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const totalVendite = vendite.reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const rate = agent.type === 'agente' ? 0.7 : 0.3;
  const totalComm = vendite.reduce((sum, s) => sum + (Number(s.valore || 0) * (s.commission_pct || 5) / 100 * rate), 0);
  const commPagate = vendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore || 0) * (s.commission_pct || 5) / 100 * rate), 0);
  
  const byStato = pipelineStati.reduce((a, st) => { 
    a[st] = agentSales.filter(s => (s.stato || 'lead') === st).length; 
    return a; 
  }, {});
  
  const byZona = agentSales.reduce((a, s) => { 
    if (s.zona) a[s.zona] = (a[s.zona] || 0) + Number(s.valore || 0); 
    return a; 
  }, {});
  
  const byMonth = agentSales.reduce((a, s) => { 
    const m = s.data?.substring(0, 7) || 'N/A'; 
    a[m] = (a[m] || 0) + Number(s.valore || 0); 
    return a; 
  }, {});

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B] overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Indietro</Button>
          <div className="flex-1" />
        </div>
        
        {/* Profile */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar nome={agent.name} size="xl" />
          <div>
            <h1 className="text-2xl font-semibold text-white">{agent.name}</h1>
            <p className="text-zinc-500 capitalize">{agent.type}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <p className="text-zinc-500 text-sm">Volume Totale</p>
            <p className="text-2xl font-semibold text-white mt-1">{fmt(totalVolume)}</p>
            <p className="text-zinc-600 text-xs">AED</p>
          </Card>
          <Card>
            <p className="text-zinc-500 text-sm">Lead</p>
            <p className="text-2xl font-semibold text-blue-400 mt-1">{agentSales.length}</p>
          </Card>
          <Card>
            <p className="text-zinc-500 text-sm">Vendite Chiuse</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{vendite.length}</p>
            <p className="text-zinc-600 text-xs">{fmt(totalVendite)} AED</p>
          </Card>
          <Card>
            <p className="text-zinc-500 text-sm">Commissioni</p>
            <p className="text-2xl font-semibold text-amber-400 mt-1">{fmt(totalComm)}</p>
            <p className="text-emerald-400 text-xs">Pagate: {fmt(commPagate)}</p>
          </Card>
        </div>
        
        {/* Pipeline */}
        <Card className="mb-6">
          <h3 className="text-white font-semibold mb-4">Pipeline</h3>
          <div className="grid grid-cols-5 gap-2">
            {pipelineStati.map(st => (
              <div key={st} className="text-center p-3 rounded-xl" style={{ background: theme.status[st]?.bg }}>
                <div className="text-xl font-semibold text-white">{byStato[st] || 0}</div>
                <div className="text-xs capitalize" style={{ color: theme.status[st]?.color }}>{st}</div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />Zone
            </h3>
            <div className="space-y-2">
              {Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([zona, value]) => (
                <div key={zona} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm w-24 truncate">{zona}</span>
                  <div className="flex-1"><ProgressBar value={value} max={Object.values(byZona).sort((a,b)=>b-a)[0] || 1} color="#34D399" /></div>
                  <span className="text-white text-sm w-20 text-right">{fmt(value)}</span>
                </div>
              ))}
              {Object.keys(byZona).length === 0 && <p className="text-zinc-500 text-sm">Nessun dato</p>}
            </div>
          </Card>
          
          <Card>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />Trend
            </h3>
            <div className="space-y-2">
              {Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-5).map(([month, value]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm w-16">{month}</span>
                  <div className="flex-1"><ProgressBar value={value} max={Math.max(...Object.values(byMonth)) || 1} color="#A78BFA" /></div>
                  <span className="text-white text-sm w-20 text-right">{fmt(value)}</span>
                </div>
              ))}
              {Object.keys(byMonth).length === 0 && <p className="text-zinc-500 text-sm">Nessun dato</p>}
            </div>
          </Card>
        </div>
        
        {/* Recent Sales */}
        <Card>
          <h3 className="text-white font-semibold mb-4">Ultimi Lead</h3>
          <div className="space-y-2">
            {agentSales.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                <div className="w-1 h-10 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
                  <p className="text-zinc-500 text-xs">{s.developer} • {s.zona}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
                  <p className="text-xs" style={{ color: theme.status[s.stato || 'lead']?.color }}>{s.stato || 'lead'}</p>
                </div>
              </div>
            ))}
            {agentSales.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Nessun lead</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================== MODALS & FORMS ====================


// Leaflet Map Component - Airbnb Style
function MapboxMap({ projects, onSelectProject, selectedProject, onAreaClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersLayer = useRef(null);
  const markersMap = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [popupProject, setPopupProject] = useState(null);

  const projectsByLocation = React.useMemo(() => {
    const grouped = {};
    projects.forEach(p => {
      const locName = p.location?.full_name || p.location?.name || 'Unknown';
      const coords = getLocationCoords(locName);
      if (coords) {
        // Add small random offset to prevent overlap
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        grouped[p.project_id] = { 
          ...p, 
          coords: { 
            lat: coords.lat + offsetLat, 
            lng: coords.lng + offsetLng,
            zoom: coords.zoom 
          } 
        };
      }
    });
    return grouped;
  }, [projects]);

  // Load Leaflet
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setTimeout(initMap, 100);
      script.onerror = () => setMapError('Errore caricamento Leaflet');
      document.head.appendChild(script);
    } else {
      setTimeout(initMap, 100);
    }

    function initMap() {
      if (!mapContainer.current || map.current) return;
      try {
        map.current = window.L.map(mapContainer.current, {
          center: [DUBAI_CENTER.lat, DUBAI_CENTER.lng],
          zoom: DEFAULT_ZOOM,
          zoomControl: false
        });

        window.L.control.zoom({ position: 'bottomright' }).addTo(map.current);

        window.L.tileLayer(LEAFLET_TILE_URL, {
          attribution: LEAFLET_ATTRIBUTION,
          maxZoom: 19
        }).addTo(map.current);

        markersLayer.current = window.L.layerGroup().addTo(map.current);
        setMapLoaded(true);
      } catch (err) {
        console.error('Map init error:', err);
        setMapError('Errore inizializzazione mappa');
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers - PropertyFinder style red price pills
  useEffect(() => {
    if (!map.current || !mapLoaded || !window.L || !markersLayer.current) return;

    markersLayer.current.clearLayers();
    markersMap.current = {};

    Object.values(projectsByLocation).forEach(project => {
      const { coords } = project;
      const price = project.price_from;
      const priceText = price > 0 ? 'From ' + (price >= 1000000 ? (price/1000000).toFixed(1) + 'M' : Math.round(price/1000) + 'K') : 'Price TBD';
      const isSelected = selectedProject?.project_id === project.project_id;
      
      const iconHtml = `
        <div class="pf-marker ${isSelected ? 'selected' : ''}">
          <span>${priceText}</span>
        </div>
      `;

      const customIcon = window.L.divIcon({
        html: iconHtml,
        className: 'pf-marker-container',
        iconSize: [90, 28],
        iconAnchor: [45, 28]
      });

      const marker = window.L.marker([coords.lat, coords.lng], { icon: customIcon })
        .addTo(markersLayer.current);

      marker.on('click', () => {
        setPopupProject(project);
        if (onSelectProject) onSelectProject(project);
      });

      markersMap.current[project.project_id] = marker;
    });
  }, [mapLoaded, projectsByLocation, selectedProject, onSelectProject]);

  // Fly to selected project
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedProject) return;
    const project = projectsByLocation[selectedProject.project_id];
    if (project?.coords) {
      map.current.flyTo([project.coords.lat, project.coords.lng], 14, { duration: 0.5 });
    }
  }, [selectedProject, mapLoaded, projectsByLocation]);

  // Close popup when clicking elsewhere
  const handleMapClick = () => setPopupProject(null);

  const formatPrice = (price) => {
    if (!price || price === 0) return 'TBD';
    return parseFloat(price).toLocaleString();
  };

  if (mapError) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" onClick={handleMapClick}>
      <div ref={mapContainer} className="absolute inset-0" style={{ background: '#1a1a1a' }} />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-[1000]">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      )}

      {/* Project Popup Card - Airbnb style */}
      {popupProject && (
        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-40">
              {popupProject.images?.[0]?.medium_image_url ? (
                <img src={popupProject.images[0].medium_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); setPopupProject(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-lg">
                {popupProject.construction_phase_key === 'completed' ? '✓ Completato' : popupProject.construction_phase_key === 'under_construction' ? '🏗️ In Costruzione' : '🚀 Lancio'}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold truncate">{popupProject.title}</h3>
              <p className="text-zinc-400 text-sm truncate">{popupProject.location?.full_name}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-orange-400 font-bold">AED {formatPrice(popupProject.price_from)}</p>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelectProject(popupProject); }}>
                  Dettagli
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl px-3 py-2">
          <p className="text-white text-sm font-medium">{Object.keys(projectsByLocation).length} progetti sulla mappa</p>
        </div>
      </div>

      <style>{`
        .pf-marker-container { background: transparent !important; border: none !important; }
        .pf-marker {
          background: #DC2626;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-align: center;
        }
        .pf-marker:hover {
          background: #B91C1C;
          transform: scale(1.05);
          z-index: 1000 !important;
        }
        .pf-marker.selected {
          background: #1D4ED8;
          transform: scale(1.1);
          z-index: 1001 !important;
        }
        .leaflet-control-zoom { border: none !important; border-radius: 8px !important; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .leaflet-control-zoom a { 
          background: white !important; 
          color: #333 !important; 
          border: none !important;
          border-bottom: 1px solid #eee !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }
        .leaflet-control-zoom a:hover { background: #f5f5f5 !important; }
        .leaflet-control-zoom-in { border-radius: 8px 8px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 8px 8px !important; border-bottom: none !important; }
      `}</style>
    </div>
  );
}

// Project Card Compact for Split View - with hover sync
function ProjectCardCompact({ project, isSelected, onClick, onHover }) {
  const formatPrice = (price) => { if (!price || price === 0) return 'TBD'; const num = parseFloat(price); if (num >= 1000000) return (num/1000000).toFixed(1) + 'M'; return num.toLocaleString(); };
  const formatBedrooms = (bedrooms) => { if (!bedrooms?.available?.length) return null; const beds = bedrooms.available; if (beds.length === 1) return beds[0] === 0 ? 'Studio' : beds[0] + 'BR'; const min = Math.min(...beds); const max = Math.max(...beds); return min === 0 ? 'Studio-' + max + 'BR' : min + '-' + max + 'BR'; };
  const formatDelivery = (d) => { if (!d) return null; const date = new Date(d); return 'Q' + Math.ceil((date.getMonth()+1)/3) + ' ' + date.getFullYear(); };
  return (
    <div 
      onClick={onClick} 
      onMouseEnter={() => onHover && onHover(project.project_id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={'p-3 rounded-xl cursor-pointer transition-all ' + (isSelected ? 'bg-orange-500/20 border-2 border-orange-500' : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800 hover:border-zinc-600')}
    >
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
          {project.images?.[0]?.medium_image_url ? (
            <img src={project.images[0].medium_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Building2 className="w-8 h-8 text-zinc-600" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{project.title}</p>
          <p className="text-zinc-500 text-xs truncate">{project.location?.full_name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-orange-400 font-bold text-sm">{project.price_from > 0 ? 'AED ' + formatPrice(project.price_from) : 'TBD'}</p>
            {formatBedrooms(project.bedrooms) && <span className="text-zinc-500 text-xs">• {formatBedrooms(project.bedrooms)}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {formatDelivery(project.delivery_date) && <span className="text-xs text-blue-400">📅 {formatDelivery(project.delivery_date)}</span>}
            {project.developer?.name && <span className="text-xs text-zinc-500 truncate">• {project.developer.name}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Off-Plan Tab with Map Integration - NOW USES SUPABASE
function OffPlanTab({ clienti, onCreateLead, savedListings, onSaveListing, onRemoveListing, user }) {
  const [viewMode, setViewMode] = useState('list');
  const [listings, setListings] = useState([]);
  const [allMapProjects, setAllMapProjects] = useState([]); // All projects for map
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    search: '', 
    location: '', 
    minPrice: '', 
    maxPrice: '', 
    bedrooms: '', 
    developer: '',
    status: '', // completed, under_construction, launch
    deliveryYear: '',
    sortBy: 'hotness' // hotness, price_asc, price_desc, delivery
  });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedAreaProjects, setSelectedAreaProjects] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState('');
  const [stats, setStats] = useState({ byZone: [], byDeveloper: [], avgPrice: 0 });
  const [showStats, setShowStats] = useState(false);
  
  const ITEMS_PER_PAGE = 24;

  const dubaiAreas = ['Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Palm Jumeirah', 'JBR', 'Dubai Hills Estate', 'Mohammed Bin Rashid City', 'Dubai Creek Harbour', 'Jumeirah Village Circle', 'Dubai South', 'DAMAC Hills', 'Arabian Ranches', 'Meydan', 'DIFC', 'Al Marjan Island', 'Dubai Islands', 'Expo City', 'Yas Island', 'Saadiyat Island'];
  const topDevelopers = ['Emaar Properties', 'Damac Properties', 'Sobha Realty', 'Nakheel', 'Meraas', 'Aldar Properties', 'Azizi Developments', 'Binghatti', 'Ellington', 'Omniyat Group'];
  const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+'];
  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    { value: 'completed', label: 'Completato' },
    { value: 'under_construction', label: 'In Costruzione' },
    { value: 'launch', label: 'Lancio' }
  ];
  const deliveryYears = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];
  const sortOptions = [
    { value: 'hotness', label: 'Più popolari' },
    { value: 'price_asc', label: 'Prezzo ↑' },
    { value: 'price_desc', label: 'Prezzo ↓' },
    { value: 'delivery', label: 'Consegna più vicina' }
  ];

  // Load stats on mount
  useEffect(() => {
    loadStats();
    loadAllMapProjects();
  }, []);

  const loadStats = async () => {
    try {
      // Get projects by zone
      const { data: zoneData } = await supabase
        .from('pf_projects')
        .select('location_name, price_from');
      
      if (zoneData) {
        // Group by zone
        const zoneMap = {};
        let totalPrice = 0;
        let priceCount = 0;
        
        zoneData.forEach(p => {
          const zone = p.location_name || 'Altro';
          if (!zoneMap[zone]) zoneMap[zone] = { count: 0, totalPrice: 0 };
          zoneMap[zone].count++;
          if (p.price_from > 0) {
            zoneMap[zone].totalPrice += p.price_from;
            totalPrice += p.price_from;
            priceCount++;
          }
        });
        
        const byZone = Object.entries(zoneMap)
          .map(([name, data]) => ({ name, count: data.count, avgPrice: data.totalPrice / data.count || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        setStats(s => ({ ...s, byZone, avgPrice: totalPrice / priceCount || 0 }));
      }
      
      // Get projects by developer
      const { data: devData } = await supabase
        .from('pf_projects')
        .select('developer_name')
        .not('developer_name', 'is', null);
      
      if (devData) {
        const devMap = {};
        devData.forEach(p => {
          const dev = p.developer_name;
          devMap[dev] = (devMap[dev] || 0) + 1;
        });
        
        const byDeveloper = Object.entries(devMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        setStats(s => ({ ...s, byDeveloper }));
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  // Load all projects with coordinates for map
  const loadAllMapProjects = async () => {
    try {
      const { data } = await supabase
        .from('pf_projects')
        .select('project_id, title, location_name, location_full, price_from, construction_phase, raw_data')
        .not('raw_data->location->coordinates', 'is', null)
        .limit(2000);
      
      if (data) {
        const mapProjects = data.map(p => ({
          project_id: p.project_id,
          title: p.title,
          location: { name: p.location_name, full_name: p.location_full },
          price_from: p.price_from,
          construction_phase_key: p.construction_phase,
          coordinates: p.raw_data?.location?.coordinates
        })).filter(p => p.coordinates?.lat && p.coordinates?.lon);
        
        setAllMapProjects(mapProjects);
      }
    } catch (err) {
      console.error('Map projects error:', err);
    }
  };

  // Search from Supabase with real SQL filters
  const searchListings = async (newPage = 1) => {
    setLoading(true); 
    setError(null);
    setPage(newPage);
    
    try {
      // Build query with filters
      let query = supabase
        .from('pf_projects')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,location_full.ilike.%${filters.search}%,developer_name.ilike.%${filters.search}%`);
      }
      if (filters.location) {
        query = query.or(`location_name.ilike.%${filters.location}%,location_full.ilike.%${filters.location}%`);
      }
      if (filters.developer) {
        query = query.ilike('developer_name', `%${filters.developer}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price_from', parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price_from', parseInt(filters.maxPrice));
      }
      if (filters.status) {
        query = query.eq('construction_phase', filters.status);
      }
      if (filters.deliveryYear) {
        const startDate = `${filters.deliveryYear}-01-01`;
        const endDate = `${filters.deliveryYear}-12-31`;
        query = query.gte('delivery_date', startDate).lte('delivery_date', endDate);
      }
      if (filters.bedrooms) {
        if (filters.bedrooms === 'Studio') {
          query = query.contains('bedrooms', { available: [0] });
        } else if (filters.bedrooms !== '5+') {
          query = query.contains('bedrooms', { available: [parseInt(filters.bedrooms)] });
        }
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_from', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          query = query.order('price_from', { ascending: false, nullsFirst: false });
          break;
        case 'delivery':
          query = query.order('delivery_date', { ascending: true, nullsFirst: false });
          break;
        default:
          query = query.order('hotness_level', { ascending: false, nullsFirst: false });
      }
      
      // Paginate
      query = query.range((newPage - 1) * ITEMS_PER_PAGE, newPage * ITEMS_PER_PAGE - 1);
        query = query.ilike('developer_name', `%${filters.developer}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price_from', parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price_from', parseInt(filters.maxPrice));
      }
      if (filters.bedrooms) {
        // Filter by bedrooms in JSONB
        if (filters.bedrooms === 'Studio') {
          query = query.contains('bedrooms', { available: [0] });
        } else if (filters.bedrooms === '5+') {
          // 5+ is harder with contains, we'll filter client-side for this
        } else {
          query = query.contains('bedrooms', { available: [parseInt(filters.bedrooms)] });
        }
      }
      
      // Order and paginate
      query = query
        .order('hotness_level', { ascending: false, nullsFirst: false })
        .range((newPage - 1) * ITEMS_PER_PAGE, newPage * ITEMS_PER_PAGE - 1);
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) throw queryError;
      
      // Transform data to match expected format
      const transformedData = (data || []).map(p => ({
        project_id: p.project_id,
        title: p.title,
        location: { 
          name: p.location_name, 
          full_name: p.location_full 
        },
        developer: { 
          name: p.developer_name 
        },
        price_from: p.price_from,
        bedrooms: p.bedrooms,
        delivery_date: p.delivery_date,
        construction_phase_key: p.construction_phase,
        hotness_level: p.hotness_level,
        images: p.images || [],
        payment_plans: p.payment_plans,
        url: p.url
      }));
      
      // Additional client-side filter for 5+ bedrooms
      let finalData = transformedData;
      if (filters.bedrooms === '5+') {
        finalData = transformedData.filter(p => 
          p.bedrooms?.available?.some(b => b >= 5)
        );
      }
      
      setListings(finalData);
      setTotalResults(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
    } catch (err) { 
      console.error('Supabase Error:', err); 
      setError('Errore nel caricamento progetti.'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      searchListings(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Export filtered projects to CSV
  const exportProjectsCSV = async () => {
    try {
      // Build same query as search but get all results
      let query = supabase
        .from('pf_projects')
        .select('title, location_full, developer_name, price_from, construction_phase, delivery_date, url');
      
      if (filters.search) query = query.or(`title.ilike.%${filters.search}%,location_full.ilike.%${filters.search}%,developer_name.ilike.%${filters.search}%`);
      if (filters.location) query = query.or(`location_name.ilike.%${filters.location}%,location_full.ilike.%${filters.location}%`);
      if (filters.developer) query = query.ilike('developer_name', `%${filters.developer}%`);
      if (filters.minPrice) query = query.gte('price_from', parseInt(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price_from', parseInt(filters.maxPrice));
      if (filters.status) query = query.eq('construction_phase', filters.status);
      if (filters.deliveryYear) {
        query = query.gte('delivery_date', `${filters.deliveryYear}-01-01`).lte('delivery_date', `${filters.deliveryYear}-12-31`);
      }
      
      query = query.order('hotness_level', { ascending: false }).limit(1000);
      
      const { data } = await query;
      
      if (!data?.length) return;
      
      const headers = ['Progetto', 'Location', 'Developer', 'Prezzo Da (AED)', 'Stato', 'Consegna', 'URL'];
      const rows = data.map(p => [
        p.title,
        p.location_full,
        p.developer_name,
        p.price_from,
        p.construction_phase === 'completed' ? 'Completato' : p.construction_phase === 'under_construction' ? 'In Costruzione' : 'Lancio',
        p.delivery_date,
        p.url
      ]);
      
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offplan-projects-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  useEffect(() => { searchListings(1); }, []);

  const isListingSaved = (projectId) => savedListings?.some(s => s.property_id === projectId);
  const formatPrice = (price) => { if (!price || price === 0) return 'TBD'; const num = parseFloat(price); if (num >= 1000000) return (num/1000000).toFixed(1) + 'M'; if (num >= 1000) return (num/1000).toFixed(0) + 'K'; return num.toLocaleString(); };
  const formatBedrooms = (bedrooms) => { if (!bedrooms?.available?.length) return null; const beds = bedrooms.available; if (beds.length === 1) return beds[0] === 0 ? 'Studio' : beds[0] + ' BR'; const min = Math.min(...beds); const max = Math.max(...beds); return min === 0 ? 'Studio - ' + max + ' BR' : min + ' - ' + max + ' BR'; };
  const formatDelivery = (dateStr) => { if (!dateStr) return null; const date = new Date(dateStr); const quarter = Math.ceil((date.getMonth() + 1) / 3); return 'Q' + quarter + ' ' + date.getFullYear(); };
  const formatPaymentPlan = (plans) => { if (!plans?.plans?.[0]) return null; const plan = plans.plans[0].summary; return plan.down_payment + '/' + plan.during_construction + '/' + plan.handover; };
  const handleAreaClick = (projects, areaName) => { setSelectedAreaProjects(projects); setSelectedAreaName(areaName); };
  const displayProjects = selectedAreaProjects || listings;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-orange-400" />Off-Plan Projects</h2>
            <p className="text-zinc-500 text-sm mt-1">{totalResults > 0 ? totalResults.toLocaleString() + ' progetti' : 'Cerca progetti'}{selectedAreaName && ' • ' + selectedAreaName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)} icon={PieChart}>
              {showStats ? 'Nascondi' : 'Stats'}
            </Button>
            <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-xl">
              <button onClick={() => { setViewMode('list'); setSelectedAreaProjects(null); }} className={'p-2 rounded-lg transition-colors ' + (viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white')} title="Lista"><List className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('map')} className={'p-2 rounded-lg transition-colors ' + (viewMode === 'map' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white')} title="Mappa"><Map className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        
        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" />Top Zone</h3>
              <div className="space-y-2">
                {stats.byZone.slice(0, 5).map((z, i) => (
                  <div key={z.name} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm truncate flex-1">{z.name}</span>
                    <span className="text-white text-sm font-medium ml-2">{z.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-orange-400" />Top Developer</h3>
              <div className="space-y-2">
                {stats.byDeveloper.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm truncate flex-1">{d.name}</span>
                    <span className="text-white text-sm font-medium ml-2">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-400" />Statistiche</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-zinc-500 text-xs">Totale Progetti</p>
                  <p className="text-white text-xl font-bold">{totalResults.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Prezzo Medio</p>
                  <p className="text-orange-400 text-xl font-bold">AED {(stats.avgPrice / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="mb-4">
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type="text" placeholder="Cerca progetto, zona o developer..." value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && searchListings(1)} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <select value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"><option value="">Tutte le zone</option>{dubaiAreas.map(a => <option key={a} value={a}>{a}</option>)}</select>
            <select value={filters.developer} onChange={(e) => setFilters(f => ({ ...f, developer: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"><option value="">Developer</option>{topDevelopers.map(d => <option key={d} value={d}>{d}</option>)}</select>
            <select value={filters.bedrooms} onChange={(e) => setFilters(f => ({ ...f, bedrooms: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"><option value="">Camere</option>{bedroomOptions.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : b + ' BR'}</option>)}</select>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none">{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            <select value={filters.deliveryYear} onChange={(e) => setFilters(f => ({ ...f, deliveryYear: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"><option value="">Consegna</option>{deliveryYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <input type="number" placeholder="Min AED" value={filters.minPrice} onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none" />
            <input type="number" placeholder="Max AED" value={filters.maxPrice} onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none" />
            <Button onClick={() => { setSelectedAreaProjects(null); searchListings(1); }} icon={Search} disabled={loading}>{loading ? '...' : 'Cerca'}</Button>
          </div>
          {/* Sorting and active filters */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">Ordina:</span>
                <select value={filters.sortBy} onChange={(e) => { setFilters(f => ({ ...f, sortBy: e.target.value })); searchListings(1); }} className="bg-transparent border-none text-orange-400 text-sm focus:outline-none cursor-pointer">
                  {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {listings.length > 0 && (
                <Button variant="ghost" size="sm" onClick={exportProjectsCSV}>
                  <Download className="w-4 h-4 mr-1" />Export CSV
                </Button>
              )}
            </div>
            {(filters.location || filters.developer || filters.status || filters.deliveryYear || filters.minPrice || filters.maxPrice || filters.bedrooms) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilters({ search: '', location: '', minPrice: '', maxPrice: '', bedrooms: '', developer: '', status: '', deliveryYear: '', sortBy: 'hotness' }); searchListings(1); }}>
                <X className="w-4 h-4 mr-1" />Reset filtri
              </Button>
            )}
          </div>
        </Card>
        {selectedAreaProjects && <div className="flex items-center gap-2 mb-4"><span className="text-zinc-400 text-sm">Filtrato: <span className="text-orange-400">{selectedAreaName}</span></span><Button variant="ghost" size="sm" onClick={() => { setSelectedAreaProjects(null); setSelectedAreaName(''); }}><X className="w-4 h-4 mr-1" />Rimuovi</Button></div>}
      </div>

      {error && <Card className="border-red-500/20 bg-red-500/5 mb-4"><div className="flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><span>{error}</span><Button variant="ghost" size="sm" onClick={() => searchListings(1)}>Riprova</Button></div></Card>}

      <div className="flex-1 min-h-0">
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto">
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <Card key={i} className="animate-pulse"><div className="h-40 bg-zinc-800 rounded-xl mb-3" /><div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" /><div className="h-3 bg-zinc-800 rounded w-1/2" /></Card>)}</div>
            ) : displayProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayProjects.map(project => (
                    <Card key={project.project_id} hover className="overflow-hidden group cursor-pointer" onClick={() => setSelectedListing(project)}>
                      <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden">
                        {project.images?.[0]?.medium_image_url ? <img src={project.images[0].medium_image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Building2 className="w-12 h-12 text-zinc-600" /></div>}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className={'px-2 py-1 text-white text-xs font-medium rounded-lg ' + (project.construction_phase_key === 'completed' ? 'bg-green-500/90' : project.construction_phase_key === 'under_construction' ? 'bg-orange-500/90' : 'bg-blue-500/90')}>{project.construction_phase_key === 'completed' ? 'Completato' : project.construction_phase_key === 'under_construction' ? 'In Costruzione' : 'Lancio'}</span>
                          {project.hotness_level >= 80 && <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-medium rounded-lg">🔥</span>}
                        </div>
                        {formatDelivery(project.delivery_date) && <div className="absolute top-2 right-12 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">{formatDelivery(project.delivery_date)}</div>}
                        <button onClick={(e) => { e.stopPropagation(); isListingSaved(project.project_id) ? onRemoveListing(project.project_id) : onSaveListing(project); }} className={'absolute top-2 right-2 p-2 rounded-full transition-colors ' + (isListingSaved(project.project_id) ? 'bg-orange-500 text-white' : 'bg-black/50 text-white hover:bg-orange-500')}><svg className="w-4 h-4" fill={isListingSaved(project.project_id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-medium line-clamp-1">{project.title}</p>
                        <p className="text-zinc-500 text-sm line-clamp-1">{project.location?.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          {formatBedrooms(project.bedrooms) && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{formatBedrooms(project.bedrooms)}</span>}
                          {project.payment_plans && <span>{formatPaymentPlan(project.payment_plans)}</span>}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-orange-400 font-semibold">{project.price_from > 0 ? 'da AED ' + formatPrice(project.price_from) : 'Prezzo TBD'}</p>
                          {project.developer?.name && <span className="text-zinc-500 text-xs truncate max-w-[100px]">{project.developer.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedListing(project); }}><Eye className="w-4 h-4 mr-1" />Dettagli</Button>
                        <Button variant="secondary" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setShowAssignModal(project); }}><Plus className="w-4 h-4 mr-1" />Lead</Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 pb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handlePageChange(page - 1)} 
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handlePageChange(page + 1)} 
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-zinc-500 text-sm ml-4">
                      {totalResults.toLocaleString()} progetti
                    </span>
                  </div>
                )}
              </>
            ) : <EmptyState icon={Building2} title="Nessun risultato" description="Modifica i filtri" />}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="fixed inset-0 z-50 bg-[#09090B]">
            {/* Header with Logo and Filters */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-[#09090B] border-b border-zinc-800">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="KeyPrime" className="h-10" />
                  <span className="text-zinc-500">|</span>
                  <span className="text-zinc-400">{displayProjects.length} progetti</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} icon={X}>Chiudi</Button>
                </div>
              </div>
              {/* Filters Row */}
              <div className="px-4 pb-3 flex items-center gap-3 overflow-x-auto">
                <select value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none min-w-[140px]">
                  <option value="">Tutte le zone</option>
                  {dubaiAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.developer} onChange={(e) => setFilters(f => ({ ...f, developer: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none min-w-[140px]">
                  <option value="">Tutti i developer</option>
                  {topDevelopers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filters.bedrooms} onChange={(e) => setFilters(f => ({ ...f, bedrooms: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none min-w-[100px]">
                  <option value="">Camere</option>
                  {bedroomOptions.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : b + ' BR'}</option>)}
                </select>
                <input type="number" placeholder="Min AED" value={filters.minPrice} onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none w-28" />
                <input type="number" placeholder="Max AED" value={filters.maxPrice} onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none w-28" />
                <Button onClick={() => searchListings(1)} icon={Search} disabled={loading}>{loading ? '...' : 'Cerca'}</Button>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="pt-28 h-full flex">
              {/* Left Sidebar - Projects List */}
              <div className="w-96 h-full bg-[#0F0F11] border-r border-zinc-800 flex flex-col">
                <div className="p-3 border-b border-zinc-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Cerca progetto..." 
                      value={filters.search} 
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && searchListings(1)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {displayProjects.map(project => (
                    <div 
                      key={project.project_id} 
                      onClick={() => setSelectedListing(project)}
                      className={'p-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/50 transition-colors ' + (selectedListing?.project_id === project.project_id ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : '')}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                          {project.images?.[0]?.medium_image_url ? (
                            <img src={project.images[0].medium_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-zinc-600" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-sm truncate">{project.title}</h3>
                          <p className="text-xs text-zinc-500 truncate">{project.location?.full_name}</p>
                          <p className="text-orange-400 font-semibold text-sm mt-1">
                            {project.price_from > 0 ? 'From ' + formatPrice(project.price_from) : 'TBD'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {formatBedrooms(project.bedrooms) && <span>{formatBedrooms(project.bedrooms)}</span>}
                            {formatDelivery(project.delivery_date) && <span>• {formatDelivery(project.delivery_date)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="p-3 flex items-center justify-center gap-2 border-t border-zinc-800">
                      <Button variant="ghost" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-zinc-400 text-sm">Pag. {page}/{totalPages}</span>
                      <Button variant="ghost" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {loading && <div className="p-4 text-center text-zinc-500">Caricamento...</div>}
                </div>
              </div>
              
              {/* Map */}
              <div className="flex-1 relative">
                <MapboxMap 
                  projects={listings} 
                  onSelectProject={setSelectedListing} 
                  selectedProject={selectedListing} 
                  onAreaClick={handleAreaClick} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onCreateLead={() => { setShowAssignModal(selectedListing); setSelectedListing(null); }} isSaved={isListingSaved(selectedListing.project_id)} onToggleSave={() => isListingSaved(selectedListing.project_id) ? onRemoveListing(selectedListing.project_id) : onSaveListing(selectedListing)} />}
      {showAssignModal && <AssignListingModal listing={showAssignModal} clienti={clienti} onClose={() => setShowAssignModal(null)} onCreateLead={onCreateLead} user={user} />}
    </div>
  );
}
// Listing Detail Modal (for Off-Plan Projects) - Enhanced with Gallery, Map, Location Insights
function ListingDetailModal({ listing, onClose, onCreateLead, isSaved, onToggleSave }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Su richiesta';
    return parseFloat(price).toLocaleString();
  };
  
  const formatBedrooms = (bedrooms) => {
    if (!bedrooms?.available?.length) return null;
    const beds = bedrooms.available;
    if (beds.length === 1) return beds[0] === 0 ? 'Studio' : `${beds[0]} Camere`;
    const min = Math.min(...beds);
    const max = Math.max(...beds);
    return min === 0 ? `Studio - ${max} Camere` : `${min} - ${max} Camere`;
  };

  const formatDelivery = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return { text: 'Completato', color: 'bg-green-500', icon: '✓' };
      case 'under_construction': return { text: 'In Costruzione', color: 'bg-orange-500', icon: '🏗️' };
      case 'not_started': return { text: 'Nuovo Lancio', color: 'bg-blue-500', icon: '🚀' };
      default: return { text: 'Off-Plan', color: 'bg-orange-500', icon: '📋' };
    }
  };

  // Location insights based on area name
  const getLocationInsights = (locationName) => {
    const insights = {
      'Dubai Marina': { rating: '⭐⭐⭐⭐⭐', type: 'Premium Waterfront', highlights: ['Vista mare', 'Ristoranti di lusso', 'Beach access', 'Metro vicina'], roi: '6-8%' },
      'Palm Jumeirah': { rating: '⭐⭐⭐⭐⭐', type: 'Ultra Luxury', highlights: ['Isola iconica', 'Spiagge private', 'Hotel 5 stelle', 'Alta domanda'], roi: '5-7%' },
      'Downtown Dubai': { rating: '⭐⭐⭐⭐⭐', type: 'Iconic Location', highlights: ['Burj Khalifa', 'Dubai Mall', 'Fountain view', 'Business hub'], roi: '5-7%' },
      'Business Bay': { rating: '⭐⭐⭐⭐', type: 'Business District', highlights: ['Canal view', 'Corporate hub', 'In crescita', 'Buon ROI'], roi: '7-9%' },
      'JBR': { rating: '⭐⭐⭐⭐⭐', type: 'Beachfront Living', highlights: ['The Walk', 'Beach access', 'Family friendly', 'Turisti'], roi: '6-8%' },
      'Dubai Creek Harbour': { rating: '⭐⭐⭐⭐', type: 'Future Icon', highlights: ['Creek Tower', 'Waterfront', 'Nuova area', 'Alto potenziale'], roi: '8-10%' },
      'MBR City': { rating: '⭐⭐⭐⭐', type: 'Master Community', highlights: ['Meydan', 'Crystal Lagoon', 'Golf course', 'Family area'], roi: '7-9%' },
      'Dubai Hills': { rating: '⭐⭐⭐⭐', type: 'Green Community', highlights: ['Golf club', 'Dubai Hills Mall', 'Parchi', 'Scuole'], roi: '6-8%' },
      'JVC': { rating: '⭐⭐⭐', type: 'Affordable Living', highlights: ['Entry level', 'Community feel', 'ROI alto', 'In sviluppo'], roi: '8-10%' },
      'Jumeirah Village': { rating: '⭐⭐⭐', type: 'Value Investment', highlights: ['Prezzi competitivi', 'Comunità', 'Buon rental'], roi: '8-10%' },
      'DIFC': { rating: '⭐⭐⭐⭐⭐', type: 'Financial Hub', highlights: ['Centro finanziario', 'Art galleries', 'Fine dining', 'Lusso'], roi: '5-6%' },
      'Yas Island': { rating: '⭐⭐⭐⭐', type: 'Entertainment Hub', highlights: ['Ferrari World', 'Yas Marina', 'Beach', 'Abu Dhabi'], roi: '6-8%' },
      'Saadiyat Island': { rating: '⭐⭐⭐⭐⭐', type: 'Cultural District', highlights: ['Louvre Abu Dhabi', 'Beaches', 'Golf', 'Exclusive'], roi: '5-7%' }
    };
    
    const locationLower = (locationName || '').toLowerCase();
    for (const [key, value] of Object.entries(insights)) {
      if (locationLower.includes(key.toLowerCase())) return { name: key, ...value };
    }
    return { name: locationName, rating: '⭐⭐⭐', type: 'Emerging Area', highlights: ['In sviluppo', 'Potenziale crescita'], roi: '7-10%' };
  };

  const status = getStatusLabel(listing.construction_phase_key);
  const locationInsights = getLocationInsights(listing.location?.full_name || listing.location?.name);
  const images = listing.images || [];
  const hasCoords = listing.location?.lat && listing.location?.lng;
  
  // Estimate coordinates from location name for map (rough Dubai coordinates)
  const getMapUrl = () => {
    const locationName = encodeURIComponent(listing.location?.full_name || listing.title + ' Dubai');
    return `https://www.google.com/maps/search/?api=1&query=${locationName}`;
  };

  // Fullscreen Gallery
  if (showFullGallery) {
    return (
      <div className="fixed inset-0 z-[60] bg-black">
        <button onClick={() => setShowFullGallery(false)} className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20">
          <X className="w-6 h-6" />
        </button>
        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm">
          {activeImageIndex + 1} / {images.length}
        </div>
        
        {/* Main Image */}
        <div className="h-full flex items-center justify-center p-4">
          {images[activeImageIndex] && (
            <img src={images[activeImageIndex].medium_image_url || images[activeImageIndex].small_image_url} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>
        
        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button onClick={() => setActiveImageIndex(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setActiveImageIndex(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur rounded-full text-white hover:bg-white/20">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Thumbnails */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
          {images.slice(0, 10).map((img, idx) => (
            <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-orange-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={img.small_image_url || img.medium_image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F0F11] border border-[#27272A] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-scaleIn">
        
        {/* Hero Image Section with Gallery */}
        <div className="relative h-72 md:h-80">
          {images[activeImageIndex]?.medium_image_url ? (
            <img src={images[activeImageIndex].medium_image_url} alt={listing.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setShowFullGallery(true)} />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <Building2 className="w-20 h-20 text-zinc-600" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F11] via-transparent to-black/30" />
          
          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1.5 ${status.color} text-white text-sm font-medium rounded-full flex items-center gap-1.5 shadow-lg`}>
                <span>{status.icon}</span> {status.text}
              </span>
              {listing.hotness_level >= 80 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5 shadow-lg">
                  🔥 Popolare
                </span>
              )}
              {formatDelivery(listing.delivery_date) && (
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur text-white text-sm rounded-full">
                  📅 {formatDelivery(listing.delivery_date)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onToggleSave} className={`p-2.5 rounded-full shadow-lg transition-all ${isSaved ? 'bg-orange-500 text-white' : 'bg-black/60 backdrop-blur text-white hover:bg-orange-500'}`}>
                <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
              <button onClick={onClose} className="p-2.5 bg-black/60 backdrop-blur rounded-full text-white hover:bg-black/80 shadow-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Image navigation dots */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
              {images.slice(0, 8).map((_, idx) => (
                <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-orange-500 w-6' : 'bg-white/50 hover:bg-white/80'}`} />
              ))}
              {images.length > 8 && <span className="text-white/50 text-xs ml-1">+{images.length - 8}</span>}
            </div>
          )}
          
          {/* Title section */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-white/80">
              <MapPin className="w-4 h-4" />
              <span>{listing.location?.full_name}</span>
            </div>
          </div>
          
          {/* Expand gallery button */}
          {images.length > 1 && (
            <button onClick={() => setShowFullGallery(true)} className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur text-white text-sm rounded-full hover:bg-black/80 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {images.length} foto
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-20rem)]">
          
          {/* Price & Quick Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
            <div>
              <p className="text-3xl font-bold text-orange-400">
                {listing.price_from > 0 ? `AED ${formatPrice(listing.price_from)}` : 'Prezzo su richiesta'}
              </p>
              {listing.price_from > 0 && <p className="text-zinc-500 text-sm mt-1">Prezzo iniziale</p>}
            </div>
            {formatBedrooms(listing.bedrooms) && (
              <div className="flex items-center gap-4 text-zinc-300">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  <span className="font-medium">{formatBedrooms(listing.bedrooms)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown by Bedroom Type */}
          {listing.bedrooms?.available?.length > 0 && listing.price_from > 0 && (
            <div className="mb-6 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                Prezzi per Tipologia
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {listing.bedrooms.available.sort((a, b) => a - b).map((bed, idx) => {
                  const basePrice = listing.price_from;
                  const multiplier = bed === 0 ? 1 : 1 + (bed * 0.35);
                  const estimatedPrice = Math.round(basePrice * multiplier);
                  return (
                    <div key={idx} className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg p-3 text-center">
                      <p className="text-zinc-400 text-xs mb-1">{bed === 0 ? 'Studio' : bed + ' BR'}</p>
                      <p className="text-orange-400 font-semibold">da {formatPrice(estimatedPrice)}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-zinc-500 text-xs mt-2 text-center">* Prezzi indicativi, contattare per quotazione esatta</p>
            </div>
          )}
          
          {/* Info Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4 text-center">
              <p className="text-orange-400 text-2xl font-bold">{status.icon}</p>
              <p className="text-white font-medium mt-1">{status.text}</p>
              <p className="text-zinc-500 text-xs mt-1">Stato progetto</p>
            </div>
            {formatDelivery(listing.delivery_date) && (
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-2xl font-bold">📅</p>
                <p className="text-white font-medium mt-1">{formatDelivery(listing.delivery_date)}</p>
                <p className="text-zinc-500 text-xs mt-1">Consegna prevista</p>
              </div>
            )}
            {listing.payment_plans?.plans?.[0]?.summary?.down_payment && (
              <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-green-400 text-2xl font-bold">{listing.payment_plans.plans[0].summary.down_payment}%</p>
                <p className="text-white font-medium mt-1">Anticipo</p>
                <p className="text-zinc-500 text-xs mt-1">Down payment</p>
              </div>
            )}
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <p className="text-purple-400 text-2xl font-bold">{locationInsights.roi}</p>
              <p className="text-white font-medium mt-1">ROI Stimato</p>
              <p className="text-zinc-500 text-xs mt-1">Rendimento annuo</p>
            </div>
          </div>
          
          {/* Developer Info - Prominent Card */}
          {listing.developer && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50 rounded-xl mb-6">
              {listing.developer.logo ? (
                <img src={listing.developer.logo} alt={listing.developer.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-orange-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Developer</p>
                <p className="text-xl font-semibold text-white">{listing.developer.name}</p>
                {listing.developer.projects_count && (
                  <p className="text-zinc-500 text-sm">{listing.developer.projects_count} progetti</p>
                )}
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">Verificato ✓</span>
              </div>
            </div>
          )}
          
          {/* Construction Progress - Only for under construction projects */}
          {listing.construction_phase_key === 'under_construction' && (
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" /> Stato Avanzamento Lavori
                </h3>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">In Costruzione</span>
              </div>
              {(() => {
                // Use real completion percentage if available, otherwise estimate
                let progress = listing.completion_percentage || listing.construction_progress;
                if (!progress) {
                  const deliveryDate = listing.delivery_date ? new Date(listing.delivery_date) : null;
                  const now = new Date();
                  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                  if (deliveryDate) {
                    const totalDuration = deliveryDate - startDate;
                    const elapsed = now - startDate;
                    progress = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 5), 95);
                  } else {
                    progress = 50;
                  }
                }
                return (
                  <>
                    <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow">{progress}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Inizio lavori</span>
                      <span>Consegna: {formatDelivery(listing.delivery_date) || 'TBD'}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 25 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500')}>
                        <p className="font-medium">Fondazioni</p>
                        <p>{progress >= 25 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500')}>
                        <p className="font-medium">Struttura</p>
                        <p>{progress >= 50 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 75 ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500')}>
                        <p className="font-medium">Finiture</p>
                        <p>{progress >= 75 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 95 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500')}>
                        <p className="font-medium">Consegna</p>
                        <p>{progress >= 95 ? '✓' : '...'}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          
          {/* Location Insights Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" /> Analisi Location
                </h3>
                <p className="text-zinc-400 text-sm">{locationInsights.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg">{locationInsights.rating}</p>
                <span className="text-blue-400 text-xs font-medium">{locationInsights.type}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {locationInsights.highlights.map((h, i) => (
                <span key={i} className="px-2.5 py-1 bg-white/5 text-zinc-300 text-xs rounded-full">✓ {h}</span>
              ))}
            </div>
            {/* Mini Map Link */}
            <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-zinc-300 transition-colors">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Apri in Google Maps</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Payment Plans */}
          {listing.payment_plans?.plans?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" /> Piano di Pagamento
              </h3>
              <div className="space-y-3">
                {listing.payment_plans.plans.map((plan, idx) => (
                  <div key={idx} className="p-4 bg-zinc-800/50 rounded-xl">
                    {plan.title && <p className="text-zinc-300 font-medium mb-3">{plan.title}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-green-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{plan.summary.down_payment}%</p>
                        <p className="text-zinc-500 text-xs mt-1">Anticipo</p>
                      </div>
                      <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-orange-400">{plan.summary.during_construction}%</p>
                        <p className="text-zinc-500 text-xs mt-1">Costruzione</p>
                      </div>
                      <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-blue-400">{plan.summary.handover}%</p>
                        <p className="text-zinc-500 text-xs mt-1">Consegna</p>
                      </div>
                      {plan.summary.after_handover > 0 && (
                        <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                          <p className="text-2xl font-bold text-purple-400">{plan.summary.after_handover}%</p>
                          <p className="text-zinc-500 text-xs mt-1">Post-consegna</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" /> Galleria
                <span className="text-zinc-500 text-sm font-normal">({images.length} immagini)</span>
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.slice(0, 12).map((img, idx) => (
                  <button key={idx} onClick={() => { setActiveImageIndex(idx); setShowFullGallery(true); }} className="relative h-20 rounded-lg overflow-hidden group">
                    <img src={img.small_image_url || img.medium_image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
                {images.length > 12 && (
                  <button onClick={() => setShowFullGallery(true)} className="h-20 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
                    <span className="text-sm font-medium">+{images.length - 12}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <Button className="flex-1 py-3 bg-orange-500 hover:bg-orange-600" onClick={onCreateLead}>
              <Plus className="w-5 h-5 mr-2" /> Crea Lead
            </Button>
            <Button variant="secondary" className="flex-1 py-3" onClick={() => {
              const bedsText = formatBedrooms(listing.bedrooms) || 'Varie tipologie';
              const deliveryText = formatDelivery(listing.delivery_date) || 'TBD';
              const paymentText = listing.payment_plans?.plans?.[0]?.summary ? 
                `💳 ${listing.payment_plans.plans[0].summary.down_payment}% anticipo` : '';
              const text = `🏗️ *${listing.title}*\n\n📍 ${listing.location?.full_name}\n💰 ${listing.price_from > 0 ? `da AED ${formatPrice(listing.price_from)}` : 'Prezzo su richiesta'}\n🏠 ${bedsText}\n📅 Consegna: ${deliveryText}\n🏢 Developer: ${listing.developer?.name || 'TBD'}\n${paymentText}\n\n_Progetto Off-Plan Dubai_\n\n🔗 Per info: contattami!`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}>
              <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignListingModal({ listing, clienti, onClose, onCreateLead, user }) {
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createNew, setCreateNew] = useState(false);
  const [newCliente, setNewCliente] = useState({ nome: '', cognome: '', telefono: '', email: '' });
  
  const filteredClienti = clienti.filter(c => 
    `${c.nome} ${c.cognome} ${c.telefono}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreate = () => {
    const leadData = {
      progetto: listing.title?.substring(0, 50) || listing.location?.name,
      developer: listing.location?.name || 'TBD',
      zona: listing.location?.path_name?.split(',')[1]?.trim() || 'Dubai',
      valore: parseFloat(listing.price) || 0,
      stato: 'lead',
      agente: user?.nome || '',
      pf_property_id: listing.property_id,
      pf_url: listing.url,
      note: `Off-Plan: ${listing.property_type} - ${listing.bedrooms || 'N/A'} BR - ${listing.size || 'N/A'} sqft`
    };
    
    if (selectedCliente) {
      leadData.cliente_id = selectedCliente.id;
      leadData.cliente_nome = `${selectedCliente.nome} ${selectedCliente.cognome}`;
    } else if (createNew && newCliente.nome) {
      leadData.newCliente = newCliente;
    }
    
    onCreateLead(leadData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-md animate-scaleIn">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Crea Lead da Annuncio</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Listing Summary */}
          <div className="flex gap-3 p-3 bg-zinc-800/50 rounded-xl">
            {listing.images?.[0]?.small_image_url && <img src={listing.images[0].small_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-1">{listing.title}</p>
              <p className="text-zinc-500 text-xs line-clamp-1">{listing.location?.path_name}</p>
              <p className="text-orange-400 text-sm font-medium mt-1">AED {parseFloat(listing.price).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Client Selection */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Associa a Cliente (opzionale)</label>
            <input type="text" placeholder="Cerca cliente..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCreateNew(false); }} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none" />
            
            {searchQuery && !createNew && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {filteredClienti.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { setSelectedCliente(c); setSearchQuery(`${c.nome} ${c.cognome}`); }} className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${selectedCliente?.id === c.id ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-zinc-800 text-zinc-300'}`}>
                    <Avatar nome={c.nome} cognome={c.cognome} size="xs" />
                    <span className="text-sm">{c.nome} {c.cognome}</span>
                  </button>
                ))}
                {filteredClienti.length === 0 && (
                  <button onClick={() => { setCreateNew(true); setNewCliente(n => ({ ...n, nome: searchQuery.split(' ')[0], cognome: searchQuery.split(' ')[1] || '' })); }} className="w-full text-left p-2 rounded-lg text-orange-400 hover:bg-zinc-800 text-sm">
                    + Crea nuovo cliente "{searchQuery}"
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* New Client Form */}
          {createNew && (
            <div className="space-y-3 p-3 bg-zinc-800/30 rounded-xl">
              <p className="text-sm text-zinc-400">Nuovo Cliente</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nome" value={newCliente.nome} onChange={(e) => setNewCliente(n => ({ ...n, nome: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="text" placeholder="Cognome" value={newCliente.cognome} onChange={(e) => setNewCliente(n => ({ ...n, cognome: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <input type="tel" placeholder="Telefono" value={newCliente.telefono} onChange={(e) => setNewCliente(n => ({ ...n, telefono: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
              <input type="email" placeholder="Email" value={newCliente.email} onChange={(e) => setNewCliente(n => ({ ...n, email: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          )}
        </div>
        
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annulla</Button>
          <Button className="flex-1" onClick={handleCreate}>Crea Lead</Button>
        </div>
      </div>
    </div>
  );
}

// Login Form
function LoginForm({ onLogin, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="space-y-4">
      <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Inserisci username" />
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Password</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-all" />
          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={loading || !username || !password} className="w-full py-3">
        {loading ? 'Accesso...' : 'Accedi'}
      </Button>
    </form>
  );
}

// Lead Detail Sheet
function LeadDetailSheet({ sale, cliente, rate, onClose, onUpdateSale, onConvert, isAdmin }) {
  const mc = (sale?.stato === 'venduto' || sale?.stato === 'incassato') ? Number(sale.valore) * (sale.commission_pct || 5) / 100 * rate : 0;
  
  return (
    <BottomSheet isOpen={!!sale} onClose={onClose} title={sale?.progetto || 'Lead'}>
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={sale?.stato || 'lead'} />
          <span className="text-zinc-500 text-sm">{fmtDate(sale?.data)}</span>
        </div>

        {/* Value */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <p className="text-zinc-400 text-sm">Valore</p>
          <p className="text-2xl font-semibold text-white mt-1">{sale?.valore > 0 ? `${fmt(sale.valore)} AED` : 'TBD'}</p>
          {mc > 0 && <p className="text-emerald-400 text-sm mt-1">Commissione: {fmt(mc)} AED {sale?.pagato ? '✓' : ''}</p>}
        </Card>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="p-3"><p className="text-zinc-500 text-xs">Developer</p><p className="text-white">{sale?.developer}</p></Card>
          <Card padding="p-3"><p className="text-zinc-500 text-xs">Zona</p><p className="text-white">{sale?.zona}</p></Card>
        </div>

        {/* Cliente */}
        {cliente && (
          <Card>
            <p className="text-zinc-500 text-xs mb-2">Cliente</p>
            <div className="flex items-center gap-3 mb-3">
              <Avatar nome={cliente.nome} cognome={cliente.cognome} />
              <div>
                <p className="text-white font-medium">{cliente.nome} {cliente.cognome}</p>
                <p className="text-zinc-500 text-sm">{cliente.telefono}</p>
              </div>
            </div>
            <QuickActions phone={cliente.telefono} whatsapp={cliente.whatsapp || cliente.telefono} email={cliente.email} clienteName={cliente.nome} />
          </Card>
        )}

        {/* Status Change */}
        <div>
          <p className="text-zinc-500 text-xs mb-2">Cambia stato</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pipelineStati.slice(0, -1).map(st => (
              <button key={st} onClick={() => { onUpdateSale(sale.id, { stato: st }); if (st !== sale.stato) onClose(); }} className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${sale?.stato === st ? 'text-white' : 'text-zinc-500 hover:text-white'}`} style={sale?.stato === st ? { background: theme.status[st]?.bg, color: theme.status[st]?.color } : { background: '#27272A' }}>
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {['prenotato', 'trattativa'].includes(sale?.stato) && (
          <Button onClick={onConvert} icon={DollarSign} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white">
            Registra Vendita
          </Button>
        )}

        {isAdmin && (
          <Button variant="danger" icon={Trash2} className="w-full">Elimina Lead</Button>
        )}
      </div>
    </BottomSheet>
  );
}

// Convert Modal
function ConvertModal({ sale, onConvert, onCancel }) {
  const [value, setValue] = useState(sale?.valore || '');
  
  return (
    <Modal isOpen={!!sale} onClose={onCancel} title="🎉 Registra Vendita" size="sm">
      <div className="space-y-4">
        <Card padding="p-3" className="bg-zinc-800/50">
          <p className="text-white font-medium">{sale?.progetto}</p>
          <p className="text-zinc-500 text-sm">{sale?.developer} • {sale?.zona}</p>
        </Card>
        <Input label="Valore finale (AED)" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="es. 1500000" autoFocus />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Annulla</Button>
          <Button onClick={() => value && onConvert(sale.id, parseFloat(value))} disabled={!value} className="flex-1 bg-emerald-500 hover:bg-emerald-600">Conferma</Button>
        </div>
      </div>
    </Modal>
  );
}

// Notifications Panel
function NotificationsPanel({ tasks, unreadIds, onClose, onGoToTask, recentSales = [] }) {
  const allNotifications = [
    ...recentSales.map(s => ({ type: 'sale', id: 'sale_' + s.id, data: s })),
    ...tasks.map(t => ({ type: 'task', id: t.id, data: t }))
  ];
  
  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Notifiche">
      {allNotifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nessuna notifica" description="Sei in pari con tutto!" />
      ) : (
        <div className="space-y-2">
          {recentSales.map(s => (
            <Card key={'sale_' + s.id} padding="p-3" className={unreadIds.includes('sale_' + s.id) ? 'border-l-2 border-l-emerald-500' : ''}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Nuova {s.stato === 'venduto' ? 'Vendita' : 'Lead'}</p>
                  <p className="text-zinc-400 text-xs">{s.progetto} • {s.agente || s.segnalatore}</p>
                  <p className="text-emerald-400 text-xs font-medium mt-1">{fmt(s.valore)} AED</p>
                </div>
                <span className="text-zinc-500 text-xs">{fmtShort(s.created_at)}</span>
              </div>
            </Card>
          ))}
          {tasks.map(t => (
            <Card key={t.id} hover onClick={onGoToTask} padding="p-3" className={unreadIds.includes(t.id) ? 'border-l-2 border-l-pink-500' : ''}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${isOverdue(t.scadenza) ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{t.titolo}</p>
                  <p className={`text-xs ${isOverdue(t.scadenza) ? 'text-red-400' : 'text-zinc-500'}`}>
                    {t.scadenza ? fmtDateTime(t.scadenza) : 'Senza scadenza'}
                    {isOverdue(t.scadenza) && ' • Scaduto!'}
                  </p>
                </div>
                <StatusBadge status={t.priorita} type="priority" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

// Password Modal
function PasswordModal({ currentPassword, onSave, onClose }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (oldPwd !== currentPassword) { setError('Password attuale errata'); return; }
    if (newPwd.length < 6) { setError('Minimo 6 caratteri'); return; }
    if (newPwd !== confirmPwd) { setError('Le password non coincidono'); return; }
    onSave(newPwd);
  };

  return (
    <Modal isOpen onClose={onClose} title="Cambia Password" size="sm">
      <div className="space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
        <Input label="Password attuale" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
        <Input label="Nuova password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
        <Input label="Conferma password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={save} className="flex-1">Salva</Button>
        </div>
      </div>
    </Modal>
  );
}

// Note Modal
function NoteModal({ task, onSave, onClose }) {
  const [note, setNote] = useState(task?.note || '');
  
  return (
    <Modal isOpen onClose={onClose} title="Aggiungi Nota" size="sm">
      <div className="space-y-4">
        <Card padding="p-3" className="bg-zinc-800/50">
          <p className="text-white font-medium">{task?.titolo}</p>
        </Card>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Nota</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scrivi una nota..." className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] h-24 resize-none" autoFocus />
        </div>
        <p className="text-zinc-600 text-xs">L'admin riceverà una notifica email</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={() => onSave(task.id, note)} icon={Send} className="flex-1">Invia</Button>
        </div>
      </div>
    </Modal>
  );
}

// Cliente Modal
function ClienteModal({ cliente, onSave, onClose }) {
  const [form, setForm] = useState(cliente || { nome: '', cognome: '', email: '', telefono: '', whatsapp: '', nazionalita: '', budget_min: '', budget_max: '', stato: 'nuovo', fonte: '', note: '' });
  
  const save = async () => {
    if (!form.nome) { alert('Nome obbligatorio'); return; }
    await onSave(form);
  };

  return (
    <Modal isOpen onClose={onClose} title={cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <Input label="Cognome" value={form.cognome || ''} onChange={(e) => setForm({ ...form, cognome: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Telefono" type="tel" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Input label="WhatsApp" type="tel" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </div>
        <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Nazionalità" value={form.nazionalita || ''} onChange={(e) => setForm({ ...form, nazionalita: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Budget Min" type="number" value={form.budget_min || ''} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
          <Input label="Budget Max" type="number" value={form.budget_max || ''} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Stato" value={form.stato || 'nuovo'} onChange={(e) => setForm({ ...form, stato: e.target.value })}>
            {clienteStati.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Fonte" value={form.fonte || ''} onChange={(e) => setForm({ ...form, fonte: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Note</label>
          <textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm h-20 resize-none focus:outline-none focus:border-[#3F3F46]" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={save} className="flex-1">Salva</Button>
        </div>
      </div>
    </Modal>
  );
}

// Task Modal
function TaskModal({ task, clienti, users, onSave, onClose }) {
  const [form, setForm] = useState(task || { titolo: '', descrizione: '', scadenza: '', priorita: 'normale', cliente_id: '', assegnato_a: '' });

  const save = async () => {
    if (!form.titolo) { alert('Titolo obbligatorio'); return; }
    await onSave({ ...form, cliente_id: form.cliente_id || null, scadenza: form.scadenza || null });
  };

  return (
    <Modal isOpen onClose={onClose} title={task?.id ? 'Modifica Task' : 'Nuovo Task'}>
      <div className="space-y-4">
        <Input label="Titolo *" value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} autoFocus />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Descrizione</label>
          <textarea value={form.descrizione || ''} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm h-20 resize-none focus:outline-none focus:border-[#3F3F46]" />
        </div>
        <Input label="Scadenza" type="datetime-local" value={form.scadenza ? form.scadenza.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, scadenza: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Priorità</label>
          <div className="flex gap-2">
            {taskPriorita.map(p => (
              <button key={p} onClick={() => setForm({ ...form, priorita: p })} className={`flex-1 px-3 py-2 rounded-xl text-sm transition-all ${form.priorita === p ? 'text-white' : 'text-zinc-500'}`} style={form.priorita === p ? { background: theme.priority[p]?.bg, color: theme.priority[p]?.color } : { background: '#27272A' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <Select label="Cliente" value={form.cliente_id || ''} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
          <option value="">Nessun cliente</option>
          {clienti.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
        </Select>
        <Select label="Assegna a" value={form.assegnato_a || ''} onChange={(e) => setForm({ ...form, assegnato_a: e.target.value })}>
          <option value="">Non assegnato</option>
          {users.filter(u => u.ruolo !== 'admin').map(u => <option key={u.id} value={u.nome}>{u.nome} ({u.ruolo})</option>)}
        </Select>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={save} className="flex-1">Salva</Button>
        </div>
      </div>
    </Modal>
  );
}

// User Modal
function UserModal({ user, onSave, onClose }) {
  const [form, setForm] = useState(user || { nome: '', username: '', password: '', email: '', ruolo: 'agente', referente: 'Pellegrino', attivo: true });

  const save = async () => {
    if (!form.nome || !form.username || !form.password) { alert('Compila i campi obbligatori'); return; }
    await onSave(form);
  };

  return (
    <Modal isOpen onClose={onClose} title={user ? 'Modifica Utente' : 'Nuovo Utente'}>
      <div className="space-y-4">
        <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Per notifiche" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input label="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Ruolo" value={form.ruolo} onChange={(e) => setForm({ ...form, ruolo: e.target.value })}>
            <option value="agente">Agente</option>
            <option value="segnalatore">Segnalatore</option>
          </Select>
          <Select label="Referente" value={form.referente} onChange={(e) => setForm({ ...form, referente: e.target.value })}>
            <option value="Pellegrino">Pellegrino</option>
            <option value="Giovanni">Giovanni</option>
          </Select>
        </div>
        {user && (
          <Card padding="p-3" className="flex items-center gap-3">
            <input type="checkbox" id="attivo" checked={form.attivo} onChange={(e) => setForm({ ...form, attivo: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="attivo" className="text-zinc-300 text-sm">Utente attivo</label>
          </Card>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annulla</Button>
          <Button onClick={save} className="flex-1">Salva</Button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== LEAD & SALE FORMS ====================

// Client Search Component
function ClientSearch({ clienti, onSelect, onCreateNew, selectedClient }) {
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const filtered = search.length >= 2 ? clienti.filter(c => `${c.nome} ${c.cognome} ${c.telefono}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];

  if (selectedClient) {
    return (
      <Card padding="p-3" className="border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <Avatar nome={selectedClient.nome} cognome={selectedClient.cognome} size="sm" />
          <div className="flex-1">
            <p className="text-white font-medium">{selectedClient.nome} {selectedClient.cognome}</p>
            <p className="text-emerald-400 text-sm">{selectedClient.telefono}</p>
          </div>
          <button onClick={() => onSelect(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Cerca cliente..." value={search} onChange={(e) => { setSearch(e.target.value); setShow(true); }} onFocus={() => setShow(true)} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46]" />
      </div>
      
      {show && search.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden shadow-xl">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { onSelect(c); setSearch(''); setShow(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-[#27272A] last:border-0 flex items-center gap-3 transition-colors">
              <Avatar nome={c.nome} cognome={c.cognome} size="sm" />
              <div>
                <p className="text-white text-sm">{c.nome} {c.cognome}</p>
                <p className="text-zinc-500 text-xs">{c.telefono}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-3 text-zinc-500 text-sm">Nessun risultato</div>}
          <button onClick={() => { onCreateNew(); setShow(false); }} className="w-full text-left px-4 py-3 bg-blue-500/10 text-blue-400 flex items-center gap-2 hover:bg-blue-500/20 transition-colors">
            <UserPlus className="w-4 h-4" /> Nuovo cliente
          </button>
        </div>
      )}
      
      {!search && (
        <button onClick={onCreateNew} className="w-full mt-3 border border-dashed border-[#3F3F46] rounded-xl py-3 text-zinc-500 text-sm flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-400 transition-colors">
          <UserPlus className="w-4 h-4" /> Crea nuovo cliente
        </button>
      )}
    </div>
  );
}

// Select with Other Option
function SelectWithOther({ value, onChange, options, placeholder, label }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (value && !options.includes(value) && value !== 'Altro') {
      setShowCustom(true);
      setCustomValue(value);
    }
  }, [value, options]);

  return (
    <div>
      {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
      <select value={showCustom ? 'Altro' : value} onChange={(e) => {
        if (e.target.value === 'Altro') { setShowCustom(true); setCustomValue(''); onChange(''); }
        else { setShowCustom(false); onChange(e.target.value); }
      }} className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3F3F46] appearance-none">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {showCustom && (
        <input type="text" value={customValue} onChange={(e) => { setCustomValue(e.target.value); onChange(e.target.value); }} placeholder="Specifica..." className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm mt-2 focus:outline-none focus:border-[#3F3F46]" autoFocus />
      )}
    </div>
  );
}

// Lead Form
function LeadForm({ type, userName, clienti, onSubmit }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    developer: '', progetto: '', zona: '', valore: '', stato: 'lead',
    cliente_nome: '', cliente_cognome: '', cliente_email: '', cliente_telefono: '',
    cliente_whatsapp: '', cliente_nazionalita: '', cliente_budget_min: '', cliente_budget_max: '', cliente_note: ''
  });

  const submit = (e) => {
    e?.preventDefault();
    if (!selectedClient && !form.cliente_nome) { alert('Seleziona o crea un cliente'); return; }
    onSubmit({
      ...form,
      cliente_id: selectedClient?.id,
      cliente_nome: selectedClient?.nome || form.cliente_nome,
      developer: form.developer || 'TBD',
      progetto: form.progetto || 'TBD',
      zona: form.zona || 'TBD',
      valore: form.valore ? parseFloat(form.valore) : 0,
      agente: type === 'agente' ? userName : null,
      segnalatore: type === 'segnalatore' ? userName : null
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Cliente */}
      <Card>
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" /> Cliente
        </h4>
        <ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNewClient(false); }} onCreateNew={() => { setSelectedClient(null); setShowNewClient(true); }} />
        
        {showNewClient && !selectedClient && (
          <div className="mt-4 pt-4 border-t border-[#27272A] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nome *" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
              <Input placeholder="Cognome" value={form.cliente_cognome} onChange={(e) => setForm({ ...form, cliente_cognome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="tel" placeholder="Telefono" value={form.cliente_telefono} onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })} />
              <Input type="email" placeholder="Email" value={form.cliente_email} onChange={(e) => setForm({ ...form, cliente_email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Budget Min" value={form.cliente_budget_min} onChange={(e) => setForm({ ...form, cliente_budget_min: e.target.value })} />
              <Input type="number" placeholder="Budget Max" value={form.cliente_budget_max} onChange={(e) => setForm({ ...form, cliente_budget_max: e.target.value })} />
            </div>
          </div>
        )}
      </Card>

      {/* Immobile */}
      <Card>
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" /> Immobile
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SelectWithOther value={form.developer} onChange={(v) => setForm({ ...form, developer: v })} options={developers} placeholder="Developer" />
            <SelectWithOther value={form.zona} onChange={(v) => setForm({ ...form, zona: v })} options={zones} placeholder="Zona" />
          </div>
          <Input placeholder="Progetto" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} />
          <Input type="number" placeholder="Valore (AED)" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} />
        </div>
      </Card>

      {/* Stato */}
      <Card>
        <h4 className="text-white font-medium mb-4">Stato iniziale</h4>
        <div className="flex flex-wrap gap-2">
          {pipelineStati.slice(0, 4).map(st => (
            <button key={st} type="button" onClick={() => setForm({ ...form, stato: st })} className={`px-4 py-2 rounded-xl text-sm transition-all ${form.stato === st ? 'text-white' : 'text-zinc-500'}`} style={form.stato === st ? { background: theme.status[st]?.bg, color: theme.status[st]?.color } : { background: '#27272A' }}>
              {st}
            </button>
          ))}
        </div>
      </Card>

      <button type="submit" id="submitBtn" className="hidden">Submit</button>
    </form>
  );
}

// Sale Form
function SaleForm({ type, userName, clienti, onSubmit }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    developer: '', progetto: '', zona: '', valore: '',
    nuovo_cliente_nome: '', nuovo_cliente_cognome: '', nuovo_cliente_telefono: '', nuovo_cliente_email: ''
  });

  const submit = (e) => {
    e?.preventDefault();
    if (!selectedClient && !form.nuovo_cliente_nome) { alert('Seleziona o inserisci il cliente'); return; }
    if (!form.developer || !form.progetto || !form.zona || !form.valore) { alert('Compila tutti i campi dell\'immobile'); return; }
    onSubmit({
      data: form.data,
      developer: form.developer,
      progetto: form.progetto,
      zona: form.zona,
      valore: parseFloat(form.valore),
      agente: type === 'agente' ? userName : null,
      segnalatore: type === 'segnalatore' ? userName : null,
      cliente_id: selectedClient?.id,
      cliente_nome: selectedClient?.nome || form.nuovo_cliente_nome,
      nuovo_cliente_nome: form.nuovo_cliente_nome,
      nuovo_cliente_cognome: form.nuovo_cliente_cognome,
      nuovo_cliente_telefono: form.nuovo_cliente_telefono,
      nuovo_cliente_email: form.nuovo_cliente_email
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Cliente */}
      <Card>
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" /> Cliente Acquirente
        </h4>
        <ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNewClient(false); }} onCreateNew={() => { setSelectedClient(null); setShowNewClient(true); }} />
        
        {showNewClient && !selectedClient && (
          <div className="mt-4 pt-4 border-t border-[#27272A] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nome *" value={form.nuovo_cliente_nome} onChange={(e) => setForm({ ...form, nuovo_cliente_nome: e.target.value })} />
              <Input placeholder="Cognome" value={form.nuovo_cliente_cognome} onChange={(e) => setForm({ ...form, nuovo_cliente_cognome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="tel" placeholder="Telefono" value={form.nuovo_cliente_telefono} onChange={(e) => setForm({ ...form, nuovo_cliente_telefono: e.target.value })} />
              <Input type="email" placeholder="Email" value={form.nuovo_cliente_email} onChange={(e) => setForm({ ...form, nuovo_cliente_email: e.target.value })} />
            </div>
          </div>
        )}
      </Card>

      {/* Vendita */}
      <Card>
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" /> Dettagli Vendita
        </h4>
        <div className="space-y-3">
          <Input label="Data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          <SelectWithOther label="Developer *" value={form.developer} onChange={(v) => setForm({ ...form, developer: v })} options={developers} placeholder="Seleziona developer" />
          <Input label="Progetto *" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} placeholder="Nome progetto" />
          <SelectWithOther label="Zona *" value={form.zona} onChange={(v) => setForm({ ...form, zona: v })} options={zones} placeholder="Seleziona zona" />
          <Input label="Valore (AED) *" type="number" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} placeholder="es. 1500000" />
        </div>
      </Card>

      <button type="submit" id="submitBtn" className="hidden">Submit</button>
    </form>
  );
}

// ==================== CSS ANIMATIONS ====================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-slideUp { animation: slideUp 0.3s ease-out; }
  .animate-slideRight { animation: slideRight 0.3s ease-out; }
  .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
  .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
  * { -webkit-tap-highlight-color: transparent; }
  input, select, textarea { font-size: 16px !important; }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
