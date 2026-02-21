import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus, Search, Phone, Mail, X, Edit2, TrendingUp, DollarSign, Target, UserCheck, Menu, Key, CheckSquare, Square, Bell, MapPin, Award } from 'lucide-react';

const supabase = createClient(
  'https://wqtylxrrerhbxagdzftn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ'
);

const RESEND_API_KEY = 're_jCpLJKfw_MfWu2jbSzPPgz6pLHQXMAXJb';
const EMAIL_FROM = 'onboarding@resend.dev';
const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];
const pipelineStati = ['lead', 'trattativa', 'prenotato', 'venduto', 'incassato'];
const pipelineColors = { lead: 'bg-slate-500', trattativa: 'bg-blue-500', prenotato: 'bg-amber-500', venduto: 'bg-emerald-500', incassato: 'bg-green-600' };
const pipelineLabels = { lead: '🎯 Lead', trattativa: '💬 Trattativa', prenotato: '📝 Prenotato', venduto: '✅ Venduto', incassato: '💰 Incassato' };
const clienteStati = ['nuovo', 'contattato', 'interessato', 'trattativa', 'acquistato', 'perso'];
const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';
const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const sendEmail = async (to, subject, html) => {
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }) });
    return await r.json();
  } catch (e) { return null; }
};

const Logo = ({ size = 'large' }) => <img src="/logo.png" alt="KeyPrime" className={size === 'large' ? 'h-16 md:h-24' : 'h-12 md:h-16'} style={{ objectFit: 'contain' }} />;

const InstallPrompt = ({ onClose }) => {
  const [dp, setDp] = useState(null);
  useEffect(() => { const h = (e) => { e.preventDefault(); setDp(e); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h); }, []);
  const install = async () => { if (dp) { dp.prompt(); await dp.userChoice; setDp(null); onClose(); } };
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!dp && isIOS) return <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-50 safe-area-bottom"><div className="flex items-start gap-3"><div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"><img src="/icon-192.png" alt="" className="w-8 h-8 rounded" /></div><div className="flex-1"><div className="text-white font-medium">Installa KeyPrime</div><div className="text-slate-400 text-sm">Condividi → Aggiungi a Home</div></div><button onClick={onClose} className="text-slate-400"><X className="w-5 h-5" /></button></div></div>;
  if (!dp) return null;
  return <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-50 safe-area-bottom"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"><img src="/icon-192.png" alt="" className="w-8 h-8 rounded" /></div><div className="flex-1"><div className="text-white font-medium">Installa KeyPrime</div></div><button onClick={install} className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-medium">Installa</button><button onClick={onClose} className="text-slate-400"><X className="w-5 h-5" /></button></div></div>;
};

