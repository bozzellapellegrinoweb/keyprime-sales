/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { theme, BRAND } from './lib/theme';
import * as auth from './lib/auth';
import * as apiKp from './lib/api';
import * as leadLib from './lib/leads';
import {
  zones, developers, commissions, pipelineStati, pipelineLabels, clienteStati,
  taskPriorita, motiviPerdita
} from './lib/costanti';
import {
  fmt, fmtDate, fmtDateTime, fmtShort, getWhatsAppLink, getBaseUrl,
  isOverdue, isToday, getInitials
} from './lib/format';
import {
  Toast, Avatar, StatusBadge, Card, SectionHeader, MetricCard, ProgressBar,
  EmptyState, Input, Select, Button, Modal, BottomSheet, NavItem, QuickActions
} from './components/ui';
import WorkQueue from './components/WorkQueue';
import LeadInbox from './components/LeadInbox';
import MessaggiGhl from './components/MessaggiGhl';
import ImpostazioniTab from './components/ImpostazioniTab';
import ControlloAccessi from './components/ControlloAccessi';
import { generaOffertaPdf, proprietaCompilata } from './lib/offertaPdf';
import DashboardAdmin from './components/DashboardAdmin';
import HomeOperativa from './components/HomeOperativa';
import ImmobiliTab from './components/ImmobiliTab';
import CalcolatoreRoi from './components/CalcolatoreRoi';
import Paginazione, { usePaginazione } from './components/Paginazione';
import RicercaProgetti from './components/RicercaProgetti';
import { SceltaTipiCliente, PastiglieTipi, FiltroTipiCliente } from './components/TipiCliente';
import { trasformaProgetto, luogoLeggibile } from './lib/offplan';
import { testoScheda, creaImmagineScheda, condividiScheda } from './lib/schedaWhatsapp';
import { istantaneaCatalogo, trimestreAnno, etichettaFase } from './lib/offerta';
import { Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus, Search, Phone, Mail, X, Edit2, TrendingUp, DollarSign, Target, Users, Menu, Key, Bell, MapPin, Award, User, MessageCircle, ChevronLeft, ChevronRight, Clock, FileText, Plus, Send, LayoutDashboard, PieChart, ListTodo, Settings, Building2, Home, ArrowUpRight, ArrowDownRight, Sparkles, Command, Printer, Map, List, ExternalLink, Calculator } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Initialize native plugins
const initNativePlugins = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Status bar dark with app background
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0d1116' });
      
      // Keyboard listeners for better UX
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });
    } catch (e) {
      console.log('Native plugin init error:', e);
    }
  }
};

// Haptic feedback helper
const hapticFeedback = async (style = 'light') => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light });
    } catch (e) {}
  }
};

initNativePlugins();


// Send Push Notification via OneSignal REST API (serverless /api/send-push)
// target: { type: 'admin' | 'user' | 'all', username?: string }
const sendPushNotification = async (title, message, url = null, target = { type: 'admin' }) => {
  const esito = await apiKp.inviaPush(title, message, url || 'https://portal.keyprimere.com', target);
  if (!esito.ok) console.log('Push non inviata:', esito.error);
  return esito.ok;
};

// Config
const ADMIN_EMAIL = 'bozzellapellegrino@gmail.com';

// Leaflet Config (no token needed - free!)
// Mappa: i basemap CARTO hanno iniziato a marchiare i tile con "API KEY
// REQUIRED" per l'uso senza chiave, rendendo la mappa illeggibile. Il canvas
// scuro di Esri non richiede registrazione e si accorda al tema dell'app.
const LEAFLET_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

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
  'Umm Al Quwain': { lat: 25.5647, lng: 55.5532, zoom: 11 },
  'Fujairah': { lat: 25.1288, lng: 56.3265, zoom: 11 },
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


const sendEmail = async (to, subject, html) => {
  const esito = await apiKp.inviaEmail(to, subject, html);
  if (!esito.ok) console.log('Email non inviata:', esito.error);
  return esito.ok;
};
const APP_URL = 'https://portal.keyprimere.com';
// ── Email template helpers ──────────────────────────────────────────────────
const kpEmail = (accentColor, badge, title, rows, url = APP_URL) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center"><table cellpadding="0" cellspacing="0" style="max-width:560px;width:100%"><tr><td style="background:#141920;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center"><span style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.5px;font-family:Georgia,serif">KEY<span style="color:#f59e0b">PRIME</span></span></td></tr><tr><td style="background:${accentColor};height:4px;font-size:1px;line-height:4px">&nbsp;</td></tr><tr><td style="background:white;padding:32px 32px 28px;border-radius:0 0 12px 12px"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1.5px">${badge}</p><h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0d1116;line-height:1.3">${title}</h1><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9">${rows}</table><a href="${url}" style="display:inline-block;margin-top:28px;padding:13px 28px;background:#141920;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.2px">Apri KeyPrime &rarr;</a></td></tr><tr><td style="padding:18px;text-align:center"><p style="margin:0;font-size:11px;color:#94a3b8">KeyPrime Sales &middot; <a href="mailto:info@keyprimere.com" style="color:#94a3b8;text-decoration:none">info@keyprimere.com</a></p></td></tr></table></td></tr></table></body></html>`;
const kpRow = (label, value) =>
  `<tr><td style="padding:11px 0;border-bottom:1px solid #f1f5f9"><span style="display:block;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</span><span style="display:block;margin-top:3px;font-size:15px;color:#0d1116;font-weight:500">${value}</span></td></tr>`;
const kpBig = (value, color) =>
  `<tr><td style="padding:14px 0 10px;border-bottom:1px solid #f1f5f9"><span style="font-size:30px;font-weight:800;color:${color}">${value}</span></td></tr>`;
const kpNote = (text) =>
  `<tr><td style="padding:14px 16px;background:#f8fafc;border-radius:8px;margin-top:8px;border-left:3px solid #e2e8f0"><span style="font-size:14px;color:#2b323d;line-height:1.5">${text}</span></td></tr>`;
// ─────────────────────────────────────────────────────────────────────────────

const notifyTaskCompleted = async (task, agentName) => {
  await sendPushNotification(`✅ Task completato: ${task.titolo}`, `Completato da: ${agentName}`, APP_URL, { type: 'admin' });
  await sendEmail(ADMIN_EMAIL, `✅ Task completato: ${task.titolo}`,
    kpEmail('#10b981', 'Task', `✅ ${task.titolo}`,
      kpRow('Completato da', agentName)));
};
const notifyTaskNote = async (task, agentName, note) => {
  await sendPushNotification(`💬 Nota su: ${task.titolo}`, `${agentName}: ${note}`, APP_URL, { type: 'admin' });
  await sendEmail(ADMIN_EMAIL, `💬 Nota: ${task.titolo}`,
    kpEmail('#8b5cf6', 'Nota su task', task.titolo,
      kpRow('Da', agentName) + kpNote(note)));
};
const notifyNewTaskToAgent = async (task, agentEmail, agentUsername = null) => {
  if (agentUsername) await sendPushNotification(`📋 Nuovo Task: ${task.titolo}`, `Priorità: ${task.priorita || 'normale'} | Scadenza: ${task.scadenza ? new Date(task.scadenza).toLocaleDateString('it-IT') : 'Nessuna'}`, APP_URL, { type: 'user', username: agentUsername });
  if (!agentEmail) return;
  await sendEmail(agentEmail, `📋 Nuovo Task: ${task.titolo}`,
    kpEmail('#8b5cf6', 'Nuovo Task Assegnato', task.titolo,
      kpRow('Priorità', task.priorita || 'Normale') +
      kpRow('Scadenza', task.scadenza ? new Date(task.scadenza).toLocaleDateString('it-IT') : 'Nessuna') +
      (task.descrizione ? kpNote(task.descrizione) : '')));
};
const notifyNewSaleToAdmin = async (sale, agentName, userRole = 'agente') => {
  const roleLabel = userRole === 'segnalatore' ? 'Segnalatore' : 'Agente';
  await sendPushNotification(`🎉 Vendita chiusa: ${sale.progetto}`, `${sale.valore ? sale.valore.toLocaleString() : 0} AED — ${agentName}`, APP_URL, { type: 'admin' });
  await sendEmail(ADMIN_EMAIL, `🎉 Nuova Vendita: ${sale.progetto}`,
    kpEmail('#10b981', 'Nuova Vendita Chiusa', sale.progetto,
      kpBig(`${sale.valore ? Number(sale.valore).toLocaleString('it-IT') : 0} AED`, '#10b981') +
      kpRow(roleLabel, agentName) +
      kpRow('Developer', sale.developer || 'N/A')));
};
const notifyNewLeadToAdmin = async (lead, agentName, userRole = 'agente') => {
  const roleLabel = userRole === 'segnalatore' ? 'Segnalatore' : 'Agente';
  await sendPushNotification(`🎯 Nuovo Lead: ${lead.progetto}`, `Zona: ${lead.zona || 'N/A'} — ${agentName}`, APP_URL, { type: 'admin' });
  await sendEmail(ADMIN_EMAIL, `🎯 Nuovo Lead: ${lead.progetto}`,
    kpEmail('#3b82f6', 'Nuovo Lead', lead.progetto,
      kpRow('Zona', lead.zona || 'N/A') +
      kpRow(roleLabel, agentName)));
};
const notifyNewClienteToAdmin = async (cliente, agentName, userRole = 'agente') => {
  const roleLabel = userRole === 'segnalatore' ? 'Segnalatore' : 'Agente';
  const nomeCompleto = `${cliente.nome} ${cliente.cognome || ''}`.trim();
  await sendPushNotification(`👤 Nuovo contatto: ${nomeCompleto}`, `${roleLabel}: ${agentName} | ${cliente.telefono || cliente.email || ''}`, APP_URL, { type: 'admin' });
  await sendEmail(ADMIN_EMAIL, `👤 Nuovo Contatto: ${nomeCompleto}`,
    kpEmail('#f59e0b', 'Nuovo Contatto', nomeCompleto,
      kpRow('Telefono', cliente.telefono || 'N/A') +
      kpRow('Email', cliente.email || 'N/A') +
      kpRow(roleLabel, agentName)));
};
const notifySegnalatoreConfermaInserimento = async (email, username, tipo, nome) => {
  const isLead = tipo === 'Lead';
  const color = isLead ? '#3b82f6' : '#f59e0b';
  const icon = isLead ? '🎯' : '👤';
  if (username) await sendPushNotification(`${icon} ${tipo} inserito`, `${nome} è stato registrato correttamente`, APP_URL, { type: 'user', username });
  if (!email) return;
  await sendEmail(email, `${icon} ${tipo} inserito: ${nome}`,
    kpEmail(color, `${tipo} Inserito`, nome,
      kpNote('Il tuo inserimento è stato ricevuto e sarà gestito dal team KeyPrime.')));
};
const notifySegnalatoreLeadVenduto = async (sale, segnalatoreUsername = null, segnalatoreEmail = null) => {
  if (segnalatoreUsername) await sendPushNotification(`🎉 Tuo lead venduto!`, `${sale.progetto}: ${sale.valore ? sale.valore.toLocaleString() : 'N/A'} AED`, APP_URL, { type: 'user', username: segnalatoreUsername });
  if (!segnalatoreEmail) return;
  await sendEmail(segnalatoreEmail, `🎉 Lead Convertito in Vendita: ${sale.progetto}`,
    kpEmail('#10b981', 'Il tuo lead è una vendita!', sale.progetto,
      kpBig(`${sale.valore ? Number(sale.valore).toLocaleString('it-IT') : 'N/A'} AED`, '#10b981') +
      kpNote('La tua commissione sarà calcolata e pagata a breve.')));
};

