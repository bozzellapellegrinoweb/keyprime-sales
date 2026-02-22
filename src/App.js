import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus, Search, Phone, Mail, X, Edit2, TrendingUp, DollarSign, Target, UserCheck, Menu, Key, CheckSquare, Square, Bell, MapPin, Award, User, MessageCircle, Filter, ChevronLeft, ChevronRight, Globe, Calendar, Clock, FileText, Plus, AlertTriangle, Send, ExternalLink, MoreVertical, Zap, ArrowUp, ArrowDown, Activity, PieChart, Home } from 'lucide-react';

const supabase = createClient('https://wqtylxrrerhbxagdzftn.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ');

const RESEND_API_KEY = 're_jCpLJKfw_MfWu2jbSzPPgz6pLHQXMAXJb';
const EMAIL_FROM = 'onboarding@resend.dev';
const ADMIN_EMAIL = 'bozzellapellegrino@gmail.com';
const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];
const pipelineStati = ['lead', 'trattativa', 'prenotato', 'venduto', 'incassato'];
const pipelineColors = { lead: 'bg-slate-500', trattativa: 'bg-blue-500', prenotato: 'bg-amber-500', venduto: 'bg-emerald-500', incassato: 'bg-green-600' };
const pipelineLabels = { lead: '🎯 Lead', trattativa: '💬 Trattativa', prenotato: '📝 Prenotato', venduto: '✅ Venduto', incassato: '💰 Incassato' };
const clienteStati = ['nuovo', 'contattato', 'interessato', 'trattativa', 'acquistato', 'perso'];
const clienteStatiColors = { nuovo: 'bg-slate-500', contattato: 'bg-blue-500', interessato: 'bg-amber-500', trattativa: 'bg-purple-500', acquistato: 'bg-emerald-500', perso: 'bg-red-500' };
const taskPriorita = ['bassa', 'normale', 'alta', 'urgente'];
const taskPrioritaColors = { bassa: 'bg-slate-500', normale: 'bg-blue-500', alta: 'bg-amber-500', urgente: 'bg-red-500' };
const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
const getWhatsAppLink = (phone, msg = '') => `https://wa.me/${(phone || '').replace(/\D/g, '')}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';
const isOverdue = (d) => d && new Date(d) < new Date();
const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();
const getInitials = (nome, cognome) => `${(nome || '')[0] || ''}${(cognome || '')[0] || ''}`.toUpperCase() || '?';
const getAvatarColor = (name) => { const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500']; return colors[Math.abs((name || '').charCodeAt(0) || 0) % colors.length]; };

const sendEmail = async (to, subject, html) => { try { await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }) }); return true; } catch (e) { return false; } };

const notifyTaskAssigned = async (task, assigneeEmail) => { if (!assigneeEmail) return; const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#C9A96E">📋 Nuovo Task Assegnato</h2><div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0"><p><strong>Titolo:</strong> ${task.titolo}</p>${task.descrizione ? `<p><strong>Descrizione:</strong> ${task.descrizione}</p>` : ''}${task.scadenza ? `<p><strong>Scadenza:</strong> ${fmtDate(task.scadenza)}</p>` : ''}<p><strong>Priorità:</strong> ${task.priorita}</p></div><p style="color:#666;font-size:12px">KeyPrime CRM</p></div>`; await sendEmail(assigneeEmail, `📋 Task: ${task.titolo}`, html); };
const notifyTaskCompleted = async (task, agentName) => { const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#10b981">✅ Task Completato</h2><div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0"><p><strong>Titolo:</strong> ${task.titolo}</p><p><strong>Completato da:</strong> ${agentName}</p>${task.note ? `<p><strong>Nota:</strong> ${task.note}</p>` : ''}</div><p style="color:#666;font-size:12px">KeyPrime CRM</p></div>`; await sendEmail(ADMIN_EMAIL, `✅ Task completato: ${task.titolo}`, html); };
const notifyTaskNote = async (task, agentName, note) => { const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#3b82f6">💬 Nota su Task</h2><div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0"><p><strong>Task:</strong> ${task.titolo}</p><p><strong>Da:</strong> ${agentName}</p><p><strong>Nota:</strong> ${note}</p></div><p style="color:#666;font-size:12px">KeyPrime CRM</p></div>`; await sendEmail(ADMIN_EMAIL, `💬 Nota task: ${task.titolo}`, html); };

const generateClientePDF = (cliente, sales, tasks) => { const totalValue = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((sum, s) => sum + Number(s.valore || 0), 0); const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cliente.nome}</title><style>*{margin:0;padding:0}body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{color:#C9A96E;border-bottom:2px solid #C9A96E;padding-bottom:10px;margin-bottom:20px}h2{margin:20px 0 10px;font-size:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px}.item{background:#f5f5f5;padding:12px;border-radius:8px}.label{font-size:11px;color:#666}.value{font-size:14px;font-weight:500;margin-top:4px}.stats{display:flex;gap:15px;margin-bottom:20px}.stat{flex:1;background:#1a1a2e;color:white;padding:15px;border-radius:8px;text-align:center}.stat-val{font-size:24px;font-weight:bold;color:#C9A96E}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:8px;text-align:left;border-bottom:1px solid #eee;font-size:12px}th{background:#f5f5f5}.footer{margin-top:40px;text-align:center;color:#666;font-size:11px}</style></head><body><div style="font-size:24px;font-weight:bold;color:#C9A96E;margin-bottom:20px">KEYPRIME</div><h1>${cliente.nome} ${cliente.cognome||''}</h1><div class="stats"><div class="stat"><div class="stat-val">${sales.length}</div><div>Lead</div></div><div class="stat"><div class="stat-val">${fmt(totalValue)}</div><div>Valore</div></div><div class="stat"><div class="stat-val">${cliente.stato}</div><div>Stato</div></div></div><h2>Contatto</h2><div class="grid"><div class="item"><div class="label">Telefono</div><div class="value">${cliente.telefono||'-'}</div></div><div class="item"><div class="label">Email</div><div class="value">${cliente.email||'-'}</div></div><div class="item"><div class="label">Budget</div><div class="value">${cliente.budget_max?fmt(cliente.budget_max)+' AED':'-'}</div></div><div class="item"><div class="label">Agente</div><div class="value">${cliente.agente_riferimento||'-'}</div></div></div>${cliente.note?'<h2>Note</h2><p style="background:#f5f5f5;padding:12px;border-radius:8px">'+cliente.note+'</p>':''}${sales.length>0?'<h2>Storico</h2><table><tr><th>Data</th><th>Progetto</th><th>Valore</th><th>Stato</th></tr>'+sales.map(s=>'<tr><td>'+fmtDate(s.data)+'</td><td>'+s.progetto+'</td><td>'+(s.valore>0?fmt(s.valore):'TBD')+'</td><td>'+s.stato+'</td></tr>').join('')+'</table>':''}${tasks.length>0?'<h2>Task</h2><table><tr><th>Titolo</th><th>Scadenza</th><th>Stato</th></tr>'+tasks.map(t=>'<tr><td>'+t.titolo+'</td><td>'+fmtDate(t.scadenza)+'</td><td>'+t.stato+'</td></tr>').join('')+'</table>':''}<div class="footer">KeyPrime Real Estate CRM - ${new Date().toLocaleDateString('it-IT')}</div></body></html>`; const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),500); };

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slideUp ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`}><Check className="w-4 h-4" /><span className="text-sm font-medium">{message}</span></div>;
};

// Skeleton Loader
const Skeleton = ({ className }) => <div className={`animate-pulse bg-slate-700 rounded ${className}`} />;

// Avatar Component
const Avatar = ({ nome, cognome, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return <div className={`${sizes[size]} ${getAvatarColor(nome)} rounded-full flex items-center justify-center font-bold text-white ${className}`}>{getInitials(nome, cognome)}</div>;
};

// Animated Counter
const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => { const duration = 500; const steps = 20; const increment = value / steps; let current = 0; const timer = setInterval(() => { current += increment; if (current >= value) { setDisplay(value); clearInterval(timer); } else { setDisplay(Math.floor(current)); }}, duration / steps); return () => clearInterval(timer); }, [value]);
  return <span>{prefix}{fmt(display)}{suffix}</span>;
};

// Progress Bar
const ProgressBar = ({ value, max, color = 'bg-amber-500', showLabel = false }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return <div className="relative"><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} /></div>{showLabel && <span className="absolute right-0 -top-5 text-xs text-slate-400">{pct.toFixed(0)}%</span>}</div>;
};

// Stat Card - Clickable
const StatCard = ({ icon: Icon, label, value, subValue, color, onClick, trend }) => (
  <div onClick={onClick} className={`bg-gradient-to-br ${color} border border-white/10 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] group`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-white/70 text-xs"><Icon className="w-4 h-4" />{label}</div>
      {trend !== undefined && <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{Math.abs(trend)}%</div>}
    </div>
    <div className="text-2xl font-bold text-white"><AnimatedNumber value={value} /></div>
    {subValue && <div className="text-white/60 text-xs mt-1">{subValue}</div>}
    <ChevronRight className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-white/60 transition-colors" />
  </div>
);

// FAB - Floating Action Button
const FAB = ({ onClick, icon: Icon, label, color = 'bg-amber-500' }) => (
  <button onClick={onClick} className={`fixed bottom-6 right-6 ${color} text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-2 px-5 py-4 hover:scale-105 transition-transform active:scale-95 z-40`}>
    <Icon className="w-5 h-5" /><span className="font-semibold">{label}</span>
  </button>
);

// Bottom Sheet Modal
const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-3xl border-t border-slate-700 max-h-[85vh] overflow-hidden animate-slideUp"><div className="flex items-center justify-between p-4 border-b border-slate-700"><h3 className="text-lg font-semibold text-white">{title}</h3><button onClick={onClose} className="text-slate-400 p-2"><X className="w-5 h-5" /></button></div><div className="overflow-y-auto max-h-[calc(85vh-60px)] p-4">{children}</div></div></div>;
};

// Quick Action Buttons
const QuickActions = ({ phone, whatsapp, email, onEdit, onDelete, clienteName }) => (
  <div className="flex gap-2 flex-wrap">
    {phone && <a href={`tel:${phone}`} className="flex-1 min-w-[80px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Phone className="w-4 h-4" /></a>}
    {(whatsapp || phone) && <a href={getWhatsAppLink(whatsapp || phone, clienteName ? `Ciao ${clienteName}, ` : '')} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[80px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><MessageCircle className="w-4 h-4" /></a>}
    {email && <a href={`mailto:${email}`} className="flex-1 min-w-[80px] bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Mail className="w-4 h-4" /></a>}
    {onEdit && <button onClick={onEdit} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl p-3 transition-colors"><Edit2 className="w-4 h-4" /></button>}
  </div>
);

const Logo = ({ size = 'large', centered = false }) => <div className={centered ? 'flex justify-center w-full' : ''}><img src="/logo.png" alt="KeyPrime" className={size === 'large' ? 'h-16 sm:h-20 md:h-24 w-auto max-w-[250px]' : 'h-10 md:h-12 w-auto'} style={{ objectFit: 'contain' }} /></div>;

const NotificationBell = ({ count, onClick }) => (
  <button onClick={onClick} className="relative text-slate-400 hover:text-white p-2 transition-colors">
    <Bell className="w-5 h-5" />
    {count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">{count > 9 ? '9+' : count}</span>}
  </button>
);

const NotificationPanel = ({ tasks, onClose, onGoToTask, onMarkAllRead, unreadIds }) => (
  <div className="fixed inset-0 z-50" onClick={onClose}>
    <div className="absolute right-4 top-16 w-80 max-h-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-slideDown" onClick={e => e.stopPropagation()}>
      <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
        <span className="text-white font-semibold">Notifiche</span>
        <div className="flex items-center gap-2">
          {unreadIds.length > 0 && <button onClick={onMarkAllRead} className="text-xs text-amber-400 hover:text-amber-300">Segna lette</button>}
          <button onClick={onClose} className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {tasks.length === 0 ? <div className="p-4 text-center text-slate-500">Nessuna notifica</div> : tasks.map(t => (
          <div key={t.id} onClick={() => onGoToTask(t)} className={`p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors ${isOverdue(t.scadenza) ? 'bg-red-500/10' : ''} ${unreadIds.includes(t.id) ? 'border-l-2 border-l-amber-500' : ''}`}>
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${isOverdue(t.scadenza) ? 'bg-red-500' : isToday(t.scadenza) ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{t.titolo}</div>
                <div className="text-slate-400 text-xs">{t.scadenza ? fmtDateTime(t.scadenza) : 'Senza scadenza'}</div>
                {isOverdue(t.scadenza) && <span className="text-red-400 text-xs">Scaduto!</span>}
                {unreadIds.includes(t.id) && <span className="text-amber-400 text-xs ml-2">● Nuovo</span>}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs text-white ${taskPrioritaColors[t.priorita]}`}>{t.priorita}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MobileMenu = ({ isOpen, onClose, tabs, activeTab, setActiveTab, user, onLogout }) => { if (!isOpen) return null; return <div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} /><div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-800 border-r border-slate-700 p-4 flex flex-col animate-slideRight"><div className="flex items-center justify-between mb-6"><Logo size="small" /><button onClick={onClose} className="text-slate-400"><X className="w-6 h-6" /></button></div><div className="space-y-2 flex-1">{tabs.map(t => <button key={t.id} onClick={() => { setActiveTab(t.id); onClose(); }} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>{t.icon} {t.label}</button>)}</div><div className="border-t border-slate-700 pt-4"><div className="bg-slate-700/50 rounded-xl p-4 mb-4"><div className="flex items-center gap-3"><Avatar nome={user?.nome} /><div><div className="text-white font-medium">{user?.nome}</div><div className="text-slate-400 text-xs">{user?.ruolo}</div></div></div></div><button onClick={onLogout} className="w-full bg-red-500/20 text-red-400 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"><LogOut className="w-5 h-5" /> Esci</button></div></div></div>; };

const SelectWithOther = ({ value, onChange, options, placeholder, className }) => { const [showCustom, setShowCustom] = useState(false); const [cv, setCv] = useState(''); useEffect(() => { if (value && !options.includes(value) && value !== 'Altro') { setShowCustom(true); setCv(value); } }, [value, options]); return <div className="space-y-2"><select value={showCustom ? 'Altro' : value} onChange={(e) => { if (e.target.value === 'Altro') { setShowCustom(true); setCv(''); onChange(''); } else { setShowCustom(false); onChange(e.target.value); }}} className={className}><option value="">{placeholder}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>{showCustom && <input type="text" value={cv} onChange={(e) => { setCv(e.target.value); onChange(e.target.value); }} placeholder="Specifica..." className={className} autoFocus />}</div>; };

const ClientSearch = ({ clienti, onSelect, onCreateNew, selectedClient }) => { const [search, setSearch] = useState(''); const [show, setShow] = useState(false); const filtered = search.length >= 2 ? clienti.filter(c => `${c.nome} ${c.cognome} ${c.telefono}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : []; return <div className="relative">{selectedClient ? <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-3 flex items-center gap-3"><Avatar nome={selectedClient.nome} cognome={selectedClient.cognome} size="sm" /><div className="flex-1"><div className="text-white font-medium">{selectedClient.nome} {selectedClient.cognome}</div><div className="text-emerald-400 text-xs">{selectedClient.telefono}</div></div><button onClick={() => onSelect(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button></div> : <><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cerca cliente..." value={search} onChange={(e) => { setSearch(e.target.value); setShow(true); }} onFocus={() => setShow(true)} className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-amber-500 transition-colors" /></div>{show && search.length >= 2 && <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">{filtered.map(c => <button key={c.id} onClick={() => { onSelect(c); setSearch(''); setShow(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0 flex items-center gap-3 transition-colors"><Avatar nome={c.nome} cognome={c.cognome} size="sm" /><div><div className="text-white text-sm">{c.nome} {c.cognome}</div><div className="text-slate-400 text-xs">{c.telefono}</div></div></button>)}{filtered.length === 0 && <div className="px-4 py-3 text-slate-400 text-sm">Nessuno</div>}<button onClick={() => { onCreateNew(); setShow(false); }} className="w-full text-left px-4 py-3 bg-blue-900/30 text-blue-400 flex items-center gap-2 hover:bg-blue-900/50 transition-colors"><UserPlus className="w-4 h-4" /> Nuovo</button></div>}{!search && <button onClick={onCreateNew} className="w-full mt-2 bg-slate-700/50 border border-dashed border-slate-600 rounded-xl py-3 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-400 transition-colors"><UserPlus className="w-4 h-4" /> Nuovo cliente</button>}</>}</div>; };

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [filters, setFilters] = useState({ search: '', stato: '' });
  const [convertingSale, setConvertingSale] = useState(null);
  const [agentTab, setAgentTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedClienti, setSelectedClienti] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteFilters, setClienteFilters] = useState({ search: '', stato: '', budgetMin: '', budgetMax: '', agente: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const saved = localStorage.getItem('keyprime_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { const s = localStorage.getItem('keyprime_user'); if (s) { const u = JSON.parse(s); setUser(u); setView(u.ruolo === 'admin' ? 'admin' : u.ruolo); } }, []);
  
  const loadSales = async () => { setLoading(true); const { data } = await supabase.from('sales_with_commissions').select('*').order('created_at', { ascending: false }); setSales(data || []); setLoading(false); };
  const loadUsers = async () => { const { data } = await supabase.from('user_credentials').select('*').order('created_at', { ascending: false }); setUsers(data || []); };
  const loadClienti = async () => { const { data } = await supabase.from('clienti').select('*').order('created_at', { ascending: false }); setClienti(data || []); };
  const loadTasks = async () => { const { data } = await supabase.from('tasks').select('*').order('scadenza', { ascending: true }); setTasks(data || []); };
  
  useEffect(() => { if (user) { loadSales(); loadClienti(); loadTasks(); if (user.ruolo === 'admin') loadUsers(); }}, [user]);

  const handleLogin = async (username, password) => { setLoading(true); setError(null); const { data } = await supabase.from('user_credentials').select('*').eq('username', username).eq('password', password).eq('attivo', true).single(); if (!data) { setError('Credenziali non valide'); setLoading(false); return; } setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data)); setView(data.ruolo === 'admin' ? 'admin' : data.ruolo); setLoading(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('keyprime_user'); setView('login'); setMobileMenuOpen(false); };
  const changePassword = async (np) => { await supabase.from('user_credentials').update({ password: np }).eq('id', user.id); const u = { ...user, password: np }; setUser(u); localStorage.setItem('keyprime_user', JSON.stringify(u)); setShowPasswordModal(false); showToast('Password aggiornata!'); return true; };

  const addLead = async (ld) => { let cliente_id = ld.cliente_id; if (!cliente_id && ld.cliente_nome) { const { data: cd } = await supabase.from('clienti').insert([{ nome: ld.cliente_nome, cognome: ld.cliente_cognome, email: ld.cliente_email, telefono: ld.cliente_telefono, whatsapp: ld.cliente_whatsapp, nazionalita: ld.cliente_nazionalita, budget_min: ld.cliente_budget_min ? parseFloat(ld.cliente_budget_min) : null, budget_max: ld.cliente_budget_max ? parseFloat(ld.cliente_budget_max) : null, note: ld.cliente_note, stato: 'nuovo', fonte: 'Agente', agente_riferimento: user?.nome, created_by: user?.nome, referente: user?.referente }]).select().single(); if (cd) cliente_id = cd.id; } await supabase.from('sales').insert([{ data: ld.data, developer: ld.developer, progetto: ld.progetto, zona: ld.zona, valore: ld.valore || 0, agente: ld.agente, segnalatore: ld.segnalatore, referente: user?.referente, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: ld.stato || 'lead', cliente_id }]); showToast('Lead salvato!'); setShowForm(null); loadSales(); loadClienti(); };

  const addSale = async (sd) => { let cliente_id = sd.cliente_id; let cliente_nome = sd.cliente_nome || ''; if (!cliente_id && sd.nuovo_cliente_nome) { const { data: cd } = await supabase.from('clienti').insert([{ nome: sd.nuovo_cliente_nome, cognome: sd.nuovo_cliente_cognome || '', telefono: sd.nuovo_cliente_telefono || '', email: sd.nuovo_cliente_email || '', stato: 'acquistato', fonte: 'Vendita', agente_riferimento: user?.nome, created_by: user?.nome, referente: user?.referente }]).select().single(); if (cd) { cliente_id = cd.id; cliente_nome = cd.nome; } } if (sd.cliente_id) await supabase.from('clienti').update({ stato: 'acquistato' }).eq('id', sd.cliente_id); await supabase.from('sales').insert([{ data: sd.data, developer: sd.developer, progetto: sd.progetto, zona: sd.zona, valore: sd.valore, agente: sd.agente, segnalatore: sd.segnalatore, cliente_id, cliente_nome, referente: user?.referente, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: 'venduto' }]); showToast('Vendita registrata!'); setShowForm(null); loadSales(); loadClienti(); };
  
  const convertLeadToSale = async (id, v) => { const sale = sales.find(s => s.id === id); if (sale?.cliente_id) await supabase.from('clienti').update({ stato: 'acquistato' }).eq('id', sale.cliente_id); await supabase.from('sales').update({ stato: 'venduto', valore: v }).eq('id', id); setConvertingSale(null); setShowLeadDetail(null); showToast('Vendita confermata!'); loadSales(); loadClienti(); };
  const updateSale = async (id, u) => { const s = sales.find(x => x.id === id); if (u.pagato === true && !s?.pagato) { const tn = s.agente || s.segnalatore; if (tn) { const { data: tu } = await supabase.from('user_credentials').select('*').eq('nome', tn).single(); if (tu?.email) { const ca = Number(s.valore) * (s.commission_pct || 5) / 100 * (s.agente ? 0.7 : 0.3); await sendEmail(tu.email, '💰 Commissione', `<h2>Pagata!</h2><p>${s.progetto}: ${fmt(ca)} AED</p>`); }}} await supabase.from('sales').update(u).eq('id', id); loadSales(); };
  const deleteSale = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('sales').delete().eq('id', id); showToast('Eliminato'); loadSales(); };
  const deleteSelectedSales = async () => { if (!selectedSales.length || !window.confirm(`Eliminare ${selectedSales.length}?`)) return; for (const id of selectedSales) await supabase.from('sales').delete().eq('id', id); setSelectedSales([]); loadSales(); };
  const toggleSelectSale = (id) => setSelectedSales(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAllSales = () => setSelectedSales(selectedSales.length === filteredSales.length ? [] : filteredSales.map(s => s.id));
  
  const createUser = async (d) => { await supabase.from('user_credentials').insert([d]); loadUsers(); setShowUserModal(false); showToast('Utente creato!'); return true; };
  const updateUser = async (id, d) => { await supabase.from('user_credentials').update(d).eq('id', id); loadUsers(); setShowUserModal(false); setEditingUser(null); showToast('Salvato!'); return true; };
  const deleteUser = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('user_credentials').delete().eq('id', id); loadUsers(); };
  const deleteSelectedUsers = async () => { if (!selectedUsers.length) return; for (const id of selectedUsers) await supabase.from('user_credentials').delete().eq('id', id); setSelectedUsers([]); loadUsers(); };
  const toggleSelectUser = (id) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  
  const createCliente = async (d) => { await supabase.from('clienti').insert([{ ...d, created_by: user?.nome, referente: user?.referente }]); loadClienti(); setShowClienteModal(false); showToast('Cliente creato!'); return true; };
  const updateCliente = async (id, d) => { await supabase.from('clienti').update(d).eq('id', id); loadClienti(); setShowClienteModal(false); if (selectedCliente?.id === id) setSelectedCliente({ ...selectedCliente, ...d }); showToast('Salvato!'); return true; };
  const deleteCliente = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('clienti').delete().eq('id', id); loadClienti(); if (selectedCliente?.id === id) setSelectedCliente(null); };
  const deleteSelectedClienti = async () => { if (!selectedClienti.length) return; for (const id of selectedClienti) await supabase.from('clienti').delete().eq('id', id); setSelectedClienti([]); loadClienti(); };
  const toggleSelectCliente = (id) => setSelectedClienti(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const createTask = async (d) => { const { data: newTask } = await supabase.from('tasks').insert([{ ...d, created_by: user?.nome }]).select().single(); if (newTask && d.assegnato_a) { const assignee = users.find(u => u.nome === d.assegnato_a); if (assignee?.email) await notifyTaskAssigned(newTask, assignee.email); } loadTasks(); setShowTaskModal(false); setEditingTask(null); showToast('Task creato!'); return true; };
  const updateTask = async (id, d) => { await supabase.from('tasks').update(d).eq('id', id); loadTasks(); setShowTaskModal(false); setEditingTask(null); showToast('Salvato!'); return true; };
  const completeTask = async (id) => { const task = tasks.find(t => t.id === id); await supabase.from('tasks').update({ stato: 'completato', completed_at: new Date().toISOString() }).eq('id', id); if (task && user?.ruolo !== 'admin') await notifyTaskCompleted(task, user?.nome); showToast('Task completato!'); loadTasks(); };
  const addTaskNote = async (id, note) => { const task = tasks.find(t => t.id === id); await supabase.from('tasks').update({ note }).eq('id', id); if (task && user?.ruolo !== 'admin') await notifyTaskNote(task, user?.nome, note); loadTasks(); setShowNoteModal(null); showToast('Nota inviata!'); };
  const deleteTask = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('tasks').delete().eq('id', id); loadTasks(); };
  
  const exportToCSV = () => { let csv = '\ufeffData,Progetto,Cliente,Agente,Valore,Stato\n'; filteredSales.forEach(s => csv += `${s.data},"${s.progetto}","${s.cliente_nome||''}","${s.agente||''}",${s.valore},${s.stato}\n`); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); l.download = `KeyPrime_${new Date().toISOString().split('T')[0]}.csv`; l.click(); };
  const exportClientiToCSV = () => { let csv = '\ufeffNome,Cognome,Telefono,Email,Stato,Budget,Agente\n'; filteredClienti.forEach(c => csv += `"${c.nome}","${c.cognome||''}","${c.telefono||''}","${c.email||''}","${c.stato}",${c.budget_max||''},"${c.agente_riferimento||''}"\n`); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); l.download = `Clienti_${new Date().toISOString().split('T')[0]}.csv`; l.click(); };
  
  const filteredSales = sales.filter(s => { if (filters.search && !`${s.progetto} ${s.developer} ${s.agente} ${s.cliente_nome}`.toLowerCase().includes(filters.search.toLowerCase())) return false; if (filters.stato && s.stato !== filters.stato) return false; return true; });
  const filteredClienti = clienti.filter(c => { if (clienteFilters.search && !`${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase().includes(clienteFilters.search.toLowerCase())) return false; if (clienteFilters.stato && c.stato !== clienteFilters.stato) return false; if (clienteFilters.agente && c.agente_riferimento !== clienteFilters.agente) return false; if (clienteFilters.budgetMin && (!c.budget_min || c.budget_min < parseFloat(clienteFilters.budgetMin))) return false; if (clienteFilters.budgetMax && (!c.budget_max || c.budget_max > parseFloat(clienteFilters.budgetMax))) return false; return true; });
  const getClientSales = (clienteId) => sales.filter(s => s.cliente_id === clienteId);
  const getClientTasks = (clienteId) => tasks.filter(t => t.cliente_id === clienteId);
  const uniqueAgenti = [...new Set(clienti.map(c => c.agente_riferimento).filter(Boolean))];
  
  const myPendingTasks = tasks.filter(t => t.stato === 'pending' && (user?.ruolo === 'admin' || t.assegnato_a === user?.nome));
  const overdueTasks = myPendingTasks.filter(t => isOverdue(t.scadenza));
  const todayTasks = myPendingTasks.filter(t => isToday(t.scadenza));
  const notificationTasks = myPendingTasks.filter(t => isOverdue(t.scadenza) || isToday(t.scadenza));
  const unreadNotificationIds = notificationTasks.filter(t => !readNotificationIds.includes(t.id)).map(t => t.id);
  const notificationCount = unreadNotificationIds.length;
  
  const markNotificationsAsRead = () => { const allIds = [...new Set([...readNotificationIds, ...notificationTasks.map(t => t.id)])]; setReadNotificationIds(allIds); localStorage.setItem('keyprime_read_notifications', JSON.stringify(allIds)); };
  const openNotifications = () => setShowNotifications(true);
  const closeNotifications = () => { setShowNotifications(false); markNotificationsAsRead(); };
  const goToTaskFromNotification = (task) => { setShowNotifications(false); if (user?.ruolo === 'admin') setAdminTab('tasks'); else setAgentTab('tasks'); };
  
  const ErrorBanner = () => error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}<button onClick={() => setError(null)} className="ml-auto">X</button></div>;

  if (view === 'login') return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6"><div className="w-full max-w-sm"><div className="text-center mb-8"><Logo size="large" centered /><p className="text-slate-400 text-sm mt-3">Sales Management</p></div>{error && <div className="bg-red-500/20 text-red-300 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}<div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"><LoginForm onLogin={handleLogin} loading={loading} /></div></div></div>;

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
    const recentSales = mySales.slice(0, 5);
    
    const agentTabs = [
      { id: 'home', icon: '🏠', label: 'Home' },
      { id: 'lista', icon: '📋', label: 'Lead' },
      { id: 'pipeline', icon: '🎯', label: 'Pipeline' },
      { id: 'tasks', icon: '📅', label: `Task${myTasks.length > 0 ? ` (${myTasks.length})` : ''}` },
      { id: 'settings', icon: '⚙️', label: 'Impostazioni' }
    ];

    // Lead Detail Bottom Sheet
    const LeadDetailSheet = ({ sale, onClose }) => {
      const cliente = clienti.find(c => c.id === sale?.cliente_id);
      const mc = (sale?.stato === 'venduto' || sale?.stato === 'incassato') ? Number(sale.valore) * (sale.commission_pct || 5) / 100 * rate : 0;
      if (!sale) return null;
      return (
        <BottomSheet isOpen={!!sale} onClose={onClose} title={sale.progetto || 'Lead'}>
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-lg text-sm font-medium text-white ${pipelineColors[sale.stato || 'lead']}`}>{pipelineLabels[sale.stato || 'lead']}</span>
              <span className="text-slate-400 text-sm">{fmtDate(sale.data)}</span>
            </div>
            
            {/* Value Card */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
              <div className="text-amber-300 text-xs mb-1">Valore</div>
              <div className="text-2xl font-bold text-white">{sale.valore > 0 ? `${fmt(sale.valore)} AED` : 'TBD'}</div>
              {mc > 0 && <div className="text-emerald-400 text-sm mt-1">Commissione: {fmt(mc)} AED {sale.pagato ? '✓' : '(pending)'}</div>}
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-xl p-3"><div className="text-slate-400 text-xs">Developer</div><div className="text-white font-medium">{sale.developer}</div></div>
              <div className="bg-slate-700/50 rounded-xl p-3"><div className="text-slate-400 text-xs">Zona</div><div className="text-white font-medium">{sale.zona}</div></div>
            </div>
            
            {/* Cliente */}
            {cliente && (
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="text-slate-400 text-xs mb-2">Cliente</div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar nome={cliente.nome} cognome={cliente.cognome} />
                  <div>
                    <div className="text-white font-medium">{cliente.nome} {cliente.cognome}</div>
                    <div className="text-slate-400 text-sm">{cliente.telefono}</div>
                  </div>
                </div>
                <QuickActions phone={cliente.telefono} whatsapp={cliente.whatsapp || cliente.telefono} email={cliente.email} clienteName={cliente.nome} />
              </div>
            )}
            
            {/* Pipeline Status Change */}
            <div>
              <div className="text-slate-400 text-xs mb-2">Cambia stato</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {pipelineStati.slice(0, -1).map(st => (
                  <button key={st} onClick={() => { updateSale(sale.id, { stato: st }); onClose(); }} className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${sale.stato === st ? `${pipelineColors[st]} text-white` : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{st}</button>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {['prenotato', 'trattativa'].includes(sale.stato) && (
                <button onClick={() => { setConvertingSale(sale); onClose(); }} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"><DollarSign className="w-5 h-5" /> Registra Vendita</button>
              )}
            </div>
          </div>
        </BottomSheet>
      );
    };

    // Form View
    if (showForm) return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={() => setShowForm(null)} className="text-slate-400 flex items-center gap-2"><ChevronLeft className="w-5 h-5" />Indietro</button>
            <span className="text-white font-medium">{showForm === 'lead' ? 'Nuovo Lead' : 'Nuova Vendita'}</span>
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 pb-28 max-w-lg mx-auto">
          {showForm === 'lead' && <LeadFormClean type={type} userName={user?.nome} clienti={myClienti} onSubmit={addLead} />}
          {showForm === 'vendita' && <SaleFormClean type={type} userName={user?.nome} clienti={myClienti} onSubmit={addSale} />}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-700">
          <button onClick={() => document.getElementById('submitBtn')?.click()} className={`w-full ${showForm === 'lead' ? 'bg-blue-500' : 'bg-emerald-500'} text-white rounded-xl py-4 font-semibold text-lg transition-transform active:scale-[0.98]`}>
            {showForm === 'lead' ? '💾 Salva Lead' : '✓ Registra Vendita'}
          </button>
        </div>
      </div>
    );

    // Main Agent View
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-400"><Menu className="w-6 h-6" /></button>
              <Logo size="small" />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell count={notificationCount} onClick={openNotifications} />
              <div className="hidden md:flex items-center gap-3">
                <Avatar nome={user?.nome} size="sm" />
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{user?.nome}</div>
                  <div className="text-slate-400 text-xs">{type}</div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
        
        {showNotifications && <NotificationPanel tasks={notificationTasks} onClose={closeNotifications} onGoToTask={goToTaskFromNotification} onMarkAllRead={markNotificationsAsRead} unreadIds={unreadNotificationIds} />}
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} tabs={agentTabs} activeTab={agentTab} setActiveTab={setAgentTab} user={user} onLogout={handleLogout} />
        <LeadDetailSheet sale={showLeadDetail} onClose={() => setShowLeadDetail(null)} />
        {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
        
        <div className="p-4 max-w-4xl mx-auto">
          <ErrorBanner />
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-2 mb-6">
            {agentTabs.map(t => (
              <button key={t.id} onClick={() => setAgentTab(t.id)} className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${agentTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>{t.icon} {t.label}</button>
            ))}
            <div className="flex-1" />
            <button onClick={loadSales} className="bg-slate-700 text-white rounded-xl px-3 py-2 hover:bg-slate-600 transition-colors"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
          
          {/* HOME TAB */}
          {agentTab === 'home' && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <Avatar nome={user?.nome} size="lg" />
                  <div>
                    <div className="text-slate-400 text-sm">Bentornato,</div>
                    <div className="text-2xl font-bold text-white">{user?.nome} 👋</div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div onClick={() => setAgentTab('lista')} className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-2 text-blue-300 text-xs mb-1"><Target className="w-4 h-4" />Lead Attivi</div>
                  <div className="text-3xl font-bold text-white">{mySales.filter(s => s.stato !== 'venduto' && s.stato !== 'incassato').length}</div>
                </div>
                <div onClick={() => setAgentTab('lista')} className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs mb-1"><TrendingUp className="w-4 h-4" />Vendite</div>
                  <div className="text-3xl font-bold text-white">{myVendite.length}</div>
                </div>
              </div>
              
              {/* Commission Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">Commissioni</div>
                  <div className="text-amber-400 text-sm font-medium">{fmt(totalComm)} AED totali</div>
                </div>
                <ProgressBar value={pagate} max={totalComm} color="bg-emerald-500" />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-emerald-400">✓ Pagate: {fmt(pagate)}</span>
                  <span className="text-amber-400">◌ Pending: {fmt(totalComm - pagate)}</span>
                </div>
              </div>
              
              {/* Tasks Alert */}
              {myTasks.length > 0 && (
                <div onClick={() => setAgentTab('tasks')} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 cursor-pointer hover:bg-amber-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 rounded-full p-2"><Bell className="w-5 h-5 text-amber-400" /></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Hai {myTasks.length} task da completare</div>
                      <div className="text-amber-300 text-sm">{overdueTasks.filter(t => t.assegnato_a === user?.nome).length > 0 && `${overdueTasks.filter(t => t.assegnato_a === user?.nome).length} scaduti!`}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              )}
              
              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">Ultimi Lead</div>
                  <button onClick={() => setAgentTab('lista')} className="text-amber-400 text-sm flex items-center gap-1">Vedi tutti <ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  {recentSales.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center text-slate-500">Nessun lead ancora. Inizia aggiungendo il primo!</div>
                  ) : recentSales.map(s => (
                    <div key={s.id} onClick={() => setShowLeadDetail(s)} className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-all active:scale-[0.99]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${pipelineColors[s.stato || 'lead']}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium truncate">{s.progetto || 'TBD'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs text-white ${pipelineColors[s.stato || 'lead']}`}>{s.stato}</span>
                          </div>
                          <div className="text-slate-400 text-xs truncate">{s.developer} • {s.zona}</div>
                        </div>
                        <div className="text-right">
                          {s.valore > 0 ? <div className="text-amber-400 font-semibold">{fmt(s.valore)}</div> : <div className="text-slate-500 text-sm">TBD</div>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowForm('lead')} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors">
                  <Target className="w-6 h-6" />
                  <span className="font-semibold">Nuovo Lead</span>
                </button>
                <button onClick={() => setShowForm('vendita')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors">
                  <DollarSign className="w-6 h-6" />
                  <span className="font-semibold">Vendita Diretta</span>
                </button>
              </div>
            </div>
          )}
          
          {/* LISTA TAB */}
          {agentTab === 'lista' && (
            <div className="space-y-3">
              {mySales.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <div className="text-slate-400 mb-4">Nessun lead ancora</div>
                  <button onClick={() => setShowForm('lead')} className="bg-amber-500 text-slate-900 px-6 py-3 rounded-xl font-semibold">+ Aggiungi Lead</button>
                </div>
              ) : mySales.map(s => {
                const mc = (s.stato === 'venduto' || s.stato === 'incassato') ? Number(s.valore) * (s.commission_pct || 5) / 100 * rate : 0;
                return (
                  <div key={s.id} onClick={() => setShowLeadDetail(s)} className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-all active:scale-[0.99]">
                    <div className="flex items-start gap-3">
                      <div className={`w-1.5 h-full min-h-[60px] rounded-full ${pipelineColors[s.stato || 'lead']}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{s.progetto || 'TBD'}</span>
                          <span className={`px-2 py-0.5 rounded text-xs text-white ${pipelineColors[s.stato || 'lead']}`}>{s.stato}</span>
                        </div>
                        <div className="text-slate-400 text-sm">{s.developer} • {s.zona}</div>
                        {s.cliente_nome && <div className="text-blue-400 text-xs mt-1 flex items-center gap-1"><User className="w-3 h-3" />{s.cliente_nome}</div>}
                        {mc > 0 && <div className="text-xs mt-2"><span className="text-slate-400">Comm: </span><span className="text-amber-300">{fmt(mc)} AED</span><span className={`ml-2 px-1.5 py-0.5 rounded ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{s.pagato ? '✓ Pagato' : 'Pending'}</span></div>}
                      </div>
                      <div className="text-right">
                        {s.valore > 0 ? <div className="text-amber-400 font-bold text-lg">{fmt(s.valore)}</div> : <div className="text-slate-500">TBD</div>}
                        <div className="text-slate-500 text-xs">{fmtDate(s.data)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* PIPELINE TAB */}
          {agentTab === 'pipeline' && (
            <div className="space-y-4">
              {pipelineStati.slice(0, -1).map(st => (
                <div key={st} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className={`${pipelineColors[st]} px-4 py-2 flex justify-between items-center`}>
                    <span className="text-white font-medium">{pipelineLabels[st]}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-white text-sm">{byStato[st]?.length || 0}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {byStato[st]?.length === 0 ? (
                      <div className="text-slate-500 text-sm text-center py-2">Nessuno</div>
                    ) : byStato[st]?.map(s => (
                      <div key={s.id} onClick={() => setShowLeadDetail(s)} className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white text-sm font-medium">{s.progetto || 'TBD'}</div>
                            {s.cliente_nome && <div className="text-blue-400 text-xs">{s.cliente_nome}</div>}
                          </div>
                          {s.valore > 0 && <div className="text-amber-400 text-sm font-medium">{fmt(s.valore)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* TASKS TAB */}
          {agentTab === 'tasks' && <AgentTasksTab tasks={myTasks} allTasks={tasks.filter(t => t.assegnato_a === user?.nome)} clienti={clienti} onComplete={completeTask} onAddNote={(t) => setShowNoteModal(t)} />}
          
          {/* SETTINGS TAB */}
          {agentTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar nome={user?.nome} size="lg" />
                  <div>
                    <div className="text-white font-semibold text-lg">{user?.nome}</div>
                    <div className="text-slate-400 text-sm">{type} • {user?.email || 'No email'}</div>
                  </div>
                </div>
                <div className="border-t border-slate-700 pt-4">
                  <button onClick={() => setShowPasswordModal(true)} className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-colors">
                    <Key className="w-4 h-4" /> Cambia Password
                  </button>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl py-3 flex items-center justify-center gap-2 transition-colors">
                <LogOut className="w-5 h-5" /> Esci
              </button>
            </div>
          )}
        </div>
        
        {/* Bottom Navigation Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-2 py-2 z-30">
          <div className="flex justify-around">
            {agentTabs.slice(0, 4).map(t => (
              <button key={t.id} onClick={() => setAgentTab(t.id)} className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${agentTab === t.id ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}>
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs mt-1">{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
        
        {showPasswordModal && <PasswordModal currentPassword={user?.password} onSave={changePassword} onClose={() => setShowPasswordModal(false)} />}
        {showNoteModal && <NoteModal task={showNoteModal} onSave={addTaskNote} onClose={() => setShowNoteModal(null)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ==================== ADMIN VIEW ====================
  if (view === 'admin') {
    const vendite = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totals = sales.reduce((a, s) => { const c = Number(s.valore) * (s.commission_pct || 5) / 100; const ag = s.agente ? c * 0.7 : 0; const sg = s.segnalatore ? c * 0.3 : 0; const n = c - ag - sg; const p = s.referente === 'Pellegrino' ? n * 0.7 : (s.referente === 'Giovanni' ? n * 0.3 : 0); const g = s.referente === 'Giovanni' ? n * 0.7 : (s.referente === 'Pellegrino' ? n * 0.3 : 0); return { valore: a.valore + Number(s.valore), comm: a.comm + c, ag: a.ag + ag, sg: a.sg + sg, netto: a.netto + n, pell: a.pell + p, giov: a.giov + g }; }, { valore: 0, comm: 0, ag: 0, sg: 0, netto: 0, pell: 0, giov: 0 });
    const byStato = pipelineStati.reduce((a, st) => { a[st] = sales.filter(s => (s.stato || 'lead') === st); return a; }, {});
    const byMonth = sales.reduce((a, s) => { const m = s.data?.substring(0, 7) || 'N/A'; a[m] = (a[m] || 0) + Number(s.valore); return a; }, {});
    const byAgente = sales.reduce((a, s) => { if (s.agente) a[s.agente] = (a[s.agente] || 0) + Number(s.valore); return a; }, {});
    const byZona = sales.reduce((a, s) => { if (s.zona) a[s.zona] = (a[s.zona] || 0) + Number(s.valore); return a; }, {});
    const pendingTasks = tasks.filter(t => t.stato === 'pending');
    const adminTabs = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'vendite', icon: '💰', label: 'Vendite' },
      { id: 'pipeline', icon: '🎯', label: 'Pipeline' },
      { id: 'clienti', icon: '👥', label: 'CRM' },
      { id: 'tasks', icon: '📅', label: `Task${pendingTasks.length > 0 ? ` (${pendingTasks.length})` : ''}` },
      { id: 'utenti', icon: '⚙️', label: 'Utenti' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-400"><Menu className="w-6 h-6" /></button>
              <Logo size="small" />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell count={notificationCount} onClick={openNotifications} />
              <div className="hidden md:flex items-center gap-3">
                <Avatar nome={user?.nome} size="sm" />
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{user?.nome}</div>
                  <div className="text-slate-400 text-xs">Admin</div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
        
        {showNotifications && <NotificationPanel tasks={notificationTasks} onClose={closeNotifications} onGoToTask={goToTaskFromNotification} onMarkAllRead={markNotificationsAsRead} unreadIds={unreadNotificationIds} />}
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} tabs={adminTabs} activeTab={adminTab} setActiveTab={(t) => { setAdminTab(t); setSelectedCliente(null); }} user={user} onLogout={handleLogout} />
        
        <div className="p-4 max-w-7xl mx-auto">
          <ErrorBanner />
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2">
            {adminTabs.map(t => (
              <button key={t.id} onClick={() => { setAdminTab(t.id); setSelectedCliente(null); }} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap text-sm transition-all ${adminTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>{t.icon} {t.label}</button>
            ))}
          </div>
          
          {adminTab === 'dashboard' && <DashboardTab totals={totals} sales={sales} vendite={vendite} byStato={byStato} byMonth={byMonth} byAgente={byAgente} byZona={byZona} fmt={fmt} pipelineColors={pipelineColors} todayTasks={todayTasks} overdueTasks={overdueTasks} onNavigate={setAdminTab} />}
          {adminTab === 'vendite' && <VenditeTab sales={filteredSales} loading={loading} filters={filters} setFilters={setFilters} updateSale={updateSale} deleteSale={deleteSale} loadSales={loadSales} exportToCSV={exportToCSV} fmt={fmt} selectedSales={selectedSales} toggleSelectSale={toggleSelectSale} selectAllSales={selectAllSales} deleteSelectedSales={deleteSelectedSales} />}
          {adminTab === 'pipeline' && <PipelineTab byStato={byStato} fmt={fmt} pipelineColors={pipelineColors} pipelineLabels={pipelineLabels} />}
          {adminTab === 'clienti' && (selectedCliente ? <ClienteDetail cliente={selectedCliente} sales={getClientSales(selectedCliente.id)} tasks={getClientTasks(selectedCliente.id)} onBack={() => setSelectedCliente(null)} onEdit={() => { setEditingCliente(selectedCliente); setShowClienteModal(true); }} onDelete={() => deleteCliente(selectedCliente.id)} updateCliente={updateCliente} fmt={fmt} fmtDate={fmtDate} onAddTask={() => { setEditingTask({ cliente_id: selectedCliente.id }); setShowTaskModal(true); }} onCompleteTask={completeTask} onDeleteTask={deleteTask} onExportPDF={() => generateClientePDF(selectedCliente, getClientSales(selectedCliente.id), getClientTasks(selectedCliente.id))} /> : <ClientiTab clienti={filteredClienti} loadClienti={loadClienti} createCliente={createCliente} deleteCliente={deleteCliente} showModal={showClienteModal} setShowModal={setShowClienteModal} editingCliente={editingCliente} setEditingCliente={setEditingCliente} selectedClienti={selectedClienti} toggleSelectCliente={toggleSelectCliente} deleteSelectedClienti={deleteSelectedClienti} onSelectCliente={setSelectedCliente} filters={clienteFilters} setFilters={setClienteFilters} showFilters={showFilters} setShowFilters={setShowFilters} uniqueAgenti={uniqueAgenti} exportToCSV={exportClientiToCSV} sales={sales} fmt={fmt} updateCliente={updateCliente} />)}
          {adminTab === 'tasks' && <AdminTasksTab tasks={tasks} clienti={clienti} users={users} onComplete={completeTask} onDelete={deleteTask} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onCreate={() => { setEditingTask(null); setShowTaskModal(true); }} />}
          {adminTab === 'utenti' && <UserManagement users={users} loadUsers={loadUsers} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} showUserModal={showUserModal} setShowUserModal={setShowUserModal} editingUser={editingUser} setEditingUser={setEditingUser} selectedUsers={selectedUsers} toggleSelectUser={toggleSelectUser} deleteSelectedUsers={deleteSelectedUsers} />}
        </div>
        
        {showTaskModal && <TaskModal task={editingTask} clienti={clienti} users={users} onClose={() => { setShowTaskModal(false); setEditingTask(null); }} onSave={editingTask?.id ? (d) => updateTask(editingTask.id, d) : createTask} currentUser={user?.nome} />}
        {showClienteModal && <ClienteModal cliente={editingCliente} onClose={() => { setShowClienteModal(false); setEditingCliente(null); }} onSave={editingCliente ? (d) => updateCliente(editingCliente.id, d) : createCliente} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }
  return null;
}

// ==================== FORM COMPONENTS ====================

function LoginForm({ onLogin, loading }) { const [u, setU] = useState(''); const [p, setP] = useState(''); const [sp, setSp] = useState(false); return <form onSubmit={(e) => { e.preventDefault(); onLogin(u, p); }} className="space-y-4"><div><label className="block text-slate-300 text-sm mb-2">Username</label><input type="text" value={u} onChange={(e) => setU(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-amber-500 transition-colors" /></div><div><label className="block text-slate-300 text-sm mb-2">Password</label><div className="relative"><input type={sp ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-white focus:border-amber-500 transition-colors" /><button type="button" onClick={() => setSp(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{sp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div><button type="submit" disabled={loading || !u || !p} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-900 rounded-xl py-3 font-semibold transition-all active:scale-[0.98]">{loading ? '...' : 'Accedi'}</button></form>; }

function PasswordModal({ currentPassword, onSave, onClose }) { const [op, setOp] = useState(''); const [np, setNp] = useState(''); const [cp, setCp] = useState(''); const [e, setE] = useState(''); const save = () => { if (op !== currentPassword) { setE('Password errata'); return; } if (np.length < 6) { setE('Min 6 caratteri'); return; } if (np !== cp) { setE('Non coincidono'); return; } onSave(np); }; return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">Cambia Password</h3>{e && <div className="bg-red-500/20 text-red-300 rounded-lg px-3 py-2 mb-4 text-sm">{e}</div>}<div className="space-y-3"><input type="password" placeholder="Attuale" value={op} onChange={(e) => setOp(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white" /><input type="password" placeholder="Nuova" value={np} onChange={(e) => setNp(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white" /><input type="password" placeholder="Conferma" value={cp} onChange={(e) => setCp(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white" /><div className="flex gap-3 pt-2"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={save} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold">Salva</button></div></div></div></div>; }

function NoteModal({ task, onSave, onClose }) { const [note, setNote] = useState(task.note || ''); return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-2">Aggiungi Nota</h3><p className="text-slate-400 text-sm mb-4">{task.titolo}</p><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scrivi una nota..." className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white h-32" autoFocus /><p className="text-slate-500 text-xs mt-2">L'admin riceverà una notifica</p><div className="flex gap-3 mt-4"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={() => onSave(task.id, note)} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Invia</button></div></div></div>; }

function ConvertModal({ sale, onConvert, onCancel }) { const [v, setV] = useState(sale.valore || ''); return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">🎉 Registra Vendita</h3><div className="bg-slate-700/50 rounded-xl p-3 mb-4"><div className="text-white font-medium text-sm">{sale.progetto}</div><div className="text-slate-400 text-xs">{sale.developer} • {sale.zona}</div></div><label className="block text-slate-400 text-sm mb-2">Valore finale (AED)</label><input type="number" placeholder="es. 1500000" value={v} onChange={(e) => setV(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg mb-4" autoFocus /><div className="flex gap-3"><button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={() => v && onConvert(sale.id, parseFloat(v))} disabled={!v} className="flex-1 bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl py-3 font-semibold">✓ Conferma</button></div></div></div>; }

function LeadFormClean({ type, userName, clienti, onSubmit }) { const [selectedClient, setSelectedClient] = useState(null); const [showNew, setShowNew] = useState(false); const [f, setF] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '', stato: 'lead', cliente_nome: '', cliente_cognome: '', cliente_email: '', cliente_telefono: '', cliente_whatsapp: '', cliente_nazionalita: '', cliente_budget_min: '', cliente_budget_max: '', cliente_note: '' }); const sub = (e) => { e?.preventDefault(); if (!selectedClient && !f.cliente_nome) { alert('Seleziona o crea un cliente'); return; } onSubmit({ ...f, cliente_id: selectedClient?.id, cliente_nome: selectedClient?.nome || f.cliente_nome, cliente_cognome: selectedClient?.cognome || f.cliente_cognome, developer: f.developer || 'TBD', progetto: f.progetto || 'TBD', zona: f.zona || 'TBD', valore: f.valore ? parseFloat(f.valore) : 0, agente: type === 'agente' ? userName : null, segnalatore: type === 'segnalatore' ? userName : null }); }; const inp = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 transition-colors"; return <form onSubmit={sub}><div className="space-y-4"><div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"><h4 className="text-white font-medium mb-3 flex items-center gap-2"><User className="w-4 h-4 text-amber-400" /> Cliente</h4><ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNew(false); }} onCreateNew={() => { setSelectedClient(null); setShowNew(true); }} />{showNew && !selectedClient && <div className="mt-4 pt-4 border-t border-slate-700 space-y-3"><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Nome *" value={f.cliente_nome} onChange={(e) => setF({ ...f, cliente_nome: e.target.value })} className={inp} /><input type="text" placeholder="Cognome" value={f.cliente_cognome} onChange={(e) => setF({ ...f, cliente_cognome: e.target.value })} className={inp} /><input type="tel" placeholder="Telefono" value={f.cliente_telefono} onChange={(e) => setF({ ...f, cliente_telefono: e.target.value })} className={inp} /><input type="email" placeholder="Email" value={f.cliente_email} onChange={(e) => setF({ ...f, cliente_email: e.target.value })} className={inp} /><input type="number" placeholder="Budget Min" value={f.cliente_budget_min} onChange={(e) => setF({ ...f, cliente_budget_min: e.target.value })} className={inp} /><input type="number" placeholder="Budget Max" value={f.cliente_budget_max} onChange={(e) => setF({ ...f, cliente_budget_max: e.target.value })} className={inp} /></div></div>}</div><div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"><h4 className="text-white font-medium mb-3 flex items-center gap-2"><Home className="w-4 h-4 text-amber-400" /> Immobile</h4><div className="grid grid-cols-2 gap-3"><SelectWithOther value={f.developer} onChange={(v) => setF({ ...f, developer: v })} options={developers} placeholder="Developer" className={inp} /><SelectWithOther value={f.zona} onChange={(v) => setF({ ...f, zona: v })} options={zones} placeholder="Zona" className={inp} /><input type="text" placeholder="Progetto" value={f.progetto} onChange={(e) => setF({ ...f, progetto: e.target.value })} className={inp} /><input type="number" placeholder="Valore (AED)" value={f.valore} onChange={(e) => setF({ ...f, valore: e.target.value })} className={inp} /></div></div><div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"><h4 className="text-white font-medium mb-3">Stato iniziale</h4><div className="flex flex-wrap gap-2">{pipelineStati.slice(0, 4).map(st => <button key={st} type="button" onClick={() => setF({ ...f, stato: st })} className={`px-4 py-2 rounded-xl text-sm transition-all ${f.stato === st ? `${pipelineColors[st]} text-white` : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{st}</button>)}</div></div></div><button type="submit" id="submitBtn" className="hidden">Submit</button></form>; }

function SaleFormClean({ type, userName, clienti, onSubmit }) { const [selectedClient, setSelectedClient] = useState(null); const [showNew, setShowNew] = useState(false); const [f, setF] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '', nuovo_cliente_nome: '', nuovo_cliente_cognome: '', nuovo_cliente_telefono: '', nuovo_cliente_email: '' }); const sub = (e) => { e?.preventDefault(); if (!selectedClient && !f.nuovo_cliente_nome) { alert('Seleziona o inserisci il cliente'); return; } if (!f.developer || !f.progetto || !f.zona || !f.valore) { alert('Compila tutti i campi'); return; } onSubmit({ data: f.data, developer: f.developer, progetto: f.progetto, zona: f.zona, valore: parseFloat(f.valore), agente: type === 'agente' ? userName : null, segnalatore: type === 'segnalatore' ? userName : null, cliente_id: selectedClient?.id, cliente_nome: selectedClient?.nome || f.nuovo_cliente_nome, nuovo_cliente_nome: f.nuovo_cliente_nome, nuovo_cliente_cognome: f.nuovo_cliente_cognome, nuovo_cliente_telefono: f.nuovo_cliente_telefono, nuovo_cliente_email: f.nuovo_cliente_email }); }; const inp = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 transition-colors"; return <form onSubmit={sub}><div className="space-y-4"><div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"><h4 className="text-white font-medium mb-3 flex items-center gap-2"><User className="w-4 h-4 text-amber-400" /> Cliente</h4><ClientSearch clienti={clienti} selectedClient={selectedClient} onSelect={(c) => { setSelectedClient(c); setShowNew(false); }} onCreateNew={() => { setSelectedClient(null); setShowNew(true); }} />{showNew && !selectedClient && <div className="mt-4 pt-4 border-t border-slate-700"><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Nome *" value={f.nuovo_cliente_nome} onChange={(e) => setF({ ...f, nuovo_cliente_nome: e.target.value })} className={inp} /><input type="text" placeholder="Cognome" value={f.nuovo_cliente_cognome} onChange={(e) => setF({ ...f, nuovo_cliente_cognome: e.target.value })} className={inp} /><input type="tel" placeholder="Telefono" value={f.nuovo_cliente_telefono} onChange={(e) => setF({ ...f, nuovo_cliente_telefono: e.target.value })} className={inp} /><input type="email" placeholder="Email" value={f.nuovo_cliente_email} onChange={(e) => setF({ ...f, nuovo_cliente_email: e.target.value })} className={inp} /></div></div>}</div><div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"><h4 className="text-white font-medium mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Dettagli Vendita</h4><div className="space-y-3"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} className={inp} /><SelectWithOther value={f.developer} onChange={(v) => setF({ ...f, developer: v })} options={developers} placeholder="Developer *" className={inp} /><input type="text" placeholder="Progetto *" value={f.progetto} onChange={(e) => setF({ ...f, progetto: e.target.value })} className={inp} /><SelectWithOther value={f.zona} onChange={(v) => setF({ ...f, zona: v })} options={zones} placeholder="Zona *" className={inp} /><input type="number" placeholder="Valore (AED) *" value={f.valore} onChange={(e) => setF({ ...f, valore: e.target.value })} className={`${inp} text-lg font-semibold`} /></div></div></div><button type="submit" id="submitBtn" className="hidden">Submit</button></form>; }

// ==================== DASHBOARD ====================
function DashboardTab({ totals, sales, vendite, byStato, byMonth, byAgente, byZona, fmt, pipelineColors, todayTasks, overdueTasks, onNavigate }) {
  const sm = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxM = Math.max(...sm.map(([, v]) => v)) || 1;
  const sa = Object.entries(byAgente).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sz = Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avg = vendite.length > 0 ? totals.valore / vendite.length : 0;
  const conv = sales.length > 0 ? (vendite.length / sales.length * 100).toFixed(1) : 0;
  const maxAgent = Math.max(...sa.map(([,v]) => v)) || 1;
  
  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(todayTasks?.length > 0 || overdueTasks?.length > 0) && (
        <div onClick={() => onNavigate('tasks')} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-500/20 transition-colors">
          <div className="bg-amber-500/20 rounded-full p-2"><Bell className="w-5 h-5 text-amber-400" /></div>
          <div className="flex-1">
            <div className="text-white font-medium">Task in scadenza</div>
            <div className="text-amber-300 text-sm">
              {overdueTasks?.length > 0 && <span className="text-red-400 font-medium">{overdueTasks.length} scaduti</span>}
              {overdueTasks?.length > 0 && todayTasks?.length > 0 && ' • '}
              {todayTasks?.length > 0 && <span>{todayTasks.length} oggi</span>}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400" />
        </div>
      )}
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div onClick={() => onNavigate('vendite')} className="relative bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all active:scale-[0.98]">
          <div className="flex items-center gap-2 text-blue-300 text-xs mb-1"><Target className="w-4 h-4" />Lead Totali</div>
          <div className="text-2xl font-bold text-white"><AnimatedNumber value={sales.length} /></div>
          <ChevronRight className="w-4 h-4 text-blue-300/50 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div onClick={() => onNavigate('vendite')} className="relative bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all active:scale-[0.98]">
          <div className="flex items-center gap-2 text-emerald-300 text-xs mb-1"><TrendingUp className="w-4 h-4" />Vendite</div>
          <div className="text-2xl font-bold text-white"><AnimatedNumber value={vendite.length} /></div>
          <div className="text-emerald-400 text-xs">{conv}% conversione</div>
          <ChevronRight className="w-4 h-4 text-emerald-300/50 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-300 text-xs mb-1"><DollarSign className="w-4 h-4" />Volume</div>
          <div className="text-xl font-bold text-white"><AnimatedNumber value={totals.valore} /></div>
          <div className="text-amber-400 text-xs">Media: {fmt(avg)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-300 text-xs mb-1"><Activity className="w-4 h-4" />Netto KP</div>
          <div className="text-xl font-bold text-white"><AnimatedNumber value={totals.netto} /></div>
        </div>
      </div>
      
      {/* Commission Split */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
          <div className="text-slate-400 text-xs">Commissioni Tot</div>
          <div className="text-lg font-bold text-emerald-400">{fmt(totals.comm)}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
          <div className="text-slate-400 text-xs">Agenti 70%</div>
          <div className="text-lg font-bold text-blue-400">{fmt(totals.ag)}</div>
        </div>
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-3 text-center">
          <div className="text-green-300 text-xs">Pellegrino</div>
          <div className="text-lg font-bold text-green-400">{fmt(totals.pell)}</div>
        </div>
        <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-3 text-center">
          <div className="text-orange-300 text-xs">Giovanni</div>
          <div className="text-lg font-bold text-orange-400">{fmt(totals.giov)}</div>
        </div>
      </div>
      
      {/* Pipeline Overview */}
      <div onClick={() => onNavigate('pipeline')} className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2"><PieChart className="w-4 h-4 text-amber-400" />Pipeline</h3>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex gap-2">
          {Object.entries(byStato).map(([st, items]) => (
            <div key={st} className="flex-1">
              <div className={`${pipelineColors[st]} rounded-lg p-3 text-center text-white`}>
                <div className="text-xl font-bold">{items.length}</div>
                <div className="text-xs opacity-80">{st}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" />Andamento</h3>
          <div className="space-y-3">
            {sm.map(([m, v]) => (
              <div key={m} className="flex items-center gap-3">
                <div className="text-slate-400 text-xs w-16">{m}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700" style={{ width: `${(v / maxM) * 100}%` }} />
                </div>
                <div className="text-white text-xs w-20 text-right font-medium">{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Agents */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-blue-400" />Top Agenti</h3>
          <div className="space-y-3">
            {sa.length === 0 ? <div className="text-slate-500 text-sm">Nessun dato</div> : sa.map(([a, v], i) => (
              <div key={a} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-600 text-white'}`}>{i + 1}</div>
                <Avatar nome={a} size="sm" />
                <div className="flex-1 min-w-0"><div className="text-white text-sm truncate">{a}</div><ProgressBar value={v} max={maxAgent} color={i === 0 ? 'bg-amber-500' : 'bg-slate-500'} /></div>
                <div className="text-amber-400 text-sm font-medium">{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Zones */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" />Zone più attive</h3>
        <div className="flex flex-wrap gap-2">
          {sz.length === 0 ? <div className="text-slate-500 text-sm">Nessun dato</div> : sz.map(([z, v], i) => (
            <div key={z} className={`px-4 py-2 rounded-xl ${i === 0 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700'}`}>
              <div className="text-white text-sm font-medium">{z}</div>
              <div className={`text-xs ${i === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{fmt(v)} AED</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== VENDITE TAB ====================
function VenditeTab({ sales, loading, filters, setFilters, updateSale, deleteSale, loadSales, exportToCSV, fmt, selectedSales, toggleSelectSale, selectAllSales, deleteSelectedSales }) {
  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={loadSales} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 transition-colors"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 transition-colors"><Download className="w-4 h-4" /></button>
          {selectedSales.length > 0 && <button onClick={deleteSelectedSales} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm transition-colors"><Trash2 className="w-4 h-4" />{selectedSales.length}</button>}
          <div className="flex-1" />
          <div className="relative"><Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cerca..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white text-sm w-32 focus:border-amber-500 transition-colors" /></div>
          <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm">
            <option value="">Tutti</option>
            {pipelineStati.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 text-left">
                <th className="px-2 py-3"><button onClick={selectAllSales}>{selectedSales.length === sales.length && sales.length > 0 ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-400" />}</button></th>
                <th className="text-slate-300 px-2 py-3 text-xs font-medium">Data</th>
                <th className="text-slate-300 px-2 py-3 text-xs font-medium">Progetto</th>
                <th className="text-slate-300 px-2 py-3 text-xs font-medium">Cliente</th>
                <th className="text-slate-300 px-2 py-3 text-xs font-medium">Agente</th>
                <th className="text-slate-300 px-2 py-3 text-right text-xs font-medium">Valore</th>
                <th className="text-slate-300 px-2 py-3 text-center text-xs font-medium">%</th>
                <th className="text-slate-300 px-2 py-3 text-center text-xs font-medium">Stato</th>
                <th className="text-slate-300 px-2 py-3 text-center text-xs font-medium">Ref</th>
                <th className="text-slate-300 px-2 py-3 text-center text-xs font-medium">Pag</th>
                <th className="text-slate-300 px-2 py-3 text-center text-xs font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className={`border-t border-slate-700 hover:bg-slate-700/30 transition-colors ${selectedSales.includes(s.id) ? 'bg-amber-500/10' : ''}`}>
                  <td className="px-2 py-2"><button onClick={() => toggleSelectSale(s.id)}>{selectedSales.includes(s.id) ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-400" />}</button></td>
                  <td className="px-2 py-2 text-white text-xs">{s.data?.substring(5,10)}</td>
                  <td className="px-2 py-2 text-white text-xs truncate max-w-[80px]">{s.progetto}</td>
                  <td className="px-2 py-2 text-blue-400 text-xs truncate max-w-[60px]">{s.cliente_nome || '-'}</td>
                  <td className="px-2 py-2 text-slate-400 text-xs truncate max-w-[60px]">{s.agente || '-'}</td>
                  <td className="px-2 py-2 text-amber-400 text-right text-xs font-medium">{s.valore > 0 ? fmt(s.valore) : '-'}</td>
                  <td className="px-2 py-2 text-center"><select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-slate-700 rounded px-1 py-0.5 text-white text-xs w-12">{commissions.map(c => <option key={c} value={c}>{c}%</option>)}</select></td>
                  <td className="px-2 py-2 text-center"><select value={s.stato || 'lead'} onChange={(e) => updateSale(s.id, { stato: e.target.value })} className={`${pipelineColors[s.stato || 'lead']} rounded px-1 py-0.5 text-white text-xs w-16`}>{pipelineStati.map(st => <option key={st} value={st} className="bg-slate-800">{st}</option>)}</select></td>
                  <td className="px-2 py-2 text-center"><select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className="bg-slate-700 rounded px-1 py-0.5 text-xs w-10 text-white"><option value="">-</option><option value="Pellegrino">P</option><option value="Giovanni">G</option></select></td>
                  <td className="px-2 py-2 text-center"><button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-2 py-1 rounded text-xs transition-colors ${s.pagato ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>{s.pagato ? '✓' : '✗'}</button></td>
                  <td className="px-2 py-2 text-center"><button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ==================== PIPELINE TAB ====================
function PipelineTab({ byStato, fmt, pipelineColors, pipelineLabels }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {pipelineStati.map(st => (
        <div key={st} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className={`${pipelineColors[st]} px-3 py-2 text-white text-sm flex justify-between items-center`}>
            <span className="font-medium">{pipelineLabels[st]}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{byStato[st]?.length || 0}</span>
          </div>
          <div className="p-2 space-y-2 max-h-[50vh] overflow-y-auto">
            {byStato[st]?.map(s => (
              <div key={s.id} className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 transition-colors cursor-pointer">
                <div className="text-white text-sm font-medium truncate">{s.progetto}</div>
                <div className="text-blue-400 text-xs truncate">{s.cliente_nome || '-'}</div>
                {s.valore > 0 && <div className="text-amber-400 text-xs mt-1 font-medium">{fmt(s.valore)} AED</div>}
              </div>
            ))}
            {!byStato[st]?.length && <div className="text-slate-500 text-xs text-center py-4">Nessuno</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== CLIENTI TAB ====================
function ClientiTab({ clienti, loadClienti, createCliente, updateCliente, deleteCliente, showModal, setShowModal, editingCliente, setEditingCliente, selectedClienti, toggleSelectCliente, deleteSelectedClienti, onSelectCliente, filters, setFilters, showFilters, setShowFilters, uniqueAgenti, exportToCSV, sales, fmt }) {
  const activeFilters = [filters.stato, filters.agente, filters.budgetMin, filters.budgetMax].filter(Boolean).length;
  const getClientValue = (id) => sales.filter(s => s.cliente_id === id && (s.stato === 'venduto' || s.stato === 'incassato')).reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const getClientLeads = (id) => sales.filter(s => s.cliente_id === id).length;
  
  return (
    <>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button onClick={() => { setEditingCliente(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg px-4 py-2 flex items-center gap-2 font-semibold transition-colors"><UserPlus className="w-4 h-4" />Nuovo</button>
        <button onClick={loadClienti} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 transition-colors"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 transition-colors"><Download className="w-4 h-4" /></button>
        <button onClick={() => setShowFilters(!showFilters)} className={`rounded-lg px-3 py-2 flex items-center gap-1 text-sm transition-colors ${activeFilters > 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
          <Filter className="w-4 h-4" />{activeFilters > 0 && <span className="bg-slate-900 text-amber-500 px-1.5 rounded text-xs">{activeFilters}</span>}
        </button>
        {selectedClienti.length > 0 && <button onClick={deleteSelectedClienti} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm transition-colors"><Trash2 className="w-4 h-4" />{selectedClienti.length}</button>}
        <div className="flex-1" />
        <div className="text-slate-400 text-sm">{clienti.length} clienti</div>
      </div>
      
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1 relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cerca..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm" /></div>
            <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"><option value="">Tutti stati</option>{clienteStati.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select value={filters.agente} onChange={(e) => setFilters({ ...filters, agente: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"><option value="">Tutti agenti</option>{uniqueAgenti.map(a => <option key={a} value={a}>{a}</option>)}</select>
            <input type="number" placeholder="Budget min" value={filters.budgetMin} onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
            <input type="number" placeholder="Budget max" value={filters.budgetMax} onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          {activeFilters > 0 && <button onClick={() => setFilters({ search: '', stato: '', budgetMin: '', budgetMax: '', agente: '' })} className="mt-3 text-amber-400 text-sm flex items-center gap-1 hover:text-amber-300"><X className="w-4 h-4" /> Rimuovi filtri</button>}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clienti.map(c => {
          const cv = getClientValue(c.id);
          const cs = getClientLeads(c.id);
          return (
            <div key={c.id} onClick={() => onSelectCliente(c)} className={`bg-slate-800 border rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-all active:scale-[0.99] ${selectedClienti.includes(c.id) ? 'border-amber-500' : 'border-slate-700'}`}>
              <div className="flex items-start gap-3">
                <button onClick={(e) => { e.stopPropagation(); toggleSelectCliente(c.id); }}>{selectedClienti.includes(c.id) ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-500" />}</button>
                <Avatar nome={c.nome} cognome={c.cognome} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium truncate">{c.nome} {c.cognome}</span>
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${clienteStatiColors[c.stato] || 'bg-slate-600'}`}>{c.stato}</span>
                  </div>
                  {c.telefono && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-400 text-sm">{c.telefono}</span>
                      <a href={getWhatsAppLink(c.whatsapp || c.telefono)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-400 hover:text-emerald-300"><MessageCircle className="w-4 h-4" /></a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    {c.budget_max && <span className="text-amber-400">{fmt(c.budget_max)} AED</span>}
                    {cs > 0 && <span className="text-blue-400">{cs} lead</span>}
                    {cv > 0 && <span className="text-emerald-400">{fmt(cv)} venduto</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>
      {clienti.length === 0 && <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun cliente</div>}
      {showModal && <ClienteModal cliente={editingCliente} onClose={() => { setShowModal(false); setEditingCliente(null); }} onSave={editingCliente ? (d) => updateCliente(editingCliente.id, d) : createCliente} />}
    </>
  );
}

// ==================== CLIENTE DETAIL ====================
function ClienteDetail({ cliente, sales, tasks, onBack, onEdit, onDelete, updateCliente, fmt, fmtDate, onAddTask, onCompleteTask, onDeleteTask, onExportPDF }) {
  const [tab, setTab] = useState('info');
  const totalValue = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').reduce((sum, s) => sum + Number(s.valore || 0), 0);
  const leadCount = sales.filter(s => s.stato === 'lead' || s.stato === 'trattativa').length;
  const venditeCount = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato').length;
  const pendingTasks = tasks.filter(t => t.stato === 'pending');
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl p-2 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <Avatar nome={cliente.nome} cognome={cliente.cognome} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{cliente.nome} {cliente.cognome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs text-white ${clienteStatiColors[cliente.stato] || 'bg-slate-600'}`}>{cliente.stato}</span>
            {cliente.nazionalita && <span className="text-slate-400 text-sm">{cliente.nazionalita}</span>}
          </div>
        </div>
        <button onClick={onExportPDF} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl p-2 transition-colors" title="PDF"><FileText className="w-5 h-5" /></button>
        <button onClick={onEdit} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl p-2 transition-colors"><Edit2 className="w-5 h-5" /></button>
        <button onClick={onDelete} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl p-2 transition-colors"><Trash2 className="w-5 h-5" /></button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center"><div className="text-slate-400 text-xs">Lead</div><div className="text-xl font-bold text-blue-400">{leadCount}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center"><div className="text-slate-400 text-xs">Vendite</div><div className="text-xl font-bold text-emerald-400">{venditeCount}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center"><div className="text-slate-400 text-xs">Valore</div><div className="text-lg font-bold text-amber-400">{fmt(totalValue)}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center"><div className="text-slate-400 text-xs">Task</div><div className="text-xl font-bold text-purple-400">{pendingTasks.length}</div></div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions phone={cliente.telefono} whatsapp={cliente.whatsapp || cliente.telefono} email={cliente.email} clienteName={cliente.nome} />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{ id: 'info', label: 'Info' }, { id: 'sales', label: `Lead (${sales.length})` }, { id: 'tasks', label: `Task (${tasks.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>{t.label}</button>
        ))}
      </div>
      
      {/* Info Tab */}
      {tab === 'info' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-slate-400 text-xs mb-1">Telefono</div><div className="text-white">{cliente.telefono || '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">WhatsApp</div><div className="text-white">{cliente.whatsapp || cliente.telefono || '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Email</div><div className="text-white truncate">{cliente.email || '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Nazionalità</div><div className="text-white">{cliente.nazionalita || '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Budget Min</div><div className="text-amber-400">{cliente.budget_min ? fmt(cliente.budget_min) : '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Budget Max</div><div className="text-amber-400">{cliente.budget_max ? fmt(cliente.budget_max) : '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Agente</div><div className="text-white">{cliente.agente_riferimento || '-'}</div></div>
            <div><div className="text-slate-400 text-xs mb-1">Fonte</div><div className="text-white">{cliente.fonte || '-'}</div></div>
          </div>
          {cliente.note && <div className="pt-4 border-t border-slate-700"><div className="text-slate-400 text-xs mb-1">Note</div><div className="text-white text-sm whitespace-pre-wrap">{cliente.note}</div></div>}
          <div className="pt-4 border-t border-slate-700">
            <div className="text-slate-400 text-xs mb-2">Cambia stato</div>
            <div className="flex flex-wrap gap-2">
              {clienteStati.map(s => <button key={s} onClick={() => updateCliente(cliente.id, { stato: s })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cliente.stato === s ? `${clienteStatiColors[s]} text-white` : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{s}</button>)}
            </div>
          </div>
        </div>
      )}
      
      {/* Sales Tab */}
      {tab === 'sales' && (
        <div className="space-y-3">
          {sales.length === 0 ? <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun lead</div> : sales.map(s => (
            <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2"><span className="text-white font-medium">{s.progetto}</span><span className={`px-2 py-0.5 rounded text-xs text-white ${pipelineColors[s.stato || 'lead']}`}>{s.stato}</span></div>
                  <div className="text-slate-400 text-sm">{s.developer} • {s.zona}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-semibold">{s.valore > 0 ? fmt(s.valore) : 'TBD'}</div>
                  <div className="text-slate-500 text-xs">{fmtDate(s.data)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-3">
          <button onClick={onAddTask} className="w-full bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-xl py-3 flex items-center justify-center gap-2 text-sm hover:bg-amber-500/30 transition-colors"><Plus className="w-4 h-4" /> Nuovo Task</button>
          {tasks.length === 0 ? <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun task</div> : tasks.map(t => (
            <div key={t.id} className={`bg-slate-800 border rounded-xl p-4 transition-colors ${t.stato === 'completato' ? 'border-slate-700 opacity-60' : isOverdue(t.scadenza) ? 'border-red-500/50' : 'border-slate-700'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</span>
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${taskPrioritaColors[t.priorita]}`}>{t.priorita}</span>
                  </div>
                  {t.scadenza && <div className={`text-xs mt-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-slate-400'}`}><Clock className="w-3 h-3 inline mr-1" />{fmtDateTime(t.scadenza)}</div>}
                  {t.note && <div className="text-blue-400 text-xs mt-1">📝 {t.note}</div>}
                </div>
                <div className="flex gap-1">
                  {t.stato !== 'completato' && <button onClick={() => onCompleteTask(t.id)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg p-2 transition-colors"><Check className="w-4 h-4" /></button>}
                  <button onClick={() => onDeleteTask(t.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN TASKS TAB ====================
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
  const pendingCount = tasks.filter(t => t.stato === 'pending').length;
  const overdueCount = tasks.filter(t => t.stato === 'pending' && isOverdue(t.scadenza)).length;
  const todayCount = tasks.filter(t => t.stato === 'pending' && isToday(t.scadenza)).length;
  
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button onClick={onCreate} className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg px-4 py-2 flex items-center gap-2 font-semibold transition-colors"><Plus className="w-4 h-4" />Nuovo</button>
        <div className="flex-1" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Pending ({pendingCount})</button>
          <button onClick={() => setFilter('overdue')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Scaduti ({overdueCount})</button>
          <button onClick={() => setFilter('today')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'today' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Oggi ({todayCount})</button>
          <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Fatto</button>
        </div>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun task</div> : filtered.map(t => {
          const cliente = getCliente(t.cliente_id);
          return (
            <div key={t.id} className={`bg-slate-800 border rounded-xl p-4 transition-colors ${t.stato === 'completato' ? 'border-slate-700 opacity-60' : isOverdue(t.scadenza) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</span>
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${taskPrioritaColors[t.priorita]}`}>{t.priorita}</span>
                    {isOverdue(t.scadenza) && t.stato !== 'completato' && <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white animate-pulse">SCADUTO</span>}
                  </div>
                  {t.descrizione && <div className="text-slate-400 text-sm mt-1">{t.descrizione}</div>}
                  {t.note && <div className="text-blue-400 text-sm mt-1 bg-blue-500/10 px-2 py-1 rounded">📝 {t.note}</div>}
                  <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                    {t.scadenza && <span className={`flex items-center gap-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-slate-400'}`}><Clock className="w-3 h-3" />{fmtDateTime(t.scadenza)}</span>}
                    {t.assegnato_a && <span className="text-blue-400 flex items-center gap-1"><User className="w-3 h-3" />{t.assegnato_a}</span>}
                    {cliente && <span className="text-purple-400">{cliente.nome}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {t.stato !== 'completato' && (
                    <>
                      <button onClick={() => onEdit(t)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg p-2 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onComplete(t.id)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg p-2 transition-colors"><Check className="w-4 h-4" /></button>
                    </>
                  )}
                  <button onClick={() => onDelete(t.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== AGENT TASKS TAB ====================
function AgentTasksTab({ tasks, allTasks, clienti, onComplete, onAddNote }) {
  const [filter, setFilter] = useState('pending');
  const completedTasks = allTasks.filter(t => t.stato === 'completato');
  const displayTasks = filter === 'completed' ? completedTasks : tasks.filter(t => {
    if (filter === 'pending') return true;
    if (filter === 'overdue') return isOverdue(t.scadenza);
    return true;
  });
  const getCliente = (id) => clienti.find(c => c.id === id);
  const overdueCount = tasks.filter(t => isOverdue(t.scadenza)).length;
  
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="flex-1"><span className="text-white font-semibold text-lg">I tuoi Task</span></div>
        <div className="flex gap-1">
          <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Pending ({tasks.length})</button>
          <button onClick={() => setFilter('overdue')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'overdue' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Scaduti ({overdueCount})</button>
          <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Fatto ({completedTasks.length})</button>
        </div>
      </div>
      <div className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <Check className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
            <div className="text-slate-400">Nessun task {filter === 'pending' ? 'da completare' : filter === 'overdue' ? 'scaduto' : 'completato'}</div>
          </div>
        ) : displayTasks.map(t => {
          const cliente = getCliente(t.cliente_id);
          return (
            <div key={t.id} className={`bg-slate-800 border rounded-xl p-4 transition-all ${t.stato === 'completato' ? 'border-slate-700 opacity-60' : isOverdue(t.scadenza) ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-white font-medium ${t.stato === 'completato' ? 'line-through' : ''}`}>{t.titolo}</span>
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${taskPrioritaColors[t.priorita]}`}>{t.priorita}</span>
                    {isOverdue(t.scadenza) && t.stato !== 'completato' && <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white animate-pulse">SCADUTO</span>}
                  </div>
                  {t.descrizione && <div className="text-slate-400 text-sm mt-1">{t.descrizione}</div>}
                  {t.note && <div className="text-blue-400 text-sm mt-2 bg-blue-500/10 px-3 py-2 rounded-lg">📝 {t.note}</div>}
                  <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                    {t.scadenza && <span className={`flex items-center gap-1 ${isOverdue(t.scadenza) && t.stato !== 'completato' ? 'text-red-400' : 'text-slate-400'}`}><Clock className="w-3 h-3" />{fmtDateTime(t.scadenza)}</span>}
                    {cliente && <span className="text-purple-400 flex items-center gap-1"><User className="w-3 h-3" />{cliente.nome}</span>}
                  </div>
                </div>
                {t.stato !== 'completato' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onAddNote(t)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg p-3 transition-colors" title="Aggiungi nota"><MessageCircle className="w-5 h-5" /></button>
                    <button onClick={() => onComplete(t.id)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg p-3 transition-colors" title="Completa"><Check className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== TASK MODAL ====================
function TaskModal({ task, clienti, users, onClose, onSave, currentUser }) {
  const [f, setF] = useState(task || { titolo: '', descrizione: '', scadenza: '', priorita: 'normale', cliente_id: '', assegnato_a: '' });
  const save = async () => { if (!f.titolo) { alert('Titolo obbligatorio'); return; } await onSave({ ...f, cliente_id: f.cliente_id || null, scadenza: f.scadenza || null }); };
  const inp = "w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 transition-colors";
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">{task?.id ? 'Modifica' : 'Nuovo'} Task</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Titolo *" value={f.titolo} onChange={(e) => setF({ ...f, titolo: e.target.value })} className={inp} autoFocus />
          <textarea placeholder="Descrizione" value={f.descrizione || ''} onChange={(e) => setF({ ...f, descrizione: e.target.value })} className={`${inp} h-20`} />
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Scadenza</label>
            <input type="datetime-local" value={f.scadenza ? f.scadenza.slice(0, 16) : ''} onChange={(e) => setF({ ...f, scadenza: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block">Priorità</label>
            <div className="flex gap-2">
              {taskPriorita.map(p => <button key={p} type="button" onClick={() => setF({ ...f, priorita: p })} className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${f.priorita === p ? `${taskPrioritaColors[p]} text-white` : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{p}</button>)}
            </div>
          </div>
          <select value={f.cliente_id || ''} onChange={(e) => setF({ ...f, cliente_id: e.target.value })} className={inp}>
            <option value="">Nessun cliente</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
          </select>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Assegna a (riceverà email)</label>
            <select value={f.assegnato_a || ''} onChange={(e) => setF({ ...f, assegnato_a: e.target.value })} className={inp}>
              <option value="">Non assegnato</option>
              {users.filter(u => u.ruolo !== 'admin').map(u => <option key={u.id} value={u.nome}>{u.nome} ({u.ruolo})</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Annulla</button>
          <button onClick={save} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl py-3 font-semibold transition-colors">Salva</button>
        </div>
      </div>
    </div>
  );
}

// ==================== CLIENTE MODAL ====================
function ClienteModal({ cliente, onClose, onSave }) {
  const [f, setF] = useState(cliente || { nome: '', cognome: '', email: '', telefono: '', whatsapp: '', nazionalita: '', budget_min: '', budget_max: '', stato: 'nuovo', fonte: '', note: '' });
  const save = async () => { if (!f.nome) { alert('Nome obbligatorio'); return; } await onSave(f); };
  const inp = "w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 transition-colors";
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">{cliente ? 'Modifica' : 'Nuovo'} Cliente</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inp} />
            <input type="text" placeholder="Cognome" value={f.cognome || ''} onChange={(e) => setF({ ...f, cognome: e.target.value })} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="tel" placeholder="Telefono" value={f.telefono || ''} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={inp} />
            <input type="tel" placeholder="WhatsApp" value={f.whatsapp || ''} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} className={inp} />
          </div>
          <input type="email" placeholder="Email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
          <input type="text" placeholder="Nazionalità" value={f.nazionalita || ''} onChange={(e) => setF({ ...f, nazionalita: e.target.value })} className={inp} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Budget Min" value={f.budget_min || ''} onChange={(e) => setF({ ...f, budget_min: e.target.value })} className={inp} />
            <input type="number" placeholder="Budget Max" value={f.budget_max || ''} onChange={(e) => setF({ ...f, budget_max: e.target.value })} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={f.stato || 'nuovo'} onChange={(e) => setF({ ...f, stato: e.target.value })} className={inp}>{clienteStati.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <input type="text" placeholder="Fonte" value={f.fonte || ''} onChange={(e) => setF({ ...f, fonte: e.target.value })} className={inp} />
          </div>
          <textarea placeholder="Note" value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} className={`${inp} h-20`} />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Annulla</button>
          <button onClick={save} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl py-3 font-semibold transition-colors">Salva</button>
        </div>
      </div>
    </div>
  );
}

// ==================== USER MANAGEMENT ====================
function UserManagement({ users, loadUsers, createUser, updateUser, deleteUser, showUserModal, setShowUserModal, editingUser, setEditingUser, selectedUsers, toggleSelectUser, deleteSelectedUsers }) {
  const [copiedId, setCopiedId] = useState(null);
  const copy = (u) => { navigator.clipboard.writeText(`KeyPrime\n${getBaseUrl()}\n${u.username} / ${u.password}`); setCopiedId(u.id); setTimeout(() => setCopiedId(null), 2000); };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Gestione Utenti</h2>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && <button onClick={deleteSelectedUsers} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm transition-colors"><Trash2 className="w-4 h-4" />{selectedUsers.length}</button>}
          <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg px-4 py-2 flex items-center gap-2 font-semibold transition-colors"><UserPlus className="w-4 h-4" />Nuovo</button>
        </div>
      </div>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className={`bg-slate-800 border rounded-xl p-4 transition-all ${selectedUsers.includes(u.id) ? 'border-amber-500' : 'border-slate-700 hover:border-slate-600'}`}>
            <div className="flex items-center gap-4">
              <button onClick={() => toggleSelectUser(u.id)}>{selectedUsers.includes(u.id) ? <CheckSquare className="w-5 h-5 text-amber-400" /> : <Square className="w-5 h-5 text-slate-500" />}</button>
              <Avatar nome={u.nome} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{u.nome}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${u.ruolo === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.ruolo === 'agente' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.ruolo}</span>
                  {!u.attivo && <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Disattivo</span>}
                </div>
                <div className="text-slate-400 text-sm mt-1">{u.username} / {u.password}{u.email && ` • ${u.email}`}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(u)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-2 transition-colors">{copiedId === u.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg p-2 transition-colors"><Edit2 className="w-4 h-4" /></button>
                {u.ruolo !== 'admin' && <button onClick={() => deleteUser(u.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showUserModal && <UserModal user={editingUser} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={editingUser ? (d) => updateUser(editingUser.id, d) : createUser} />}
    </div>
  );
}

// ==================== USER MODAL ====================
function UserModal({ user, onClose, onSave }) {
  const [f, setF] = useState(user || { nome: '', username: '', password: '', email: '', ruolo: 'agente', referente: 'Pellegrino', attivo: true });
  const save = async () => { if (!f.nome || !f.username || !f.password) { alert('Compila i campi obbligatori'); return; } const ok = await onSave(f); if (ok) onClose(); };
  const inp = "w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 transition-colors";
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{user ? 'Modifica' : 'Nuovo'} Utente</h3>
        <div className="space-y-3">
          <input type="text" placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inp} />
          <input type="email" placeholder="Email (per notifiche)" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Username *" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} className={inp} />
            <input type="text" placeholder="Password *" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={f.ruolo} onChange={(e) => setF({ ...f, ruolo: e.target.value })} className={inp}><option value="agente">Agente</option><option value="segnalatore">Segnalatore</option></select>
            <select value={f.referente} onChange={(e) => setF({ ...f, referente: e.target.value })} className={inp}><option value="Pellegrino">Pellegrino</option><option value="Giovanni">Giovanni</option></select>
          </div>
          {user && (
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-xl p-3">
              <input type="checkbox" id="att" checked={f.attivo} onChange={(e) => setF({ ...f, attivo: e.target.checked })} className="w-4 h-4 rounded" />
              <label htmlFor="att" className="text-slate-300 text-sm">Utente attivo</label>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Annulla</button>
          <button onClick={save} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl py-3 font-semibold transition-colors">Salva</button>
        </div>
      </div>
    </div>
  );
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-slideUp { animation: slideUp 0.3s ease-out; }
  .animate-slideDown { animation: slideDown 0.2s ease-out; }
  .animate-slideRight { animation: slideRight 0.3s ease-out; }
  .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