const MobileMenu = ({ isOpen, onClose, tabs, activeTab, setActiveTab, user, onLogout }) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/70" onClick={onClose} /><div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-800 border-r border-slate-700 p-4 flex flex-col"><div className="flex items-center justify-between mb-6"><Logo size="small" /><button onClick={onClose} className="text-slate-400"><X className="w-6 h-6" /></button></div><div className="space-y-2 flex-1">{tabs.map(t => <button key={t.id} onClick={() => { setActiveTab(t.id); onClose(); }} className={`w-full text-left px-4 py-3 rounded-xl font-medium ${activeTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>{t.icon} {t.label}</button>)}</div><div className="border-t border-slate-700 pt-4"><div className="bg-slate-700/50 rounded-xl p-4 mb-4"><div className="text-slate-400 text-sm">{user?.ruolo}</div><div className="text-white font-medium">{user?.nome}</div></div><button onClick={onLogout} className="w-full bg-red-500/20 text-red-400 rounded-xl py-3 flex items-center justify-center gap-2"><LogOut className="w-5 h-5" /> Esci</button></div></div></div>;
};

const SelectWithOther = ({ value, onChange, options, placeholder, className }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [cv, setCv] = useState('');
  useEffect(() => { if (value && !options.includes(value) && value !== 'Altro') { setShowCustom(true); setCv(value); } }, [value, options]);
  return <div className="space-y-2"><select value={showCustom ? 'Altro' : value} onChange={(e) => { if (e.target.value === 'Altro') { setShowCustom(true); setCv(''); onChange(''); } else { setShowCustom(false); onChange(e.target.value); }}} className={className}><option value="">{placeholder || 'Seleziona'}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>{showCustom && <input type="text" value={cv} onChange={(e) => { setCv(e.target.value); onChange(e.target.value); }} placeholder="Specifica..." className={className} autoFocus />}</div>;
};

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [filters, setFilters] = useState({ search: '', stato: '', agente: '', pagato: '' });
  const [convertingSale, setConvertingSale] = useState(null);
  const [agentTab, setAgentTab] = useState('lista');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedClienti, setSelectedClienti] = useState([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const role = p.get('role'), username = p.get('user');
    if (role && username) verifyDirectAccess(username, role);
    else { const s = localStorage.getItem('keyprime_user'); if (s) { const u = JSON.parse(s); setUser(u); setView(u.ruolo === 'admin' ? 'admin' : u.ruolo); }}
    if (localStorage.getItem('pwa_prompt_dismissed')) setShowInstallPrompt(false);
  }, []);

  const dismissInstallPrompt = () => { setShowInstallPrompt(false); localStorage.setItem('pwa_prompt_dismissed', 'true'); };
  const verifyDirectAccess = async (username, role) => { const { data } = await supabase.from('user_credentials').select('*').eq('username', username).eq('ruolo', role).eq('attivo', true).single(); if (data) { setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data)); setView(role === 'admin' ? 'admin' : role); }};
  const loadSales = async () => { setLoading(true); const { data } = await supabase.from('sales_with_commissions').select('*').order('created_at', { ascending: false }); setSales(data || []); setLoading(false); };
  const loadUsers = async () => { const { data } = await supabase.from('user_credentials').select('*').order('created_at', { ascending: false }); setUsers(data || []); };
  const loadClienti = async () => { const { data } = await supabase.from('clienti').select('*').order('created_at', { ascending: false }); setClienti(data || []); };
  const loadNotifications = async () => { const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50); setNotifications((data || []).map(s => ({ id: s.id, type: s.stato === 'venduto' ? 'vendita' : 'lead', message: `${s.inserted_by} ha aggiunto: ${s.progetto || 'Nuovo'}`, time: s.created_at, read: false }))); };
  
  useEffect(() => { if (user) { loadSales(); if (user.ruolo === 'admin') { loadUsers(); loadClienti(); loadNotifications(); }}}, [user]);
  
  useEffect(() => {
    if (user?.ruolo !== 'admin') return;
    const ch = supabase.channel('sales_changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, (p) => {
      const s = p.new;
      setNotifications(pr => [{ id: s.id, type: s.stato === 'venduto' ? 'vendita' : 'lead', message: `${s.inserted_by} ha aggiunto: ${s.progetto || 'Nuovo'}`, time: new Date().toISOString(), read: false }, ...pr.slice(0, 49)]);
      loadSales();
    }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

  const handleLogin = async (username, password) => { setLoading(true); setError(null); const { data, error: e } = await supabase.from('user_credentials').select('*').eq('username', username).eq('password', password).eq('attivo', true).single(); if (e || !data) { setError('Credenziali non valide'); setLoading(false); return; } setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data)); setView(data.ruolo === 'admin' ? 'admin' : data.ruolo); setLoading(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('keyprime_user'); setView('login'); setMobileMenuOpen(false); };
  const changePassword = async (np) => { const { error: e } = await supabase.from('user_credentials').update({ password: np }).eq('id', user.id); if (e) { setError(e.message); return false; } const u = { ...user, password: np }; setUser(u); localStorage.setItem('keyprime_user', JSON.stringify(u)); setShowPasswordModal(false); setSaveStatus('Password aggiornata!'); setTimeout(() => setSaveStatus(''), 2000); return true; };

  const addLead = async (ld) => {
    setSaveStatus('Salvataggio...');
    let cliente_id = null;
    if (ld.cliente_nome) { const { data: cd } = await supabase.from('clienti').insert([{ nome: ld.cliente_nome, cognome: ld.cliente_cognome, email: ld.cliente_email, telefono: ld.cliente_telefono, whatsapp: ld.cliente_whatsapp, nazionalita: ld.cliente_nazionalita, budget_min: ld.cliente_budget_min ? parseFloat(ld.cliente_budget_min) : null, budget_max: ld.cliente_budget_max ? parseFloat(ld.cliente_budget_max) : null, note: ld.cliente_note, stato: 'nuovo', fonte: 'Agente', agente_riferimento: user?.nome, created_by: user?.nome, referente: user?.referente }]).select().single(); if (cd) cliente_id = cd.id; }
    const { error: e } = await supabase.from('sales').insert([{ data: ld.data, developer: ld.developer, progetto: ld.progetto, zona: ld.zona, valore: ld.valore || 0, agente: ld.agente, segnalatore: ld.segnalatore, referente: user?.referente, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: ld.stato || 'lead', cliente_id }]);
    if (e) { setSaveStatus('Errore!'); setError(e.message); } else { setSaveStatus('Lead salvato!'); setShowForm(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }
  };

  const addSale = async (sd) => { setSaveStatus('Salvataggio...'); const { error: e } = await supabase.from('sales').insert([{ ...sd, referente: user?.referente, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false, stato: 'venduto' }]); if (e) { setSaveStatus('Errore!'); setError(e.message); } else { setSaveStatus('Vendita registrata!'); setShowForm(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }};
  const convertLeadToSale = async (id, v) => { setSaveStatus('Conversione...'); await supabase.from('sales').update({ stato: 'venduto', valore: v }).eq('id', id); setSaveStatus('Convertito!'); setConvertingSale(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); };
  const updateSale = async (id, u) => { const s = sales.find(x => x.id === id); if (u.pagato === true && !s?.pagato) { const tn = s.agente || s.segnalatore; if (tn) { const { data: tu } = await supabase.from('user_credentials').select('*').eq('nome', tn).single(); if (tu?.email) { const ca = Number(s.valore) * (s.commission_pct || 5) / 100 * (s.agente ? 0.7 : 0.3); await sendEmail(tu.email, '💰 Commissione Pagata', `<h2>Commissione Pagata!</h2><p>${s.progetto}: ${fmt(ca)} AED</p>`); }}} await supabase.from('sales').update(u).eq('id', id); loadSales(); };
  const deleteSale = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('sales').delete().eq('id', id); loadSales(); };
  const deleteSelectedSales = async () => { if (!selectedSales.length || !window.confirm(`Eliminare ${selectedSales.length} elementi?`)) return; for (const id of selectedSales) await supabase.from('sales').delete().eq('id', id); setSelectedSales([]); loadSales(); setSaveStatus(`Eliminati`); setTimeout(() => setSaveStatus(''), 2000); };
  const toggleSelectSale = (id) => setSelectedSales(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selectAllSales = () => setSelectedSales(selectedSales.length === filteredSales.length ? [] : filteredSales.map(s => s.id));
  const createUser = async (d) => { const { error: e } = await supabase.from('user_credentials').insert([d]); if (e) { setError(e.message); return false; } loadUsers(); setShowUserModal(false); return true; };
  const updateUser = async (id, d) => { const { error: e } = await supabase.from('user_credentials').update(d).eq('id', id); if (e) { setError(e.message); return false; } loadUsers(); setShowUserModal(false); setEditingUser(null); return true; };
  const deleteUser = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('user_credentials').delete().eq('id', id); loadUsers(); };
  const deleteSelectedUsers = async () => { if (!selectedUsers.length || !window.confirm(`Eliminare ${selectedUsers.length}?`)) return; for (const id of selectedUsers) await supabase.from('user_credentials').delete().eq('id', id); setSelectedUsers([]); loadUsers(); };
  const toggleSelectUser = (id) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const createCliente = async (d) => { const { error: e } = await supabase.from('clienti').insert([{ ...d, created_by: user?.nome, referente: user?.referente }]); if (e) { setError(e.message); return false; } loadClienti(); setShowClienteModal(false); return true; };
  const updateCliente = async (id, d) => { const { error: e } = await supabase.from('clienti').update(d).eq('id', id); if (e) { setError(e.message); return false; } loadClienti(); setShowClienteModal(false); return true; };
  const deleteCliente = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('clienti').delete().eq('id', id); loadClienti(); };
  const deleteSelectedClienti = async () => { if (!selectedClienti.length || !window.confirm(`Eliminare ${selectedClienti.length}?`)) return; for (const id of selectedClienti) await supabase.from('clienti').delete().eq('id', id); setSelectedClienti([]); loadClienti(); };
  const toggleSelectCliente = (id) => setSelectedClienti(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const exportToCSV = () => { let csv = '\ufeffData,Progetto,Agente,Valore,Stato\n'; filteredSales.forEach(s => csv += `${s.data},"${s.progetto}","${s.agente||''}",${s.valore},${s.stato}\n`); const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); l.download = `KeyPrime_${new Date().toISOString().split('T')[0]}.csv`; l.click(); };
  const filteredSales = sales.filter(s => { if (filters.search && !`${s.progetto} ${s.developer} ${s.agente}`.toLowerCase().includes(filters.search.toLowerCase())) return false; if (filters.stato && s.stato !== filters.stato) return false; if (filters.pagato === 'si' && !s.pagato) return false; if (filters.pagato === 'no' && s.pagato) return false; return true; });
  const ErrorBanner = () => error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto">✕</button></div>;

  // LOGIN
  if (view === 'login') return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><Logo size="large" /></div>
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <LoginForm onLogin={handleLogin} loading={loading} />
        </div>
      </div>
    </div>
  );

  // AGENTE/SEGNALATORE
  if (view === 'agente' || view === 'segnalatore') {
    const type = view;
    const mySales = sales.filter(s => type === 'agente' ? s.agente === user?.nome : s.segnalatore === user?.nome);
    const rate = type === 'agente' ? 0.7 : 0.3;
    const myVendite = mySales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totalComm = myVendite.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const pagate = myVendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const byStato = pipelineStati.reduce((acc, st) => { acc[st] = mySales.filter(s => (s.stato || 'lead') === st); return acc; }, {});
    const agentTabs = [{ id: 'lista', icon: '📋', label: 'Lista' }, { id: 'pipeline', icon: '🎯', label: 'Pipeline' }, { id: 'settings', icon: '⚙️', label: 'Impostazioni' }];

    // FORM MODE - CLEAN
    if (showForm) return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={() => setShowForm(null)} className="text-slate-400 flex items-center gap-2"><X className="w-5 h-5" /><span className="text-sm">Annulla</span></button>
            <span className="text-white font-medium">{showForm === 'lead' ? 'Nuovo Lead' : 'Nuova Vendita'}</span>
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 pb-24 max-w-lg mx-auto">
          {saveStatus && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl px-4 py-2 mb-4 text-center text-sm">{saveStatus}</div>}
          {showForm === 'lead' && <LeadFormClean type={type} userName={user?.nome} onSubmit={addLead} />}
          {showForm === 'vendita' && <SaleFormClean type={type} userName={user?.nome} onSubmit={addSale} />}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-700 safe-area-bottom">
          <button onClick={() => document.getElementById('submitBtn')?.click()} className={`w-full ${showForm === 'lead' ? 'bg-blue-500' : 'bg-emerald-500'} text-white rounded-xl py-4 font-semibold text-lg`}>
            {showForm === 'lead' ? '💾 Salva Lead' : '💰 Registra Vendita'}
          </button>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700 safe-area-top">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3"><button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-400"><Menu className="w-6 h-6" /></button><Logo size="small" /></div>
            <div className="hidden md:flex items-center gap-4"><div className="text-right"><div className="text-slate-400 text-xs">{type}</div><div className="text-white text-sm">{user?.nome}</div></div><button onClick={() => setShowPasswordModal(true)} className="text-slate-400"><Key className="w-5 h-5" /></button><button onClick={handleLogout} className="text-slate-400"><LogOut className="w-5 h-5" /></button></div>
            <button onClick={() => setShowPasswordModal(true)} className="md:hidden text-slate-400"><Key className="w-5 h-5" /></button>
          </div>
        </div>
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} tabs={agentTabs} activeTab={agentTab} setActiveTab={setAgentTab} user={user} onLogout={handleLogout} />
        <div className="p-4 max-w-4xl mx-auto">
          <ErrorBanner />
          {saveStatus && <div className="bg-emerald-500/20 text-emerald-300 rounded-xl px-4 py-2 mb-4 text-center text-sm">{saveStatus}</div>}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Lead</div><div className="text-xl font-bold text-white">{mySales.length}</div></div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Vendite</div><div className="text-xl font-bold text-emerald-400">{myVendite.length}</div></div>
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-2 text-center"><div className="text-emerald-300 text-xs">Pagate</div><div className="text-sm font-bold text-emerald-400">{fmt(pagate)}</div></div>
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-2 text-center"><div className="text-red-300 text-xs">Pending</div><div className="text-sm font-bold text-red-400">{fmt(totalComm - pagate)}</div></div>
          </div>
          {!convertingSale && agentTab !== 'settings' && <div className="grid grid-cols-2 gap-3 mb-4"><button onClick={() => setShowForm('lead')} className="bg-blue-500 text-white rounded-xl p-3 flex items-center justify-center gap-2 font-semibold text-sm"><Target className="w-4 h-4" /> Nuovo Lead</button><button onClick={() => setShowForm('vendita')} className="bg-emerald-500 text-white rounded-xl p-3 flex items-center justify-center gap-2 font-semibold text-sm"><DollarSign className="w-4 h-4" /> Vendita</button></div>}
          {convertingSale && <ConvertModal sale={convertingSale} onConvert={convertLeadToSale} onCancel={() => setConvertingSale(null)} />}
          <div className="hidden md:flex gap-2 mb-4">{agentTabs.map(t => <button key={t.id} onClick={() => setAgentTab(t.id)} className={`px-4 py-2 rounded-xl font-medium text-sm ${agentTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>{t.icon} {t.label}</button>)}<div className="flex-1" /><button onClick={loadSales} className="bg-slate-700 text-white rounded-xl px-3 py-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
          {agentTab === 'lista' && (mySales.length === 0 ? <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun lead</div> : <div className="space-y-3">{mySales.map(s => { const mc = (s.stato === 'venduto' || s.stato === 'incassato') ? Number(s.valore) * (s.commission_pct || 5) / 100 * rate : 0; const cv = ['prenotato', 'trattativa'].includes(s.stato) || (s.stato === 'venduto' && !s.valore); return <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="flex justify-between items-start mb-2"><div><div className="flex items-center gap-2"><span className="text-white font-medium text-sm">{s.progetto || 'TBD'}</span><span className={`px-2 py-0.5 rounded text-xs text-white ${pipelineColors[s.stato || 'lead']}`}>{s.stato}</span></div><div className="text-slate-400 text-xs">{s.developer} • {s.zona}</div>{s.cliente_nome && <div className="text-blue-400 text-xs">👤 {s.cliente_nome}</div>}</div><div className="text-right">{s.valore > 0 ? <div className="text-amber-400 font-semibold text-sm">{fmt(s.valore)}</div> : <div className="text-slate-500 text-xs">TBD</div>}</div></div><div className="flex items-center gap-1 py-2 border-t border-slate-700 overflow-x-auto">{pipelineStati.slice(0, -1).map(st => <button key={st} onClick={() => updateSale(s.id, { stato: st })} className={`px-2 py-1 rounded text-xs ${s.stato === st ? `${pipelineColors[st]} text-white` : 'bg-slate-700 text-slate-400'}`}>{st}</button>)}</div><div className="flex justify-between items-center">{mc > 0 ? <div className="text-xs"><span className="text-slate-400">Comm: </span><span className="text-amber-300">{fmt(mc)}</span><span className={`ml-1 px-1.5 py-0.5 rounded ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.pagato ? '✓' : '⏳'}</span></div> : <span className="text-slate-500 text-xs">-</span>}{cv && <button onClick={() => setConvertingSale(s)} className="bg-emerald-500 text-white px-2 py-1 rounded text-xs">💰</button>}</div></div>; })}</div>)}
          {agentTab === 'pipeline' && <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{pipelineStati.slice(0, -1).map(st => <div key={st} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"><div className={`${pipelineColors[st]} px-2 py-1.5 text-white text-xs flex justify-between`}><span>{st}</span><span className="bg-white/20 px-1.5 rounded">{byStato[st]?.length || 0}</span></div><div className="p-2 space-y-2 max-h-[40vh] overflow-y-auto">{byStato[st]?.map(s => <div key={s.id} className="bg-slate-700/50 rounded-lg p-2"><div className="text-white text-xs truncate">{s.progetto || 'TBD'}</div>{s.cliente_nome && <div className="text-blue-400 text-xs truncate">👤 {s.cliente_nome}</div>}{s.valore > 0 && <div className="text-amber-400 text-xs">{fmt(s.valore)}</div>}</div>)}{(!byStato[st] || !byStato[st].length) && <div className="text-slate-500 text-xs text-center py-3">-</div>}</div></div>)}</div>}
          {agentTab === 'settings' && <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h3 className="text-white font-semibold mb-4">Impostazioni</h3><div className="flex justify-between items-center py-3"><div className="text-white text-sm">Password</div><button onClick={() => setShowPasswordModal(true)} className="bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium">Cambia</button></div></div>}
        </div>
        {showInstallPrompt && <InstallPrompt onClose={dismissInstallPrompt} />}
        {showPasswordModal && <PasswordModal currentPassword={user?.password} onSave={changePassword} onClose={() => setShowPasswordModal(false)} />}
      </div>
    );
  }

  // ADMIN
  if (view === 'admin') {
    const vendite = sales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totals = sales.reduce((a, s) => { const c = Number(s.valore) * (s.commission_pct || 5) / 100; const ag = s.agente ? c * 0.7 : 0; const sg = s.segnalatore ? c * 0.3 : 0; const n = c - ag - sg; const p = s.referente === 'Pellegrino' ? n * 0.7 : (s.referente === 'Giovanni' ? n * 0.3 : 0); const g = s.referente === 'Giovanni' ? n * 0.7 : (s.referente === 'Pellegrino' ? n * 0.3 : 0); return { valore: a.valore + Number(s.valore), comm: a.comm + c, ag: a.ag + ag, sg: a.sg + sg, netto: a.netto + n, pell: a.pell + p, giov: a.giov + g }; }, { valore: 0, comm: 0, ag: 0, sg: 0, netto: 0, pell: 0, giov: 0 });
    const byStato = pipelineStati.reduce((a, st) => { a[st] = sales.filter(s => (s.stato || 'lead') === st); return a; }, {});
    const byMonth = sales.reduce((a, s) => { const m = s.data?.substring(0, 7) || 'N/A'; a[m] = (a[m] || 0) + Number(s.valore); return a; }, {});
    const byAgente = sales.reduce((a, s) => { if (s.agente) a[s.agente] = (a[s.agente] || 0) + Number(s.valore); return a; }, {});
    const byZona = sales.reduce((a, s) => { if (s.zona) a[s.zona] = (a[s.zona] || 0) + Number(s.valore); return a; }, {});
    const unreadNotifs = notifications.filter(n => !n.read).length;
    const adminTabs = [{ id: 'dashboard', icon: '📊', label: 'Dashboard' }, { id: 'vendite', icon: '💰', label: 'Vendite' }, { id: 'pipeline', icon: '🎯', label: 'Pipeline' }, { id: 'clienti', icon: '👥', label: 'CRM' }, { id: 'notifiche', icon: '🔔', label: `Notifiche${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}` }, { id: 'utenti', icon: '⚙️', label: 'Utenti' }];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700 safe-area-top">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3"><button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-400"><Menu className="w-6 h-6" /></button><Logo size="small" /></div>
            <div className="hidden md:flex items-center gap-4"><button onClick={() => setAdminTab('notifiche')} className="relative text-slate-400"><Bell className="w-5 h-5" />{unreadNotifs > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unreadNotifs}</span>}</button><div className="text-right"><div className="text-slate-400 text-xs">Admin</div><div className="text-white text-sm">{user?.nome}</div></div><button onClick={handleLogout} className="text-slate-400"><LogOut className="w-5 h-5" /></button></div>
            <button onClick={() => setAdminTab('notifiche')} className="md:hidden relative text-slate-400"><Bell className="w-5 h-5" />{unreadNotifs > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unreadNotifs}</span>}</button>
          </div>
        </div>
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} tabs={adminTabs} activeTab={adminTab} setActiveTab={setAdminTab} user={user} onLogout={handleLogout} />
        <div className="p-4 max-w-7xl mx-auto">
          <ErrorBanner />
          {saveStatus && <div className="bg-emerald-500/20 text-emerald-300 rounded-xl px-4 py-2 mb-4 text-center text-sm">{saveStatus}</div>}
          <div className="hidden md:flex gap-2 mb-4 overflow-x-auto pb-2">{adminTabs.map(t => <button key={t.id} onClick={() => setAdminTab(t.id)} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap text-sm ${adminTab === t.id ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>{t.icon} {t.label}</button>)}</div>
          {adminTab === 'dashboard' && <DashboardTab totals={totals} sales={sales} vendite={vendite} byStato={byStato} byMonth={byMonth} byAgente={byAgente} byZona={byZona} fmt={fmt} pipelineColors={pipelineColors} />}
          {adminTab === 'vendite' && <VenditeTab sales={filteredSales} loading={loading} filters={filters} setFilters={setFilters} updateSale={updateSale} deleteSale={deleteSale} loadSales={loadSales} exportToCSV={exportToCSV} totals={totals} fmt={fmt} selectedSales={selectedSales} toggleSelectSale={toggleSelectSale} selectAllSales={selectAllSales} deleteSelectedSales={deleteSelectedSales} />}
          {adminTab === 'pipeline' && <PipelineTab byStato={byStato} fmt={fmt} pipelineColors={pipelineColors} pipelineLabels={pipelineLabels} />}
          {adminTab === 'clienti' && <ClientiTab clienti={clienti} loadClienti={loadClienti} createCliente={createCliente} updateCliente={updateCliente} deleteCliente={deleteCliente} showModal={showClienteModal} setShowModal={setShowClienteModal} editingCliente={editingCliente} setEditingCliente={setEditingCliente} selectedClienti={selectedClienti} toggleSelectCliente={toggleSelectCliente} deleteSelectedClienti={deleteSelectedClienti} />}
          {adminTab === 'notifiche' && <NotificheTab notifications={notifications} setNotifications={setNotifications} />}
          {adminTab === 'utenti' && <UserManagement users={users} loadUsers={loadUsers} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} showUserModal={showUserModal} setShowUserModal={setShowUserModal} editingUser={editingUser} setEditingUser={setEditingUser} selectedUsers={selectedUsers} toggleSelectUser={toggleSelectUser} deleteSelectedUsers={deleteSelectedUsers} />}
        </div>
        {showInstallPrompt && <InstallPrompt onClose={dismissInstallPrompt} />}
      </div>
    );
  }
  return null;
}

// SUB-COMPONENTS
function LoginForm({ onLogin, loading }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [sp, setSp] = useState(false);
  return <form onSubmit={(e) => { e.preventDefault(); onLogin(u, p); }} className="space-y-4"><div><label className="block text-slate-300 text-sm mb-2">Username</label><input type="text" value={u} onChange={(e) => setU(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white" /></div><div><label className="block text-slate-300 text-sm mb-2">Password</label><div className="relative"><input type={sp ? 'text' : 'password'} value={p} onChange={(e) => setP(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-white" /><button type="button" onClick={() => setSp(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{sp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div><button type="submit" disabled={loading || !u || !p} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-900 rounded-xl py-3 font-semibold">{loading ? '...' : 'Accedi'}</button></form>;
}

function PasswordModal({ currentPassword, onSave, onClose }) {
  const [op, setOp] = useState(''); const [np, setNp] = useState(''); const [cp, setCp] = useState(''); const [e, setE] = useState('');
  const save = () => { if (op !== currentPassword) { setE('Password errata'); return; } if (np.length < 6) { setE('Min 6 caratteri'); return; } if (np !== cp) { setE('Non coincidono'); return; } onSave(np); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">Cambia Password</h3>{e && <div className="bg-red-500/20 text-red-300 rounded-lg px-3 py-2 mb-4 text-sm">{e}</div>}<div className="space-y-3"><input type="password" placeholder="Password attuale" value={op} onChange={(e) => setOp(e.target.value)} className={inp} /><input type="password" placeholder="Nuova password" value={np} onChange={(e) => setNp(e.target.value)} className={inp} /><input type="password" placeholder="Conferma" value={cp} onChange={(e) => setCp(e.target.value)} className={inp} /><div className="flex gap-3 pt-2"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3 text-sm">Annulla</button><button onClick={save} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold text-sm">Salva</button></div></div></div></div>;
}

function LeadFormClean({ type, userName, onSubmit }) {
  const [f, setF] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '', stato: 'lead', cliente_nome: '', cliente_cognome: '', cliente_email: '', cliente_telefono: '', cliente_whatsapp: '', cliente_nazionalita: '', cliente_budget_min: '', cliente_budget_max: '', cliente_note: '' });
  const sub = (e) => { e?.preventDefault(); if (!f.cliente_nome) { alert('Nome cliente obbligatorio'); return; } onSubmit({ ...f, developer: f.developer || 'TBD', progetto: f.progetto || 'TBD', zona: f.zona || 'TBD', valore: f.valore ? parseFloat(f.valore) : 0, agente: type === 'agente' ? userName : null, segnalatore: type === 'segnalatore' ? userName : null }); };
  const inp = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm";
  return <form onSubmit={sub}><div className="space-y-4"><div className="bg-slate-800/50 rounded-xl p-4"><h4 className="text-white font-medium mb-3">👤 Cliente</h4><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Nome *" value={f.cliente_nome} onChange={(e) => setF({ ...f, cliente_nome: e.target.value })} className={inp} required /><input type="text" placeholder="Cognome" value={f.cliente_cognome} onChange={(e) => setF({ ...f, cliente_cognome: e.target.value })} className={inp} /><input type="email" placeholder="Email" value={f.cliente_email} onChange={(e) => setF({ ...f, cliente_email: e.target.value })} className={inp} /><input type="tel" placeholder="Telefono" value={f.cliente_telefono} onChange={(e) => setF({ ...f, cliente_telefono: e.target.value })} className={inp} /><input type="tel" placeholder="WhatsApp" value={f.cliente_whatsapp} onChange={(e) => setF({ ...f, cliente_whatsapp: e.target.value })} className={inp} /><input type="text" placeholder="Nazionalità" value={f.cliente_nazionalita} onChange={(e) => setF({ ...f, cliente_nazionalita: e.target.value })} className={inp} /><input type="number" placeholder="Budget Min" value={f.cliente_budget_min} onChange={(e) => setF({ ...f, cliente_budget_min: e.target.value })} className={inp} /><input type="number" placeholder="Budget Max" value={f.cliente_budget_max} onChange={(e) => setF({ ...f, cliente_budget_max: e.target.value })} className={inp} /></div><textarea placeholder="Note..." value={f.cliente_note} onChange={(e) => setF({ ...f, cliente_note: e.target.value })} className={`${inp} mt-3 h-16`} /></div><div className="bg-slate-800/50 rounded-xl p-4"><h4 className="text-white font-medium mb-3">🏠 Interesse</h4><div className="grid grid-cols-2 gap-3"><SelectWithOther value={f.developer} onChange={(v) => setF({ ...f, developer: v })} options={developers} placeholder="Developer" className={inp} /><SelectWithOther value={f.zona} onChange={(v) => setF({ ...f, zona: v })} options={zones} placeholder="Zona" className={inp} /><input type="text" placeholder="Progetto" value={f.progetto} onChange={(e) => setF({ ...f, progetto: e.target.value })} className={inp} /><input type="number" placeholder="Valore" value={f.valore} onChange={(e) => setF({ ...f, valore: e.target.value })} className={inp} /></div></div><div className="bg-slate-800/50 rounded-xl p-4"><h4 className="text-white font-medium mb-3">Stato</h4><div className="flex flex-wrap gap-2">{pipelineStati.slice(0, 4).map(st => <button key={st} type="button" onClick={() => setF({ ...f, stato: st })} className={`px-4 py-2 rounded-lg text-sm font-medium ${f.stato === st ? `${pipelineColors[st]} text-white` : 'bg-slate-700 text-slate-400'}`}>{st}</button>)}</div></div></div><button type="submit" id="submitBtn" className="hidden">Submit</button></form>;
}

function SaleFormClean({ type, userName, onSubmit }) {
  const [f, setF] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '' });
  const sub = (e) => { e?.preventDefault(); if (!f.developer || !f.progetto || !f.zona || !f.valore) { alert('Compila tutti i campi'); return; } onSubmit({ ...f, valore: parseFloat(f.valore), agente: type === 'agente' ? userName : null, segnalatore: type === 'segnalatore' ? userName : null }); };
  const inp = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm";
  return <form onSubmit={sub}><div className="space-y-4"><div className="bg-slate-800/50 rounded-xl p-4"><h4 className="text-white font-medium mb-3">💰 Vendita</h4><div className="space-y-3"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} className={inp} /><SelectWithOther value={f.developer} onChange={(v) => setF({ ...f, developer: v })} options={developers} placeholder="Developer *" className={inp} /><input type="text" placeholder="Progetto *" value={f.progetto} onChange={(e) => setF({ ...f, progetto: e.target.value })} className={inp} required /><SelectWithOther value={f.zona} onChange={(v) => setF({ ...f, zona: v })} options={zones} placeholder="Zona *" className={inp} /><input type="number" placeholder="Valore (AED) *" value={f.valore} onChange={(e) => setF({ ...f, valore: e.target.value })} className={inp} required /></div></div></div><button type="submit" id="submitBtn" className="hidden">Submit</button></form>;
}

function ConvertModal({ sale, onConvert, onCancel }) {
  const [v, setV] = useState(sale.valore || '');
  return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">🎉 Registra Vendita</h3><div className="bg-slate-700/50 rounded-xl p-3 mb-4"><div className="text-white font-medium text-sm">{sale.progetto}</div><div className="text-slate-400 text-xs">{sale.developer}</div></div><input type="number" placeholder="Valore (AED)" value={v} onChange={(e) => setV(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white mb-4" autoFocus /><div className="flex gap-3"><button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3 text-sm">Annulla</button><button onClick={() => v && onConvert(sale.id, parseFloat(v))} disabled={!v} className="flex-1 bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl py-3 font-semibold text-sm">Conferma</button></div></div></div>;
}

function DashboardTab({ totals, sales, vendite, byStato, byMonth, byAgente, byZona, fmt, pipelineColors }) {
  const sm = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxM = Math.max(...sm.map(([, v]) => v)) || 1;
  const sa = Object.entries(byAgente).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sz = Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avg = vendite.length > 0 ? totals.valore / vendite.length : 0;
  const conv = sales.length > 0 ? (vendite.length / sales.length * 100).toFixed(1) : 0;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-blue-300 text-xs mb-1"><Target className="w-3 h-3" />Lead</div><div className="text-2xl font-bold text-white">{sales.length}</div></div>
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-emerald-300 text-xs mb-1"><TrendingUp className="w-3 h-3" />Vendite</div><div className="text-2xl font-bold text-white">{vendite.length}</div><div className="text-emerald-400 text-xs">{conv}% conv.</div></div>
      <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-amber-300 text-xs mb-1"><DollarSign className="w-3 h-3" />Volume</div><div className="text-xl font-bold text-white">{fmt(totals.valore)}</div></div>
      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-purple-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-purple-300 text-xs mb-1"><UserCheck className="w-3 h-3" />Netto</div><div className="text-xl font-bold text-white">{fmt(totals.netto)}</div></div>
    </div>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Media</div><div className="text-sm font-bold text-amber-400">{fmt(avg)}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Comm</div><div className="text-sm font-bold text-emerald-400">{fmt(totals.comm)}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Ag 70%</div><div className="text-sm font-bold text-blue-400">{fmt(totals.ag)}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-center"><div className="text-slate-400 text-xs">Seg 30%</div><div className="text-sm font-bold text-cyan-400">{fmt(totals.sg)}</div></div>
      <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-2 text-center"><div className="text-green-300 text-xs">Pell</div><div className="text-sm font-bold text-green-400">{fmt(totals.pell)}</div></div>
      <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-2 text-center"><div className="text-orange-300 text-xs">Giov</div><div className="text-sm font-bold text-orange-400">{fmt(totals.giov)}</div></div>
    </div>
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h3 className="text-white font-semibold mb-3">Pipeline</h3><div className="flex gap-2 overflow-x-auto pb-2">{Object.entries(byStato).map(([st, items]) => <div key={st} className="flex-1 min-w-[60px]"><div className={`${pipelineColors[st]} rounded-lg p-2 text-center text-white`}><div className="text-xl font-bold">{items.length}</div><div className="text-xs opacity-80">{st}</div></div></div>)}</div></div>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h3 className="text-white font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" />Andamento</h3><div className="space-y-2">{sm.map(([m, v]) => <div key={m} className="flex items-center gap-2"><div className="text-slate-400 text-xs w-14">{m}</div><div className="flex-1 bg-slate-700 rounded-full h-3"><div className="bg-amber-500 h-full rounded-full" style={{ width: `${(v / maxM) * 100}%` }} /></div><div className="text-white text-xs w-16 text-right">{fmt(v)}</div></div>)}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-blue-400" />Top Agenti</h3><div className="space-y-2">{sa.length === 0 ? <div className="text-slate-500 text-sm">-</div> : sa.map(([a, v], i) => <div key={a} className="flex items-center gap-2"><div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-600 text-white'}`}>{i + 1}</div><div className="text-white text-sm flex-1 truncate">{a}</div><div className="text-amber-400 text-xs">{fmt(v)}</div></div>)}</div></div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><h3 className="text-white font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" />Top Zone</h3><div className="space-y-2">{sz.length === 0 ? <div className="text-slate-500 text-sm">-</div> : sz.map(([z, v], i) => <div key={z} className="flex items-center gap-2"><div className="text-slate-400 text-xs w-4">{i + 1}</div><div className="text-white text-sm flex-1 truncate">{z}</div><div className="text-emerald-400 text-xs">{fmt(v)}</div></div>)}</div></div>
    </div>
  </div>;
}

function VenditeTab({ sales, loading, filters, setFilters, updateSale, deleteSale, loadSales, exportToCSV, totals, fmt, selectedSales, toggleSelectSale, selectAllSales, deleteSelectedSales }) {
  return <>
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 mb-4"><div className="flex flex-wrap gap-2 items-center"><button onClick={loadSales} className="bg-slate-700 text-white rounded-lg px-3 py-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={exportToCSV} className="bg-emerald-500 text-white rounded-lg px-3 py-2"><Download className="w-4 h-4" /></button>{selectedSales.length > 0 && <button onClick={deleteSelectedSales} className="bg-red-500 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm"><Trash2 className="w-4 h-4" />{selectedSales.length}</button>}<div className="flex-1" /><div className="relative"><Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cerca..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white text-sm w-28" /></div><select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm"><option value="">Stato</option>{pipelineStati.map(s => <option key={s} value={s}>{s}</option>)}</select>{(filters.search || filters.stato) && <button onClick={() => setFilters({ search: '', stato: '', agente: '', pagato: '' })} className="text-slate-400"><X className="w-5 h-5" /></button>}</div></div>
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-700/50 text-left"><th className="px-2 py-2"><button onClick={selectAllSales}>{selectedSales.length === sales.length && sales.length > 0 ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-400" />}</button></th><th className="text-slate-300 px-2 py-2 text-xs">Data</th><th className="text-slate-300 px-2 py-2 text-xs">Progetto</th><th className="text-slate-300 px-2 py-2 text-xs">Agente</th><th className="text-slate-300 px-2 py-2 text-right text-xs">Valore</th><th className="text-slate-300 px-2 py-2 text-center text-xs">%</th><th className="text-slate-300 px-2 py-2 text-center text-xs">Stato</th><th className="text-slate-300 px-2 py-2 text-center text-xs">Ref</th><th className="text-slate-300 px-2 py-2 text-center text-xs">💰</th><th className="text-slate-300 px-2 py-2 text-center text-xs">🗑️</th></tr></thead><tbody>{sales.map(s => <tr key={s.id} className={`border-t border-slate-700 hover:bg-slate-700/30 ${selectedSales.includes(s.id) ? 'bg-amber-500/10' : ''}`}><td className="px-2 py-2"><button onClick={() => toggleSelectSale(s.id)}>{selectedSales.includes(s.id) ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-400" />}</button></td><td className="px-2 py-2 text-white text-xs">{s.data?.substring(5,10)}</td><td className="px-2 py-2 text-white text-xs truncate max-w-[80px]">{s.progetto}</td><td className="px-2 py-2 text-blue-400 text-xs truncate max-w-[60px]">{s.agente || '-'}</td><td className="px-2 py-2 text-amber-400 text-right text-xs">{s.valore > 0 ? fmt(s.valore) : '-'}</td><td className="px-2 py-2 text-center"><select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-slate-700 border-0 rounded px-1 py-0.5 text-white text-xs w-12">{commissions.map(c => <option key={c} value={c}>{c}%</option>)}</select></td><td className="px-2 py-2 text-center"><select value={s.stato || 'lead'} onChange={(e) => updateSale(s.id, { stato: e.target.value })} className={`${pipelineColors[s.stato || 'lead']} border-0 rounded px-1 py-0.5 text-white text-xs w-16`}>{pipelineStati.map(st => <option key={st} value={st} className="bg-slate-800">{st}</option>)}</select></td><td className="px-2 py-2 text-center"><select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className={`bg-slate-700 border rounded px-1 py-0.5 text-xs w-10 ${s.referente ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}><option value="">-</option><option value="Pellegrino">P</option><option value="Giovanni">G</option></select></td><td className="px-2 py-2 text-center"><button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-1.5 py-0.5 rounded text-xs ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.pagato ? '✓' : '✗'}</button></td><td className="px-2 py-2 text-center"><button onClick={() => deleteSale(s.id)} className="text-red-400"><Trash2 className="w-3 h-3" /></button></td></tr>)}</tbody></table></div></div>
  </>;
}

function PipelineTab({ byStato, fmt, pipelineColors, pipelineLabels }) {
  return <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{pipelineStati.map(st => <div key={st} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"><div className={`${pipelineColors[st]} px-2 py-1.5 text-white text-xs flex justify-between`}><span>{pipelineLabels[st]}</span><span className="bg-white/20 px-1.5 rounded">{byStato[st]?.length || 0}</span></div><div className="p-2 space-y-2 max-h-[50vh] overflow-y-auto">{byStato[st]?.map(s => <div key={s.id} className="bg-slate-700/50 rounded-lg p-2"><div className="text-white text-xs truncate">{s.progetto}</div><div className="text-slate-400 text-xs truncate">{s.agente || s.segnalatore || '-'}</div>{s.valore > 0 && <div className="text-amber-400 text-xs mt-1">{fmt(s.valore)}</div>}</div>)}{(!byStato[st] || !byStato[st].length) && <div className="text-slate-500 text-xs text-center py-3">-</div>}</div></div>)}</div>;
}

function NotificheTab({ notifications, setNotifications }) {
  const markRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const clear = () => setNotifications([]);
  return <div><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-white">Notifiche</h2><div className="flex gap-2"><button onClick={markRead} className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm">Lette</button><button onClick={clear} className="bg-red-500/20 text-red-400 rounded-lg px-3 py-1.5 text-sm">Pulisci</button></div></div>{notifications.length === 0 ? <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessuna notifica</div> : <div className="space-y-2">{notifications.map((n, i) => <div key={i} className={`bg-slate-800 border rounded-xl p-3 flex items-start gap-3 ${n.read ? 'border-slate-700' : 'border-blue-500/50 bg-blue-900/10'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'vendita' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{n.type === 'vendita' ? <DollarSign className="w-4 h-4" /> : <Target className="w-4 h-4" />}</div><div className="flex-1"><div className="text-white text-sm">{n.message}</div><div className="text-slate-500 text-xs">{new Date(n.time).toLocaleString('it-IT')}</div></div>{!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}</div>)}</div>}</div>;
}

function ClientiTab({ clienti, loadClienti, createCliente, updateCliente, deleteCliente, showModal, setShowModal, editingCliente, setEditingCliente, selectedClienti, toggleSelectCliente, deleteSelectedClienti }) {
  const [search, setSearch] = useState('');
  const filtered = clienti.filter(c => !search || `${c.nome} ${c.cognome} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="flex flex-wrap gap-2 items-center mb-4"><button onClick={() => { setEditingCliente(null); setShowModal(true); }} className="bg-amber-500 text-slate-900 rounded-lg px-3 py-2 flex items-center gap-1 text-sm font-semibold"><UserPlus className="w-4 h-4" />Nuovo</button><button onClick={loadClienti} className="bg-slate-700 text-white rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4" /></button>{selectedClienti.length > 0 && <button onClick={deleteSelectedClienti} className="bg-red-500 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm"><Trash2 className="w-4 h-4" />{selectedClienti.length}</button>}<div className="flex-1" /><div className="relative"><Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white text-sm" /></div></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map(c => <div key={c.id} className={`bg-slate-800 border rounded-xl p-3 ${selectedClienti.includes(c.id) ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700'}`}><div className="flex items-start gap-2"><button onClick={() => toggleSelectCliente(c.id)}>{selectedClienti.includes(c.id) ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-500" />}</button><div className="flex-1"><div className="flex justify-between"><div><div className="text-white font-medium text-sm">{c.nome} {c.cognome}</div><div className="text-slate-400 text-xs">{c.nazionalita}</div></div><span className={`px-2 py-0.5 rounded text-xs ${c.stato === 'acquistato' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-300'}`}>{c.stato}</span></div>{c.telefono && <div className="flex items-center gap-1 text-slate-400 text-xs mt-1"><Phone className="w-3 h-3" />{c.telefono}</div>}{c.email && <div className="flex items-center gap-1 text-slate-400 text-xs"><Mail className="w-3 h-3" />{c.email}</div>}<div className="flex gap-2 mt-2"><button onClick={() => { setEditingCliente(c); setShowModal(true); }} className="flex-1 bg-slate-700 text-white rounded-lg py-1.5 text-xs">Edit</button><button onClick={() => deleteCliente(c.id)} className="bg-red-500/20 text-red-400 rounded-lg px-2 py-1.5"><Trash2 className="w-3 h-3" /></button></div></div></div></div>)}</div>{showModal && <ClienteModal cliente={editingCliente} onClose={() => { setShowModal(false); setEditingCliente(null); }} onSave={editingCliente ? (d) => updateCliente(editingCliente.id, d) : createCliente} />}</>;
}

function ClienteModal({ cliente, onClose, onSave }) {
  const [f, setF] = useState(cliente || { nome: '', cognome: '', email: '', telefono: '', stato: 'nuovo', note: '' });
  const save = async () => { if (!f.nome) { alert('Nome obbligatorio'); return; } await onSave(f); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm";
  return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">{cliente ? 'Modifica' : 'Nuovo'} Cliente</h3><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inp} /><input type="text" placeholder="Cognome" value={f.cognome || ''} onChange={(e) => setF({ ...f, cognome: e.target.value })} className={inp} /></div><div className="grid grid-cols-2 gap-3"><input type="email" placeholder="Email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} /><input type="tel" placeholder="Telefono" value={f.telefono || ''} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={inp} /></div><select value={f.stato || 'nuovo'} onChange={(e) => setF({ ...f, stato: e.target.value })} className={inp}>{clienteStati.map(s => <option key={s} value={s}>{s}</option>)}</select><textarea placeholder="Note" value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} className={`${inp} h-20`} /></div><div className="flex gap-3 mt-4"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3 text-sm">Annulla</button><button onClick={save} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold text-sm">Salva</button></div></div></div>;
}

function UserManagement({ users, loadUsers, createUser, updateUser, deleteUser, showUserModal, setShowUserModal, editingUser, setEditingUser, selectedUsers, toggleSelectUser, deleteSelectedUsers }) {
  const [copiedId, setCopiedId] = useState(null);
  const copy = (u) => { navigator.clipboard.writeText(`KeyPrime\n${getBaseUrl()}\n${u.username} / ${u.password}`); setCopiedId(u.id); setTimeout(() => setCopiedId(null), 2000); };
  return <div><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-white">Utenti</h2><div className="flex gap-2">{selectedUsers.length > 0 && <button onClick={deleteSelectedUsers} className="bg-red-500 text-white rounded-lg px-3 py-2 flex items-center gap-1 text-sm"><Trash2 className="w-4 h-4" />{selectedUsers.length}</button>}<button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-amber-500 text-slate-900 rounded-lg px-3 py-2 flex items-center gap-1 text-sm font-semibold"><UserPlus className="w-4 h-4" />Nuovo</button></div></div><div className="space-y-2">{users.map(u => <div key={u.id} className={`bg-slate-800 border rounded-xl p-3 ${selectedUsers.includes(u.id) ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700'}`}><div className="flex items-center gap-3"><button onClick={() => toggleSelectUser(u.id)}>{selectedUsers.includes(u.id) ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-slate-500" />}</button><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-white font-medium text-sm">{u.nome}</span><span className={`px-2 py-0.5 rounded text-xs ${u.ruolo === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.ruolo === 'agente' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.ruolo}</span></div><div className="text-slate-400 text-xs mt-1 truncate">{u.username} / {u.password}{u.email && ` • ${u.email}`}</div></div><div className="flex gap-1"><button onClick={() => copy(u)} className="bg-slate-700 text-white rounded-lg p-2">{copiedId === u.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button><button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="bg-blue-500/20 text-blue-400 rounded-lg p-2"><Edit2 className="w-4 h-4" /></button>{u.ruolo !== 'admin' && <button onClick={() => deleteUser(u.id)} className="bg-red-500/20 text-red-400 rounded-lg p-2"><Trash2 className="w-4 h-4" /></button>}</div></div></div>)}</div>{showUserModal && <UserModal user={editingUser} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={editingUser ? (d) => updateUser(editingUser.id, d) : createUser} />}</div>;
}

function UserModal({ user, onClose, onSave }) {
  const [f, setF] = useState(user || { nome: '', username: '', password: '', email: '', ruolo: 'agente', referente: 'Pellegrino', attivo: true });
  const save = async () => { if (!f.nome || !f.username || !f.password) { alert('Compila campi obbligatori'); return; } const ok = await onSave(f); if (ok) onClose(); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm";
  return <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"><div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700"><h3 className="text-lg font-semibold text-white mb-4">{user ? 'Modifica' : 'Nuovo'} Utente</h3><div className="space-y-3"><input type="text" placeholder="Nome *" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inp} /><input type="email" placeholder="Email" value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} className={inp} /><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Username *" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} className={inp} /><input type="text" placeholder="Password *" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inp} /></div><div className="grid grid-cols-2 gap-3"><select value={f.ruolo} onChange={(e) => setF({ ...f, ruolo: e.target.value })} className={inp}><option value="agente">Agente</option><option value="segnalatore">Segnalatore</option></select><select value={f.referente} onChange={(e) => setF({ ...f, referente: e.target.value })} className={inp}><option value="Pellegrino">Pellegrino</option><option value="Giovanni">Giovanni</option></select></div>{user && <div className="flex items-center gap-3"><input type="checkbox" id="att" checked={f.attivo} onChange={(e) => setF({ ...f, attivo: e.target.checked })} className="w-4 h-4" /><label htmlFor="att" className="text-slate-300 text-sm">Attivo</label></div>}</div><div className="flex gap-3 mt-4"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3 text-sm">Annulla</button><button onClick={save} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold text-sm">Salva</button></div></div></div>;
}