// PDF Generator
const generateClientePDF = (cliente, sales, tasks) => { const tv = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((sum, s) => sum + Number(s.valore || 0), 0); const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cliente.nome}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}h1{font-size:28px;font-weight:600;margin-bottom:8px}h2{font-size:14px;font-weight:600;color:#666;margin:24px 0 12px;text-transform:uppercase;letter-spacing:0.5px}.stats{display:flex;gap:16px;margin:24px 0}.stat{flex:1;background:#f5f5f7;padding:16px;border-radius:12px;text-align:center}.stat-val{font-size:24px;font-weight:600}.stat-label{font-size:12px;color:#666;margin-top:4px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.item{background:#f5f5f7;padding:12px 16px;border-radius:8px}.item-label{font-size:11px;color:#666;margin-bottom:2px}.item-value{font-size:14px;font-weight:500}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:10px 12px;text-align:left;font-size:13px}th{background:#f5f5f7;font-weight:500}tr:not(:last-child) td{border-bottom:1px solid #e5e5e5}</style></head><body><h1>${cliente.nome} ${cliente.cognome||''}</h1><p style="color:#666">${cliente.telefono||''} ${cliente.email?'• '+cliente.email:''}</p><div class="stats"><div class="stat"><div class="stat-val">${sales.length}</div><div class="stat-label">Lead</div></div><div class="stat"><div class="stat-val">${fmt(tv)}</div><div class="stat-label">Valore AED</div></div><div class="stat"><div class="stat-val">${cliente.stato}</div><div class="stat-label">Stato</div></div></div><h2>Informazioni</h2><div class="grid"><div class="item"><div class="item-label">Budget</div><div class="item-value">${cliente.budget_max?fmt(cliente.budget_max)+' AED':'N/A'}</div></div><div class="item"><div class="item-label">Agente</div><div class="item-value">${cliente.agente_riferimento||'N/A'}</div></div></div>${sales.length>0?'<h2>Storico Lead</h2><table><tr><th>Data</th><th>Progetto</th><th>Valore</th><th>Stato</th></tr>'+sales.map(s=>'<tr><td>'+fmtShort(s.data)+'</td><td>'+s.progetto+'</td><td>'+(s.valore>0?fmt(s.valore):'TBD')+'</td><td>'+s.stato+'</td></tr>').join('')+'</table>':''}</body></html>`; const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),500); };

// ==================== UI COMPONENTS ====================

// Toast
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
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#ffffff] border border-[#e4e0d8] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#e4e0d8]">
          <Search className="w-5 h-5 text-zinc-500" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca lead, clienti, task..." className="flex-1 bg-transparent text-ink text-lg placeholder:text-zinc-600 focus:outline-none" />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-700/50 rounded text-xs text-zinc-500">ESC</kbd>
        </div>
        
        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="p-8 text-center">
              <Command className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Digita almeno 2 caratteri per cercare</p>
              <p className="text-zinc-600 text-sm mt-2">Premi <kbd className="px-1.5 py-0.5 bg-zinc-700/50 rounded text-xs">⌘K</kbd> ovunque per aprire</p>
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
                        <p className="text-ink text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
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
                        <p className="text-ink text-sm font-medium truncate">{c.nome} {c.cognome}</p>
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
                        <p className={`text-ink text-sm font-medium truncate ${t.stato === 'completato' ? 'line-through opacity-50' : ''}`}>{t.titolo}</p>
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
        <div className="px-4 py-3 border-t border-[#e4e0d8] flex items-center justify-between text-xs text-zinc-600">
          <span>KeyPrime Search</span>
          <div className="flex items-center gap-2">
            <span>Naviga con</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-700/50 rounded">↑↓</kbd>
            <span>Seleziona con</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-700/50 rounded">↵</kbd>
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
    .logo { font-size: 28px; font-weight: 700; color: #141920; }
    .logo span { color: #A78BFA; }
    .date { color: #666; font-size: 14px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    h2 { font-size: 16px; font-weight: 600; color: #666; margin: 32px 0 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%); padding: 20px; border-radius: 12px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #141920; }
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
      <div class="stat-label">Volume Potenziale AED</div>
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
      <div class="commission-value" style="color: #22C55E">${fmt(totals.pell + totals.agPell)}</div>
      <div class="commission-label">Pellegrino (KP ${fmt(totals.pell)} + ag. ${fmt(totals.agPell)})</div>
    </div>
    <div class="commission-item">
      <div class="commission-value" style="color: #F97316">${fmt(totals.giov + totals.agGiov)}</div>
      <div class="commission-label">Giovanni (KP ${fmt(totals.giov)} + ag. ${fmt(totals.agGiov)})</div>
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

// ==================== OFFERTA PDF ====================
const KEYPRIME_LOGO = 'https://assets.cdn.filesafe.space/Yjm3Uvb0rc8mRuraj7ad/media/69c3d8f7a5f60947f53a1b8f.png';

// L'impaginazione sta in lib/offertaPdf. Qui resta solo quello che riguarda
// l'utente davanti allo schermo: la schermata di attesa, il salvataggio del
// file e cosa dirgli se qualcosa non e' riuscito.
const generateOffertaPDF = async (offerta) => {
  const velo = document.createElement('div');
  velo.style.cssText = 'position:fixed;inset:0;background:rgba(13,17,22,0.97);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
  velo.innerHTML = `
    <img src="${KEYPRIME_LOGO}" style="height:34px;margin-bottom:22px;opacity:0.9;" alt="" />
    <div style="font-size:14px;color:#fff;font-weight:600;" id="_pdfStato">Preparazione…</div>
    <div style="font-size:12px;color:#8ba6c4;margin-top:6px;" id="_pdfDettaglio"></div>
    <div style="width:260px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;margin-top:18px;">
      <div id="_pdfBarra" style="height:4px;background:#c9a84c;border-radius:2px;width:0%;transition:width 0.35s;"></div>
    </div>`;
  document.body.appendChild(velo);

  const mostraStato = (testo, dettaglio, pct) => {
    const t = document.getElementById('_pdfStato');
    const d = document.getElementById('_pdfDettaglio');
    const b = document.getElementById('_pdfBarra');
    if (t && testo) t.textContent = testo;
    if (d) d.textContent = dettaglio || '';
    if (b && pct !== undefined) b.style.width = pct + '%';
  };

  try {
    const esito = await generaOffertaPdf(offerta, { logoUrl: KEYPRIME_LOGO, onStato: mostraStato });
    if (!esito.ok) { alert(esito.errore); return; }

    const url = URL.createObjectURL(esito.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = esito.nomeFile;
    document.body.appendChild(a);
    mostraStato('Pronto', `${esito.pagine} pagine · download avviato`, 100);
    await new Promise(r => setTimeout(r, 450));
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Meglio saperlo adesso che dal cliente: il PDF c'e', la brochure no.
    if (esito.brochureNonAllegate.length) {
      alert(
        `PDF generato, ma la brochure di ${esito.brochureNonAllegate.join(', ')} non e' stata allegata.\n\n` +
        `Controlla che il link punti davvero a un file PDF.`
      );
    }
  } catch (err) {
    console.error('Errore generazione PDF:', err);
    alert('Errore nella generazione del PDF: ' + err.message);
  } finally {
    if (document.body.contains(velo)) document.body.removeChild(velo);
  }
};


// ==================== PUSH TAB (admin only) ====================
function PushTab({ users }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [targetUser, setTargetUser] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    if (target === 'user' && !targetUser) return;
    setSending(true);
    setResult(null);
    try {
      const t = target === 'user'
        ? { type: 'user', username: targetUser }
        : target === 'admin'
        ? { type: 'admin' }
        : { type: 'all' };
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), target: t })
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, text: `Inviata a ${data.recipients ?? '—'} destinatari` });
        setTitle(''); setMessage('');
      } else {
        setResult({ ok: false, text: JSON.stringify(data.error || data) });
      }
    } catch (e) {
      setResult({ ok: false, text: e.message });
    } finally {
      setSending(false);
    }
  };

  const inputCls = 'w-full bg-[#ffffff] border border-[#e4e0d8] rounded-lg px-3 py-2.5 text-ink text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors';
  const activeUsers = users.filter(u => u.ruolo !== 'admin');

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink mb-1">Invia Notifica Push</h2>
        <p className="text-sm text-zinc-500">Manda una notifica direttamente agli utenti dell'app.</p>
      </div>

      <Card>
        <div className="space-y-4">
          {/* Titolo */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Titolo</label>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Nuova proprietà disponibile" maxLength={100} />
          </div>

          {/* Messaggio */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Messaggio</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Testo della notifica…" maxLength={250} />
            <div className="text-right text-xs text-zinc-600 mt-1">{message.length}/250</div>
          </div>

          {/* Destinatari */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destinatari</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'all', label: '🌐 Tutti' },
                { v: 'admin', label: '👑 Solo Admin' },
                { v: 'user', label: '👤 Utente' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setTarget(opt.v)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${target === opt.v ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#ffffff] border-[#e4e0d8] text-zinc-400 hover:border-zinc-500'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selezione utente specifico */}
          {target === 'user' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Seleziona utente</label>
              <select className={inputCls} value={targetUser} onChange={e => setTargetUser(e.target.value)}>
                <option value="">— Scegli utente —</option>
                {activeUsers.map(u => (
                  <option key={u.username} value={u.username}>{u.nome} ({u.ruolo})</option>
                ))}
              </select>
            </div>
          )}

          {/* Feedback */}
          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {result.ok ? '✓ ' : '✗ '}{result.text}
            </div>
          )}

          {/* Bottone */}
          <button onClick={send} disabled={sending || !title.trim() || !message.trim() || (target === 'user' && !targetUser)}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold py-2.5 rounded-lg transition-colors">
            {sending ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Invio…</>
            ) : (
              <><Send className="w-4 h-4" />Invia Notifica</>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ==================== OFFERTA TAB ====================

// Il budget e' testo libero: chi scrive "MAX 800K AED" va lasciato com'e',
// chi digita "1000000" merita i separatori, altrimenti in elenco si legge
// come un codice.
function budgetLeggibile(budget) {
  const testo = String(budget || '').trim();
  if (!/^\d+$/.test(testo)) return testo;
  return `${Number(testo).toLocaleString('it-IT')} AED`;
}

function OffertaTab({ offerte, user, onCrea, onEdit, onDelete, onGeneraPDF }) {
  const myOfferte = user?.ruolo === 'admin'
    ? offerte
    : offerte.filter(o => o.agente_nome === user?.nome);

  const pagOfferte = usePaginazione(myOfferte);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-ink font-semibold text-lg">Offerte</h2>
          <p className="text-zinc-500 text-sm">{myOfferte.length} prospetti salvati</p>
        </div>
        <button onClick={onCrea} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
          style={{ background: theme.accento.fill, color: theme.accento.inkSuFill }}>
          <Plus className="w-4 h-4" /> Nuova Offerta
        </button>
      </div>
      {myOfferte.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nessuna offerta ancora</p>
          <p className="text-sm mt-1">Crea il tuo primo prospetto cliente</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
             style={{ background: theme.bg.secondary, border: `1px solid ${theme.border.subtle}` }}>
          {pagOfferte.elementi.map((o, i) => (
            <div key={o.id} className="p-4 flex items-center justify-between gap-4"
                 style={i > 0 ? { borderTop: `1px solid ${theme.border.subtle}` } : undefined}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-ink font-semibold truncate">{o.cliente_nome || 'Cliente n/d'}</span>
                  {o.budget && (
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: theme.accento.wash, color: theme.accento.text }}>
                      {budgetLeggibile(o.budget)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                  <span>{new Date(o.created_at).toLocaleDateString('it-IT')}</span>
                  <span>·</span><span>{o.agente_nome}</span>
                  {o.zona_nome && <><span>·</span><span>{o.zona_nome}</span></>}
                  <span>·</span><span>{(o.proprieta || []).length} propr.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onGeneraPDF(o)} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1"
                        style={{ background: theme.accento.fill, color: theme.accento.inkSuFill }}>
                  <Printer className="w-3 h-3" /> PDF
                </button>
                <button onClick={() => onEdit(o)} aria-label="Modifica offerta"
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center"
                        style={{ background: theme.bg.tertiary, color: theme.text.secondary }}>
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => onDelete(o.id)} aria-label="Elimina offerta"
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center"
                        style={{ background: theme.stato.critico.bg, color: theme.stato.critico.text }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          <Paginazione {...pagOfferte} nome="offerte" />
        </div>
      )}
    </div>
  );
}

// ==================== OFFERTA MODAL ====================
const EMPTY_PROP = { nome: '', zona: '', prezzo: '', specs: '', foto_urls: ['', '', ''], brochure_url: '' };

function OffertaModal({ offerta, clienti, user, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [uploading, setUploading] = useState({});
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [activePropIdx, setActivePropIdx] = useState(null);

  const [form, setForm] = useState({
    cliente_nome: offerta?.cliente_nome || '',
    cliente_id: offerta?.cliente_id || null,
    budget: offerta?.budget || '',
    zona_nome: offerta?.zona_nome || '',
    zona_descrizione: offerta?.zona_descrizione || '',
    // Finiscono stampati sul prospetto, e nessuno si ricorda di riscriverli
    // a ogni offerta: partono da quelli in scheda.
    agente_email: (offerta?.agente_email || user?.email || '').trim(),
    agente_telefono: (offerta?.agente_telefono || user?.telefono || '').trim(),
    note: offerta?.note || '',
    proprieta: offerta?.proprieta?.length
      ? offerta.proprieta.map(p => ({ ...EMPTY_PROP, ...p, foto_urls: [...(p.foto_urls?.length ? p.foto_urls : ['', '', ''])] }))
      : [{ ...EMPTY_PROP, foto_urls: ['', '', ''] }],
  });

  // Fix catalog search: use correct column names
  const searchCatalog = async (q) => {
    if (!q || q.length < 2) { setCatalogResults([]); return; }
    const { data } = await supabase
      .from('pf_projects')
      .select('id,title,location_name,location_full,price_from,images,developer_name')
      .or(`title.ilike.%${q}%,location_full.ilike.%${q}%,developer_name.ilike.%${q}%`)
      .limit(10);
    setCatalogResults(data || []);
  };

  // La ricerca restituisce poche colonne per restare leggera: developer,
  // consegna e piano di pagamento si leggono qui, alla scelta, e restano
  // attaccati all'offerta. Il prezzo di oggi e' quello che il cliente ha
  // visto, non quello che il catalogo avra' fra sei mesi.
  const pickFromCatalog = async (listing, idx) => {
    const imgs = (listing.images || []).slice(0, 3).map(i => i.medium_image_url || '').filter(Boolean);
    while (imgs.length < 3) imgs.push('');

    let istantanea = { listing_id: listing.id };
    const { data: completo } = await supabase
      .from('pf_projects')
      .select('id,title,developer_name,location_name,location_full,price_from,bedrooms,delivery_date,construction_phase,payment_plans,url,raw_data')
      .eq('id', listing.id)
      .maybeSingle();
    if (completo) istantanea = istantaneaCatalogo(completo);

    setForm(f => ({
      ...f,
      proprieta: f.proprieta.map((p, i) => i !== idx ? p : {
        ...p,
        ...istantanea,
        nome: listing.title || '',
        zona: listing.location_name || listing.location_full || '',
        prezzo: listing.price_from ? `${Number(listing.price_from).toLocaleString('it-IT')} AED` : '',
        foto_urls: imgs,
      })
    }));
    setCatalogResults([]); setCatalogSearch(''); setActivePropIdx(null);
  };

  // Upload immagine a Supabase Storage
  const uploadImage = async (file, propIdx, fotoIdx) => {
    const key = `${propIdx}_${fotoIdx}`;
    setUploading(u => ({ ...u, [key]: true }));
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filename = `${Date.now()}_${propIdx}_${fotoIdx}.${ext}`;
      const { error } = await supabase.storage.from('offerte-images').upload(filename, file, { contentType: file.type, upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from('offerte-images').getPublicUrl(filename);
        updateFoto(propIdx, fotoIdx, urlData.publicUrl);
      }
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  const uploadBrochure = async (file, propIdx) => {
    const key = `brochure_${propIdx}`;
    setUploading(u => ({ ...u, [key]: true }));
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filename = `brochure_${Date.now()}_${propIdx}.${ext}`;
      const { error } = await supabase.storage.from('offerte-images').upload(filename, file, { contentType: file.type, upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from('offerte-images').getPublicUrl(filename);
        updateProp(propIdx, 'brochure_url', urlData.publicUrl);
      }
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  // Il modello scrive meglio se sa per chi scrive: budget, immobili scelti,
  // developer e consegna sono gia' nel modulo, quindi partono con la richiesta.
  const generaDescrizione = async () => {
    if (!form.zona_nome) return;
    setErrore('');
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/genera-descrizione', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zona: form.zona_nome,
          budget: form.budget || null,
          cliente: form.cliente_nome || null,
          proprieta: form.proprieta
            .filter(p => (p.nome || '').trim())
            .map(p => ({
              nome: p.nome, prezzo: p.prezzo, developer: p.developer,
              tipologie: p.tipologie, consegna: p.consegna
            }))
        }),
      });
      const dati = await res.json().catch(() => ({}));
      if (!res.ok || !dati.descrizione) {
        setErrore(dati.error || 'Non sono riuscito a generare il testo, riprova.');
      } else {
        setForm(f => ({ ...f, zona_descrizione: dati.descrizione }));
      }
    } catch (e) {
      setErrore('Servizio non raggiungibile, riprova.');
    }
    setGeneratingDesc(false);
  };

  const updateProp = (idx, field, val) =>
    setForm(f => ({ ...f, proprieta: f.proprieta.map((p, i) => i === idx ? { ...p, [field]: val } : p) }));

  const updateFoto = (propIdx, fotoIdx, val) =>
    setForm(f => ({
      ...f,
      proprieta: f.proprieta.map((p, i) => {
        if (i !== propIdx) return p;
        const urls = [...p.foto_urls]; urls[fotoIdx] = val; return { ...p, foto_urls: urls };
      })
    }));

  const addProp = () => { if (form.proprieta.length < 3) setForm(f => ({ ...f, proprieta: [...f.proprieta, { ...EMPTY_PROP, foto_urls: ['', '', ''] }] })); };
  const removeProp = (idx) => { if (form.proprieta.length > 1) setForm(f => ({ ...f, proprieta: f.proprieta.filter((_, i) => i !== idx) })); };

  // Le righe lasciate in bianco non vanno ne' salvate ne' stampate: stesso
  // criterio che usa il generatore del PDF, cosi' il riepilogo mostra
  // esattamente quello che finira' nel documento.
  const proprietaValide = form.proprieta.filter(proprietaCompilata);
  const righeVuote = form.proprieta.length - proprietaValide.length;

  const handleSave = async () => {
    setErrore('');
    if (!proprietaValide.length) {
      setErrore('Aggiungi almeno una proprieta con nome, prezzo o foto: un prospetto vuoto non si manda a un cliente.');
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(offerta?.id ? { id: offerta.id } : {}),
        ...form,
        proprieta: proprietaValide.map(p => ({ ...p, foto_urls: p.foto_urls.filter(Boolean) })),
        agente_nome: offerta?.agente_nome || user?.nome,
        referente: offerta?.referente || user?.referente,
      };
      const esito = await onSave(payload);
      if (esito && esito.ok === false) { setErrore(esito.error || 'Salvataggio non riuscito'); return; }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-oro-500";
  const labelCls = "block text-xs text-zinc-400 mb-1 font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
           style={{ background: theme.bg.secondary, border: `1px solid ${theme.border.default}`,
                    boxShadow: '0 24px 60px rgba(15,28,53,0.22)', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 shrink-0">
          <div>
            <h2 className="text-ink font-semibold">{offerta?.id ? 'Modifica Offerta' : 'Nuova Offerta'}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Step {step} di 3</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        {/* Step bar */}
        <div className="flex px-6 pt-3 gap-2 shrink-0">
          {[1,2,3].map(s => (
            <button key={s} onClick={() => s < step && setStep(s)}
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: s <= step ? theme.accento.fill : theme.border.subtle, cursor: s < step ? 'pointer' : 'default' }} />
          ))}
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">

          {/* STEP 1 — Info */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cliente & Dettagli</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cliente</label>
                  <input list="clienti-offerta" className={inputCls} value={form.cliente_nome}
                    onChange={e => { const c = clienti.find(cl => `${cl.nome} ${cl.cognome||''}`.trim() === e.target.value); setForm(f => ({ ...f, cliente_nome: e.target.value, cliente_id: c?.id||null })); }}
                    placeholder="Nome cliente..." />
                  <datalist id="clienti-offerta">{clienti.map(c => <option key={c.id} value={`${c.nome} ${c.cognome||''}`.trim()} />)}</datalist>
                </div>
                <div>
                  <label className={labelCls}>Budget</label>
                  <input className={inputCls} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="es. MAX 800K AED" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome (agente)</label>
                  <input className={inputCls} value={offerta?.agente_nome || user?.nome || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <label className={labelCls}>Email agente</label>
                  <input className={inputCls} value={form.agente_email} onChange={e => setForm(f => ({ ...f, agente_email: e.target.value }))} placeholder="nome@keyprimere.com" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Telefono agente</label>
                <input className={inputCls} value={form.agente_telefono} onChange={e => setForm(f => ({ ...f, agente_telefono: e.target.value }))} placeholder="+971 50 340 8622" />
              </div>
              {(!form.agente_email.trim() || !form.agente_telefono.trim()) && (
                <p className="text-xs text-amber-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Email e telefono vengono stampati sul prospetto: senza, il cliente non ha modo di risponderti.
                  Compilali qui, oppure falli mettere in scheda dall'amministratore e resteranno per sempre.
                </p>
              )}
              <div>
                <label className={labelCls}>Zona / Area (es. JVC, Business Bay)</label>
                <input className={inputCls} value={form.zona_nome} onChange={e => setForm(f => ({ ...f, zona_nome: e.target.value }))} placeholder="es. JVC" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls} style={{ margin: 0 }}>Descrizione zona — "Perché scegliere {form.zona_nome || 'X'}"</label>
                  <button onClick={generaDescrizione} disabled={!form.zona_nome || generatingDesc}
                    className="text-xs text-oro-400 px-2 py-1 rounded-lg border border-oro-500/50 hover:border-oro-500 hover:bg-oro-50 disabled:opacity-40 flex items-center gap-1">
                    {generatingDesc ? '...' : '✨ Genera con AI'}
                  </button>
                </div>
                <textarea className={inputCls} rows={5} value={form.zona_descrizione}
                  onChange={e => setForm(f => ({ ...f, zona_descrizione: e.target.value }))}
                  placeholder="Prezzi competitivi, rendimenti 6-8%, community family-friendly..." />
              </div>
            </div>
          )}

          {/* STEP 2 — Proprietà */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Proprietà ({form.proprieta.length}/3)</p>
                {form.proprieta.length < 3 && (
                  <button onClick={addProp} className="text-xs text-oro-400 flex items-center gap-1 hover:text-oro-800">
                    <Plus className="w-3 h-3" /> Aggiungi
                  </button>
                )}
              </div>
              {form.proprieta.map((prop, idx) => (
                <div key={idx} className="rounded-xl p-4 space-y-3" style={{ background: theme.bg.tertiary, border: `1px solid ${theme.border.subtle}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Proprietà {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActivePropIdx(activePropIdx === idx ? null : idx)}
                        className="text-xs text-oro-400 flex items-center gap-1 px-2 py-1 rounded-lg border border-oro-500/50 hover:border-oro-500 hover:bg-oro-50">
                        <Search className="w-3 h-3" /> Cerca nel catalogo
                      </button>
                      {form.proprieta.length > 1 && (
                        <button onClick={() => removeProp(idx)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>

                  {activePropIdx === idx && (
                    <div className="space-y-2">
                      <input className={inputCls} value={catalogSearch} autoFocus
                        onChange={e => { setCatalogSearch(e.target.value); searchCatalog(e.target.value); }}
                        placeholder="Cerca per nome, zona, developer..." />
                      {catalogResults.length > 0 && (
                        <div className="rounded-lg overflow-hidden max-h-48 overflow-y-auto" style={{ border: `1px solid ${theme.border.subtle}` }}>
                          {catalogResults.map(l => (
                            <button key={l.id} onClick={() => pickFromCatalog(l, idx)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-700/80 border-b border-zinc-700 last:border-0 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-ink font-medium truncate">{l.title}</div>
                                <div className="text-zinc-500 text-xs">{l.location_name || l.location_full} · {l.developer_name}</div>
                              </div>
                              {l.price_from && <span className="text-oro-400 text-xs shrink-0">{Number(l.price_from).toLocaleString()} AED</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {catalogSearch.length >= 2 && catalogResults.length === 0 && (
                        <p className="text-xs text-zinc-500 px-1">Nessun risultato — inserisci manualmente</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nome progetto</label>
                      <input className={inputCls} value={prop.nome} onChange={e => updateProp(idx, 'nome', e.target.value)} placeholder="es. BINGHATTI TULIP" />
                    </div>
                    <div>
                      <label className={labelCls}>Zona</label>
                      <input className={inputCls} value={prop.zona} onChange={e => updateProp(idx, 'zona', e.target.value)} placeholder="es. JVC" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Prezzo</label>
                    <input className={inputCls} value={prop.prezzo} onChange={e => updateProp(idx, 'prezzo', e.target.value)} placeholder="es. 715,000 AED" />
                  </div>

                  {/* Quello che il catalogo sa gia': finisce nel PDF senza
                      che nessuno lo riscriva. Se manca, la sezione sparisce. */}
                  {(prop.developer || prop.consegna || prop.tipologie || prop.payment_plans) && (
                    <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
                      <p className="text-oro-400 font-medium mb-1.5">Dal catalogo — finisce nel PDF</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                        {prop.developer && <div>Developer: <span className="text-zinc-200">{prop.developer}</span></div>}
                        {prop.tipologie && <div>Tipologie: <span className="text-zinc-200">{prop.tipologie}</span></div>}
                        {prop.consegna && <div>Consegna: <span className="text-zinc-200">{trimestreAnno(prop.consegna)}</span></div>}
                        {prop.fase && <div>Stato: <span className="text-zinc-200">{etichettaFase(prop.fase) || prop.fase}</span></div>}
                        {prop.payment_plans?.plans?.[0]?.summary && (
                          <div className="col-span-2">Piano di pagamento: <span className="text-zinc-200">
                            {prop.payment_plans.plans[0].summary.down_payment}% acconto · {prop.payment_plans.plans[0].summary.handover}% alla consegna
                          </span></div>
                        )}
                        {prop.lat && <div className="col-span-2 text-zinc-500">Mappa inclusa</div>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Affitto annuo atteso — facoltativo</label>
                      <input className={inputCls} value={prop.affitto_annuo || ''} onChange={e => updateProp(idx, 'affitto_annuo', e.target.value)} placeholder="es. 65,000 AED" />
                    </div>
                    <div>
                      <label className={labelCls}>Spese annue — facoltativo</label>
                      <input className={inputCls} value={prop.spese_annue || ''} onChange={e => updateProp(idx, 'spese_annue', e.target.value)} placeholder="service charge, gestione" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 -mt-1">
                    Compilando l'affitto, il PDF calcola il rendimento lordo (e il netto se metti le spese) e stampa
                    i dati da cui arriva. Lasciandoli vuoti, la sezione non compare: nessuna proiezione inventata.
                  </p>
                  <div>
                    <label className={labelCls}>Specifiche (separate da ; o a capo)</label>
                    <textarea className={inputCls} rows={3} value={prop.specs} onChange={e => updateProp(idx, 'specs', e.target.value)}
                      placeholder="STUDIO 304 SQFT; ARREDATO; GYM; PISCINA; VISTA BURJ KHALIFA; PIANO 24; HANDOVER 2026" />
                  </div>
                  <div>
                    <label className={labelCls}>Foto (carica o inserisci URL — max 3)</label>
                    <div className="space-y-2">
                      {[0,1,2].map(fi => {
                        const uploadKey = `${idx}_${fi}`;
                        return (
                          <div key={fi} className="flex gap-2 items-center">
                            <input className={`${inputCls} flex-1`} value={prop.foto_urls[fi] || ''}
                              onChange={e => updateFoto(idx, fi, e.target.value)}
                              placeholder={`Foto ${fi+1} — URL o carica ↓`} />
                            <label className="shrink-0 cursor-pointer px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-700/50 hover:bg-zinc-600/50 relative">
                              {uploading[uploadKey] ? '...' : '📁'}
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], idx, fi)} />
                            </label>
                            {prop.foto_urls[fi] && <img src={prop.foto_urls[fi]} className="w-8 h-8 object-cover rounded shrink-0" alt="" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Brochure PDF (opzionale — verrà allegata al PDF generato)</label>
                    <div className="flex gap-2 items-center">
                      <input className={`${inputCls} flex-1`} value={prop.brochure_url || ''}
                        onChange={e => updateProp(idx, 'brochure_url', e.target.value)}
                        placeholder="URL brochure PDF o carica ↓" />
                      <label className={`shrink-0 cursor-pointer px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 relative ${uploading[`brochure_${idx}`] ? 'bg-zinc-700/50 text-zinc-400 cursor-not-allowed' : 'text-zinc-300 bg-zinc-700/50 hover:bg-zinc-600/50'}`}>
                        {uploading[`brochure_${idx}`] ? (
                          <>
                            <svg className="animate-spin" style={{width:13,height:13,flexShrink:0}} viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            <span>Caricamento…</span>
                          </>
                        ) : '📄 Carica PDF'}
                        <input type="file" accept="application/pdf" disabled={uploading[`brochure_${idx}`]} className="absolute inset-0 opacity-0 cursor-pointer w-full"
                          onChange={e => e.target.files?.[0] && uploadBrochure(e.target.files[0], idx)} />
                      </label>
                      {prop.brochure_url && !uploading[`brochure_${idx}`] && <span className="text-green-400 text-xs shrink-0">✓ PDF caricato</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — Riepilogo */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Riepilogo</p>
              <div className="rounded-xl p-4 space-y-3" style={{ background: theme.bg.tertiary, border: `1px solid ${theme.border.subtle}` }}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-zinc-500">Cliente:</span> <span className="text-ink ml-1">{form.cliente_nome || '—'}</span></div>
                  <div><span className="text-zinc-500">Budget:</span> <span className="text-ink ml-1">{form.budget || '—'}</span></div>
                  <div><span className="text-zinc-500">Zona:</span> <span className="text-ink ml-1">{form.zona_nome || '—'}</span></div>
                  <div><span className="text-zinc-500">Consulente:</span> <span className="text-ink ml-1">{offerta?.agente_nome || user?.nome}</span></div>
                  <div><span className="text-zinc-500">Email:</span> <span className={form.agente_email ? 'text-ink ml-1' : 'text-amber-400 ml-1'}>{form.agente_email || 'mancante'}</span></div>
                  <div><span className="text-zinc-500">Tel:</span> <span className={form.agente_telefono ? 'text-ink ml-1' : 'text-amber-400 ml-1'}>{form.agente_telefono || 'mancante'}</span></div>
                </div>
                <div className="pt-2 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-2">
                    Proprietà nel PDF:{righeVuote > 0 && <span className="text-zinc-600"> ({righeVuote} {righeVuote === 1 ? 'riga vuota verrà scartata' : 'righe vuote verranno scartate'})</span>}
                  </p>
                  {proprietaValide.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className="w-5 h-5 rounded-full bg-oro-500/25 text-oro-400 text-xs flex items-center justify-center font-bold shrink-0">{i+1}</span>
                      <span className="text-ink font-medium truncate">{p.nome || 'N/D'}</span>
                      <span className="text-zinc-500 truncate">{p.zona}</span>
                      <span className="text-oro-400 shrink-0">{p.prezzo}</span>
                      <span className="text-zinc-600 text-xs shrink-0">{p.foto_urls.filter(Boolean).length} foto</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Al salvataggio il PDF (A4 verticale) viene generato e scaricato: copertina, pagina sulla zona,
                confronto fra le proprietà, una scheda per ciascuna e le brochure in coda.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {errore && (
          <div className="px-6 pt-3 shrink-0">
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errore}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700 shrink-0">
          <button onClick={step > 1 ? () => setStep(s => s-1) : onClose} className="text-sm text-zinc-400 hover:text-ink px-4 py-2">
            {step > 1 ? '← Indietro' : 'Annulla'}
          </button>
          <div className="flex gap-3">
            {step < 3 && (
              <button onClick={() => setStep(s => s+1)} className="px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: theme.accento.fill, color: theme.accento.inkSuFill }}>
                Avanti →
              </button>
            )}
            {step === 3 && (
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: theme.accento.fill, color: theme.accento.inkSuFill }}>
                {saving ? 'Salvataggio...' : '💾 Salva e Genera PDF'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
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
  const [clienteFilters, setClienteFilters] = useState({ search: '', stato: '', tipi: [] });
  const [periodFilter, setPeriodFilter] = useState('all'); // all, 30, 60, 90
  const [showAgentDetail, setShowAgentDetail] = useState(null);
  
  // Saved Listings (PropertyFinder)
  const [savedListings, setSavedListings] = useState([]);

  // Impostazioni operative (SLA, rotazione, mappature GHL)
  const [impostazioni, setImpostazioni] = useState({});

  // Offerte
  const [offerte, setOfferte] = useState([]);
  const [showOffertaModal, setShowOffertaModal] = useState(null);
  
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

  // Riapertura app: il ruolo viene riletto dal server, non dal localStorage.
  // Prima bastava modificare il localStorage per presentarsi come admin.
  useEffect(() => {
    let annullato = false;
    (async () => {
      const esito = await auth.ripristinaSessione();
      if (annullato) return;
      if (!esito.ok) { setView('login'); return; }
      applicaUtente(esito.user);
    })();
    return () => { annullato = true; };
  }, []);

  // Porta l'utente nella vista giusta in base al ruolo verificato.
  const applicaUtente = (u) => {
    setUser(u);
    setActiveTab(u.ruolo === 'admin' ? 'dashboard' : 'oggi');
    // agente_admin lavora nella vista agente
    const vista = u.ruolo === 'admin' ? 'admin' : (u.ruolo === 'agente_admin' ? 'agente' : u.ruolo);
    setView(vista);
    if (u.must_change_password) setShowPasswordModal(true);
    registraSuOneSignal(u);
  };

  const registraSuOneSignal = (u) => {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.login(u.username);
        await OneSignal.User.addTag('ruolo', u.ruolo);
        await OneSignal.User.addTag('username', u.username);
        if (u.email) await OneSignal.User.addTag('email', u.email);
      } catch (e) { console.log('OneSignal:', e); }
    });
  };
  
  // Data Loading
  const loadSales = async () => { setLoading(true); const { data } = await supabase.from('sales_with_commissions').select('*').order('created_at', { ascending: false }); setSales(data || []); setLoading(false); };
  const loadUsers = async () => { setUsers(await auth.caricaTeam()); };
  const loadClienti = async () => { const { data } = await supabase.from('clienti').select('*').order('created_at', { ascending: false }); setClienti(data || []); };
  const loadTasks = async () => { const { data } = await supabase.from('tasks').select('*').order('scadenza', { ascending: true }); setTasks(data || []); };
  const loadActivities = async () => { const { data } = await supabase.from('lead_activities').select('*').order('created_at', { ascending: false }); setActivities(data || []); };
  const loadFollowUps = async () => { const { data } = await supabase.from('follow_ups').select('*').order('data_reminder', { ascending: true }); setFollowUps(data || []); };
  const loadSavedListings = async () => {
    const { data } = await supabase.from('saved_listings').select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setSavedListings(data || []);
  };
  const loadOfferte = async () => {
    const { data } = await supabase.from('offerte').select('*').order('created_at', { ascending: false });
    setOfferte(data || []);
  };
  const loadImpostazioni = async () => { setImpostazioni(await leadLib.caricaImpostazioni()); };

  useEffect(() => { if (user) { loadSales(); loadClienti(); loadTasks(); loadActivities(); loadFollowUps(); loadSavedListings(); loadOfferte(); loadImpostazioni(); loadUsers(); }}, [user]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => loadSales())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clienti' }, () => loadClienti())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Global refresh function
  const refreshAllData = async () => {
    setLoading(true);
    showToast('Aggiornamento...');
    await Promise.all([
      loadSales(),
      loadClienti(),
      loadTasks(),
      loadActivities(),
      loadFollowUps(),
      loadSavedListings(),
      loadOfferte(),
      loadImpostazioni(),
      loadUsers()
    ]);
    setLoading(false);
    showToast('Dati aggiornati ✓');
  };

  // Auth Handlers
  // La password non viene piu' confrontata dal client: la verifica bcrypt
  // avviene sul database, che restituisce un token di sessione.
  const handleLogin = async (username, password) => {
    setLoading(true); setError(null);
    const esito = await auth.login(username, password);
    setLoading(false);
    if (!esito.ok) { setError(esito.error); return; }
    applicaUtente(esito.user);
  };

  const handleLogout = async () => {
    setUser(null); setView('login'); setMobileMenuOpen(false);
    await auth.logout();
  };

  const changePassword = async (vecchia, nuova) => {
    const esito = await auth.cambiaPassword(vecchia, nuova);
    if (!esito.ok) return esito;
    setUser(u => (u ? { ...u, must_change_password: false } : u));
    setShowPasswordModal(false);
    showToast('Password aggiornata');
    return { ok: true };
  };

  // Saved Listings Handlers
  const saveListing = async (listing) => {
    const { error } = await supabase.from('saved_listings').insert([{
      property_id: listing.project_id,
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
      pf_url: listing.url,
      completion_status: listing.construction_phase_key,
      agent_name: listing.developer?.name,
      agent_email: null,
      description: listing.title,
      created_by: user?.nome,
      user_id: user?.id, // Track which user saved this
      property_data: listing
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
      inserted_as: user?.ruolo,
      assegnato_a: user?.nome,
      fonte: 'Off-Plan'
    }]);
    
    // Notifica email per nuovo lead (solo se non è admin a creare)
    if (user?.ruolo !== 'admin') {
      await notifyNewLeadToAdmin({ progetto: leadData.progetto, zona: leadData.zona }, user?.nome, user?.ruolo);
      if (user?.ruolo === 'segnalatore') await notifySegnalatoreConfermaInserimento(user?.email, user?.username, 'Lead', leadData.progetto);
    }
    
    loadSales();
    showToast('Lead creato da Off-Plan');
  };

  // Sales Handlers
  const addLead = async (ld) => {
    if (submitting) return;
    setSubmitting(true);
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
        inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: ld.stato || 'lead', cliente_id,
        assegnato_a: ld.agente || user?.nome, fonte: 'Inserimento manuale'
      }]);
      if (error) { console.error('Insert error:', error); showToast('Errore: ' + error.message); setSubmitting(false); return; }
      if (user?.ruolo !== 'admin') {
        await notifyNewLeadToAdmin({ progetto: ld.progetto, zona: ld.zona }, user?.nome, user?.ruolo);
        if (user?.ruolo === 'segnalatore') await notifySegnalatoreConfermaInserimento(user?.email, user?.username, 'Lead', ld.progetto);
      }
      showToast('Lead aggiunto'); setShowForm(null); loadSales(); loadClienti();
    } catch (err) { console.error('addLead error:', err); showToast('Errore salvataggio'); }
    setSubmitting(false);
  };

  const addSale = async (sd) => {
    if (submitting) return;
    setSubmitting(true);
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
      if (error) { console.error('Insert error:', error); showToast('Errore: ' + error.message); setSubmitting(false); return; }
      showToast('Vendita registrata'); setShowForm(null); loadSales(); loadClienti();
    } catch (err) { console.error('addSale error:', err); showToast('Errore salvataggio'); }
    setSubmitting(false);
  };

  const convertLeadToSale = async (id, v) => {
    const sale = sales.find(s => s.id === id);
    if (sale?.cliente_id) await supabase.from('clienti').update({ stato: 'acquistato' }).eq('id', sale.cliente_id);
    await supabase.from('sales').update({ stato: 'venduto', valore: v }).eq('id', id);
    const updatedSale = { ...sale, valore: v, stato: 'venduto' };
    await notifyNewSaleToAdmin(updatedSale, sale?.agente || sale?.segnalatore || 'N/A', sale?.segnalatore && !sale?.agente ? 'segnalatore' : 'agente');
    if (sale?.segnalatore) {
      const { data: sg } = await supabase.from('team_members').select('email, username').eq('nome', sale.segnalatore).maybeSingle();
      if (sg) await notifySegnalatoreLeadVenduto(updatedSale, sg.username, sg.email);
    }
    setConvertingSale(null); setShowLeadDetail(null); showToast('Vendita confermata!'); loadSales(); loadClienti();
  };

  const updateSale = async (id, u) => {
    const s = sales.find(x => x.id === id);
    
    // Notifica email per vendita chiusa
    if (u.stato === 'vinto' && s?.stato !== 'vinto') {
      await notifyNewSaleToAdmin(s, s.agente || s.segnalatore || 'N/A', s?.segnalatore && !s?.agente ? 'segnalatore' : 'agente');
      if (s?.segnalatore) {
        const { data: sg } = await supabase.from('team_members').select('email, username').eq('nome', s.segnalatore).maybeSingle();
        if (sg) await notifySegnalatoreLeadVenduto(s, sg.username, sg.email);
      }
    }
    
    // Notifica push + email per lead incassato
    if (u.stato === 'incassato' && s?.stato !== 'incassato') {
      await sendPushNotification(`💰 Incasso: ${s.progetto}`, `${fmt(s.valore)} AED registrato`, APP_URL, { type: 'admin' });
      await sendEmail(ADMIN_EMAIL, `💰 Incasso: ${s.progetto}`,
        kpEmail('#10b981', 'Incasso Registrato', s.progetto,
          kpBig(`${fmt(s.valore)} AED`, '#10b981') +
          kpRow('Agente', s.agente || s.segnalatore || 'N/A')));
    }

    if (u.pagato === true && !s?.pagato) {
      const tn = s.agente || s.segnalatore;
      if (tn) {
        const { data: tu } = await supabase.from('team_members').select('*').eq('nome', tn).maybeSingle();
        if (tu) {
          const isAdmin = tu.ruolo === 'agente_admin';
          const agRate = isAdmin ? (s.referente === 'Giovanni' ? 0.7 : 0.3) : (s.agente && tu.nome === s.agente ? 0.7 : 0.3);
          const ca = Number(s.valore) * (s.commission_pct || 5) / 100 * agRate;
          await sendPushNotification(`💰 Commissione pagata!`, `${s.progetto}: ${fmt(ca)} AED`, APP_URL, { type: 'user', username: tu.username });
          if (tu.email) await sendEmail(tu.email, '💰 Commissione Pagata!',
            kpEmail('#f59e0b', 'Commissione Pagata', s.progetto,
              kpBig(`${fmt(ca)} AED`, '#f59e0b') +
              kpNote('Il pagamento è stato registrato. Grazie per il tuo lavoro!')));
        }
      }
    }
    
    console.log('Updating sale:', id, u);
    const { error } = await supabase.from('sales').update(u).eq('id', id);
    if (error) {
      console.error('Update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      showToast('Errore: ' + (error.message || error.details || 'Sconosciuto'));
      return;
    }
    await loadSales();
    showToast('Salvato');

    // GHL deve vedere lo stesso stato del portale, altrimenti le automazioni
    // girano su dati vecchi. Non blocca l'agente: se GHL non e' configurato o
    // non risponde, l'errore finisce in ghl_sync_log.
    if (u.stato && u.stato !== s?.stato) {
      apiKp.sincronizzaGhlInSilenzio({ saleId: id });
    }
  };

  // Ogni eliminazione ora controlla l'esito: prima l'app annunciava
  // "Eliminato" anche quando il database aveva rifiutato la cancellazione.
  const deleteSale = async (id, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Eliminare questo lead? Spariscono anche le attivita e i follow-up collegati.')) return;
    const esito = await leadLib.eliminaLead(id);
    if (!esito.ok) { showToast(esito.error, 'error'); return; }
    setShowLeadDetail(null);
    await loadSales();
    showToast('Lead eliminato');
  };

  // Cliente Handlers
  const createCliente = async (d) => {
    const { data: creato } = await supabase
      .from('clienti')
      .insert([{ ...d, created_by: user?.nome, referente: user?.referente, assegnato_a: d.assegnato_a || user?.nome }])
      .select()
      .single();
    if (creato?.id) apiKp.sincronizzaGhlInSilenzio({ clienteId: creato.id });
    if (user?.ruolo !== 'admin') {
      await notifyNewClienteToAdmin(d, user?.nome, user?.ruolo);
      if (user?.ruolo === 'segnalatore') await notifySegnalatoreConfermaInserimento(user?.email, user?.username, 'Contatto', `${d.nome} ${d.cognome || ''}`.trim());
    }
    loadClienti(); setShowClienteModal(null); showToast('Cliente creato');
  };
  const updateCliente = async (id, d) => {
    await supabase.from('clienti').update(d).eq('id', id);

    if (d.assegnato_a) {
      await supabase.from('sales').update({ assegnato_a: d.assegnato_a }).eq('cliente_id', id);
    }

    await Promise.all([loadClienti(), loadSales()]);
    setShowClienteModal(null);
    if (showClienteDetail?.id === id) setShowClienteDetail(prev => ({ ...prev, ...d }));
    showToast('Salvato');
  };
  // Un cliente con lead, offerte o immobili salvati non si puo' cancellare
  // finche' quelle righe esistono: i vincoli del database lo impediscono, a
  // protezione dello storico vendite. Qui si dice esattamente cosa andrebbe
  // perso, e solo dopo conferma si rimuove tutto nell'ordine giusto.
  const deleteCliente = async (id, skipConfirm = false) => {
    const dip = await leadLib.dipendenzeCliente(id);
    const collegati = dip.ok
      ? [
          dip.lead ? `${dip.lead} lead` : null,
          dip.offerte ? `${dip.offerte} offerte` : null,
          dip.immobili_salvati ? `${dip.immobili_salvati} immobili salvati` : null,
          dip.task ? `${dip.task} task` : null
        ].filter(Boolean)
      : [];

    if (!skipConfirm) {
      const avviso = collegati.length
        ? `Eliminando questo cliente spariscono anche: ${collegati.join(', ')}.` +
          (dip.lead_venduti ? `\n\nATTENZIONE: ${dip.lead_venduti} sono vendite chiuse, e usciranno dalle commissioni.` : '') +
          '\n\nProcedere?'
        : 'Eliminare questo cliente?';
      if (!window.confirm(avviso)) return;
    }

    const esito = await leadLib.eliminaCliente(id);
    if (!esito.ok) { showToast(esito.error, 'error'); return; }

    await Promise.all([loadClienti(), loadSales(), loadOfferte(), loadSavedListings()]);
    setShowClienteDetail(null);
    showToast('Cliente eliminato');
  };

  // Task Handlers
  const createTask = async (d) => {
    await supabase.from('tasks').insert([{ ...d, created_by: user?.nome }]);
    // Notifica push + email per nuovo task assegnato
    if (d.assegnato_a) {
      const { data: agentData } = await supabase.from('team_members').select('email, username').eq('nome', d.assegnato_a).maybeSingle();
      await notifyNewTaskToAgent(d, agentData?.email, agentData?.username);
    }
    loadTasks(); setShowTaskModal(null); showToast('Task creato');
  };
  const updateTask = async (id, d) => { await supabase.from('tasks').update(d).eq('id', id); loadTasks(); setShowTaskModal(null); showToast('Salvato'); };
  const completeTask = async (id) => { 
    const task = tasks.find(t => t.id === id); 
    await supabase.from('tasks').update({ stato: 'completato', completed_at: new Date().toISOString() }).eq('id', id); 
    // Notifica email per task completato (per admin)
    if (task && user?.ruolo !== 'admin') {
      await notifyTaskCompleted(task, user?.nome); 
    }
    showToast('Completato!'); loadTasks(); 
  };
  const addTaskNote = async (id, note) => { const task = tasks.find(t => t.id === id); await supabase.from('tasks').update({ note }).eq('id', id); if (task && user?.ruolo !== 'admin') await notifyTaskNote(task, user?.nome, note); loadTasks(); setShowNoteModal(null); showToast('Nota inviata'); };
  const deleteTask = async (id) => {
    if (!window.confirm('Eliminare questo task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    loadTasks();
    showToast('Task eliminato');
  };

  // Activity Handlers (Lead Notes/Activities)
  const addActivity = async (saleId, tipo, contenuto) => {
    await supabase.from('lead_activities').insert([{ 
      sale_id: saleId, 
      tipo, 
      contenuto, 
      created_by: user?.nome 
    }]);
    loadActivities();
    showToast('Attività registrata');
  };
  const deleteActivity = async (id) => {
    const { error } = await supabase.from('lead_activities').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    loadActivities();
  };

  // Follow-up Handlers
  const createFollowUp = async (data) => {
    await supabase.from('follow_ups').insert([{ 
      ...data, 
      assegnato_a: data.assegnato_a || user?.nome 
    }]);
    loadFollowUps();
    showToast('Follow-up programmato');
  };
  const completeFollowUp = async (id, esito) => {
    await leadLib.completaFollowUp(id, esito);
    loadFollowUps();
    showToast('Follow-up completato');
  };
  const deleteFollowUp = async (id) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    loadFollowUps();
  };

  // Programma il prossimo contatto e porta la data sul lead, cosi' la coda di
  // lavoro e i promemoria la vedono senza rileggere tutti i follow-up.
  const programmaFollowUp = async (saleId, clienteId, giorni, tipo, nota) => {
    const esito = await leadLib.programmaFollowUp({
      saleId, clienteId, giorni, tipo, nota,
      assegnatoA: user?.nome, creatoDa: user?.nome
    });
    if (!esito.ok) { showToast(esito.error || 'Non riuscito', 'error'); return esito; }
    await Promise.all([loadFollowUps(), loadSales()]);
    showToast(giorni === 1 ? 'Richiamo fissato per domani' : `Richiamo fissato fra ${giorni} giorni`);
    return esito;
  };

  // ---- Coda di lavoro --------------------------------------------------
  const sla = impostazioni.sla || leadLib.SLA_PREDEFINITO;

  const codaDiLavoro = leadLib.costruisciCoda({
    leads: sales,
    followUps,
    clienti,
    nomeUtente: user?.nome,
    sla,
    soloMiei: user?.ruolo !== 'admin'
  });

  // Chiude una voce della coda: registra com'e' andata, archivia il follow-up
  // e, se richiesto, fissa subito quello successivo.
  const eseguiVoceCoda = async (voce, { tipo, nota, prossimoFollowUp }) => {
    const saleId = voce.lead?.id ?? voce.followUp?.sale_id;
    const clienteId = voce.lead?.cliente_id ?? voce.followUp?.cliente_id;

    if (saleId) {
      await leadLib.registraAttivita({
        saleId,
        tipo: tipo || 'call',
        contenuto: nota?.trim() || `${leadLib.TIPI_ATTIVITA.find(t => t.id === tipo)?.label || 'Contatto'} effettuato`,
        autore: user?.nome
      });
    }
    if (voce.followUp) await leadLib.completaFollowUp(voce.followUp.id, nota?.trim() || null);

    if (prossimoFollowUp) {
      await leadLib.programmaFollowUp({
        saleId, clienteId, giorni: prossimoFollowUp, tipo: 'call',
        assegnatoA: user?.nome, creatoDa: user?.nome
      });
    } else if (saleId) {
      // Senza prossimo passo il lead resta scoperto: la coda lo ripescera'.
      await supabase.from('sales').update({ prossima_azione_at: null }).eq('id', saleId);
    }

    await Promise.all([loadActivities(), loadFollowUps(), loadSales()]);
    showToast(prossimoFollowUp ? 'Registrato, prossimo contatto fissato' : 'Registrato');
  };

  const rimandaVoceCoda = async (voce, giorni) => {
    const quando = leadLib.fraGiorni(giorni);
    if (voce.followUp) {
      await supabase.from('follow_ups')
        .update({ data_reminder: quando.data_reminder, ora_reminder: quando.ora_reminder, reminder_inviato_at: null })
        .eq('id', voce.followUp.id);
      if (voce.followUp.sale_id) {
        await supabase.from('sales')
          .update({ prossima_azione_at: `${quando.data_reminder}T${quando.ora_reminder}:00` })
          .eq('id', voce.followUp.sale_id);
      }
    } else if (voce.lead) {
      await leadLib.programmaFollowUp({
        saleId: voce.lead.id, clienteId: voce.lead.cliente_id, giorni,
        tipo: 'call', assegnatoA: user?.nome, creatoDa: user?.nome
      });
    }
    await Promise.all([loadFollowUps(), loadSales()]);
    showToast(giorni === 1 ? 'Rimandato a domani' : `Rimandato di ${giorni} giorni`);
  };

  // ---- Assegnazione ----------------------------------------------------
  const assegnaLeads = async (ids, agente) => {
    const esito = await leadLib.assegnaLead(ids, agente);
    if (!esito.ok) { showToast(esito.error || 'Non riuscito', 'error'); return; }
    await loadSales();
    showToast(`${esito.aggiornati} lead assegnati a ${agente}`);

    // L'agente deve saperlo subito, non al prossimo accesso.
    const destinatario = users.find(u => u.nome === agente);
    if (destinatario?.username) {
      await sendPushNotification(
        ids.length === 1 ? 'Nuovo lead assegnato' : `${ids.length} nuovi lead assegnati`,
        'Apri il portale e guarda la scheda Oggi',
        APP_URL,
        { type: 'user', username: destinatario.username }
      );
    }
  };

  const assegnaRotazione = async (ids) => {
    const assegnati = [];
    for (const id of ids) {
      const esito = await leadLib.assegnaARotazione(id, user?.nome);
      if (esito.ok) assegnati.push(esito.agente);
      else { showToast(esito.error || 'Rotazione non riuscita', 'error'); break; }
    }
    await loadSales();
    if (assegnati.length) {
      showToast(`${assegnati.length} lead distribuiti a rotazione`);
      for (const nome of [...new Set(assegnati)]) {
        const quanti = assegnati.filter(a => a === nome).length;
        const destinatario = users.find(u => u.nome === nome);
        if (destinatario?.username) {
          await sendPushNotification(
            quanti === 1 ? 'Nuovo lead assegnato' : `${quanti} nuovi lead assegnati`,
            'Apri il portale e guarda la scheda Oggi',
            APP_URL,
            { type: 'user', username: destinatario.username }
          );
        }
      }
    }
  };

  // Agenti che entrano nella rotazione dei lead
  const agentiAttivi = users.filter(u => u.attivo && (u.ruolo === 'agente' || u.ruolo === 'agente_admin'));

  // Il lead mostrato nella scheda segue sempre i dati freschi di `sales`.
  const leadInScheda = showLeadDetail
    ? (sales.find(x => x.id === showLeadDetail.id) || showLeadDetail)
    : null;

  // Gestione team: passa dalle RPC, che verificano il ruolo admin sul server.
  const saveUser = async (d) => {
    const esito = await auth.salvaUtente(d);
    if (!esito.ok) { showToast(esito.error || 'Non riuscito', 'error'); return esito; }
    await loadUsers();
    setShowUserModal(null);
    showToast(d.id ? 'Utente aggiornato' : 'Utente creato');
    return esito;
  };

  // Un agente che lascia l'agenzia va disattivato, non cancellato: le vendite
  // e le commissioni restano attribuite a lui.
  const setUserActive = async (id, attivo) => {
    const esito = await auth.impostaAttivo(id, attivo);
    if (!esito.ok) { showToast(esito.error || 'Non riuscito', 'error'); return; }
    await loadUsers();
    showToast(attivo ? 'Accesso riattivato' : 'Accesso disattivato');
  };

  // Offerta handlers
  const saveOfferta = async (data) => {
    let error;
    if (data.id) {
      const { id, ...rest } = data;
      ({ error } = await supabase.from('offerte').update(rest).eq('id', id));
    } else {
      ({ error } = await supabase.from('offerte').insert([data]));
    }
    if (error) {
      showToast(`Offerta non salvata: ${error.message}`, 'error');
      return { ok: false, error: error.message };
    }
    await loadOfferte();
    showToast('Offerta salvata');
    return { ok: true };
  };
  const deleteOfferta = async (id) => {
    if (!window.confirm('Eliminare questa offerta?')) return;
    const { error } = await supabase.from('offerte').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    await loadOfferte();
    showToast('Offerta eliminata');
  };

  // Computed Data
  const filteredSales = sales.filter(s => {
    if (filters.search && !`${s.progetto} ${s.developer} ${s.agente} ${s.cliente_nome}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.stato && s.stato !== filters.stato) return false;
    return true;
  });
  
  const filteredClienti = clienti.filter(c => {
    if (clienteFilters.search && !`${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase().includes(clienteFilters.search.toLowerCase())) return false;
    if (clienteFilters.stato && c.stato !== clienteFilters.stato) return false;
    // Le categorie sono in OR: "proprietario oppure informatore" e' la domanda
    // che si fa davvero (chi puo' portarmi un immobile), non l'intersezione.
    if (clienteFilters.tipi?.length && !clienteFilters.tipi.some(t => (c.tipi || []).includes(t))) return false;
    return true;
  });

  // I numeri accanto alle categorie contano su tutta la rubrica, non su
  // quella gia' filtrata: servono a decidere se vale la pena filtrare.
  const conteggiTipiCliente = useMemo(() => {
    const m = {};
    for (const c of clienti) for (const t of (c.tipi || [])) m[t] = (m[t] || 0) + 1;
    return m;
  }, [clienti]);

  const myPendingTasks = tasks.filter(t => t.stato === 'pending' && (user?.ruolo === 'admin' || t.assegnato_a === user?.nome));
  const overdueTasks = myPendingTasks.filter(t => isOverdue(t.scadenza));
  const todayTasks = myPendingTasks.filter(t => isToday(t.scadenza));
  
  // Follow-up reminders
  const myFollowUps = followUps.filter(f => !f.completato && (user?.ruolo === 'admin' || f.assegnato_a === user?.nome));
  const todayFollowUps = myFollowUps.filter(f => isToday(f.data_reminder));
  const overdueFollowUps = myFollowUps.filter(f => isOverdue(f.data_reminder));
  
  // For agents: show all their assigned tasks as notifications (not just overdue/today)
  // For admin: show overdue/today tasks + recent sales
  const notificationTasks = user?.ruolo === 'admin' 
    ? myPendingTasks.filter(t => isOverdue(t.scadenza) || isToday(t.scadenza))
    : myPendingTasks; // Agents see ALL their pending tasks
  
  // Recent sales notifications (last 24 hours for admin)
  const recentSalesNotifications = user?.ruolo === 'admin' ? sales.filter(s => {
    const created = new Date(s.created_at);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff <= 24 && !readNotificationIds.includes('sale_' + s.id);
  }) : [];
  
  // Unread = not in readNotificationIds AND (for agents: created_by !== user, for admin: all)
  const unreadNotificationIds = [
    ...notificationTasks.filter(t => {
      const isRead = readNotificationIds.includes(`task_${t.id}_${user?.id}`);
      // For agents: only unread if someone else created it OR it's overdue
      if (user?.ruolo !== 'admin') {
        return !isRead && (t.created_by !== user?.nome || isOverdue(t.scadenza));
      }
      return !isRead;
    }).map(t => `task_${t.id}_${user?.id}`),
    ...recentSalesNotifications.map(s => 'sale_' + s.id)
  ];
  const notificationCount = unreadNotificationIds.length;

  const markNotificationsAsRead = () => {
    const taskIds = notificationTasks.map(t => `task_${t.id}_${user?.id}`);
    const saleIds = recentSalesNotifications.map(s => 'sale_' + s.id);
    const allIds = [...new Set([...readNotificationIds, ...taskIds, ...saleIds])];
    setReadNotificationIds(allIds);
    localStorage.setItem('keyprime_read_notifications', JSON.stringify(allIds));
  };

  const markSingleNotificationAsRead = (notifId) => {
    const allIds = [...new Set([...readNotificationIds, notifId])];
    setReadNotificationIds(allIds);
    localStorage.setItem('keyprime_read_notifications', JSON.stringify(allIds));
  };

  // ==================== LOGIN VIEW ====================
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#edebe6] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo-scuro.png" alt="KeyPrime" className="h-16 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Real Estate CRM</p>
          </div>

          <div className="bg-[#ffffff] border border-[#e4e0d8] rounded-2xl p-6 shadow-[0_2px_18px_rgba(20,28,43,0.06)]">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}
            <LoginForm onLogin={handleLogin} loading={loading} />
          </div>
        </div>
      </div>
    );
  }

  // ==================== AGENT/SEGNALATORE VIEW ====================
  if (view === 'agente' || view === 'segnalatore') {
    // Per agente_admin, usa la view agente ma con ruolo originale per calcoli
    const type = user?.ruolo === 'agente_admin' ? 'agente' : view;
    const isAgenteAdmin = user?.ruolo === 'agente_admin';
    const mySales = sales.filter(s => type === 'agente' ? s.agente === user?.nome : s.segnalatore === user?.nome);
    const myTasks = tasks.filter(t => t.assegnato_a === user?.nome && t.stato === 'pending');
    const myClienti = clienti.filter(c => c.created_by === user?.nome || c.agente_riferimento === user?.nome);
    // La percentuale dell'agente puo' essere personalizzata dall'admin
    // (user.commission_pct). Il segnalatore resta al 30%, l'agente_admin
    // segue la regola societaria legata al referente.
    const getMyRate = (s) => {
      if (type === 'segnalatore') return 0.3;
      return leadLib.percentualeAgente(s, user) / 100;
    };
    const rate = type === 'segnalatore' ? 0.3 : leadLib.percentualeAgente({ referente: user?.referente }, user) / 100;
    const myVendite = mySales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totalComm = myVendite.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * getMyRate(s)), 0);
    const pagate = myVendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * getMyRate(s)), 0);
    const byStato = pipelineStati.reduce((acc, st) => { acc[st] = mySales.filter(s => (s.stato || 'lead') === st); return acc; }, {});

    // "Oggi" apre l'app: la prima domanda di un agente e' cosa deve fare adesso.
    // primaria = visibile nella barra mobile; il resto sta sotto "Altro".
    const tabs = [
      { id: 'oggi', icon: Clock, label: 'Oggi', accent: theme.sections.oggi.accent, badge: codaDiLavoro.length, primaria: true },
      { id: 'leads', icon: Target, label: 'Lead', accent: theme.sections.pipeline.accent, primaria: true },
      { id: 'pipeline', icon: PieChart, label: 'Pipeline', accent: theme.sections.vendite.accent, primaria: true },
      { id: 'crm', icon: Users, label: 'Clienti', accent: theme.sections.crm.accent, primaria: true },
      { id: 'home', icon: LayoutDashboard, label: 'Riepilogo', accent: theme.sections.dashboard.accent },
      { id: 'immobili', icon: Home, label: 'Annunci KP', accent: theme.sections.offplan.accent },
      { id: 'offplan', icon: Building2, label: 'Off-Plan', accent: theme.sections.offplan.accent },
      { id: 'calculator', icon: Calculator, label: 'Calcolatore ROI', accent: theme.sections.calculator.accent },
      { id: 'offerte', icon: FileText, label: 'Offerte', accent: theme.sections.offerte.accent },
      { id: 'tasks', icon: ListTodo, label: 'Task', accent: theme.sections.tasks.accent, badge: myTasks.length },
      { id: 'settings', icon: Settings, label: 'Account', accent: theme.sections.utenti.accent }
    ];

    // Form View (same for mobile/desktop)
    if (showForm) {
      return (
        <div className="min-h-screen bg-[#edebe6]">
          <div className="sticky top-0 z-40 bg-[#edebe6]/95 backdrop-blur-xl border-b border-[#e4e0d8] px-4 py-4">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <button onClick={() => setShowForm(null)} className="text-zinc-400 hover:text-ink flex items-center gap-2 transition-colors">
                <ChevronLeft className="w-5 h-5" />Indietro
              </button>
              <span className="text-ink font-semibold">{showForm === 'lead' ? 'Nuovo Lead' : 'Nuova Vendita'}</span>
              <div className="w-20" />
            </div>
          </div>
          <div className="p-4 pb-32 max-w-lg mx-auto">
            {showForm === 'lead' && <LeadForm type={type} userName={user?.nome} clienti={myClienti} onSubmit={addLead} />}
            {showForm === 'vendita' && <SaleForm type={type} userName={user?.nome} clienti={myClienti} onSubmit={addSale} />}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#edebe6]/95 backdrop-blur-xl border-t border-[#e4e0d8]">
            <Button onClick={() => document.getElementById('submitBtn')?.click()} className="w-full py-4" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Salvataggio...
                </span>
              ) : (
                showForm === 'lead' ? 'Salva Lead' : 'Registra Vendita'
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#edebe6] lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#e4e0d8] bg-[#ffffff] p-4 fixed h-full">
          <div className="mb-8">
            <img src="/logo-scuro.png" alt="KeyPrime" className="h-16" />
          </div>
          <nav className="space-y-1 flex-1">
            {tabs.map(t => (
              <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} accent={t.accent} badge={t.badge} isNew={t.isNew} />
            ))}
          </nav>
          <div className="pt-4 border-t border-[#e4e0d8]">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar nome={user?.nome} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-zinc-500 text-xs capitalize">{type}</p>
              </div>
              <button onClick={handleLogout} className="text-zinc-500 hover:text-ink"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 pb-24 lg:pb-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-[#edebe6]/95 backdrop-blur-xl border-b border-[#e4e0d8]">
            <div className="flex items-center justify-between px-4 py-4">
              <img src="/logo-scuro.png" alt="KeyPrime" className="h-12" />
              <div className="flex items-center gap-3">
                <button onClick={refreshAllData} className="p-2 text-zinc-400 hover:text-ink" title="Aggiorna">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-ink">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <Avatar nome={user?.nome} size="sm" />
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block sticky top-0 z-40 bg-[#edebe6]/95 backdrop-blur-xl border-b border-[#e4e0d8]">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-semibold text-ink">{activeTab === 'oggi' ? `Ciao ${(user?.nome || '').split(' ')[0]}` : tabs.find(t => t.id === activeTab)?.label}</h1>
                <p className="text-zinc-500 text-sm">
                  {activeTab === 'oggi' && (codaDiLavoro.length ? (codaDiLavoro.length === 1 ? '1 cosa da fare adesso' : `${codaDiLavoro.length} cose da fare adesso`) : 'Nessun lead in attesa')}
                  {activeTab === 'home' && 'Il tuo riepilogo'}
                  {activeTab === 'leads' && `${mySales.length} lead totali`}
                  {activeTab === 'pipeline' && 'Stato dei tuoi lead'}
                  {activeTab === 'immobili' && 'Annunci KP'}
                  {activeTab === 'offplan' && 'Progetti Off-Plan'}
                  {activeTab === 'calculator' && 'Calcola rendimenti immobiliari UAE'}
                  {activeTab === 'tasks' && `${myTasks.length} task pendenti`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-ink bg-[#f0ede6] rounded-xl">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <button onClick={refreshAllData} className="p-2 text-zinc-400 hover:text-ink bg-[#f0ede6] rounded-xl" title="Aggiorna">
                  <RefreshCw className="w-5 h-5" />
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
                {/* Lo stesso quadro dell'admin, sui dati dell'agente: la
                    richiesta era che la funzione la capissero loro. */}
                <HomeOperativa
                  clienti={myClienti}
                  sales={mySales}
                  tasks={myTasks}
                  followUps={myFollowUps}
                  offerte={offerte}
                  onVai={setActiveTab}
                  onNuovoCliente={() => setShowClienteModal({})}
                />
                <div className="lg:hidden grid grid-cols-2 gap-3">
                  <button onClick={() => setShowForm('lead')} className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5 text-left">
                    <Target className="w-6 h-6 text-blue-400 mb-3" />
                    <span className="text-ink font-medium block">Nuovo Lead</span>
                  </button>
                  <button onClick={() => setShowForm('vendita')} className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5 text-left">
                    <DollarSign className="w-6 h-6 text-emerald-400 mb-3" />
                    <span className="text-ink font-medium block">Vendita</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MetricCard label="Lead Attivi" value={mySales.filter(s => s.stato !== 'venduto' && s.stato !== 'incassato').length} icon={Target} onClick={() => setActiveTab('leads')} />
                  <MetricCard label="Vendite (SPA)" value={myVendite.length} icon={TrendingUp} />
                  <MetricCard label="Comm. Maturate" value={fmt(totalComm)} icon={DollarSign} />
                  <MetricCard label="Comm. Pagate" value={fmt(pagate)} icon={Check} />
                </div>

                {/* Pipeline */}
                <Card>
                  <h3 className="text-ink font-medium mb-4">Pipeline</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {pipelineStati.map(st => (
                      <div key={st} className="text-center">
                        <div className="rounded-xl py-3 px-2" style={{ background: theme.status[st]?.bg || '#2b323d' }}>
                          <p className="text-2xl font-bold" style={{ color: theme.status[st]?.color || '#fff' }}>{byStato[st]?.length || 0}</p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">{pipelineLabels[st] || st}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-ink font-medium">Commissioni</span>
                    <span className="text-zinc-400 text-sm">{fmt(totalComm)} AED maturate</span>
                  </div>
                  <ProgressBar value={pagate} max={totalComm || 1} />
                  <div className="flex justify-between mt-3 text-sm">
                    <span className="text-emerald-400">✓ Pagate: {fmt(pagate)} AED</span>
                    <span className="text-amber-400">Da incassare: {fmt(totalComm - pagate)} AED</span>
                  </div>
                </Card>

                {myTasks.length > 0 && (
                  <Card hover onClick={() => setActiveTab('tasks')} className="border-pink-500/20 bg-pink-500/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <ListTodo className="w-6 h-6 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-ink font-medium">{myTasks.length} task da completare</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    </div>
                  </Card>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-ink">Lead Aperti</h2>
                    <button onClick={() => setActiveTab('leads')} className="text-sm text-violet-400">Tutti →</button>
                  </div>
                  {mySales.filter(s => s.stato === 'lead' || s.stato === 'trattativa' || s.stato === 'EOI').length === 0 ? (
                    <Card padding="p-6" className="text-center">
                      <p className="text-zinc-500">Nessun lead aperto</p>
                    </Card>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {mySales.filter(s => s.stato === 'lead' || s.stato === 'trattativa' || s.stato === 'EOI').slice(0, 4).map(s => (
                        <Card key={s.id} hover onClick={() => setShowLeadDetail(s)} padding="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-1 h-12 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-ink font-medium truncate">{s.progetto}</p>
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
                  )}
                </div>

                {/* Vendite Confermate Recenti */}
                {myVendite.length > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-ink">🎉 Vendite Confermate</h2>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {myVendite.slice(0, 4).map(s => (
                        <Card key={s.id} hover onClick={() => setShowLeadDetail(s)} padding="p-4" className="border-emerald-500/20">
                          <div className="flex items-center gap-4">
                            <div className="w-1 h-12 rounded-full bg-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-ink font-medium truncate">{s.progetto}</p>
                              <p className="text-zinc-500 text-sm">{s.developer}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-emerald-400 font-medium">{fmt(s.valore)}</p>
                              <StatusBadge status={s.stato} />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* LEADS TAB */}
            {activeTab === 'leads' && (
              <LeadsTableView 
                leads={mySales} 
                clienti={clienti} 
                onSelectLead={setShowLeadDetail}
                onUpdateStatus={(id, stato) => updateSale(id, { stato })}
                onDelete={deleteSale}
                theme={theme}
                users={[]}
                isAdmin={false}
              />
            )}

            {activeTab === 'pipeline' && (
              <div className="space-y-6">
                {/* Pipeline Overview */}
                <div className="grid grid-cols-5 gap-3">
                  {pipelineStati.map(st => (
                    <Card key={st} padding="p-4" className="text-center">
                      <p className="text-3xl font-bold" style={{ color: theme.status[st]?.color }}>{byStato[st]?.length || 0}</p>
                      <p className="text-xs text-zinc-500 mt-1">{pipelineLabels[st] || st}</p>
                    </Card>
                  ))}
                </div>
                
                {/* Kanban style */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {pipelineStati.map(st => (
                    <div key={st}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: theme.status[st]?.color }} />
                        <span className="text-ink font-medium text-sm">{pipelineLabels[st] || st}</span>
                        <span className="text-zinc-500 text-xs">({byStato[st]?.length || 0})</span>
                      </div>
                      <div className="space-y-2">
                        {(byStato[st] || []).map(s => (
                          <Card key={s.id} hover onClick={() => setShowLeadDetail(s)} padding="p-3" className="border-l-2" style={{ borderLeftColor: theme.status[st]?.color }}>
                            <p className="text-ink text-sm font-medium truncate">{s.progetto}</p>
                            <p className="text-zinc-500 text-xs">{s.developer}</p>
                            {s.valore > 0 && <p className="text-emerald-400 text-sm mt-1">{fmt(s.valore)}</p>}
                          </Card>
                        ))}
                        {(!byStato[st] || byStato[st].length === 0) && (
                          <div className="text-center py-4 text-zinc-600 text-xs">Nessun lead</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'oggi' && (
              <WorkQueue
                coda={codaDiLavoro}
                clienti={clienti}
                onApriLead={setShowLeadDetail}
                onEseguito={eseguiVoceCoda}
                onRimanda={rimandaVoceCoda}
                onApriTuttiLead={() => setActiveTab('leads')}
              />
            )}

            {activeTab === 'tasks' && <AgentTasksTab tasks={myTasks} allTasks={tasks.filter(t => t.assegnato_a === user?.nome)} clienti={clienti} onComplete={completeTask} onAddNote={(t) => setShowNoteModal(t)} />}
            {activeTab === 'immobili' && <ImmobiliTab clienti={myClienti} user={user} onToast={showToast} />}
            {activeTab === 'offplan' && <OffPlanTab clienti={myClienti} onCreateLead={createLeadFromListing} savedListings={savedListings} onSaveListing={saveListing} onRemoveListing={removeListing} user={user} />}
            {activeTab === 'calculator' && <CalcolatoreRoi />}
            {activeTab === 'offerte' && <OffertaTab offerte={offerte} user={user} onCrea={() => setShowOffertaModal({})} onEdit={setShowOffertaModal} onDelete={deleteOfferta} onGeneraPDF={generateOffertaPDF} />}
            {activeTab === 'crm' && (showClienteDetail ? <ClienteDetailView cliente={showClienteDetail} sales={sales.filter(s => s.cliente_id === showClienteDetail.id)} tasks={tasks.filter(t => t.cliente_id === showClienteDetail.id)} onBack={() => setShowClienteDetail(null)} onEdit={() => setShowClienteModal(showClienteDetail)} onDelete={() => deleteCliente(showClienteDetail.id)} updateCliente={updateCliente} onAddTask={() => setShowTaskModal({ cliente_id: showClienteDetail.id })} onCompleteTask={completeTask} onDeleteTask={deleteTask} onExportPDF={() => generateClientePDF(showClienteDetail, sales.filter(s => s.cliente_id === showClienteDetail.id), tasks.filter(t => t.cliente_id === showClienteDetail.id))} /> : <CRMTab clienti={myClienti} conteggiTipi={conteggiTipiCliente} filters={clienteFilters} setFilters={setClienteFilters} sales={mySales} onSelect={setShowClienteDetail} onCreate={() => setShowClienteModal({})} onDelete={deleteCliente} onUpdateCliente={updateCliente} users={users} />)}

            {activeTab === 'settings' && (
              <Card className="max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar nome={user?.nome} size="lg" />
                  <div>
                    <p className="text-xl font-semibold text-ink">{user?.nome}</p>
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

          {/* Barra mobile: solo le schede primarie, il resto sotto "Altro".
              Con dieci voci affiancate le etichette diventavano illeggibili. */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#edebe6]/95 backdrop-blur-xl border-t border-[#e4e0d8] px-2 py-2 z-30">
            <div className="flex justify-around items-end">
              {tabs.filter(t => t.primaria).map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); }}
                        className={`relative flex flex-col items-center py-1.5 px-2 min-w-[60px] ${activeTab === t.id ? 'text-ink' : 'text-zinc-500'}`}>
                  <t.icon className="w-6 h-6" style={activeTab === t.id ? { color: t.accent } : {}} />
                  {t.badge > 0 && (
                    <span className="absolute top-0 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                      {t.badge > 9 ? '9+' : t.badge}
                    </span>
                  )}
                  <span className="text-[11px] mt-1">{t.label}</span>
                </button>
              ))}
              <button onClick={() => setMobileMenuOpen(true)}
                      className={`flex flex-col items-center py-1.5 px-2 min-w-[60px] ${tabs.some(t => !t.primaria && t.id === activeTab) ? 'text-ink' : 'text-zinc-500'}`}>
                <Menu className="w-6 h-6" />
                <span className="text-[11px] mt-1">Altro</span>
              </button>
            </div>
          </div>

          {/* Pannello "Altro" */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-[#ffffff] border-t border-[#e4e0d8] rounded-t-3xl p-4 pb-8 animate-slideUp">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-ink font-semibold">Altre sezioni</h3>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-ink"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {tabs.filter(t => !t.primaria).map(t => (
                    <button key={t.id} onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); }}
                            className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${activeTab === t.id ? 'bg-ink/10' : 'bg-zinc-800/60'}`}>
                      <t.icon className="w-6 h-6" style={{ color: t.accent }} />
                      <span className="text-xs text-center leading-tight text-zinc-300">{t.label}</span>
                      {t.badge > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{t.badge}</span>}
                    </button>
                  ))}
                  <button onClick={handleLogout} className="rounded-2xl p-4 flex flex-col items-center gap-2 bg-red-500/10">
                    <LogOut className="w-6 h-6 text-red-400" />
                    <span className="text-xs text-red-400">Esci</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {leadInScheda && <LeadDetailSheet
          sale={leadInScheda}
          cliente={clienti.find(c => c.id === leadInScheda.cliente_id)}
          rate={leadLib.percentualeAgente(leadInScheda, user) / 100}
          onClose={() => setShowLeadDetail(null)}
          onUpdateSale={updateSale}
          onConvert={() => setConvertingSale(leadInScheda)}
          activities={activities.filter(a => a.sale_id === leadInScheda.id)}
          followUps={followUps.filter(f => f.sale_id === leadInScheda.id)}
          onAddActivity={addActivity}
          onCreateFollowUp={createFollowUp}
          onCompleteFollowUp={completeFollowUp}
          onDeleteActivity={deleteActivity}
          onDeleteFollowUp={deleteFollowUp}
          onProgrammaFollowUp={programmaFollowUp}
          agenti={agentiAttivi}
          utente={user}
          onToast={showToast}
          sla={sla}
        />}
        {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
        {showNotifications && <NotificationsPanel tasks={notificationTasks} unreadIds={unreadNotificationIds} recentSales={recentSalesNotifications} onClose={() => { setShowNotifications(false); }} onGoToTask={() => { setShowNotifications(false); setActiveTab('tasks'); }} onMarkAsRead={markSingleNotificationAsRead} userId={user?.id} />}
        {showPasswordModal && <PasswordModal obbligatorio={!!user?.must_change_password} onSave={changePassword} onClose={() => setShowPasswordModal(false)} />}
        {showNoteModal && <NoteModal task={showNoteModal} onSave={addTaskNote} onClose={() => setShowNoteModal(null)} />}
        {showClienteModal && <ClienteModal cliente={showClienteModal.id ? showClienteModal : null} onSave={showClienteModal.id ? (d) => updateCliente(showClienteModal.id, d) : createCliente} onClose={() => setShowClienteModal(null)} />}
        {showOffertaModal !== null && <OffertaModal offerta={showOffertaModal?.id ? showOffertaModal : null} clienti={clienti} user={user} onSave={async (data) => { const esito = await saveOfferta(data); if (esito.ok && !showOffertaModal?.id) generateOffertaPDF(data); return esito; }} onClose={() => setShowOffertaModal(null)} />}
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
    // Stesso elenco per il conto nell'intestazione e per le righe: altrimenti
    // i due numeri possono divergere senza che nessuno se ne accorga.
    const venditeDettaglio = vendite;

    // calcCommission: logica riutilizzabile per una singola vendita
    const calcCommission = (s) => {
      const c = Number(s.valore) * (s.commission_pct || 5) / 100;
      const agentUser = users.find(u => u.nome === s.agente && (u.ruolo === 'agente' || u.ruolo === 'agente_admin'));
      const isAgenteAdmin = agentUser?.ruolo === 'agente_admin';
      let ag, sg, p, g;
      if (isAgenteAdmin) {
        if (s.referente === 'Giovanni') { ag = c * 0.7; sg = 0; g = 0; p = c * 0.3; }
        else { ag = c * 0.3; sg = 0; g = 0; p = c * 0.7; }
      } else {
        // 70% standard, o la percentuale personalizzata dell'agente
        const pctAgente = leadLib.percentualeAgente(s, agentUser) / 100;
        ag = s.agente ? c * pctAgente : 0;
        sg = s.segnalatore ? c * 0.3 : 0;
        const nr = c - ag - sg;
        p = s.referente === 'Pellegrino' ? nr * 0.7 : (s.referente === 'Giovanni' ? nr * 0.3 : 0);
        g = s.referente === 'Giovanni' ? nr * 0.7 : (s.referente === 'Pellegrino' ? nr * 0.3 : 0);
      }
      const n = isAgenteAdmin ? 0 : (c - ag - (s.segnalatore ? c * 0.3 : 0));
      return { c, ag, sg: s.segnalatore && !isAgenteAdmin ? c * 0.3 : 0, n, p, g, isAgenteAdmin };
    };

    // valore potenziale = tutti i lead; commissioni = SOLO venduto/incassato
    const volPotenziale = periodSales.reduce((sum, s) => sum + Number(s.valore || 0), 0);
    const commTotals = vendite.reduce((a, s) => {
      const { c, ag, sg, n, p, g, isAgenteAdmin } = calcCommission(s);
      const agRef = s.referente || '';
      return { comm: a.comm + c, ag: a.ag + ag, sg: a.sg + sg, netto: a.netto + n, pell: a.pell + p, giov: a.giov + g,
        agPell: a.agPell + (isAgenteAdmin && agRef === 'Pellegrino' ? ag : 0),
        agGiov: a.agGiov + (isAgenteAdmin && agRef === 'Giovanni' ? ag : 0) };
    }, { comm: 0, ag: 0, sg: 0, netto: 0, pell: 0, giov: 0, agPell: 0, agGiov: 0 });
    const totals = { valore: volPotenziale, ...commTotals };
    
    const volTrattativa = periodSales.filter(s => s.stato === 'trattativa').reduce((sum, s) => sum + Number(s.valore || 0), 0);
    const byStato = pipelineStati.reduce((a, st) => { a[st] = periodSales.filter(s => (s.stato || 'lead') === st); return a; }, {});
    const byMonth = periodSales.reduce((a, s) => { const m = s.data?.substring(0, 7) || 'N/A'; a[m] = (a[m] || 0) + Number(s.valore); return a; }, {});
    const byAgente = periodSales.reduce((a, s) => { if (s.agente) a[s.agente] = (a[s.agente] || 0) + Number(s.valore); return a; }, {});
    const byZona = periodSales.reduce((a, s) => { if (s.zona) a[s.zona] = (a[s.zona] || 0) + Number(s.valore); return a; }, {});
    const pendingTasks = tasks.filter(t => t.stato === 'pending');

    const daAssegnare = sales.filter(s => leadLib.eAperto(s) && !s.assegnato_a && !s.agente).length;
    const daLavorare = sales.filter(s => {
      if (!leadLib.eAperto(s)) return false;
      if (!(s.assegnato_a || s.agente)) return false;
      if (s.ultimo_contatto_at) return false;
      return (leadLib.oreDa(s.created_at) || 0) > (sla.primo_contatto_ore ?? 24);
    }).length;

    const tabs = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', accent: theme.sections.dashboard.accent },
      { id: 'inbox', icon: AlertCircle, label: 'Inbox Lead', accent: theme.sections.inbox.accent, badge: daAssegnare + daLavorare },
      { id: 'commissioni', icon: Award, label: 'Commissioni', accent: theme.sections.commissioni.accent },
      { id: 'vendite', icon: DollarSign, label: 'Vendite', accent: theme.sections.vendite.accent },
      { id: 'pipeline', icon: PieChart, label: 'Pipeline', accent: theme.sections.pipeline.accent },
      { id: 'crm', icon: Users, label: 'CRM', accent: theme.sections.crm.accent },
      { id: 'immobili', icon: Home, label: 'Annunci KP', accent: theme.sections.offplan.accent },
      { id: 'offplan', icon: Building2, label: 'Off-Plan', accent: theme.sections.offplan.accent, isNew: true },
      { id: 'calculator', icon: Calculator, label: 'Calcolatore ROI', accent: theme.sections.calculator.accent, isNew: true },
      { id: 'offerte', icon: FileText, label: 'Offerte', accent: theme.sections.offerte.accent },
      { id: 'tasks', icon: ListTodo, label: 'Task', accent: theme.sections.tasks.accent, badge: pendingTasks.length },
      { id: 'followups', icon: Clock, label: 'Follow-up', accent: theme.sections.followups.accent, badge: todayFollowUps.length + overdueFollowUps.length },
      { id: 'push', icon: Bell, label: 'Notifiche', accent: theme.sections.push.accent },
      { id: 'utenti', icon: Users, label: 'Team', accent: theme.sections.utenti.accent },
      { id: 'accessi', icon: Key, label: 'Controllo accessi', accent: theme.sections.accessi.accent },
      { id: 'impostazioni', icon: Settings, label: 'Impostazioni', accent: theme.sections.ghl.accent }
    ];

    return (
      <div className="min-h-screen bg-[#edebe6] flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#e4e0d8] bg-[#ffffff] p-4">
          <div className="mb-8">
            <img src="/logo-scuro.png" alt="KeyPrime" className="h-20" />
          </div>
          
          <nav className="space-y-1 flex-1">
            {tabs.map(t => (
              <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => { setActiveTab(t.id); setShowClienteDetail(null); }} accent={t.accent} badge={t.badge} isNew={t.isNew} />
            ))}
          </nav>
          
          <div className="border-t border-[#e4e0d8] pt-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar nome={user?.nome} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{user?.nome}</p>
                <p className="text-xs text-zinc-500">Admin</p>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="text-zinc-500 hover:text-ink transition-colors mr-2" title="Cambia password"><Key className="w-4 h-4" /></button>
              <button onClick={handleLogout} className="text-zinc-500 hover:text-ink transition-colors" title="Esci"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-40 bg-[#edebe6]/95 backdrop-blur-xl border-b border-[#e4e0d8]">
            <div className="flex items-center justify-between px-4 py-4">
              <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-400"><Menu className="w-6 h-6" /></button>
              <img src="/logo-scuro.png" alt="KeyPrime" className="h-16" />
              <div className="flex items-center gap-2">
                <button onClick={refreshAllData} className="text-zinc-400 hover:text-ink" title="Aggiorna">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowNotifications(true)} className="relative text-zinc-400">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
              </div>
            </div>
            {/* Mobile Tabs */}
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setShowClienteDetail(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${activeTab === t.id ? 'text-ink' : 'text-zinc-500 hover:text-ink'}`} style={activeTab === t.id ? { background: `${t.accent}20`, color: t.accent } : {}}>
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
                <h1 className="text-2xl font-semibold text-ink">{tabs.find(t => t.id === activeTab)?.label || activeTab}</h1>
                <p className="text-zinc-500 text-sm mt-1">
                  {activeTab === 'dashboard' && 'Panoramica generale'}
                  {activeTab === 'inbox' && (daAssegnare + daLavorare > 0 ? `${daAssegnare} senza agente, ${daLavorare} mai contattati` : 'Tutti i lead sono presi in carico')}
                                    {activeTab === 'pipeline' && 'Gestisci il flusso di vendita'}
                  {activeTab === 'crm' && `${clienti.length} clienti in database`}
                  {activeTab === 'immobili' && 'Portafoglio dell\'agenzia e vetrina pubblica'}
                  {activeTab === 'offplan' && `Progetti Off-Plan • ${savedListings.length} salvati`}
                  {activeTab === 'calculator' && 'Calcola rendimenti immobiliari UAE'}
                  {activeTab === 'tasks' && `${pendingTasks.length} task da completare`}
                  {activeTab === 'followups' && `${todayFollowUps.length + overdueFollowUps.length} follow-up da gestire`}
                  {activeTab === 'commissioni' && `${fmt(totals.comm)} AED commissioni totali`}
                  {activeTab === 'utenti' && `${users.length} membri del team`}
                  {activeTab === 'accessi' && 'Permessi per ruolo, sessioni aperte e compensi'}
                  {activeTab === 'impostazioni' && 'Collegamento GHL, tempi di reazione e distribuzione lead'}
                  {activeTab === 'vendite' && 'Solo gli affari chiusi'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowGlobalSearch(true)} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-zinc-700/50 hover:bg-zinc-700 rounded-xl text-zinc-400 text-sm transition-colors">
                  <Search className="w-4 h-4" />
                  <span>Cerca...</span>
                  <kbd className="ml-2 px-1.5 py-0.5 bg-zinc-700 rounded text-xs">⌘K</kbd>
                </button>
                <button onClick={() => setShowNotifications(true)} className="relative p-2 text-zinc-400 hover:text-ink transition-colors">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <Button variant="secondary" icon={RefreshCw} onClick={refreshAllData}>Aggiorna</Button>
              </div>
            </div>

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
              {/* Lo schema della revisione: "cosa faccio adesso" sopra,
                  l'analisi di come sta andando sotto. */}
              <HomeOperativa
                clienti={clienti}
                sales={sales}
                tasks={tasks}
                followUps={followUps}
                offerte={offerte}
                onVai={setActiveTab}
                onNuovoCliente={() => setShowClienteModal({})}
              />
              <DashboardAdmin
                sales={sales}
                periodSales={periodSales}
                vendite={vendite}
                totals={totals}
                byStato={byStato}
                byAgente={byAgente}
                byZona={byZona}
                volTrattativa={volTrattativa}
                periodFilter={periodFilter}
                overdueTasks={overdueTasks}
                todayTasks={todayTasks}
                daAssegnare={daAssegnare}
                onPeriodo={setPeriodFilter}
                onVai={setActiveTab}
                onEsporta={() => generateDashboardPDF(totals, periodSales, vendite, byAgente, byZona)}
              />
              </>
            )}
            
            {/* AGENT DETAIL VIEW */}
            {activeTab === 'dashboard' && showAgentDetail && (
              <AgentDetailView 
                agent={showAgentDetail} 
                sales={periodSales} 
                onBack={() => setShowAgentDetail(null)} 
              />
            )}

            {/* INBOX LEAD */}
            {activeTab === 'inbox' && (
              <LeadInbox
                leads={sales}
                clienti={clienti}
                agenti={agentiAttivi}
                sla={sla}
                onApriLead={setShowLeadDetail}
                onAssegna={assegnaLeads}
                onAssegnaRotazione={assegnaRotazione}
              />
            )}

            {/* VENDITE */}
            {activeTab === 'vendite' && <VenditeTab sales={filteredSales} filters={filters} setFilters={setFilters} updateSale={updateSale} deleteSale={deleteSale} loading={loading} />}

            {/* PIPELINE */}
            {activeTab === 'pipeline' && <PipelineTab byStato={byStato} onSelectLead={setShowLeadDetail} onUpdateSaleStatus={(id, stato) => updateSale(id, { stato })} />}

            {/* CRM */}
            {activeTab === 'crm' && (showClienteDetail ? <ClienteDetailView cliente={showClienteDetail} sales={sales.filter(s => s.cliente_id === showClienteDetail.id)} tasks={tasks.filter(t => t.cliente_id === showClienteDetail.id)} onBack={() => setShowClienteDetail(null)} onEdit={() => setShowClienteModal(showClienteDetail)} onDelete={() => deleteCliente(showClienteDetail.id)} updateCliente={updateCliente} onAddTask={() => setShowTaskModal({ cliente_id: showClienteDetail.id })} onCompleteTask={completeTask} onDeleteTask={deleteTask} onExportPDF={() => generateClientePDF(showClienteDetail, sales.filter(s => s.cliente_id === showClienteDetail.id), tasks.filter(t => t.cliente_id === showClienteDetail.id))} /> : <CRMTab clienti={filteredClienti} conteggiTipi={conteggiTipiCliente} filters={clienteFilters} setFilters={setClienteFilters} sales={sales} onSelect={setShowClienteDetail} onCreate={() => setShowClienteModal({})} onDelete={deleteCliente} onUpdateCliente={updateCliente} users={users} />)}

            {/* OFF-PLAN */}
            {activeTab === 'immobili' && <ImmobiliTab clienti={clienti} user={user} onToast={showToast} />}
            {activeTab === 'offplan' && <OffPlanTab clienti={clienti} onCreateLead={createLeadFromListing} savedListings={savedListings} onSaveListing={saveListing} onRemoveListing={removeListing} user={user} />}

            {/* CALCULATOR */}
            {activeTab === 'calculator' && <CalcolatoreRoi />}

            {/* OFFERTE */}
            {activeTab === 'offerte' && <OffertaTab offerte={offerte} user={user} onCrea={() => setShowOffertaModal({})} onEdit={setShowOffertaModal} onDelete={deleteOfferta} onGeneraPDF={generateOffertaPDF} />}

            {/* PUSH */}
            {activeTab === 'push' && <PushTab users={users} />}

            {/* TASKS */}
            {activeTab === 'tasks' && <AdminTasksTab tasks={tasks} clienti={clienti} users={users} onComplete={completeTask} onDelete={deleteTask} onEdit={setShowTaskModal} onCreate={() => setShowTaskModal({})} />}

            {/* FOLLOW-UPS */}
            {activeTab === 'followups' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-red-500/20">
                    <p className="text-zinc-500 text-sm">Scaduti</p>
                    <p className="text-2xl font-semibold text-red-400 mt-1">{overdueFollowUps.length}</p>
                  </Card>
                  <Card className="border-purple-500/20">
                    <p className="text-zinc-500 text-sm">Oggi</p>
                    <p className="text-2xl font-semibold text-purple-400 mt-1">{todayFollowUps.length}</p>
                  </Card>
                  <Card>
                    <p className="text-zinc-500 text-sm">Prossimi 7 giorni</p>
                    <p className="text-2xl font-semibold text-ink mt-1">{myFollowUps.filter(f => { const d = new Date(f.data_reminder); const today = new Date(); const week = new Date(); week.setDate(today.getDate() + 7); return d >= today && d <= week; }).length}</p>
                  </Card>
                  <Card>
                    <p className="text-zinc-500 text-sm">Totale Attivi</p>
                    <p className="text-2xl font-semibold text-ink mt-1">{myFollowUps.length}</p>
                  </Card>
                </div>

                {/* Follow-ups List */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-ink font-semibold">Follow-up Programmati</h3>
                  </div>
                  {myFollowUps.length > 0 ? (
                    <div className="space-y-2">
                      {myFollowUps.map(f => {
                        const sale = sales.find(s => s.id === f.sale_id);
                        const cliente = clienti.find(c => c.id === f.cliente_id);
                        const isOverdueF = new Date(f.data_reminder) < new Date();
                        const isTodayF = new Date(f.data_reminder).toDateString() === new Date().toDateString();
                        return (
                          <div key={f.id} className={`p-4 rounded-xl border ${isOverdueF ? 'bg-red-500/10 border-red-500/30' : isTodayF ? 'bg-purple-500/10 border-purple-500/30' : 'bg-zinc-800/50 border-zinc-800'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdueF ? 'bg-red-500/20' : isTodayF ? 'bg-purple-500/20' : 'bg-zinc-700'}`}>
                                  {f.tipo === 'call' && '📞'}
                                  {f.tipo === 'email' && '📧'}
                                  {f.tipo === 'whatsapp' && '💬'}
                                  {f.tipo === 'meeting' && '🤝'}
                                  {f.tipo === 'viewing' && '🏠'}
                                  {!f.tipo && '⏰'}
                                </div>
                                <div>
                                  <p className="text-ink font-medium">{cliente ? `${cliente.nome} ${cliente.cognome}` : 'Cliente'}</p>
                                  <p className="text-zinc-400 text-sm">{sale?.progetto || 'Lead'}</p>
                                  {f.nota && <p className="text-zinc-500 text-xs mt-1">{f.nota}</p>}
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className={`font-medium ${isOverdueF ? 'text-red-400' : isTodayF ? 'text-purple-400' : 'text-ink'}`}>
                                    {new Date(f.data_reminder).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                  </p>
                                  {f.ora_reminder && <p className="text-zinc-500 text-xs">{f.ora_reminder.slice(0,5)}</p>}
                                  {isOverdueF && <span className="text-red-400 text-xs font-medium">SCADUTO</span>}
                                  {isTodayF && !isOverdueF && <span className="text-purple-400 text-xs font-medium">OGGI</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => completeFollowUp(f.id)} className="p-2 text-zinc-500 hover:text-green-400 transition-colors" title="Completa">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteFollowUp(f.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" title="Elimina">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-center py-8">Nessun follow-up programmato</p>
                  )}
                </Card>
              </div>
            )}

            {/* COMMISSIONI */}
            {activeTab === 'commissioni' && (
              <div className="space-y-6">
                {/* Period Filter */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'Tutto' },
                    { id: '30', label: '30 giorni' },
                    { id: '90', label: '90 giorni' },
                    { id: '365', label: 'Anno' }
                  ].map(p => (
                    <button key={p.id} onClick={() => setPeriodFilter(p.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${periodFilter === p.id ? 'bg-ink text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-ink'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-oro-500/30 bg-oro-500/5">
                    <p className="text-zinc-400 text-sm">Commissioni Totali</p>
                    <p className="text-3xl font-bold text-ink mt-2">{fmt(totals.comm)}</p>
                    <p className="text-zinc-500 text-xs mt-1">AED</p>
                  </Card>
                  <Card className="border-zinc-700">
                    <p className="text-zinc-400 text-sm">💰 Pellegrino</p>
                    <p className="text-2xl font-bold text-ink mt-2">{fmt(totals.pell + totals.agPell)}</p>
                    <p className="text-zinc-500 text-xs mt-1">Totale reale</p>
                    <div className="mt-2 pt-2 border-t border-zinc-700/50 space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-zinc-500">Quota KeyPrime</span><span className="text-zinc-400">{fmt(totals.pell)}</span></div>
                      {totals.agPell > 0 && <div className="flex justify-between text-xs"><span className="text-zinc-500">Comm. agente</span><span className="text-zinc-400">{fmt(totals.agPell)}</span></div>}
                    </div>
                  </Card>
                  <Card className="border-zinc-700">
                    <p className="text-zinc-400 text-sm">💰 Giovanni</p>
                    <p className="text-2xl font-bold text-ink mt-2">{fmt(totals.giov + totals.agGiov)}</p>
                    <p className="text-zinc-500 text-xs mt-1">Totale reale</p>
                    <div className="mt-2 pt-2 border-t border-zinc-700/50 space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-zinc-500">Quota KeyPrime</span><span className="text-zinc-400">{fmt(totals.giov)}</span></div>
                      {totals.agGiov > 0 && <div className="flex justify-between text-xs"><span className="text-zinc-500">Comm. agente</span><span className="text-zinc-400">{fmt(totals.agGiov)}</span></div>}
                    </div>
                  </Card>
                  <Card>
                    <p className="text-zinc-400 text-sm">Agenti (70%)</p>
                    <p className="text-2xl font-bold text-ink mt-2">{fmt(totals.ag)}</p>
                    <p className="text-zinc-500 text-xs mt-1">Da pagare</p>
                  </Card>
                </div>

                {/* Incassato vs Da Incassare */}
                {(() => {
                  const incassatoSales = periodSales.filter(s => s.stato === 'incassato');
                  const vendutoSales = periodSales.filter(s => s.stato === 'venduto');
                  const commIncassato = incassatoSales.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100), 0);
                  const commVenduto = vendutoSales.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100), 0);
                  const commTot = commIncassato + commVenduto;
                  const pctIncassato = commTot > 0 ? (commIncassato / commTot * 100) : 0;
                  return (
                    <Card>
                      <h3 className="text-ink font-semibold mb-4">Stato Incasso Commissioni</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-zinc-800 rounded-xl">
                          <p className="text-ink text-2xl font-bold">{fmt(commTot)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Totale</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-xl">
                          <p className="text-green-400 text-2xl font-bold">{fmt(commIncassato)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Incassate ({incassatoSales.length} vendite)</p>
                        </div>
                        <div className="text-center p-4 bg-red-500/10 rounded-xl">
                          <p className="text-red-400 text-2xl font-bold">{fmt(commVenduto)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Da incassare ({vendutoSales.length} vendite)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-oro-500 rounded-full transition-all duration-500" style={{ width: `${pctIncassato}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-ink shrink-0 tabular-nums">{pctIncassato.toFixed(0)}% incassato</span>
                      </div>
                    </Card>
                  );
                })()}

                {/* Maturate vs Pagate */}
                {(() => {
                  const venduteSales = periodSales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
                  const maturate = venduteSales.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100), 0);
                  const pagate = venduteSales.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100), 0);
                  const daPagare = maturate - pagate;
                  const percentPaid = maturate > 0 ? (pagate / maturate * 100) : 0;
                  
                  return (
                    <Card>
                      <h3 className="text-ink font-semibold mb-4">Stato Pagamenti</h3>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-zinc-800 rounded-xl">
                          <p className="text-ink text-2xl font-bold">{fmt(maturate)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Maturate</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-xl">
                          <p className="text-green-400 text-2xl font-bold">{fmt(pagate)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Pagate ✓</p>
                        </div>
                        <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                          <p className="text-amber-400 text-2xl font-bold">{fmt(daPagare)}</p>
                          <p className="text-zinc-500 text-xs mt-1">Da Pagare</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-oro-500 rounded-full transition-all duration-500" style={{ width: `${percentPaid}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-ink shrink-0 tabular-nums">{percentPaid.toFixed(0)}% pagato</span>
                      </div>
                    </Card>
                  );
                })()}

                {/* Per Agente */}
                <Card>
                  <h3 className="text-ink font-semibold mb-4">Commissioni per Agente</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      periodSales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((acc, s) => {
                        const agente = s.agente || 'Non assegnato';
                        if (!acc[agente]) acc[agente] = { totale: 0, pagate: 0, count: 0 };
                        const comm = calcCommission(s).ag;
                        acc[agente].totale += comm;
                        if (s.pagato) acc[agente].pagate += comm;
                        acc[agente].count++;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1].totale - a[1].totale).map(([agente, data]) => (
                      <div key={agente} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar nome={agente} size="sm" />
                          <div>
                            <p className="text-ink font-medium">{agente}</p>
                            <p className="text-zinc-500 text-xs">{data.count} vendite</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-blue-400 font-semibold">{fmt(data.totale)} AED</p>
                          <p className="text-zinc-500 text-xs">
                            {data.pagate > 0 && <span className="text-green-400">{fmt(data.pagate)} pagati</span>}
                            {data.totale - data.pagate > 0 && <span className="text-amber-400 ml-2">{fmt(data.totale - data.pagate)} pending</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Vendite con Commissioni */}
                <Card>
                  <div className="flex items-baseline justify-between gap-3 mb-4">
                    <h3 className="text-ink font-semibold">Dettaglio Vendite</h3>
                    {venditeDettaglio.length > 20 && (
                      <button onClick={() => setActiveTab('vendite')} className="text-sm text-oro-400 hover:underline">
                        prime 20 di {venditeDettaglio.length} — vedi tutte
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="text-left text-zinc-500 text-xs border-b border-zinc-800">
                          <th className="pb-3">Progetto</th>
                          <th className="pb-3">Agente</th>
                          <th className="pb-3 text-right">Valore</th>
                          <th className="pb-3 text-right">Comm.</th>
                          <th className="pb-3 text-center">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {venditeDettaglio.slice(0, 20).map(s => {
                          const comm = Number(s.valore) * (s.commission_pct || 5) / 100;
                          return (
                            <tr key={s.id} className="text-sm">
                              <td className="py-3">
                                <p className="text-ink">{s.progetto}</p>
                                <p className="text-zinc-500 text-xs">{s.zona}</p>
                              </td>
                              <td className="py-3 text-zinc-300">{s.agente || '-'}</td>
                              <td className="py-3 text-right text-ink">{fmt(s.valore)}</td>
                              <td className="py-3 text-right text-emerald-400">{fmt(comm)}</td>
                              <td className="py-3 text-center">
                                {s.pagato ? (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Pagata ✓</span>
                                ) : (
                                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Pending</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TEAM */}
            {activeTab === 'accessi' && (
              <ControlloAccessi
                users={users}
                sales={sales}
                onToast={showToast}
                onModificaUtente={setShowUserModal}
              />
            )}

            {activeTab === 'impostazioni' && (
              <ImpostazioniTab
                impostazioni={impostazioni}
                agentiAttivi={agentiAttivi}
                onRicarica={loadImpostazioni}
                onToast={showToast}
              />
            )}

            {activeTab === 'utenti' && <TeamTab users={users} currentUserId={user?.id} onCreate={() => setShowUserModal({})} onEdit={setShowUserModal} onSetActive={setUserActive} />}
          </div>
        </main>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#ffffff] p-4 animate-slideRight">
              <div className="flex items-center justify-between mb-8">
                <img src="/logo-scuro.png" alt="KeyPrime" className="h-16" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-1">
                {tabs.map(t => (
                  <NavItem key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); setShowClienteDetail(null); }} accent={t.accent} badge={t.badge} isNew={t.isNew} />
                ))}
              </nav>
              <div className="absolute bottom-4 left-4 right-4">
                <Button variant="danger" icon={LogOut} onClick={handleLogout} className="w-full">Esci</Button>
              </div>
            </aside>
          </div>
        )}

        {/* Modals */}
        {leadInScheda && <LeadDetailSheet
          sale={leadInScheda}
          cliente={clienti.find(c => c.id === leadInScheda.cliente_id)}
          rate={leadLib.percentualeAgente(leadInScheda, users.find(u => u.nome === (leadInScheda.assegnato_a || leadInScheda.agente))) / 100}
          onClose={() => setShowLeadDetail(null)}
          onUpdateSale={updateSale}
          onConvert={() => setConvertingSale(leadInScheda)}
          isAdmin
          activities={activities.filter(a => a.sale_id === leadInScheda.id)}
          followUps={followUps.filter(f => f.sale_id === leadInScheda.id)}
          onAddActivity={addActivity}
          onCreateFollowUp={createFollowUp}
          onCompleteFollowUp={completeFollowUp}
          onDeleteActivity={deleteActivity}
          onDeleteFollowUp={deleteFollowUp}
          onProgrammaFollowUp={programmaFollowUp}
          onAssegna={assegnaLeads}
          agenti={agentiAttivi}
          utente={user}
          onToast={showToast}
          sla={sla}
        />}
        {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
        {showClienteModal && <ClienteModal cliente={showClienteModal.id ? showClienteModal : null} onSave={showClienteModal.id ? (d) => updateCliente(showClienteModal.id, d) : createCliente} onClose={() => setShowClienteModal(null)} />}
        {showTaskModal && <TaskModal task={showTaskModal.id ? showTaskModal : null} clienti={clienti} users={users} onSave={showTaskModal.id ? (d) => updateTask(showTaskModal.id, d) : createTask} onClose={() => setShowTaskModal(null)} />}
        {showUserModal && <UserModal user={showUserModal.id ? showUserModal : null} onSave={saveUser} onClose={() => setShowUserModal(null)} />}
        {showNotifications && <NotificationsPanel tasks={notificationTasks} unreadIds={unreadNotificationIds} recentSales={recentSalesNotifications} onClose={() => { setShowNotifications(false); }} onGoToTask={() => { setShowNotifications(false); setActiveTab('tasks'); }} onMarkAsRead={markSingleNotificationAsRead} userId={user?.id} />}
        {showPasswordModal && <PasswordModal obbligatorio={!!user?.must_change_password} onSave={changePassword} onClose={() => setShowPasswordModal(false)} />}
        {showGlobalSearch && <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} sales={sales} clienti={clienti} tasks={tasks} onSelectSale={setShowLeadDetail} onSelectCliente={setShowClienteDetail} onSelectTask={() => setActiveTab('tasks')} setActiveTab={setActiveTab} />}
        {showOffertaModal !== null && <OffertaModal offerta={showOffertaModal?.id ? showOffertaModal : null} clienti={clienti} user={user} onSave={async (data) => { const esito = await saveOfferta(data); if (esito.ok && !showOffertaModal?.id) generateOffertaPDF(data); return esito; }} onClose={() => setShowOffertaModal(null)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return null;
}

// ==================== TAB COMPONENTS ====================

// Vendite Tab
function VenditeTab({ sales, filters, setFilters, updateSale, deleteSale, loading }) {
  // "Vendite" mostrava l'intera pipeline, trattative comprese: una sezione con
  // questo nome deve contenere le vendite. Qui restano solo gli affari chiusi
  // (SPA firmato e incassato); chi vuole vedere la pipeline ha la scheda
  // Pipeline. L'interruttore sotto permette comunque di includere gli EOI,
  // che sono impegni presi ma non ancora firmati.
  const [includiEOI, setIncludiEOI] = useState(false);

  const chiuse = sales.filter(s =>
    s.stato === 'venduto' || s.stato === 'incassato' || (includiEOI && s.stato === 'EOI'));

  const valore = chiuse.reduce((t, s) => t + Number(s.valore || 0), 0);
  const commissioni = chiuse.reduce((t, s) => t + Number(s.valore || 0) * (s.commission_pct || 5) / 100, 0);
  const incassate = chiuse.filter(s => s.stato === 'incassato')
    .reduce((t, s) => t + Number(s.valore || 0) * (s.commission_pct || 5) / 100, 0);
  const daPagare = chiuse.filter(s => !s.pagato)
    .reduce((t, s) => t + Number(s.valore || 0) * (s.commission_pct || 5) / 100, 0);

  // I totali qui sopra restano su tutte le vendite del filtro: si impagina
  // la tabella, non il conto.
  const pagVendite = usePaginazione(chiuse);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="p-4">
          <p className="text-zinc-500 text-sm">Vendite chiuse</p>
          <p className="text-2xl font-semibold text-ink mt-1">{chiuse.length}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-zinc-500 text-sm">Volume venduto</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">{fmt(valore)}</p>
          <p className="text-zinc-600 text-xs mt-0.5">AED</p>
        </Card>
        <Card padding="p-4">
          <p className="text-zinc-500 text-sm">Commissioni generate</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: BRAND.oro }}>{fmt(commissioni)}</p>
          <p className="text-zinc-600 text-xs mt-0.5">di cui incassate {fmt(incassate)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-zinc-500 text-sm">Da liquidare agli agenti</p>
          <p className={`text-2xl font-semibold mt-1 ${daPagare > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{fmt(daPagare)}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Cerca progetto, cliente, agente..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl pl-10 pr-4 py-2.5 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-2.5">
          <input type="checkbox" checked={includiEOI} onChange={(e) => setIncludiEOI(e.target.checked)} className="w-4 h-4 rounded" />
          Includi gli EOI
        </label>
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#e4e0d8]">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Data</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Progetto</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Zona</th>
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
            <tbody className="divide-y divide-[#2b323d]">
              {pagVendite.elementi.map(s => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-400">{fmtShort(s.data)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-ink text-sm font-medium">{s.progetto}</span>
                        <br /><span className="text-xs text-zinc-500">{s.developer}</span>
                      </div>
                      {s.note && (
                        <span title={s.note} className="text-amber-400 cursor-help">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {s.pf_url && (
                        <a href={s.pf_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.zona || '-'}</td>
                  <td className="px-4 py-3 text-sm text-blue-400">{s.cliente_nome || '-'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.agente || s.segnalatore || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-ink">{s.valore > 0 ? fmt(s.valore) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-zinc-700/50 rounded px-2 py-1 text-xs text-ink min-w-[58px] focus:outline-none">
                      {commissions.map(c => <option key={c} value={c}>{c}%</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.stato || 'lead'} onChange={(e) => updateSale(s.id, { stato: e.target.value })} className="rounded px-2 py-1 text-xs text-white min-w-[116px] focus:outline-none" style={{ background: theme.status[s.stato || 'lead']?.bg, color: theme.status[s.stato || 'lead']?.color }}>
                      {pipelineStati.map(st => <option key={st} value={st} className="bg-zinc-800">{pipelineLabels[st] || st}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className={`rounded px-2 py-1 text-xs font-medium min-w-[52px] focus:outline-none ${s.referente === 'Pellegrino' ? 'bg-green-500/20 text-green-400' : s.referente === 'Giovanni' ? 'bg-oro-500/20 text-oro-400' : 'bg-zinc-700/50 text-zinc-500'}`}>
                      <option value="">-</option>
                      <option value="Pellegrino">P</option>
                      <option value="Giovanni">G</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-500 hover:text-zinc-300'}`}>
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
        <Paginazione {...pagVendite} nome="vendite" />
        {sales.length === 0 && <div className="text-center py-12 text-zinc-500">Nessuna vendita trovata</div>}
      </Card>
    </div>
  );
}

// Leads Table View with Multi-Select
function LeadsTableView({ leads, clienti, onSelectLead, onUpdateStatus, onDelete, onAssign, theme, users, isAdmin }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStato, setFilterStato] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);

  // Usa pipelineStati globale (già definito sopra)
  const fmt = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n);
  
  const getCliente = (id) => clienti.find(c => c.id === id);
  
  // Filter and sort leads
  const filteredLeads = leads
    .filter(l => {
      if (filterStato && l.stato !== filterStato) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const cliente = getCliente(l.cliente_id);
        return l.progetto?.toLowerCase().includes(q) || 
               l.zona?.toLowerCase().includes(q) ||
               l.developer?.toLowerCase().includes(q) ||
               cliente?.nome?.toLowerCase().includes(q) ||
               cliente?.cognome?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'cliente') {
        aVal = getCliente(a.cliente_id)?.nome || '';
        bVal = getCliente(b.cliente_id)?.nome || '';
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const pag = usePaginazione(filteredLeads);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map(l => l.id));
    }
  };

  const handleBulkAction = (action, value) => {
    if (action === 'delete') {
      if (window.confirm(`Eliminare ${selectedIds.length} lead?`)) {
        // la conferma e' gia' stata chiesta qui sopra, una volta sola
        selectedIds.forEach(id => onDelete(id, true));
        setSelectedIds([]);
      }
    } else if (action === 'status') {
      selectedIds.forEach(id => onUpdateStatus(id, value));
      setSelectedIds([]);
    } else if (action === 'assign' && onAssign) {
      onAssign(selectedIds, value);
      setSelectedIds([]);
    }
    setBulkAction(null);
  };

  const SortHeader = ({ field, children }) => (
    <th 
      className="text-left py-3 px-4 text-zinc-400 font-medium text-sm cursor-pointer hover:text-ink transition-colors"
      onClick={() => {
        if (sortField === field) {
          setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDir('asc');
        }
      }}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-oro-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cerca lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-700/50 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-ink text-sm w-64 focus:border-oro-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value)}
            className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"
          >
            <option value="">Tutti gli stati</option>
            {pipelineStati.map(s => (
              <option key={s} value={s}>{pipelineLabels[s] || s}</option>
            ))}
          </select>
        </div>
        <p className="text-zinc-500 text-sm">{filteredLeads.length} lead</p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <Card className="bg-oro-500/10 border-oro-500/40">
          <div className="flex items-center justify-between">
            <p className="text-oro-400 font-medium">
              {selectedIds.length} lead selezionati
            </p>
            <div className="flex items-center gap-2">
              <select
                value=""
                onChange={(e) => handleBulkAction('status', e.target.value)}
                className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-ink text-sm"
              >
                <option value="">Cambia stato...</option>
                {pipelineStati.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {isAdmin && users?.length > 0 && (
                <select
                  value=""
                  onChange={(e) => handleBulkAction('assign', e.target.value)}
                  className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-ink text-sm"
                >
                  <option value="">Assegna a...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.nome}>{u.nome}</option>
                  ))}
                </select>
              )}
              <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-1" /> Elimina
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-oro-600 focus:ring-oro-500"
                  />
                </th>
                <SortHeader field="cliente">Cliente</SortHeader>
                <SortHeader field="progetto">Progetto</SortHeader>
                <SortHeader field="zona">Zona</SortHeader>
                <SortHeader field="valore">Valore</SortHeader>
                <SortHeader field="stato">Stato</SortHeader>
                <SortHeader field="created_at">Data</SortHeader>
                {isAdmin && <SortHeader field="assegnato_a">Agente</SortHeader>}
                <th className="w-20 py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pag.elementi.map(lead => {
                const cliente = getCliente(lead.cliente_id);
                const isSelected = selectedIds.includes(lead.id);
                return (
                  <tr 
                    key={lead.id} 
                    className={`hover:bg-zinc-800 cursor-pointer transition-colors ${isSelected ? 'bg-oro-500/10' : ''}`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-oro-600 focus:ring-oro-500"
                      />
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelectLead(lead)}>
                      <div className="flex items-center gap-3">
                        {cliente && <Avatar nome={cliente.nome} size="sm" />}
                        <div>
                          <p className="text-ink font-medium">{cliente ? `${cliente.nome} ${cliente.cognome || ''}` : 'N/A'}</p>
                          {cliente?.telefono && <p className="text-zinc-500 text-xs">{cliente.telefono}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelectLead(lead)}>
                      <p className="text-ink">{lead.progetto || '-'}</p>
                      <p className="text-zinc-500 text-xs">{lead.developer || ''}</p>
                    </td>
                    <td className="py-3 px-4 text-zinc-300" onClick={() => onSelectLead(lead)}>{lead.zona || '-'}</td>
                    <td className="py-3 px-4" onClick={() => onSelectLead(lead)}>
                      <span className="text-emerald-400 font-semibold">{lead.valore > 0 ? fmt(lead.valore) : 'TBD'}</span>
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelectLead(lead)}>
                      <StatusBadge status={lead.stato || 'lead'} />
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-sm" onClick={() => onSelectLead(lead)}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('it-IT') : '-'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4" onClick={() => onSelectLead(lead)}>
                        {lead.assegnato_a ? (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">{lead.assegnato_a}</span>
                        ) : (
                          <span className="text-zinc-600 text-sm">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectLead(lead); }}
                          className="p-1.5 text-zinc-400 hover:text-ink hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if(window.confirm('Eliminare?')) onDelete(lead.id); }}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="py-12 text-center">
              <Target className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">Nessun lead trovato</p>
            </div>
          )}
        </div>
        <Paginazione {...pag} nome="lead" />
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
      {/* Su schermo largo cinque colonne; su telefono una fila che scorre,
          perche' cinque stadi in due colonne di griglia non si leggono e non
          si scorrono. */}
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {pipelineStati.map(st => (
          <div key={st} className="space-y-3 shrink-0 w-[78vw] max-w-[300px] snap-start lg:w-auto lg:max-w-none lg:shrink" onDragOver={(e) => handleDragOver(e, st)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, st)}>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: theme.status[st]?.color }} />
                <span className="text-sm font-medium text-ink">{pipelineLabels[st] || st}</span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-0.5 rounded-full">{byStato[st]?.length || 0}</span>
            </div>
            <div className={`space-y-2 min-h-[200px] rounded-xl p-2 transition-all ${dragOverColumn === st ? 'bg-white/5 ring-2 ring-violet-500/50' : ''}`}>
              {byStato[st]?.map(s => (
                <div key={s.id} draggable onDragStart={(e) => handleDragStart(e, s)} onDragEnd={handleDragEnd} className={`cursor-grab active:cursor-grabbing ${draggedItem?.id === s.id ? 'opacity-50' : ''}`}>
                  <Card hover onClick={() => onSelectLead(s)} padding="p-3" className="border-l-2" style={{ borderLeftColor: theme.status[st]?.color }}>
                    <p className="text-ink text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
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
// Una riga della tabella clienti, memoizzata di proposito.
//
// Spuntando una casella cambia una riga sola, ma senza memo React ne ridisegna
// trentasei: misurato, erano 96-235 ms per click su CPU rallentata quattro
// volte — un ritardo che si sente sotto il dito.
const STATS_VUOTE = { leads: 0, value: 0 };

const RigaCliente = React.memo(function RigaCliente({
  cliente, stats, selezionata, onToggle, onSelect, onDelete
}) {
  return (
                  <tr 
                    className={`hover:bg-zinc-800 cursor-pointer transition-colors ${selezionata ? 'bg-amber-500/10' : ''}`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selezionata}
                        onChange={() => onToggle(cliente.id)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelect(cliente)}>
                      <div className="flex items-center gap-3">
                        <Avatar nome={cliente.nome} cognome={cliente.cognome} size="sm" />
                        <div className="min-w-0">
                          <p className="text-ink font-medium flex items-center gap-2 flex-wrap">
                            {cliente.nome} {cliente.cognome || ''}
                            <PastiglieTipi tipi={cliente.tipi} breve />
                          </p>
                          {cliente.azienda && <p className="text-zinc-500 text-xs">{cliente.azienda}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300" onClick={() => onSelect(cliente)}>
                      {cliente.telefono || '-'}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 text-sm" onClick={() => onSelect(cliente)}>
                      {cliente.email || '-'}
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelect(cliente)}>
                      <StatusBadge status={cliente.stato} type="cliente" />
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelect(cliente)}>
                      {cliente.assegnato_a ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">{cliente.assegnato_a}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelect(cliente)}>
                      {stats.leads > 0 ? (
                        <span className="text-blue-400 font-medium">{stats.leads}</span>
                      ) : (
                        <span className="text-zinc-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={() => onSelect(cliente)}>
                      {stats.value > 0 ? (
                        <span className="text-emerald-400 font-semibold">{fmt(stats.value)}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-300" onClick={() => onSelect(cliente)}>
                      {cliente.budget_max ? fmt(cliente.budget_max) : '-'}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-sm" onClick={() => onSelect(cliente)}>
                      {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelect(cliente); }}
                          className="p-1.5 text-zinc-400 hover:text-ink hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Dettagli"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if(window.confirm('Eliminare questo cliente?')) onDelete(cliente.id); }}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
  );
});

function CRMTab({ clienti, conteggiTipi = {}, filters, setFilters, sales, onSelect, onCreate, onDelete, onUpdateCliente, users }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Una passata sola sulle vendite, non una per ogni riga a ogni ridisegno.
  // Oggetto semplice e non Map: in questo file "Map" e' un'icona importata da
  // lucide-react, e `new Map()` chiamerebbe il componente come costruttore.
  const statsPerCliente = useMemo(() => {
    const m = {};
    for (const s of sales) {
      if (!s.cliente_id) continue;
      const v = m[s.cliente_id] || (m[s.cliente_id] = { leads: 0, value: 0 });
      v.leads += 1;
      if (s.stato === 'venduto' || s.stato === 'incassato') v.value += Number(s.valore || 0);
    }
    return m;
  }, [sales]);

  const sortedClienti = useMemo(() => {
    const stat = (id) => statsPerCliente[id] || STATS_VUOTE;
    return [...clienti].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'leads') { aVal = stat(a.id).leads; bVal = stat(b.id).leads; }
      else if (sortField === 'value') { aVal = stat(a.id).value; bVal = stat(b.id).value; }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [clienti, statsPerCliente, sortField, sortDir]);

  // L'elenco si impagina: con trenta contatti si scorre, con trecento no.
  const pag = usePaginazione(sortedClienti);

  // Stabile fra un ridisegno e l'altro, altrimenti il memo delle righe non
  // serve a niente: una funzione nuova e' una prop nuova.
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedClienti.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedClienti.map(c => c.id));
    }
  };

  const handleBulkAction = async (action, value) => {
    console.log('Bulk action:', action, value, 'IDs:', selectedIds);
    
    if (action === 'delete') {
      if (window.confirm(`Eliminare ${selectedIds.length} clienti?`)) {
        for (const id of selectedIds) {
          await onDelete(id, true);
        }
        setSelectedIds([]);
      }
    } else if (action === 'stato') {
      if (!onUpdateCliente) { console.error('onUpdateCliente not provided'); return; }
      for (const id of selectedIds) {
        console.log('Updating stato for', id, 'to', value);
        await onUpdateCliente(id, { stato: value });
      }
      setSelectedIds([]);
    } else if (action === 'assegnato') {
      if (!onUpdateCliente) { console.error('onUpdateCliente not provided'); return; }
      for (const id of selectedIds) {
        console.log('Assigning', id, 'to', value);
        await onUpdateCliente(id, { assegnato_a: value });
      }
      setSelectedIds([]);
    }
  };

  const SortHeader = ({ field, children, className = '' }) => (
    <th 
      className={`text-left py-3 px-4 text-zinc-400 font-medium text-sm cursor-pointer hover:text-ink transition-colors ${className}`}
      onClick={() => {
        if (sortField === field) {
          setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortDir('asc');
        }
      }}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-amber-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative min-w-[250px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Cerca cliente..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl pl-10 pr-4 py-2.5 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50" />
          </div>
          <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-2.5 text-ink text-sm focus:outline-none">
            <option value="">Tutti gli stati</option>
            {clienteStati.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button icon={UserPlus} onClick={onCreate}>Nuovo Cliente</Button>
      </div>

      {/* Le categorie del contatto: la «bandiera» per cercare chi porta
          immobili invece di chi li compra. */}
      <FiltroTipiCliente scelti={filters.tipi || []} conteggi={conteggiTipi}
                         onCambia={(tipi) => setFilters({ ...filters, tipi })} />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-amber-400 font-medium">
              {selectedIds.length} clienti selezionati
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value=""
                onChange={(e) => handleBulkAction('stato', e.target.value)}
                className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-ink text-sm"
              >
                <option value="">Cambia stato...</option>
                {clienteStati.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {users?.length > 0 && (
                <select
                  value=""
                  onChange={(e) => handleBulkAction('assegnato', e.target.value)}
                  className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-ink text-sm"
                >
                  <option value="">Assegna a...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.nome}>{u.nome}</option>
                  ))}
                </select>
              )}
              <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-1" /> Elimina
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === sortedClienti.length && sortedClienti.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <SortHeader field="nome">Cliente</SortHeader>
                <SortHeader field="telefono">Telefono</SortHeader>
                <SortHeader field="email">Email</SortHeader>
                <SortHeader field="stato">Stato</SortHeader>
                <SortHeader field="assegnato_a">Agente</SortHeader>
                <SortHeader field="leads">Lead</SortHeader>
                <SortHeader field="value">Valore</SortHeader>
                <SortHeader field="budget_max">Budget</SortHeader>
                <SortHeader field="created_at">Data</SortHeader>
                <th className="w-20 py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pag.elementi.map(cliente => (
                <RigaCliente
                  key={cliente.id}
                  cliente={cliente}
                  stats={statsPerCliente[cliente.id] || STATS_VUOTE}
                  selezionata={selectedIds.includes(cliente.id)}
                  onToggle={toggleSelect}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
          {sortedClienti.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">Nessun cliente trovato</p>
              <Button className="mt-4" icon={UserPlus} onClick={onCreate}>Aggiungi Cliente</Button>
            </div>
          )}
        </div>
        <Paginazione {...pag} nome="clienti" />
      </Card>
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
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-ink">{cliente.nome} {cliente.cognome}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={cliente.stato} type="cliente" />
              <PastiglieTipi tipi={cliente.tipi} massimo={6} />
              {cliente.nazionalita && <span className="text-zinc-500 text-sm">{cliente.nazionalita}</span>}
              {cliente.assegnato_a && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                  <User className="w-3 h-3" /> {cliente.assegnato_a}
                </span>
              )}
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
      <div className="flex gap-2 border-b border-[#e4e0d8]">
        {['info', 'lead', 'task'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'text-ink border-amber-500' : 'text-zinc-500 border-transparent hover:text-ink'}`}>
            {t === 'info' ? 'Informazioni' : t === 'lead' ? `Lead (${sales.length})` : `Task (${tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-zinc-500 text-xs mb-1">Telefono</p><p className="text-ink">{cliente.telefono || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Email</p><p className="text-ink truncate">{cliente.email || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Budget Min</p><p className="text-amber-400">{cliente.budget_min ? fmt(cliente.budget_min) : '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Budget Max</p><p className="text-amber-400">{cliente.budget_max ? fmt(cliente.budget_max) : '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Assegnato a</p><p className="text-blue-400">{cliente.assegnato_a || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Agente Rif.</p><p className="text-ink">{cliente.agente_riferimento || '-'}</p></div>
            <div><p className="text-zinc-500 text-xs mb-1">Fonte</p><p className="text-ink">{cliente.fonte || '-'}</p></div>
          </div>
          {cliente.note && <div className="mt-4 pt-4 border-t border-[#e4e0d8]"><p className="text-zinc-500 text-xs mb-1">Note</p><p className="text-ink text-sm">{cliente.note}</p></div>}
          <div className="mt-4 pt-4 border-t border-[#e4e0d8]">
            <p className="text-zinc-500 text-xs mb-2">Stato</p>
            <div className="flex flex-wrap gap-2">
              {clienteStati.map(s => (
                <button key={s} onClick={() => updateCliente(cliente.id, { stato: s })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cliente.stato === s ? 'bg-amber-500 text-black' : 'bg-zinc-700/50 text-zinc-400 hover:text-ink'}`}>{s}</button>
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
                  <div className="flex items-center gap-2"><p className="text-ink font-medium">{s.progetto}</p><StatusBadge status={s.stato || 'lead'} /></div>
                  <p className="text-zinc-500 text-sm">{s.developer} • {s.zona}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink font-medium">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
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
                    <p className={`text-ink font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
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
  const pagTask = usePaginazione(filtered);
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
            { id: 'pending', label: 'Da fare', count: counts.pending, tinta: theme.delta.pari },
            { id: 'overdue', label: 'Scaduti', count: counts.overdue, tinta: theme.stato.critico },
            { id: 'today', label: 'Oggi', count: counts.today, tinta: theme.stato.attenzione },
            { id: 'completed', label: 'Fatto', tinta: theme.stato.buono }
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? '' : 'text-zinc-500 hover:text-ink'}`}
                    style={filter === f.id ? { background: f.tinta.bg, color: f.tinta.text } : {}}>
              {f.label} {f.count !== undefined && `(${f.count})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon={ListTodo} title="Nessun task" description={filter === 'pending' ? 'Tutti i task sono completati!' : 'Nessun task in questa categoria'} />
        ) : pagTask.elementi.map(t => {
          const cliente = getCliente(t.cliente_id);
          return (
            <Card key={t.id} padding="p-4" className={`${t.stato === 'completato' ? 'opacity-50' : ''} ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'border-red-500/30 bg-red-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`text-ink font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
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
      <Paginazione {...pagTask} nome="task" className="rounded-xl" />
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
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500 hover:text-ink'}`}>
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
                    <p className={`text-ink font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</p>
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
function TeamTab({ users, currentUserId, onCreate, onEdit, onSetActive }) {
  const [copiato, setCopiato] = useState(null);

  // Le password non sono piu' leggibili: nel database resta solo l'hash.
  // Si copia il link di accesso, non la credenziale.
  const copiaAccesso = (u) => {
    navigator.clipboard.writeText(`Portale KeyPrime\n${getBaseUrl()}\nUtente: ${u.username}`);
    setCopiato(u.id);
    setTimeout(() => setCopiato(null), 2000);
  };

  const etichettaRuolo = {
    admin: 'Admin', agente_admin: 'Agente Admin', agente: 'Agente', segnalatore: 'Segnalatore'
  };
  const coloreRuolo = {
    admin: 'bg-oro-500/20 text-oro-400',
    agente_admin: 'bg-violet-500/20 text-violet-300',
    agente: 'bg-blue-500/20 text-blue-300',
    segnalatore: 'bg-emerald-500/20 text-emerald-300'
  };

  const attivi = users.filter(u => u.attivo);
  const disattivi = users.filter(u => !u.attivo);
  const agenti = attivi.filter(u => u.ruolo === 'agente' || u.ruolo === 'agente_admin');

  const scheda = (u) => (
    <Card key={u.id} padding="p-4" className={u.attivo ? '' : 'opacity-60'}>
      <div className="flex items-center gap-4">
        <Avatar nome={u.nome} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-ink font-medium truncate">{u.nome}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs ${coloreRuolo[u.ruolo] || 'bg-zinc-700 text-zinc-300'}`}>
              {etichettaRuolo[u.ruolo] || u.ruolo}
            </span>
            {!u.attivo && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Disattivato</span>}
            {u.must_change_password && u.attivo && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">Password da impostare</span>
            )}
          </div>
          <p className="text-zinc-500 text-sm mt-1 truncate">
            {u.username}
            {u.email && ` • ${u.email}`}
            {u.telefono && ` • ${u.telefono}`}
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            {(u.ruolo === 'agente' || u.ruolo === 'agente_admin') && (
              u.ruolo === 'agente_admin'
                ? 'Quota societaria legata al referente'
                : `Commissione ${u.commission_pct ?? 70}%`
            )}
            {u.referente && ` • Referente ${u.referente}`}
            {u.last_login_at ? ` • Ultimo accesso ${fmtShort(u.last_login_at)}` : ' • Mai entrato'}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" icon={copiato === u.id ? Check : Copy} onClick={() => copiaAccesso(u)} title="Copia link di accesso" />
          <Button variant="ghost" size="sm" icon={Edit2} onClick={() => onEdit(u)} title="Modifica" />
          {u.id !== currentUserId && (
            u.attivo ? (
              <Button variant="ghost" size="sm" icon={EyeOff}
                onClick={() => { if (window.confirm(`Disattivare l'accesso di ${u.nome}? I suoi lead e le commissioni restano.`)) onSetActive(u.id, false); }}
                title="Disattiva accesso" />
            ) : (
              <Button variant="ghost" size="sm" icon={Eye} onClick={() => onSetActive(u.id, true)} title="Riattiva accesso" />
            )
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="p-4"><p className="text-zinc-500 text-sm">Attivi</p><p className="text-2xl font-semibold text-ink mt-1">{attivi.length}</p></Card>
        <Card padding="p-4"><p className="text-zinc-500 text-sm">In rotazione lead</p><p className="text-2xl font-semibold text-oro-400 mt-1">{agenti.length}</p></Card>
        <Card padding="p-4"><p className="text-zinc-500 text-sm">Segnalatori</p><p className="text-2xl font-semibold text-emerald-400 mt-1">{attivi.filter(u => u.ruolo === 'segnalatore').length}</p></Card>
        <Card padding="p-4"><p className="text-zinc-500 text-sm">Disattivati</p><p className="text-2xl font-semibold text-zinc-400 mt-1">{disattivi.length}</p></Card>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-zinc-500 text-sm">
          I nuovi lead inbound vengono distribuiti a rotazione fra i {agenti.length} agenti attivi.
        </p>
        <Button icon={UserPlus} onClick={onCreate}>Nuovo accesso</Button>
      </div>

      <div className="space-y-2">{attivi.map(scheda)}</div>

      {disattivi.length > 0 && (
        <div className="space-y-2">
          <p className="text-zinc-500 text-sm pt-2">Accessi disattivati</p>
          {disattivi.map(scheda)}
        </div>
      )}
    </div>
  );
}
function AgentDetailView({ agent, sales, onBack }) {
  const agentSales = sales.filter(s =>
    (agent.type === 'agente' || agent.type === 'agente_admin') ? s.agente === agent.name : s.segnalatore === agent.name
  );
  const vendite = agentSales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
  const totalVolume = agentSales.reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const totalVendite = vendite.reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const getRate = (s) => {
    if (agent.type === 'agente_admin') return s.referente === 'Giovanni' ? 0.7 : 0.3;
    return agent.type === 'agente' ? 0.7 : 0.3;
  };
  const rate = agent.type === 'agente' ? 0.7 : 0.3;
  const totalComm = vendite.reduce((sum, s) => sum + (Number(s.valore || 0) * (s.commission_pct || 5) / 100 * getRate(s)), 0);
  const commPagate = vendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore || 0) * (s.commission_pct || 5) / 100 * getRate(s)), 0);
  
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
    <div className="fixed inset-0 z-50 bg-[#edebe6] overflow-auto">
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
            <h1 className="text-2xl font-semibold text-ink">{agent.name}</h1>
            <p className="text-zinc-500 capitalize">{agent.type}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <p className="text-zinc-500 text-sm">Volume Totale</p>
            <p className="text-2xl font-semibold text-ink mt-1">{fmt(totalVolume)}</p>
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
          <h3 className="text-ink font-semibold mb-4">Pipeline</h3>
          <div className="grid grid-cols-5 gap-2">
            {pipelineStati.map(st => (
              <div key={st} className="text-center p-3 rounded-xl" style={{ background: theme.status[st]?.bg }}>
                <div className="text-xl font-semibold text-ink">{byStato[st] || 0}</div>
                <div className="text-xs" style={{ color: theme.status[st]?.color }}>{pipelineLabels[st] || st}</div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <h3 className="text-ink font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />Zone
            </h3>
            <div className="space-y-2">
              {Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([zona, value]) => (
                <div key={zona} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm w-24 truncate">{zona}</span>
                  <div className="flex-1"><ProgressBar value={value} max={Object.values(byZona).sort((a,b)=>b-a)[0] || 1} /></div>
                  <span className="text-ink text-sm w-20 text-right">{fmt(value)}</span>
                </div>
              ))}
              {Object.keys(byZona).length === 0 && <p className="text-zinc-500 text-sm">Nessun dato</p>}
            </div>
          </Card>
          
          <Card>
            <h3 className="text-ink font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />Trend
            </h3>
            <div className="space-y-2">
              {Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-5).map(([month, value]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-zinc-400 text-sm w-16">{month}</span>
                  <div className="flex-1"><ProgressBar value={value} max={Math.max(...Object.values(byMonth)) || 1} /></div>
                  <span className="text-ink text-sm w-20 text-right">{fmt(value)}</span>
                </div>
              ))}
              {Object.keys(byMonth).length === 0 && <p className="text-zinc-500 text-sm">Nessun dato</p>}
            </div>
          </Card>
        </div>
        
        {/* Recent Sales */}
        <Card>
          <h3 className="text-ink font-semibold mb-4">Ultimi Lead</h3>
          <div className="space-y-2">
            {agentSales.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
                <div className="w-1 h-10 rounded-full" style={{ background: theme.status[s.stato || 'lead']?.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-ink text-sm font-medium truncate">{s.progetto || 'TBD'}</p>
                  <p className="text-zinc-500 text-xs">{s.developer} • {s.zona}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink text-sm font-medium">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</p>
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
      // Try to use real coordinates first (from allMapProjects)
      let coords = null;
      if (p.coordinates?.lat && p.coordinates?.lon) {
        coords = { lat: p.coordinates.lat, lng: p.coordinates.lon, zoom: 14 };
      } else {
        // Fallback to location name lookup
        const locName = p.location?.full_name || p.location?.name || 'Unknown';
        coords = getLocationCoords(locName);
      }
      
      if (coords) {
        // Add small random offset to prevent overlap
        const offsetLat = (Math.random() - 0.5) * 0.008;
        const offsetLng = (Math.random() - 0.5) * 0.008;
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
          // Il canvas Esri copre fino allo zoom 16; oltre, Leaflet riusa
          // l'ultimo livello disponibile invece di mostrare riquadri vuoti.
          maxZoom: 19,
          maxNativeZoom: 16
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

      marker.on('click', (e) => {
        // Stop event propagation to prevent map click handler
        window.L.DomEvent.stopPropagation(e);
        setJustOpened(true);
        setPopupProject(project);
        // Reset after a tick
        setTimeout(() => setJustOpened(false), 100);
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
  // Close popup when clicking elsewhere, but not immediately after opening
  const [justOpened, setJustOpened] = useState(false);
  const handleMapClick = () => {
    if (!justOpened) {
      setPopupProject(null);
    }
    setJustOpened(false);
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'TBD';
    return parseFloat(price).toLocaleString();
  };

  if (mapError) {
    return (
      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
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
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center z-[1000]">
          <RefreshCw className="w-8 h-8 text-oro-400 animate-spin" />
        </div>
      )}

      {/* Project Popup Card - Airbnb style */}
      {popupProject && (
        <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] animate-fadeIn">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-40">
              {popupProject.images?.[0]?.medium_image_url ? (
                <img src={popupProject.images[0].medium_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); setPopupProject(null); }} className="absolute top-2 right-2 p-1.5 bg-zinc-800/50 rounded-full text-ink hover:bg-zinc-800/70">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-oro-500 text-ink text-xs font-medium rounded-lg">
                {popupProject.construction_phase_key === 'completed' ? '✓ Pronto' : popupProject.construction_phase_key === 'under_construction' ? '🏗️ In Costruzione' : '🚀 Non partito'}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-ink font-semibold truncate">{popupProject.title}</h3>
              <p className="text-zinc-400 text-sm truncate">{luogoLeggibile(popupProject.location?.full_name, popupProject.location?.name)}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-oro-400 font-bold">{popupProject.price_from > 0 ? 'AED ' + formatPrice(popupProject.price_from) : 'TBD'}</p>
                {popupProject.url ? (
                  <a href={popupProject.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-oro-500 hover:bg-oro-600 text-ink text-sm font-medium rounded-lg flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> PropertyFinder
                  </a>
                ) : (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setPopupProject(null); }}>
                    Chiudi
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-zinc-800/90 backdrop-blur border border-zinc-700 rounded-xl px-3 py-2">
          <p className="text-ink text-sm font-medium">{Object.keys(projectsByLocation).length} progetti sulla mappa</p>
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
      className={'p-3 rounded-xl cursor-pointer transition-all ' + (isSelected ? 'bg-oro-500/20 border-2 border-oro-500' : 'bg-zinc-800 border border-transparent hover:bg-zinc-700/50 hover:border-zinc-600')}
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
          <p className="text-ink font-medium text-sm truncate">{project.title}</p>
          <p className="text-zinc-500 text-xs truncate">{luogoLeggibile(project.location?.full_name, project.location?.name)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-oro-400 font-bold text-sm">{project.price_from > 0 ? 'AED ' + formatPrice(project.price_from) : 'TBD'}</p>
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
    emirate: '', // NEW: emirate filter
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

  const emirates = ['Dubai', 'Abu Dhabi', 'Ras Al Khaimah', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Fujairah'];
  
  const zonesByEmirate = {
    'Dubai': ['Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Palm Jumeirah', 'JBR', 'Dubai Hills Estate', 
      'Mohammed Bin Rashid City', 'Dubai Creek Harbour', 'Jumeirah Village Circle', 'JVC', 'JLT',
      'Dubai South', 'DAMAC Hills', 'DAMAC Hills 2', 'Arabian Ranches', 'Meydan', 'DIFC', 
      'Dubai Islands', 'Expo City', 'City Walk', 'Sobha Hartland', 'Tilal Al Ghaf', 'The Valley',
      'Motor City', 'Sports City', 'Al Furjan', 'Discovery Gardens', 'International City',
      'Dubai Silicon Oasis', 'Arjan', 'Al Barsha', 'Jumeirah', 'Umm Suqeim', 'Al Quoz', 'Deira', 'Bur Dubai'],
    'Abu Dhabi': ['Yas Island', 'Saadiyat Island', 'Al Reem Island', 'Al Raha Beach', 'Khalifa City', 'Masdar City', 'Al Ghadeer', 'Al Shamkha', 'Corniche'],
    'Ras Al Khaimah': ['Al Marjan Island', 'Mina Al Arab', 'Al Hamra Village', 'Hayat Island', 'RAK Central', 'Yasmin Village'],
    'Sharjah': ['Aljada', 'Al Mamzar Sharjah', 'Al Nahda Sharjah', 'Al Majaz', 'Muwaileh', 'Al Khan'],
    'Ajman': ['Ajman Downtown', 'Ajman Corniche', 'Al Rashidiya', 'Al Nuaimiya', 'Emirates City'],
    'Umm Al Quwain': ['UAQ Marina', 'UAQ Corniche', 'Al Salamah'],
    // Le prime due sono le zone che compaiono davvero nel catalogo
    // (Oceana ad Al Fqait, Ocean Living a Sharm); le altre sono le aree
    // residenziali dell'emirato, pronte per quando arriveranno progetti.
    'Fujairah': ['Al Fqait', 'Sharm', 'Fujairah Corniche', 'Al Faseel', 'Dibba Al Fujairah', 'Fujairah City']
  };
  
  // Get zones based on selected emirate or all
  const availableZones = filters.emirate ? zonesByEmirate[filters.emirate] || [] : Object.values(zonesByEmirate).flat();
  
  const topDevelopers = ['Emaar Properties', 'Damac Properties', 'Sobha Realty', 'Nakheel', 'Meraas', 'Aldar Properties', 'Azizi Developments', 'Binghatti', 'Ellington', 'Omniyat Group', 'Danube Properties', 'Select Group', 'Deyaar', 'MAG', 'Reportage Properties'];
  const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+'];
  /* Le fasi che il catalogo ha davvero: under_construction (2.452),
     completed (546), not_started (172). "launch" non e' mai esistito nei
     dati — chi lo sceglieva otteneva zero risultati e pensava che il
     catalogo fosse vuoto.
     E "Tutti gli stati" non erano tutti: i consegnati restavano fuori
     comunque, perche' la ricerca li esclude di suo. Ora il valore vuoto
     dice cosa fa, e chi cerca un'unita' pronta da rivendere ha una voce
     che la nomina. */
  const statusOptions = [
    { value: '', label: 'Off-plan (non consegnati)' },
    { value: 'under_construction', label: 'In costruzione' },
    { value: 'not_started', label: 'Non ancora partiti' },
    { value: 'completed', label: 'Pronti / consegnati' },
    { value: 'tutti', label: 'Tutte le fasi' }
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
      // Get projects by zone (excluding completed)
      const { data: zoneData } = await supabase
        .from('pf_projects')
        .select('location_name, price_from')
        .neq('construction_phase', 'completed');
      
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
      
      // Get projects by developer (excluding completed)
      const { data: devData } = await supabase
        .from('pf_projects')
        .select('developer_name')
        .not('developer_name', 'is', null)
        .neq('construction_phase', 'completed');
      
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

  // Load all projects with coordinates for map (excluding completed)
  const loadAllMapProjects = async () => {
    try {
      const { data } = await supabase
        .from('pf_projects')
        .select('project_id, title, location_name, location_full, price_from, construction_phase, url, raw_data')
        .neq('construction_phase', 'completed')
        .not('raw_data->location->coordinates', 'is', null)
        .limit(2000);
      
      if (data) {
        const mapProjects = data.map(p => ({
          project_id: p.project_id,
          title: p.title,
          location: { name: p.location_name, full_name: p.location_full },
          price_from: p.price_from,
          construction_phase_key: p.construction_phase,
          url: p.url,
          images: p.raw_data?.images,
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
      
      // EXCLUDE completed projects by default (they're not off-plan anymore)
      // Only show completed if explicitly filtered
      if (filters.status === 'tutti') {
        // nessun vincolo sulla fase
      } else if (filters.status) {
        query = query.eq('construction_phase', filters.status);
      } else {
        query = query.neq('construction_phase', 'completed');
      }
      
      // Una consegna vecchia su un off-plan vuol dire scheda ferma; su un
      // progetto gia' consegnato e' solo la data in cui e' stato consegnato,
      // e tagliarla toglierebbe proprio le unita' pronte che si cercano.
      if (filters.status !== 'completed' && filters.status !== 'tutti') {
        query = query.or('delivery_date.is.null,delivery_date.gte.2024-01-01');
      }
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,location_full.ilike.%${filters.search}%,developer_name.ilike.%${filters.search}%`);
      }
      if (filters.emirate) {
        query = query.ilike('location_full', `%${filters.emirate}%`);
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
      
      const { data, error: queryError, count } = await query;
      
      if (queryError) throw queryError;
      
      // Transform data to match expected format
      const transformedData = (data || []).map(trasformaProgetto);

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
      if (filters.status && filters.status !== 'tutti') query = query.eq('construction_phase', filters.status);
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
        p.construction_phase === 'completed' ? 'Pronto' : p.construction_phase === 'under_construction' ? 'In Costruzione' : 'Non partito',
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

  /* Scegliendo un developer o una zona dai suggerimenti la ricerca deve
     ripartire da sola. Non si puo' chiamarla subito dopo setFilters: quella
     chiamata leggerebbe i filtri vecchi. Si alza un contatore e si lascia
     ripartire al rendering successivo, quando i filtri nuovi ci sono. */
  const [daRicercare, setDaRicercare] = useState(0);
  useEffect(() => {
    if (daRicercare > 0) searchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daRicercare]);

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
            <h2 className="text-xl font-semibold text-ink flex items-center gap-2"><Building2 className="w-6 h-6 text-oro-400" />Off-Plan Projects</h2>
            <p className="text-zinc-500 text-sm mt-1">{totalResults > 0 ? totalResults.toLocaleString() + ' progetti' : 'Cerca progetti'}{selectedAreaName && ' • ' + selectedAreaName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)} icon={PieChart}>
              {showStats ? 'Nascondi' : 'Stats'}
            </Button>
            <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded-xl">
              <button onClick={() => { setViewMode('list'); setSelectedAreaProjects(null); }} className={'p-2 rounded-lg transition-colors ' + (viewMode === 'list' ? 'bg-oro-500 text-ink' : 'text-zinc-400 hover:text-ink')} title="Lista"><List className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('map')} className={'p-2 rounded-lg transition-colors ' + (viewMode === 'map' ? 'bg-oro-500 text-ink' : 'text-zinc-400 hover:text-ink')} title="Mappa"><Map className="w-5 h-5" /></button>
              <button onClick={() => setViewMode('saved')} className={'p-2 rounded-lg transition-colors relative ' + (viewMode === 'saved' ? 'bg-oro-500 text-ink' : 'text-zinc-400 hover:text-ink')} title="Salvati">
                <svg className="w-5 h-5" fill={viewMode === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                {savedListings?.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-oro-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">{savedListings.length}</span>}
              </button>
            </div>
          </div>
        </div>
        
        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="p-4">
              <h3 className="text-ink font-medium mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-oro-400" />Top Zone</h3>
              <div className="space-y-2">
                {stats.byZone.slice(0, 5).map((z, i) => (
                  <div key={z.name} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm truncate flex-1">{z.name}</span>
                    <span className="text-ink text-sm font-medium ml-2">{z.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-ink font-medium mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-oro-400" />Top Developer</h3>
              <div className="space-y-2">
                {stats.byDeveloper.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm truncate flex-1">{d.name}</span>
                    <span className="text-ink text-sm font-medium ml-2">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-ink font-medium mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-oro-400" />Statistiche</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-zinc-500 text-xs">Totale Progetti</p>
                  <p className="text-ink text-xl font-bold">{totalResults.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Prezzo Medio</p>
                  <p className="text-oro-400 text-xl font-bold">AED {(stats.avgPrice / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="mb-4">
          <div className="mb-3">
            <RicercaProgetti
              supabase={supabase}
              valore={filters.search}
              soloAttivi={filters.status !== 'completed' && filters.status !== 'tutti'}
              onCambia={(v) => setFilters(f => ({ ...f, search: v }))}
              onCerca={() => { setSelectedAreaProjects(null); searchListings(1); }}
              onApriProgetto={setSelectedListing}
              onScegliDeveloper={(nome) => { setFilters(f => ({ ...f, search: '', developer: nome })); setSelectedAreaProjects(null); setDaRicercare(n => n + 1); }}
              onScegliZona={(nome) => { setFilters(f => ({ ...f, search: '', location: nome })); setSelectedAreaProjects(null); setDaRicercare(n => n + 1); }}
            />
          </div>
          {/* Nove colonne uguali schiacciavano ogni filtro sotto la larghezza
              della propria etichetta ("Tutte le zo…"). Cinque per riga danno
              a ciascuno lo spazio per leggersi, e i nove controlli vanno
              semplicemente a capo. */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <select value={filters.emirate} onChange={(e) => setFilters(f => ({ ...f, emirate: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"><option value="">🇦🇪 Emirato</option>{emirates.map(e => <option key={e} value={e}>{e}</option>)}</select>
            <select value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"><option value="">Tutte le zone</option>{availableZones.map(a => <option key={a} value={a}>{a}</option>)}</select>
            <select value={filters.developer} onChange={(e) => setFilters(f => ({ ...f, developer: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"><option value="">Developer</option>{topDevelopers.map(d => <option key={d} value={d}>{d}</option>)}</select>
            <select value={filters.bedrooms} onChange={(e) => setFilters(f => ({ ...f, bedrooms: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"><option value="">Camere</option>{bedroomOptions.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : b + ' BR'}</option>)}</select>
            <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none">{statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            <select value={filters.deliveryYear} onChange={(e) => setFilters(f => ({ ...f, deliveryYear: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none"><option value="">Consegna</option>{deliveryYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <input type="number" placeholder="Min AED" value={filters.minPrice} onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none" />
            <input type="number" placeholder="Max AED" value={filters.maxPrice} onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none" />
            <Button onClick={() => { setSelectedAreaProjects(null); searchListings(1); }} icon={Search} disabled={loading}>{loading ? '...' : 'Cerca'}</Button>
          </div>
          {/* Sorting and active filters */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">Ordina:</span>
                <select value={filters.sortBy} onChange={(e) => { setFilters(f => ({ ...f, sortBy: e.target.value })); searchListings(1); }} className="bg-transparent border-none text-oro-400 text-sm focus:outline-none cursor-pointer">
                  {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {listings.length > 0 && (
                <Button variant="ghost" size="sm" onClick={exportProjectsCSV}>
                  <Download className="w-4 h-4 mr-1" />Export CSV
                </Button>
              )}
            </div>
            {(filters.emirate || filters.location || filters.developer || filters.status || filters.deliveryYear || filters.minPrice || filters.maxPrice || filters.bedrooms) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilters({ search: '', emirate: '', location: '', minPrice: '', maxPrice: '', bedrooms: '', developer: '', status: '', deliveryYear: '', sortBy: 'hotness' }); searchListings(1); }}>
                <X className="w-4 h-4 mr-1" />Reset filtri
              </Button>
            )}
          </div>
        </Card>
        {selectedAreaProjects && <div className="flex items-center gap-2 mb-4"><span className="text-zinc-400 text-sm">Filtrato: <span className="text-oro-400">{selectedAreaName}</span></span><Button variant="ghost" size="sm" onClick={() => { setSelectedAreaProjects(null); setSelectedAreaName(''); }}><X className="w-4 h-4 mr-1" />Rimuovi</Button></div>}
      </div>

      {error && <Card className="border-red-500/20 bg-red-500/5 mb-4"><div className="flex items-center gap-3 text-red-400"><AlertCircle className="w-5 h-5" /><span>{error}</span><Button variant="ghost" size="sm" onClick={() => searchListings(1)}>Riprova</Button></div></Card>}

      <div className="flex-1 min-h-0">
        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto">
            {loading && listings.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <Card key={i} className="animate-pulse"><div className="h-40 bg-zinc-700/50 rounded-xl mb-3" /><div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-2" /><div className="h-3 bg-zinc-700/50 rounded w-1/2" /></Card>)}</div>
            ) : displayProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayProjects.map(project => (
                    <Card key={project.project_id} hover className="overflow-hidden group cursor-pointer" onClick={() => setSelectedListing(project)}>
                      <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden">
                        {project.images?.[0]?.medium_image_url ? <img src={project.images[0].medium_image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center"><Building2 className="w-12 h-12 text-zinc-600" /></div>}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <span className={'px-2 py-1 text-white text-xs font-medium rounded-lg ' + (project.construction_phase_key === 'completed' ? 'bg-emerald-500/90' : project.construction_phase_key === 'under_construction' ? 'bg-navy-500/90' : 'bg-oro-500/90 !text-ink')}>{project.construction_phase_key === 'completed' ? 'Pronto' : project.construction_phase_key === 'under_construction' ? 'In Costruzione' : 'Non partito'}</span>
                          {project.hotness_level >= 80 && <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-oro-600 text-white text-xs font-medium rounded-lg">🔥</span>}
                        </div>
                        {formatDelivery(project.delivery_date) && <div className="absolute top-2 right-12 px-2 py-1 bg-zinc-800/70 text-ink text-xs rounded-lg">{formatDelivery(project.delivery_date)}</div>}
                        <button onClick={(e) => { e.stopPropagation(); isListingSaved(project.project_id) ? onRemoveListing(project.project_id) : onSaveListing(project); }} className={'absolute top-2 right-2 p-2 rounded-full transition-colors ' + (isListingSaved(project.project_id) ? 'bg-oro-500 text-ink' : 'bg-zinc-800/50 text-white hover:bg-oro-500')}><svg className="w-4 h-4" fill={isListingSaved(project.project_id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-ink font-medium line-clamp-1">{project.title}</p>
                        <p className="text-zinc-500 text-sm line-clamp-1">{luogoLeggibile(project.location?.full_name, project.location?.name)}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          {formatBedrooms(project.bedrooms) && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{formatBedrooms(project.bedrooms)}</span>}
                          {project.payment_plans && <span>{formatPaymentPlan(project.payment_plans)}</span>}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-oro-400 font-semibold">{project.price_from > 0 ? 'da AED ' + formatPrice(project.price_from) : 'Prezzo TBD'}</p>
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
                              ? 'bg-oro-500 text-ink' 
                              : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
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
          <div className="fixed inset-0 z-50 bg-[#edebe6]">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-[#edebe6]/95 backdrop-blur border-b border-zinc-800">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/logo-scuro.png" alt="KeyPrime" className="h-8 lg:h-10" />
                  <span className="text-zinc-500 hidden sm:inline">|</span>
                  <span className="text-zinc-400 text-sm">{displayProjects.length} progetti</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} icon={X}>Chiudi</Button>
              </div>
              {/* Filters - Horizontal scroll on mobile */}
              <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <select value={filters.emirate} onChange={(e) => setFilters(f => ({ ...f, emirate: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm min-w-[100px] flex-shrink-0">
                  <option value="">🇦🇪 Emirato</option>
                  {emirates.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm min-w-[120px] flex-shrink-0">
                  <option value="">Tutte le zone</option>
                  {availableZones.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.developer} onChange={(e) => setFilters(f => ({ ...f, developer: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm min-w-[130px] flex-shrink-0">
                  <option value="">Tutti i developer</option>
                  {topDevelopers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filters.bedrooms} onChange={(e) => setFilters(f => ({ ...f, bedrooms: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm min-w-[90px] flex-shrink-0">
                  <option value="">Camere</option>
                  {bedroomOptions.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : b + ' BR'}</option>)}
                </select>
                <Button onClick={() => searchListings(1)} size="sm" className="flex-shrink-0" disabled={loading}>{loading ? '...' : 'Cerca'}</Button>
              </div>
            </div>
            
            {/* Map Container - Fullscreen */}
            <div className="absolute inset-0 pt-24 lg:pt-28">
              {/* Desktop: Sidebar + Map */}
              <div className="hidden lg:flex h-full">
                {/* Left Sidebar */}
                <div className="w-96 h-full bg-[#ffffff] border-r border-zinc-800 flex flex-col">
                  <div className="p-3 border-b border-zinc-800">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input type="text" placeholder="Cerca progetto..." value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && searchListings(1)} className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-ink text-sm placeholder:text-zinc-500 focus:border-oro-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {displayProjects.map(project => (
                      <div key={project.project_id} onClick={() => setSelectedListing(project)} className={'p-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-700/30 transition-colors ' + (selectedListing?.project_id === project.project_id ? 'bg-oro-500/10 border-l-2 border-l-oro-500' : '')}>
                        <div className="flex gap-3">
                          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                            {project.images?.[0]?.medium_image_url ? <img src={project.images[0].medium_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-zinc-600" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink text-sm truncate">{project.title}</h3>
                            <p className="text-xs text-zinc-500 truncate">{luogoLeggibile(project.location?.full_name, project.location?.name)}</p>
                            <p className="text-oro-400 font-semibold text-sm mt-1">{project.price_from > 0 ? 'From ' + formatPrice(project.price_from) : 'TBD'}</p>
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
                        <Button variant="ghost" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-zinc-400 text-sm">Pag. {page}/{totalPages}</span>
                        <Button variant="ghost" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Map */}
                <div className="flex-1 relative">
                  <MapboxMap projects={listings} onSelectProject={setSelectedListing} selectedProject={selectedListing} onAreaClick={handleAreaClick} />
                </div>
              </div>

              {/* Mobile: Fullscreen Map + Bottom Carousel */}
              <div className="lg:hidden h-full flex flex-col">
                {/* Map takes most space */}
                <div className="flex-1 relative">
                  <MapboxMap projects={listings} onSelectProject={setSelectedListing} selectedProject={selectedListing} onAreaClick={handleAreaClick} />
                </div>
                
                {/* Bottom Carousel */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d1116] via-[#0d1116]/95 to-transparent pt-8 pb-4">
                  <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
                    {displayProjects.map(project => (
                      <div 
                        key={project.project_id} 
                        onClick={() => setSelectedListing(project)}
                        className={'flex-shrink-0 w-72 bg-[#ffffff] rounded-xl p-3 border transition-all snap-start ' + (selectedListing?.project_id === project.project_id ? 'border-oro-500 scale-[1.02]' : 'border-zinc-800')}
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
                            <h3 className="font-medium text-ink text-sm line-clamp-1">{project.title}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-1">{luogoLeggibile(project.location?.full_name, project.location?.name)}</p>
                            <p className="text-oro-400 font-bold mt-1">{project.price_from > 0 ? 'From ' + formatPrice(project.price_from) : 'TBD'}</p>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                              {formatBedrooms(project.bedrooms) && <span>{formatBedrooms(project.bedrooms)}</span>}
                              {formatDelivery(project.delivery_date) && <span>• {formatDelivery(project.delivery_date)}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Page indicator */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-zinc-500 text-xs">{displayProjects.length} progetti • Scorri →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Projects View */}
        {viewMode === 'saved' && (
          <div className="h-full overflow-y-auto">
            {savedListings?.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-zinc-400 text-sm">{savedListings.length} progetti salvati</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedListings.map(saved => {
                    // Try to get full project data, fallback to saved fields
                    const project = saved.property_data || {
                      project_id: saved.property_id,
                      title: saved.title,
                      price_from: saved.price,
                      location: { full_name: saved.location_full, name: saved.location_path },
                      developer: { name: saved.agent_name },
                      images: saved.image_url ? [{ medium_image_url: saved.image_url }] : [],
                      construction_phase_key: saved.completion_status,
                      url: saved.pf_url
                    };
                    const imageUrl = project.images?.[0]?.medium_image_url || saved.image_url;
                    
                    return (
                      <Card key={saved.id} hover className="overflow-hidden group cursor-pointer" onClick={() => setSelectedListing(project)}>
                        <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center"><Building2 className="w-12 h-12 text-zinc-600" /></div>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveListing(saved.property_id); }} 
                            className="absolute top-2 right-2 p-2 rounded-full bg-oro-500 text-ink hover:bg-red-500 hover:text-white transition-colors"
                            title="Rimuovi dai salvati"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {saved.completion_status && (
                            <span className={'absolute top-2 left-2 px-2 py-1 text-ink text-xs font-medium rounded-lg ' + 
                              (saved.completion_status === 'completed' ? 'bg-green-500/90' : 
                               saved.completion_status === 'under_construction' ? 'bg-oro-500/90' : 'bg-blue-500/90')}>
                              {saved.completion_status === 'completed' ? 'Completato' : 
                               saved.completion_status === 'under_construction' ? 'In Costruzione' : 'Lancio'}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-ink font-medium line-clamp-1">{project.title || saved.title}</p>
                          <p className="text-zinc-500 text-sm line-clamp-1">{luogoLeggibile(project.location?.full_name || saved.location_full)}</p>
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-oro-400 font-semibold">
                              {(project.price_from || saved.price) > 0 ? 'da AED ' + parseFloat(project.price_from || saved.price).toLocaleString() : 'Prezzo TBD'}
                            </p>
                            {(project.developer?.name || saved.agent_name) && (
                              <span className="text-zinc-500 text-xs truncate max-w-[100px]">{project.developer?.name || saved.agent_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                          <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedListing(project); }}>
                            <Eye className="w-4 h-4 mr-1" />Dettagli
                          </Button>
                          <Button variant="secondary" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setShowAssignModal(project); }}>
                            <Plus className="w-4 h-4 mr-1" />Lead
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState 
                icon={Building2} 
                title="Nessun progetto salvato" 
                description="Salva i progetti che ti interessano cliccando sull'icona segnalibro"
                actionLabel="Cerca Progetti"
                onAction={() => setViewMode('list')}
              />
            )}
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [inviandoWa, setInviandoWa] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoType, setVideoType] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showBrochureViewer, setShowBrochureViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Fetch brochure and video URLs on mount
  useEffect(() => {
    if (listing?.url) {
      setMediaLoading(true);
      fetch(`/api/get-brochure?url=${encodeURIComponent(listing.url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.brochure_url) setBrochureUrl(data.brochure_url);
            if (data.video_url) {
              setVideoUrl(data.video_url);
              setVideoType(data.video_type);
            }
          }
        })
        .catch(() => {})
        .finally(() => setMediaLoading(false));
    }
  }, [listing?.url]);

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
      case 'under_construction': return { text: 'In Costruzione', color: 'bg-oro-500', icon: '🏗️' };
      case 'not_started': return { text: 'Nuovo Lancio', color: 'bg-blue-500', icon: '🚀' };
      default: return { text: 'Off-Plan', color: 'bg-oro-500', icon: '📋' };
    }
  };

  // Generate PDF for WhatsApp sharing
  const downloadProjectPDF = async () => {
    setGeneratingPdf(true);
    try {
      const status = getStatusLabel(listing.construction_phase_key);
      const paymentPlan = listing.payment_plans?.plans?.[0]?.summary;
      const imageUrl = listing.images?.[0]?.medium_image_url || '';
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #111; color: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #f97316; }
    .date { color: #888; font-size: 12px; }
    .hero { position: relative; margin-bottom: 30px; border-radius: 16px; overflow: hidden; }
    .hero img { width: 100%; height: 300px; object-fit: cover; }
    .badge { position: absolute; top: 16px; left: 16px; background: #f97316; color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px; }
    .title { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
    .location { color: #888; font-size: 16px; margin-bottom: 24px; }
    .price { font-size: 36px; font-weight: bold; color: #f97316; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
    .card { background: #1a1a1a; border-radius: 12px; padding: 20px; }
    .card-title { color: #888; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
    .card-value { font-size: 20px; font-weight: bold; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #f97316; }
    .payment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .payment-item { background: #1a1a1a; border-radius: 12px; padding: 16px; text-align: center; }
    .payment-percent { font-size: 28px; font-weight: bold; color: #f97316; }
    .payment-label { font-size: 12px; color: #888; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #666; font-size: 12px; }
    .cta { background: #f97316; color: white; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 20px; text-decoration: none; }
    .developer { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .developer-name { font-size: 16px; color: #ccc; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔑 KeyPrime</div>
    <div class="date">${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  
  ${imageUrl ? `<div class="hero"><img src="${imageUrl}" /><div class="badge">${status.icon} ${status.text}</div></div>` : ''}
  
  <div class="developer">
    <span class="developer-name">by ${listing.developer?.name || 'Developer'}</span>
  </div>
  
  <h1 class="title">${listing.title}</h1>
  <p class="location">📍 ${listing.location?.full_name || ''}</p>
  <p class="price">A partire da AED ${formatPrice(listing.price_from)}</p>
  
  <div class="grid">
    <div class="card">
      <div class="card-title">Tipologie</div>
      <div class="card-value">${formatBedrooms(listing.bedrooms) || 'Varie'}</div>
    </div>
    <div class="card">
      <div class="card-title">Consegna</div>
      <div class="card-value">${formatDelivery(listing.delivery_date) || 'TBA'}</div>
    </div>
    <div class="card">
      <div class="card-title">Stato</div>
      <div class="card-value">${status.text}</div>
    </div>
    <div class="card">
      <div class="card-title">Popolarità</div>
      <div class="card-value">${listing.hotness_level || 0}/100 🔥</div>
    </div>
  </div>
  
  ${paymentPlan ? `
  <div class="section">
    <div class="section-title">Piano di Pagamento</div>
    <div class="payment-grid">
      <div class="payment-item">
        <div class="payment-percent">${paymentPlan.down_payment || 0}%</div>
        <div class="payment-label">Anticipo</div>
      </div>
      <div class="payment-item">
        <div class="payment-percent">${paymentPlan.during_construction || 0}%</div>
        <div class="payment-label">In Costruzione</div>
      </div>
      <div class="payment-item">
        <div class="payment-percent">${paymentPlan.handover || 0}%</div>
        <div class="payment-label">Alla Consegna</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <div style="text-align: center;">
    <a href="${listing.url || '#'}" class="cta">Scopri di più →</a>
  </div>
  
  <div class="footer">
    <p>Documento generato da KeyPrime CRM</p>
    <p>Per info: pellegrino@indubai.it | +971 XXX XXX XXXX</p>
  </div>
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${listing.title.replace(/[^a-zA-Z0-9]/g, '_')}_KeyPrime.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF error:', err);
    }
    setGeneratingPdf(false);
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
      <div className="fixed inset-0 z-[60] bg-zinc-800">
        <button onClick={() => setShowFullGallery(false)} className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur rounded-full text-ink hover:bg-white/20">
          <X className="w-6 h-6" />
        </button>
        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-ink text-sm">
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
            <button onClick={() => setActiveImageIndex(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur rounded-full text-ink hover:bg-white/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setActiveImageIndex(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur rounded-full text-ink hover:bg-white/20">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Thumbnails */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
          {images.slice(0, 10).map((img, idx) => (
            <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-oro-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={img.small_image_url || img.medium_image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-zinc-800/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#ffffff] border border-[#e4e0d8] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-scaleIn">
        
        {/* Hero Image Section with Gallery */}
        <div className="relative h-72 md:h-80">
          {images[activeImageIndex]?.medium_image_url ? (
            <img src={images[activeImageIndex].medium_image_url} alt={listing.title} className="w-full h-full object-cover cursor-pointer" onClick={() => setShowFullGallery(true)} />
          ) : (
            <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center">
              <Building2 className="w-20 h-20 text-zinc-600" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141920] via-transparent to-black/30" />
          
          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1.5 ${status.color} text-ink text-sm font-medium rounded-full flex items-center gap-1.5 shadow-lg`}>
                <span>{status.icon}</span> {status.text}
              </span>
              {listing.hotness_level >= 80 && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-oro-600 text-white text-sm font-medium rounded-full flex items-center gap-1.5 shadow-lg">
                  🔥 Popolare
                </span>
              )}
              {formatDelivery(listing.delivery_date) && (
                <span className="px-3 py-1.5 bg-zinc-800/60 backdrop-blur text-ink text-sm rounded-full">
                  📅 {formatDelivery(listing.delivery_date)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onToggleSave} className={`p-2.5 rounded-full shadow-lg transition-all ${isSaved ? 'bg-oro-500 text-ink' : 'bg-zinc-800/60 backdrop-blur text-white hover:bg-oro-500'}`}>
                <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </button>
              <button onClick={onClose} className="p-2.5 bg-zinc-800/60 backdrop-blur rounded-full text-ink hover:bg-zinc-800/80 shadow-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Image navigation dots */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
              {images.slice(0, 8).map((_, idx) => (
                <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-oro-500 w-6' : 'bg-white/50 hover:bg-white/80'}`} />
              ))}
              {images.length > 8 && <span className="text-ink/50 text-xs ml-1">+{images.length - 8}</span>}
            </div>
          )}
          
          {/* Title section */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl md:text-3xl font-bold text-ink drop-shadow-lg">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-ink/80">
              <MapPin className="w-4 h-4" />
              <span>{listing.location?.full_name}</span>
            </div>
          </div>
          
          {/* Expand gallery button */}
          {images.length > 1 && (
            <button onClick={() => setShowFullGallery(true)} className="absolute bottom-4 right-4 px-3 py-1.5 bg-zinc-800/60 backdrop-blur text-ink text-sm rounded-full hover:bg-zinc-800/80 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {images.length} foto
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-20rem)]">
          
          {/* Price & Quick Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
            <div>
              <p className="text-3xl font-bold text-oro-400">
                {listing.price_from > 0 ? `AED ${formatPrice(listing.price_from)}` : 'Prezzo su richiesta'}
              </p>
              {listing.price_from > 0 && <p className="text-zinc-500 text-sm mt-1">Prezzo iniziale</p>}
            </div>
            {formatBedrooms(listing.bedrooms) && (
              <div className="flex items-center gap-4 text-zinc-300">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl">
                  <svg className="w-5 h-5 text-oro-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  <span className="font-medium">{formatBedrooms(listing.bedrooms)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown by Bedroom Type */}
          {listing.bedrooms?.available?.length > 0 && listing.price_from > 0 && (
            <div className="mb-6 p-4 bg-zinc-700/50/30 border border-zinc-700/50 rounded-xl">
              <h4 className="text-ink font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-oro-400" />
                Prezzi per Tipologia
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {listing.bedrooms.available.sort((a, b) => a - b).map((bed, idx) => {
                  const basePrice = listing.price_from;
                  const multiplier = bed === 0 ? 1 : 1 + (bed * 0.35);
                  const estimatedPrice = Math.round(basePrice * multiplier);
                  return (
                    <div key={idx} className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center">
                      <p className="text-zinc-400 text-xs mb-1">{bed === 0 ? 'Studio' : bed + ' BR'}</p>
                      <p className="text-oro-400 font-semibold">da {formatPrice(estimatedPrice)}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-zinc-500 text-xs mt-2 text-center">* Prezzi indicativi, contattare per quotazione esatta</p>
            </div>
          )}
          
          {/* Info Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-oro-500/14 to-oro-600/6 border border-oro-500/30 rounded-xl p-4 text-center">
              <p className="text-oro-400 text-2xl font-bold">{status.icon}</p>
              <p className="text-ink font-medium mt-1">{status.text}</p>
              <p className="text-zinc-500 text-xs mt-1">Stato progetto</p>
            </div>
            {formatDelivery(listing.delivery_date) && (
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-2xl font-bold">📅</p>
                <p className="text-ink font-medium mt-1">{formatDelivery(listing.delivery_date)}</p>
                <p className="text-zinc-500 text-xs mt-1">Consegna prevista</p>
              </div>
            )}
            {listing.payment_plans?.plans?.[0]?.summary?.down_payment && (
              <div className="bg-zinc-800 rounded-xl p-4 text-center">
                <p className="text-green-400 text-2xl font-bold">{listing.payment_plans.plans[0].summary.down_payment}%</p>
                <p className="text-ink font-medium mt-1">Anticipo</p>
                <p className="text-zinc-500 text-xs mt-1">Down payment</p>
              </div>
            )}
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-purple-400 text-2xl font-bold">{locationInsights.roi}</p>
              <p className="text-ink font-medium mt-1">ROI Stimato</p>
              <p className="text-zinc-500 text-xs mt-1">Rendimento annuo</p>
            </div>
          </div>
          
          {/* Developer Info - Prominent Card */}
          {listing.developer && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50 rounded-xl mb-6">
              {listing.developer.logo ? (
                <img src={listing.developer.logo} alt={listing.developer.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-oro-500/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-oro-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Developer</p>
                <p className="text-xl font-semibold text-ink">{listing.developer.name}</p>
                {listing.developer.projects_count && (
                  <p className="text-zinc-500 text-sm">{listing.developer.projects_count} progetti</p>
                )}
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-oro-500/20 text-oro-400 text-xs font-medium rounded-full">Verificato ✓</span>
              </div>
            </div>
          )}
          
          {/* Construction Progress - Only for under construction projects */}
          {listing.construction_phase_key === 'under_construction' && (
            <div className="bg-gradient-to-r from-oro-500/14 to-oro-400/6 border border-oro-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-ink font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-oro-400" /> Stato Avanzamento Lavori
                </h3>
                <span className="px-2 py-1 bg-oro-500/20 text-oro-400 text-xs font-medium rounded-full">In Costruzione</span>
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
                    <div className="relative h-4 bg-zinc-700/50 rounded-full overflow-hidden mb-2">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-oro-500 to-oro-300 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-ink drop-shadow">{progress}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Inizio lavori</span>
                      <span>Consegna: {formatDelivery(listing.delivery_date) || 'TBD'}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 25 ? 'bg-oro-500/20 text-oro-400' : 'bg-zinc-700/50 text-zinc-500')}>
                        <p className="font-medium">Fondazioni</p>
                        <p>{progress >= 25 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 50 ? 'bg-oro-500/20 text-oro-400' : 'bg-zinc-700/50 text-zinc-500')}>
                        <p className="font-medium">Struttura</p>
                        <p>{progress >= 50 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 75 ? 'bg-oro-500/20 text-oro-400' : 'bg-zinc-700/50 text-zinc-500')}>
                        <p className="font-medium">Finiture</p>
                        <p>{progress >= 75 ? '✓' : '...'}</p>
                      </div>
                      <div className={'p-2 rounded-lg text-center text-xs ' + (progress >= 95 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700/50 text-zinc-500')}>
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
                <h3 className="text-ink font-semibold flex items-center gap-2">
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
            <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700/50 rounded-xl text-zinc-300 transition-colors">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Apri in Google Maps</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Payment Plans */}
          {listing.payment_plans?.plans?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-ink font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" /> Piano di Pagamento
              </h3>
              <div className="space-y-3">
                {listing.payment_plans.plans.map((plan, idx) => (
                  <div key={idx} className="p-4 bg-zinc-800 rounded-xl">
                    {plan.title && <p className="text-zinc-300 font-medium mb-3">{plan.title}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-green-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{plan.summary.down_payment}%</p>
                        <p className="text-zinc-500 text-xs mt-1">Anticipo</p>
                      </div>
                      <div className="text-center p-3 bg-oro-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-oro-400">{plan.summary.during_construction}%</p>
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
              <h3 className="text-ink font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-oro-400" /> Galleria
                <span className="text-zinc-500 text-sm font-normal">({images.length} immagini)</span>
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.slice(0, 12).map((img, idx) => (
                  <button key={idx} onClick={() => { setActiveImageIndex(idx); setShowFullGallery(true); }} className="relative h-20 rounded-lg overflow-hidden group">
                    <img src={img.small_image_url || img.medium_image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-zinc-800/0 group-hover:bg-zinc-800/30 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-ink opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
                {images.length > 12 && (
                  <button onClick={() => setShowFullGallery(true)} className="h-20 rounded-lg bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
                    <span className="text-sm font-medium">+{images.length - 12}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          
          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
            <Button className="flex-1 py-3 bg-oro-500 hover:bg-oro-600" onClick={onCreateLead}>
              <Plus className="w-5 h-5 mr-2" /> Crea Lead
            </Button>
            <Button variant="secondary" className="flex-1 py-3" disabled={inviandoWa} onClick={async () => {
              setInviandoWa(true);
              try {
                const dati = {
                  bedsText: formatBedrooms(listing.bedrooms) || 'Varie tipologie',
                  deliveryText: formatDelivery(listing.delivery_date) || 'TBD',
                  paymentText: listing.payment_plans?.plans?.[0]?.summary
                    ? `${listing.payment_plans.plans[0].summary.down_payment}% anticipo` : ''
                };
                const testo = testoScheda(listing, dati);
                // Se la foto non si riesce a disegnare si parte lo stesso col
                // solo testo: meglio il messaggio di prima che nessun messaggio.
                const immagine = await creaImmagineScheda(listing, dati).catch(() => null);
                await condividiScheda(listing, testo, immagine);
              } finally {
                setInviandoWa(false);
              }
            }}>
              {inviandoWa
                ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Preparo...</>
                : <><MessageCircle className="w-5 h-5 mr-2" /> WhatsApp</>}
            </Button>
            {/* Video button */}
            {mediaLoading ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-500/10 text-purple-400/50 rounded-xl">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            ) : videoUrl ? (
              <button 
                onClick={() => setShowVideoPlayer(true)} 
                className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors" 
                title="Guarda Video"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Video
              </button>
            ) : null}
            {/* Brochure button */}
            {mediaLoading ? null : brochureUrl ? (
              <button 
                onClick={() => setShowBrochureViewer(true)} 
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors" 
                title="Visualizza Brochure PDF"
              >
                <FileText className="w-5 h-5" /> Brochure
              </button>
            ) : null}
            {listing.url && (
              <a href={listing.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors" title="Vedi su PropertyFinder">
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <Button variant="ghost" className="py-3" onClick={downloadProjectPDF} disabled={generatingPdf} title="Scarica scheda PDF">
              {generatingPdf ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Brochure Viewer Modal */}
      {showBrochureViewer && brochureUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-ink font-medium">Brochure - {listing.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={brochureUrl} 
                  download 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Scarica PDF
                </a>
                <button 
                  onClick={() => setShowBrochureViewer(false)} 
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* PDF Viewer */}
            <div className="flex-1 bg-zinc-800">
              <iframe 
                src={brochureUrl + '#toolbar=1&navpanes=0'}
                className="w-full h-full"
                title="Brochure PDF"
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && videoUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95">
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span className="text-ink font-medium">Video - {listing.title}</span>
              </div>
              <button 
                onClick={() => setShowVideoPlayer(false)} 
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Video Player */}
            <div className="flex-1 bg-black flex items-center justify-center">
              {videoType === 'youtube' || videoType === 'vimeo' ? (
                <iframe 
                  src={videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1'}
                  className="w-full h-full"
                  title="Project Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                >
                  Il tuo browser non supporta il video.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
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
  
  // Check if we can create lead
  const canCreate = selectedCliente || (createNew && newCliente.nome.trim());
  
  const handleCreate = () => {
    if (!canCreate) return;
    
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
      <div className="absolute inset-0 bg-zinc-800/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#ffffff] border border-[#e4e0d8] rounded-2xl w-full max-w-md animate-scaleIn">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-ink">Crea Lead da Annuncio</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Listing Summary */}
          <div className="flex gap-3 p-3 bg-zinc-800 rounded-xl">
            {listing.images?.[0]?.small_image_url && <img src={listing.images[0].small_image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium line-clamp-1">{listing.title}</p>
              <p className="text-zinc-500 text-xs line-clamp-1">{listing.location?.path_name}</p>
              <p className="text-oro-400 text-sm font-medium mt-1">AED {parseFloat(listing.price).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Client Selection */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Associa a Cliente <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Cerca cliente o digita nome per crearne uno nuovo..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedCliente(null); setCreateNew(false); }} className="w-full bg-zinc-700/50 border border-zinc-700 rounded-xl px-3 py-2 text-ink text-sm focus:border-oro-500 focus:outline-none" />
            
            {searchQuery && !createNew && !selectedCliente && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {filteredClienti.slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { setSelectedCliente(c); setSearchQuery(`${c.nome} ${c.cognome}`); }} className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${selectedCliente?.id === c.id ? 'bg-oro-500/20 text-oro-400' : 'hover:bg-zinc-700/50 text-zinc-300'}`}>
                    <Avatar nome={c.nome} cognome={c.cognome} size="xs" />
                    <span className="text-sm">{c.nome} {c.cognome}</span>
                  </button>
                ))}
                <button onClick={() => { setCreateNew(true); setNewCliente(n => ({ ...n, nome: searchQuery.split(' ')[0], cognome: searchQuery.split(' ')[1] || '' })); }} className="w-full text-left p-2 rounded-lg text-oro-400 hover:bg-zinc-700/50 text-sm">
                  + Crea nuovo cliente "{searchQuery}"
                </button>
              </div>
            )}
            
            {selectedCliente && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-500/20 rounded-lg">
                <Avatar nome={selectedCliente.nome} cognome={selectedCliente.cognome} size="xs" />
                <span className="text-sm text-emerald-400">{selectedCliente.nome} {selectedCliente.cognome}</span>
                <button onClick={() => { setSelectedCliente(null); setSearchQuery(''); }} className="ml-auto text-zinc-400 hover:text-ink"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          
          {/* New Client Form */}
          {createNew && (
            <div className="space-y-3 p-3 bg-zinc-700/30 rounded-xl border border-oro-500/40">
              <p className="text-sm text-oro-400 font-medium">Nuovo Cliente</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nome *" value={newCliente.nome} onChange={(e) => setNewCliente(n => ({ ...n, nome: e.target.value }))} className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm" />
                <input type="text" placeholder="Cognome" value={newCliente.cognome} onChange={(e) => setNewCliente(n => ({ ...n, cognome: e.target.value }))} className="bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm" />
              </div>
              <input type="tel" placeholder="Telefono" value={newCliente.telefono} onChange={(e) => setNewCliente(n => ({ ...n, telefono: e.target.value }))} className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm" />
              <input type="email" placeholder="Email" value={newCliente.email} onChange={(e) => setNewCliente(n => ({ ...n, email: e.target.value }))} className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm" />
            </div>
          )}
          
          {!canCreate && (
            <p className="text-xs text-zinc-500 text-center">Seleziona un cliente esistente o creane uno nuovo per continuare</p>
          )}
        </div>
        
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annulla</Button>
          <Button className="flex-1" onClick={handleCreate} disabled={!canCreate} style={{ opacity: canCreate ? 1 : 0.5 }}>Crea Lead</Button>
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
          <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 pr-12 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#d8d3c9] transition-all" />
          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-ink transition-colors">
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
function LeadDetailSheet({
  sale, cliente, rate, onClose, onUpdateSale, onConvert, isAdmin,
  activities = [], followUps = [], onAddActivity, onCreateFollowUp,
  onCompleteFollowUp, onDeleteActivity, onDeleteFollowUp,
  onProgrammaFollowUp, onAssegna, agenti = [], utente, onToast, sla
}) {
  const mc = (sale?.stato === 'venduto' || sale?.stato === 'incassato')
    ? Number(sale.valore) * (sale.commission_pct || 5) / 100 * rate : 0;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheda, setScheda] = useState('lavoro');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ tipo: 'call', contenuto: '' });
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ tipo: 'call', data_reminder: '', ora_reminder: '', nota: '' });
  const [showPerso, setShowPerso] = useState(false);
  const [motivoPerso, setMotivoPerso] = useState(motiviPerdita[0]);
  const [editForm, setEditForm] = useState({
    progetto: sale?.progetto || '', developer: sale?.developer || '',
    zona: sale?.zona || '', valore: sale?.valore || ''
  });

  useEffect(() => {
    if (sale) {
      setEditForm({
        progetto: sale.progetto || '', developer: sale.developer || '',
        zona: sale.zona || '', valore: sale.valore || ''
      });
      setScheda('lavoro');
    }
  }, [sale?.id]);

  const diagnosi = sale ? leadLib.valutaLead(sale, sla || leadLib.SLA_PREDEFINITO) : null;
  const followUpAperti = followUps.filter(f => !f.completato);
  const prossimo = followUpAperti
    .slice()
    .sort((a, b) => new Date(a.data_reminder) - new Date(b.data_reminder))[0];

  const handleSave = async () => {
    if (!sale?.id) return;
    setSaving(true);
    await onUpdateSale(sale.id, {
      progetto: editForm.progetto, developer: editForm.developer, zona: editForm.zona,
      valore: editForm.valore ? parseFloat(editForm.valore) : 0
    });
    setSaving(false);
    setEditing(false);
  };

  const handleAddActivity = async () => {
    if (!activityForm.contenuto.trim()) return;
    await onAddActivity(sale.id, activityForm.tipo, activityForm.contenuto);
    setActivityForm({ tipo: 'call', contenuto: '' });
    setShowActivityForm(false);
  };

  const handleAddFollowUp = async () => {
    if (!followUpForm.data_reminder) return;
    await onCreateFollowUp({ sale_id: sale.id, cliente_id: cliente?.id, ...followUpForm });
    setFollowUpForm({ tipo: 'call', data_reminder: '', ora_reminder: '', nota: '' });
    setShowFollowUpForm(false);
  };

  const segnaPerso = async () => {
    await onUpdateSale(sale.id, { stato: 'perso', perso_motivo: motivoPerso });
    setShowPerso(false);
    onClose();
  };

  const schede = [
    { id: 'lavoro', label: 'Lavoro' },
    { id: 'attivita', label: `Diario (${activities.length})` },
    { id: 'messaggi', label: 'Messaggi' },
    { id: 'dati', label: 'Dati' }
  ];

  return (
    <BottomSheet isOpen={!!sale} onClose={onClose} title={cliente ? `${cliente.nome} ${cliente.cognome || ''}`.trim() : (sale?.progetto || 'Lead')}>
      <div className="space-y-4">
        {/* Intestazione: stato, temperatura, perche' chiede attenzione */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusBadge status={sale?.stato || 'lead'} />
            {sale?.temperatura && (
              <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ background: `${leadLib.TEMPERATURE[sale.temperatura]?.colore}22`, color: leadLib.TEMPERATURE[sale.temperatura]?.colore }}>
                {leadLib.TEMPERATURE[sale.temperatura]?.emoji} {leadLib.TEMPERATURE[sale.temperatura]?.label}
              </span>
            )}
          </div>
          <span className="text-zinc-500 text-sm">{fmtDate(sale?.data)}</span>
        </div>

        {diagnosi && (
          <div className="rounded-xl px-3 py-2 border text-sm"
               style={{ background: theme.gravita[diagnosi.gravita].bg, borderColor: theme.gravita[diagnosi.gravita].border, color: theme.gravita[diagnosi.gravita].color }}>
            {diagnosi.motivo} — {diagnosi.dettaglio}
          </div>
        )}

        {/* Contatti rapidi */}
        {cliente && (
          <Card padding="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar nome={cliente.nome} cognome={cliente.cognome} />
              <div className="min-w-0">
                <p className="text-ink font-medium truncate">{cliente.nome} {cliente.cognome}</p>
                <p className="text-zinc-500 text-sm truncate">
                  {cliente.telefono}
                  {sale?.fonte ? ` • ${sale.fonte}` : ''}
                </p>
              </div>
            </div>
            <QuickActions phone={cliente.telefono} whatsapp={cliente.whatsapp || cliente.telefono} email={cliente.email} clienteName={cliente.nome} />
          </Card>
        )}

        {/* Navigazione interna */}
        <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
          {schede.map(s => (
            <button key={s.id} onClick={() => setScheda(s.id)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                      scheda === s.id ? 'bg-zinc-700 text-ink' : 'text-zinc-400 hover:text-ink'
                    }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ---------- LAVORO ---------- */}
        {scheda === 'lavoro' && (
          <div className="space-y-4">
            {prossimo ? (
              <Card padding="p-4" className="border-violet-500/25 bg-violet-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-xs">Prossimo contatto</p>
                    <p className="text-ink font-medium mt-0.5">
                      {new Date(prossimo.data_reminder).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {prossimo.ora_reminder ? ` alle ${String(prossimo.ora_reminder).slice(0, 5)}` : ''}
                    </p>
                    {prossimo.nota && <p className="text-zinc-500 text-xs mt-1">{prossimo.nota}</p>}
                  </div>
                  <button onClick={() => onCompleteFollowUp(prossimo.id)}
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Segna fatto">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ) : (
              <Card padding="p-4" className="border-amber-500/25 bg-amber-500/5">
                <p className="text-amber-400 text-sm">Nessun prossimo contatto fissato su questo lead.</p>
              </Card>
            )}

            {/* Richiamo in un tocco: era la parte che nessuno usava perche'
                richiedeva di aprire un form e scegliere una data. */}
            <div>
              <p className="text-zinc-500 text-xs mb-2">Richiama fra</p>
              <div className="flex gap-2">
                {[1, 3, 7, 14].map(g => (
                  <button key={g} onClick={() => onProgrammaFollowUp?.(sale.id, cliente?.id, g, 'call')}
                          className="flex-1 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-ink text-sm transition-colors">
                    {g === 1 ? 'Domani' : `${g} gg`}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperatura */}
            <div>
              <p className="text-zinc-500 text-xs mb-2">Quanto scotta</p>
              <div className="flex gap-2">
                {Object.entries(leadLib.TEMPERATURE).map(([id, t]) => (
                  <button key={id} onClick={() => onUpdateSale(sale.id, { temperatura: id })}
                          className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${
                            sale?.temperatura === id ? 'text-ink font-medium' : 'bg-zinc-800/60 text-zinc-400 hover:text-ink'
                          }`}
                          style={sale?.temperatura === id ? { background: `${t.colore}26`, color: t.colore } : {}}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stato pipeline */}
            <div>
              <p className="text-zinc-500 text-xs mb-2">Stato</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {pipelineStati.slice(0, -1).map(st => (
                  <button key={st} onClick={() => { onUpdateSale(sale.id, { stato: st }); }}
                          className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${sale?.stato === st ? 'text-ink' : 'text-zinc-500 hover:text-ink'}`}
                          style={sale?.stato === st ? { background: theme.status[st]?.bg, color: theme.status[st]?.color } : { background: '#1b212b' }}>
                    {pipelineLabels[st] || st}
                  </button>
                ))}
              </div>
            </div>

            {/* Assegnazione: solo admin */}
            {isAdmin && agenti.length > 0 && (
              <div>
                <p className="text-zinc-500 text-xs mb-2">Assegnato a</p>
                <select value={sale?.assegnato_a || ''}
                        onChange={(e) => onAssegna?.([sale.id], e.target.value)}
                        className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm focus:outline-none focus:border-[#d8d3c9]">
                  <option value="">Nessuno</option>
                  {agenti.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                </select>
              </div>
            )}

            {['trattativa', 'EOI'].includes(sale?.stato) && (
              <Button onClick={onConvert} icon={DollarSign} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white">
                Registra vendita
              </Button>
            )}

            {/* Chiudere un lead perso non e' una sconfitta da nascondere:
                serve a capire dove si rompe la pipeline. */}
            {leadLib.eAperto(sale) && (
              showPerso ? (
                <Card padding="p-4" className="border-red-500/25 bg-red-500/5 space-y-3">
                  <p className="text-red-300 text-sm">Perche' si e' perso?</p>
                  <select value={motivoPerso} onChange={(e) => setMotivoPerso(e.target.value)}
                          className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-3 py-2 text-ink text-sm">
                    {motiviPerdita.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowPerso(false)} className="flex-1">Annulla</Button>
                    <Button variant="danger" onClick={segnaPerso} className="flex-1">Conferma</Button>
                  </div>
                </Card>
              ) : (
                <button onClick={() => setShowPerso(true)}
                        className="w-full text-zinc-500 hover:text-red-400 text-sm py-2 transition-colors">
                  Segna come perso
                </button>
              )
            )}
          </div>
        )}

        {/* ---------- DIARIO ---------- */}
        {scheda === 'attivita' && (
          <div className="space-y-3">
            {!showActivityForm ? (
              <button onClick={() => setShowActivityForm(true)}
                      className="w-full py-2.5 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-ink hover:border-zinc-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Registra attivita
              </button>
            ) : (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                  {leadLib.TIPI_ATTIVITA.map(t => (
                    <button key={t.id} onClick={() => setActivityForm({ ...activityForm, tipo: t.id })}
                            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${activityForm.tipo === t.id ? 'bg-blue-500 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-ink'}`}>
                      {t.icona} {t.label}
                    </button>
                  ))}
                </div>
                <textarea value={activityForm.contenuto} onChange={(e) => setActivityForm({ ...activityForm, contenuto: e.target.value })}
                          placeholder="Com'e' andata?" rows={3}
                          className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm resize-none" />
                <div className="flex gap-2 mt-3">
                  <Button variant="secondary" onClick={() => setShowActivityForm(false)} className="flex-1">Annulla</Button>
                  <Button onClick={handleAddActivity} className="flex-1" disabled={!activityForm.contenuto.trim()}>Salva</Button>
                </div>
              </Card>
            )}

            {activities.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {activities.map(a => {
                  const tipo = leadLib.TIPI_ATTIVITA.find(t => t.id === a.tipo) || leadLib.TIPI_ATTIVITA[5];
                  return (
                    <div key={a.id} className="p-3 bg-zinc-800/50 rounded-xl group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-lg shrink-0">{tipo.icona}</span>
                          <div className="min-w-0">
                            <p className="text-ink text-sm break-words">{a.contenuto}</p>
                            <p className="text-zinc-500 text-xs mt-1">{a.created_by} • {fmtDateTime(a.created_at)}</p>
                          </div>
                        </div>
                        <button onClick={() => onDeleteActivity(a.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-4">Nessuna attivita registrata</p>
            )}

            {/* Follow-up programmati */}
            <div className="pt-2 border-t border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-zinc-500 text-xs">Follow-up programmati ({followUpAperti.length})</p>
                <button onClick={() => setShowFollowUpForm(!showFollowUpForm)} className="text-zinc-400 hover:text-ink text-xs">
                  {showFollowUpForm ? 'Chiudi' : 'Data precisa'}
                </button>
              </div>

              {showFollowUpForm && (
                <Card className="border-violet-500/20 bg-violet-500/5 mb-2">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-zinc-500 text-xs">Data</label>
                      <input type="date" value={followUpForm.data_reminder} onChange={(e) => setFollowUpForm({ ...followUpForm, data_reminder: e.target.value })}
                             className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-xs">Ora</label>
                      <input type="time" value={followUpForm.ora_reminder} onChange={(e) => setFollowUpForm({ ...followUpForm, ora_reminder: e.target.value })}
                             className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                    </div>
                  </div>
                  <textarea value={followUpForm.nota} onChange={(e) => setFollowUpForm({ ...followUpForm, nota: e.target.value })}
                            placeholder="Cosa devi fare" rows={2}
                            className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm resize-none" />
                  <Button onClick={handleAddFollowUp} className="w-full mt-3" disabled={!followUpForm.data_reminder}>Programma</Button>
                </Card>
              )}

              {followUps.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {followUps.map(f => {
                    const scaduto = new Date(f.data_reminder) < new Date() && !f.completato;
                    const oggi = isToday(f.data_reminder);
                    return (
                      <div key={f.id} className={`p-3 rounded-xl border text-sm ${
                        f.completato ? 'bg-zinc-800/30 border-zinc-800 opacity-60'
                        : scaduto ? 'bg-red-500/10 border-red-500/30'
                        : oggi ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-zinc-800/50 border-zinc-800'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={f.completato ? 'text-zinc-500 line-through' : scaduto ? 'text-red-400' : 'text-ink'}>
                              {new Date(f.data_reminder).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                              {f.ora_reminder ? ` alle ${String(f.ora_reminder).slice(0, 5)}` : ''}
                              {scaduto && ' — in ritardo'}
                            </p>
                            {f.nota && <p className="text-zinc-400 text-xs mt-1 break-words">{f.nota}</p>}
                            {f.esito && <p className="text-emerald-400/70 text-xs mt-1">Esito: {f.esito}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!f.completato && (
                              <button onClick={() => onCompleteFollowUp(f.id)} className="p-1.5 text-zinc-500 hover:text-emerald-400 transition-colors" title="Fatto">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => onDeleteFollowUp(f.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" title="Elimina">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- MESSAGGI ---------- */}
        {scheda === 'messaggi' && (
          <MessaggiGhl sale={sale} cliente={cliente} utente={utente} onToast={onToast} />
        )}

        {/* ---------- DATI ---------- */}
        {scheda === 'dati' && (
          <div className="space-y-4">
            <Card className="border-amber-500/20 bg-amber-500/5">
              <p className="text-zinc-400 text-sm">Valore</p>
              <p className="text-2xl font-semibold text-ink mt-1">{sale?.valore > 0 ? `${fmt(sale.valore)} AED` : 'Da definire'}</p>
              {mc > 0 && <p className="text-emerald-400 text-sm mt-1">La tua commissione: {fmt(mc)} AED {sale?.pagato ? '(pagata)' : ''}</p>}
            </Card>

            {editing ? (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <div className="space-y-3">
                  <div>
                    <label className="text-zinc-500 text-xs">Progetto</label>
                    <input type="text" value={editForm.progetto} onChange={(e) => setEditForm({ ...editForm, progetto: e.target.value })}
                           className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-500 text-xs">Developer</label>
                      <input type="text" value={editForm.developer} onChange={(e) => setEditForm({ ...editForm, developer: e.target.value })}
                             className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-xs">Zona</label>
                      <input type="text" value={editForm.zona} onChange={(e) => setEditForm({ ...editForm, zona: e.target.value })}
                             className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 text-xs">Valore (AED)</label>
                    <input type="number" value={editForm.valore} onChange={(e) => setEditForm({ ...editForm, valore: e.target.value })}
                           className="w-full bg-zinc-700/50 border border-zinc-700 rounded-lg px-3 py-2 text-ink text-sm mt-1" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1" disabled={saving}>Annulla</Button>
                  <Button onClick={handleSave} className="flex-1" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Immobile</p>
                    <p className="text-ink font-medium">{sale?.progetto || 'N/A'}</p>
                  </div>
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-zinc-700/50 text-zinc-400 hover:text-ink">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><p className="text-zinc-500 text-xs">Developer</p><p className="text-ink text-sm">{sale?.developer || 'N/A'}</p></div>
                  <div><p className="text-zinc-500 text-xs">Zona</p><p className="text-ink text-sm">{sale?.zona || 'N/A'}</p></div>
                  <div><p className="text-zinc-500 text-xs">Agente</p><p className="text-ink text-sm">{sale?.assegnato_a || sale?.agente || 'Nessuno'}</p></div>
                  <div><p className="text-zinc-500 text-xs">Fonte</p><p className="text-ink text-sm">{sale?.fonte || 'N/A'}</p></div>
                </div>
                {sale?.note && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs mb-1">Note</p>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap break-words">{sale.note}</p>
                  </div>
                )}
                {sale?.perso_motivo && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs mb-1">Motivo della perdita</p>
                    <p className="text-red-400 text-sm">{sale.perso_motivo}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
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
        <Card padding="p-3" className="bg-zinc-800">
          <p className="text-ink font-medium">{sale?.progetto}</p>
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
function NotificationsPanel({ tasks, unreadIds, onClose, onGoToTask, recentSales = [], onMarkAsRead, userId }) {
  const allNotifications = [
    ...recentSales.map(s => ({ type: 'sale', id: 'sale_' + s.id, data: s })),
    ...tasks.map(t => ({ type: 'task', id: `task_${t.id}_${userId}`, data: t }))
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
                  <p className="text-ink text-sm font-medium">Nuova {s.stato === 'venduto' ? 'Vendita' : 'Lead'}</p>
                  <p className="text-zinc-400 text-xs">{s.progetto} • {s.agente || s.segnalatore}</p>
                  <p className="text-emerald-400 text-xs font-medium mt-1">{fmt(s.valore)} AED</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-zinc-500 text-xs">{fmtShort(s.created_at)}</span>
                  {unreadIds.includes('sale_' + s.id) && (
                    <button onClick={(e) => { e.stopPropagation(); onMarkAsRead('sale_' + s.id); }} className="text-xs text-zinc-500 hover:text-ink">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {tasks.map(t => {
            const taskNotifId = `task_${t.id}_${userId}`;
            const isUnread = unreadIds.includes(taskNotifId);
            return (
              <Card key={t.id} padding="p-3" className={isUnread ? 'border-l-2 border-l-pink-500' : ''}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${isOverdue(t.scadenza) ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 cursor-pointer" onClick={onGoToTask}>
                    <p className="text-ink text-sm font-medium">{t.titolo}</p>
                    <p className={`text-xs ${isOverdue(t.scadenza) ? 'text-red-400' : 'text-zinc-500'}`}>
                      {t.scadenza ? fmtDateTime(t.scadenza) : 'Senza scadenza'}
                      {isOverdue(t.scadenza) && ' • Scaduto!'}
                    </p>
                    {t.created_by && <p className="text-zinc-600 text-xs mt-1">Da: {t.created_by}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priorita} type="priority" />
                    {isUnread && (
                      <button onClick={(e) => { e.stopPropagation(); onMarkAsRead(taskNotifId); }} className="p-1 text-zinc-500 hover:text-ink hover:bg-zinc-700 rounded transition-colors" title="Segna come letta">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}

// Password Modal
function PasswordModal({ obbligatorio = false, onSave, onClose }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // La password attuale la verifica il database: il client non la conosce piu'.
  const save = async () => {
    setError('');
    if (newPwd.length < 8) { setError('La nuova password deve avere almeno 8 caratteri'); return; }
    if (newPwd !== confirmPwd) { setError('Le due password non coincidono'); return; }
    if (newPwd === oldPwd) { setError('La nuova password deve essere diversa da quella attuale'); return; }

    setSaving(true);
    const esito = await onSave(oldPwd, newPwd);
    setSaving(false);
    if (esito && !esito.ok) setError(esito.error || 'Non riuscito');
  };

  return (
    <Modal isOpen onClose={obbligatorio ? () => {} : onClose} title={obbligatorio ? 'Imposta la tua password' : 'Cambia password'} size="sm">
      <div className="space-y-4">
        {obbligatorio && (
          <div className="bg-oro-500/10 border border-oro-500/25 text-oro-400 rounded-xl px-4 py-3 text-sm">
            Questo e' il primo accesso: scegli una password personale prima di continuare.
          </div>
        )}
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}
        <Input label={obbligatorio ? 'Password ricevuta' : 'Password attuale'} type="password" autoComplete="current-password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
        <Input label="Nuova password" type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
        <Input label="Conferma nuova password" type="password" autoComplete="new-password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
        <div className="flex gap-3">
          {!obbligatorio && <Button variant="secondary" onClick={onClose} className="flex-1" disabled={saving}>Annulla</Button>}
          <Button onClick={save} className="flex-1" disabled={saving || !oldPwd || !newPwd}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
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
        <Card padding="p-3" className="bg-zinc-800">
          <p className="text-ink font-medium">{task?.titolo}</p>
        </Card>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Nota</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scrivi una nota..." className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#d8d3c9] h-24 resize-none" autoFocus />
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
  const [form, setForm] = useState(cliente || { nome: '', cognome: '', email: '', telefono: '', whatsapp: '', nazionalita: '', budget_min: '', budget_max: '', stato: 'nuovo', fonte: '', note: '', tipi: [] });
  
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
        <SceltaTipiCliente valore={form.tipi || []} onCambia={(tipi) => setForm({ ...form, tipi })} />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Note</label>
          <textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm h-20 resize-none focus:outline-none focus:border-[#d8d3c9]" />
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
          <textarea value={form.descrizione || ''} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm h-20 resize-none focus:outline-none focus:border-[#d8d3c9]" />
        </div>
        <Input label="Scadenza" type="datetime-local" value={form.scadenza ? form.scadenza.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, scadenza: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Priorità</label>
          <div className="flex gap-2">
            {taskPriorita.map(p => (
              <button key={p} onClick={() => setForm({ ...form, priorita: p })} className={`flex-1 px-3 py-2 rounded-xl text-sm transition-all ${form.priorita === p ? 'text-white' : 'text-zinc-500'}`} style={form.priorita === p ? { background: theme.priority[p]?.bg, color: theme.priority[p]?.color } : { background: '#2b323d' }}>
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
  const [form, setForm] = useState(() => user
    ? { ...user, password: '' }
    : { nome: '', username: '', password: auth.generaPassword(), email: '', telefono: '', ruolo: 'agente', referente: 'Pellegrino', attivo: true, commission_pct: '' });
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState('');
  // La password in chiaro esiste solo in questo momento: dopo il salvataggio
  // nel database resta solo l'hash, quindi va consegnata adesso.
  const [daConsegnare, setDaConsegnare] = useState(null);
  const [copiato, setCopiato] = useState(false);

  const eAgente = form.ruolo === 'agente';

  const save = async () => {
    setErrore('');
    if (!form.nome?.trim() || !form.username?.trim()) { setErrore('Nome e username sono obbligatori'); return; }
    if (!user && (form.password || '').length < 8) { setErrore('La password iniziale deve avere almeno 8 caratteri'); return; }
    if (user && form.password && form.password.length < 8) { setErrore('La nuova password deve avere almeno 8 caratteri'); return; }
    if (eAgente && form.commission_pct !== '' && form.commission_pct !== null && form.commission_pct !== undefined) {
      const n = Number(form.commission_pct);
      if (Number.isNaN(n) || n < 0 || n > 100) { setErrore('La percentuale deve stare fra 0 e 100'); return; }
    }

    const payload = {
      ...(user ? { id: user.id } : {}),
      nome: form.nome.trim(),
      username: form.username.trim(),
      email: form.email || '',
      telefono: form.telefono || '',
      ruolo: form.ruolo,
      referente: form.ruolo === 'agente_admin' ? '' : (form.referente || ''),
      attivo: form.attivo !== false,
      ...(form.password ? { password: form.password } : {}),
      ...(eAgente ? { commission_pct: form.commission_pct === '' ? null : Number(form.commission_pct) } : {})
    };

    setSaving(true);
    const esito = await onSave(payload);
    setSaving(false);
    if (!esito?.ok) { setErrore(esito?.error || 'Non riuscito'); return; }
    if (form.password) {
      setDaConsegnare({ username: payload.username, password: form.password, nome: payload.nome });
    }
  };

  const copiaCredenziali = () => {
    const testo = `Portale KeyPrime\n${getBaseUrl()}\nUtente: ${daConsegnare.username}\nPassword: ${daConsegnare.password}\n\nAl primo accesso ti verra' chiesto di scegliere una password personale.`;
    navigator.clipboard.writeText(testo);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  };

  // Schermata di consegna: compare dopo il salvataggio.
  if (daConsegnare) {
    return (
      <Modal isOpen onClose={onClose} title="Credenziali da consegnare" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl px-4 py-3 text-sm">
            Copiale adesso: nel database viene salvato solo l'hash, quindi questa password non sara' piu' recuperabile.
          </div>
          <Card padding="p-4" className="space-y-2">
            <div className="flex justify-between"><span className="text-zinc-500 text-sm">Portale</span><span className="text-ink text-sm">{getBaseUrl().replace('https://', '')}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500 text-sm">Utente</span><span className="text-ink text-sm font-medium">{daConsegnare.username}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500 text-sm">Password</span><span className="text-oro-400 text-sm font-mono font-medium">{daConsegnare.password}</span></div>
          </Card>
          <p className="text-zinc-500 text-sm">
            Al primo accesso {daConsegnare.nome.split(' ')[0]} dovra' scegliere una password personale.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" icon={copiato ? Check : Copy} onClick={copiaCredenziali} className="flex-1">
              {copiato ? 'Copiate' : 'Copia'}
            </Button>
            <Button onClick={onClose} className="flex-1">Fatto</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title={user ? 'Modifica accesso' : 'Nuovo accesso'}>
      <div className="space-y-4">
        {errore && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{errore}</div>}

        <Input label="Nome e cognome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Per i promemoria" />
          <Input label="Telefono" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+39..." />
        </div>

        <Input label="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="nome.cognome" />

        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            {user ? 'Nuova password (lascia vuoto per non cambiarla)' : 'Password iniziale *'}
          </label>
          <div className="flex gap-2">
            <input
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={user ? 'Invariata' : ''}
              className="flex-1 bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#d8d3c9] transition-all"
            />
            <Button variant="secondary" icon={RefreshCw} onClick={() => setForm({ ...form, password: auth.generaPassword() })} title="Genera">Genera</Button>
          </div>
          {user && form.password && (
            <p className="text-amber-400/80 text-xs mt-2">Cambiando la password, le sessioni aperte di questo utente verranno chiuse.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Ruolo" value={form.ruolo} onChange={(e) => setForm({ ...form, ruolo: e.target.value })}>
            <option value="agente">Agente</option>
            <option value="segnalatore">Segnalatore</option>
            <option value="agente_admin">Agente Admin</option>
            <option value="admin">Admin</option>
          </Select>
          <Select label="Referente" value={form.referente || 'Pellegrino'} onChange={(e) => setForm({ ...form, referente: e.target.value })} disabled={form.ruolo === 'agente_admin'}>
            <option value="Pellegrino">Pellegrino</option>
            <option value="Giovanni">Giovanni</option>
          </Select>
        </div>

        {eAgente && (
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Commissione agente</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="100"
                value={form.commission_pct ?? ''}
                onChange={(e) => setForm({ ...form, commission_pct: e.target.value })}
                placeholder="70"
                className="w-28 bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm focus:outline-none focus:border-[#d8d3c9]"
              />
              <span className="text-zinc-500 text-sm">% della commissione sulla vendita (vuoto = 70%, lo standard)</span>
            </div>
          </div>
        )}

        {form.ruolo === 'agente_admin' && (
          <Card padding="p-3" className="bg-violet-500/10 border-violet-500/20">
            <p className="text-violet-300 text-sm">
              Agente Admin: quota societaria legata al referente del lead (70/30), non modificabile da qui.
            </p>
          </Card>
        )}
        {form.ruolo === 'agente' && (
          <Card padding="p-3" className="bg-blue-500/10 border-blue-500/20">
            <p className="text-blue-300 text-sm">
              Gli agenti entrano nella rotazione automatica dei lead inbound da GHL.
            </p>
          </Card>
        )}

        {user && (
          <Card padding="p-3" className="flex items-center gap-3">
            <input type="checkbox" id="attivo" checked={form.attivo !== false} onChange={(e) => setForm({ ...form, attivo: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="attivo" className="text-zinc-300 text-sm">Accesso attivo</label>
          </Card>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={saving}>Annulla</Button>
          <Button onClick={save} className="flex-1" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
        </div>
      </div>
    </Modal>
  );
}
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
            <p className="text-ink font-medium">{selectedClient.nome} {selectedClient.cognome}</p>
            <p className="text-emerald-400 text-sm">{selectedClient.telefono}</p>
          </div>
          <button onClick={() => onSelect(null)} className="text-zinc-500 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Cerca cliente..." value={search} onChange={(e) => { setSearch(e.target.value); setShow(true); }} onFocus={() => setShow(true)} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl pl-10 pr-4 py-3 text-ink text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#d8d3c9]" />
      </div>
      
      {show && search.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-[#ffffff] border border-[#e4e0d8] rounded-xl overflow-hidden shadow-xl">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { onSelect(c); setSearch(''); setShow(false); }} className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-[#e4e0d8] last:border-0 flex items-center gap-3 transition-colors">
              <Avatar nome={c.nome} cognome={c.cognome} size="sm" />
              <div>
                <p className="text-ink text-sm">{c.nome} {c.cognome}</p>
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
        <button onClick={onCreateNew} className="w-full mt-3 border border-dashed border-[#d8d3c9] rounded-xl py-3 text-zinc-500 text-sm flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-400 transition-colors">
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
      }} className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm focus:outline-none focus:border-[#d8d3c9] appearance-none">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {showCustom && (
        <input type="text" value={customValue} onChange={(e) => { setCustomValue(e.target.value); onChange(e.target.value); }} placeholder="Specifica..." className="w-full bg-[#ffffff] border border-[#e4e0d8] rounded-xl px-4 py-3 text-ink text-sm mt-2 focus:outline-none focus:border-[#d8d3c9]" autoFocus />
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
        <h4 className="text-ink font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" /> Cliente
        </h4>
        <ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNewClient(false); }} onCreateNew={() => { setSelectedClient(null); setShowNewClient(true); }} />
        
        {showNewClient && !selectedClient && (
          <div className="mt-4 pt-4 border-t border-[#e4e0d8] space-y-3">
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
        <h4 className="text-ink font-medium mb-4 flex items-center gap-2">
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
        <h4 className="text-ink font-medium mb-4">Stato iniziale</h4>
        <div className="flex flex-wrap gap-2">
          {pipelineStati.slice(0, 4).map(st => (
            <button key={st} type="button" onClick={() => setForm({ ...form, stato: st })} className={`px-4 py-2 rounded-xl text-sm transition-all ${form.stato === st ? 'text-white' : 'text-zinc-500'}`} style={form.stato === st ? { background: theme.status[st]?.bg, color: theme.status[st]?.color } : { background: '#2b323d' }}>
              {pipelineLabels[st] || st}
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
        <h4 className="text-ink font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" /> Cliente Acquirente
        </h4>
        <ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNewClient(false); }} onCreateNew={() => { setSelectedClient(null); setShowNewClient(true); }} />
        
        {showNewClient && !selectedClient && (
          <div className="mt-4 pt-4 border-t border-[#e4e0d8] space-y-3">
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
        <h4 className="text-ink font-medium mb-4 flex items-center gap-2">
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

// Il calcolatore ROI e i suoi dati di riferimento stanno in
// components/CalcolatoreRoi.js: ogni voce vi porta la propria spiegazione.


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
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
