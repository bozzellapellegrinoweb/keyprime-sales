import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus, Search, Users, Phone, Mail, X, Edit2, TrendingUp, DollarSign, Target, UserCheck, ArrowRight, FileText } from 'lucide-react';

const supabase = createClient(
  'https://wqtylxrrerhbxagdzftn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ'
);

const RESEND_API_KEY = 're_jCpLJKfw_MfWu2jbSzPPgz6pLHQXMAXJb';
const EMAIL_FROM = 'onboarding@resend.dev'; // Cambia con tuo dominio verificato

const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];
const pipelineStati = ['lead', 'trattativa', 'prenotato', 'venduto', 'incassato'];
const pipelineColors = { lead: 'bg-slate-500', trattativa: 'bg-blue-500', prenotato: 'bg-amber-500', venduto: 'bg-emerald-500', incassato: 'bg-green-600' };
const pipelineLabels = { lead: '🎯 Lead', trattativa: '💬 Trattativa', prenotato: '📝 Prenotato', venduto: '✅ Venduto', incassato: '💰 Incassato' };
const clienteStati = ['nuovo', 'contattato', 'interessato', 'trattativa', 'acquistato', 'perso'];
const fontiLead = ['Web', 'Referral', 'Social', 'Fiera', 'Cold Call', 'WhatsApp', 'Altro'];

const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';
const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Send email via Resend
const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
      }),
    });
    const data = await response.json();
    console.log('Email sent:', data);
    return data;
  } catch (error) {
    console.error('Email error:', error);
    return null;
  }
};

const Logo = ({ size = 'large' }) => (
  <div className={`flex items-center gap-3 ${size === 'small' ? 'scale-75' : ''}`}>
    <svg viewBox="0 0 60 80" className={size === 'large' ? 'w-16 h-20' : 'w-10 h-12'}>
      <rect x="0" y="20" width="12" height="60" fill="#C9B99A" />
      <rect x="16" y="0" width="14" height="80" fill="#2C3E50" rx="2" />
      <rect x="34" y="10" width="14" height="70" fill="#3D5A6C" rx="2" />
      <circle cx="23" cy="50" r="4" fill="#C9B99A" />
      <rect x="21" y="54" width="4" height="20" fill="#C9B99A" />
    </svg>
    <div>
      <div className={`font-serif tracking-wider ${size === 'large' ? 'text-3xl' : 'text-xl'}`}>
        <span style={{ color: '#2C3E50' }}>KEY</span><span style={{ color: '#3D5A6C' }}>PRIME</span>
      </div>
      <div className={`tracking-widest ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: '#C9B99A' }}>real estate brokerage</div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(null); // 'lead' | 'vendita' | null
  const [saveStatus, setSaveStatus] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [filters, setFilters] = useState({ search: '', stato: '', agente: '', zona: '', pagato: '' });
  const [convertingSale, setConvertingSale] = useState(null);
  const [agentTab, setAgentTab] = useState('lista');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const username = params.get('user');
    if (role && username) verifyDirectAccess(username, role);
    else {
      const saved = localStorage.getItem('keyprime_user');
      if (saved) { const p = JSON.parse(saved); setUser(p); setView(p.ruolo === 'admin' ? 'admin' : p.ruolo); }
    }
  }, []);

  const verifyDirectAccess = async (username, role) => {
    const { data } = await supabase.from('user_credentials').select('*').eq('username', username).eq('ruolo', role).eq('attivo', true).single();
    if (data) { setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data)); setView(role === 'admin' ? 'admin' : role); }
  };

  const loadSales = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales_with_commissions').select('*').order('created_at', { ascending: false });
    setSales(data || []);
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data } = await supabase.from('user_credentials').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const loadClienti = async () => {
    const { data } = await supabase.from('clienti').select('*').order('created_at', { ascending: false });
    setClienti(data || []);
  };

  useEffect(() => { 
    if (user) { 
      loadSales(); 
      if (user.ruolo === 'admin') { loadUsers(); loadClienti(); } 
    } 
  }, [user]);

  const handleLogin = async (username, password) => {
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.from('user_credentials').select('*').eq('username', username).eq('password', password).eq('attivo', true).single();
    if (err || !data) { setError('Credenziali non valide'); setLoading(false); return; }
    setUser(data); localStorage.setItem('keyprime_user', JSON.stringify(data)); setView(data.ruolo === 'admin' ? 'admin' : data.ruolo); setLoading(false);
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('keyprime_user'); setView('login'); window.history.replaceState({}, document.title, window.location.pathname); };

  // Add Lead (with client data)
  const addLead = async (leadData) => {
    setSaveStatus('Salvataggio...');
    
    // Prima crea il cliente se ha dati
    let cliente_id = null;
    if (leadData.cliente_nome) {
      const { data: clienteData, error: clienteError } = await supabase.from('clienti').insert([{
        nome: leadData.cliente_nome,
        cognome: leadData.cliente_cognome || null,
        email: leadData.cliente_email || null,
        telefono: leadData.cliente_telefono || null,
        whatsapp: leadData.cliente_whatsapp || null,
        nazionalita: leadData.cliente_nazionalita || null,
        budget_min: leadData.cliente_budget_min ? parseFloat(leadData.cliente_budget_min) : null,
        budget_max: leadData.cliente_budget_max ? parseFloat(leadData.cliente_budget_max) : null,
        note: leadData.cliente_note || null,
        stato: 'nuovo',
        fonte: 'Agente',
        agente_riferimento: user?.nome,
        created_by: user?.nome,
        referente: user?.referente
      }]).select().single();
      
      if (!clienteError && clienteData) {
        cliente_id = clienteData.id;
      }
    }
    
    // Poi crea il lead/sale
    const { error: err } = await supabase.from('sales').insert([{
      data: leadData.data,
      developer: leadData.developer,
      progetto: leadData.progetto,
      zona: leadData.zona,
      valore: leadData.valore || 0,
      agente: leadData.agente,
      segnalatore: leadData.segnalatore,
      referente: user?.referente || null,
      commission_pct: 5,
      inserted_by: user?.nome,
      inserted_as: user?.ruolo,
      pagato: false,
      stato: leadData.stato || 'lead',
      cliente_id: cliente_id
    }]);
    
    if (err) { setSaveStatus('Errore!'); setError(err.message); }
    else { setSaveStatus('Lead salvato!'); setShowForm(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }
  };

  // Add Sale (with value - direct sale or converted from lead)
  const addSale = async (saleData) => {
    setSaveStatus('Salvataggio...');
    const { error: err } = await supabase.from('sales').insert([{
      ...saleData,
      referente: user?.referente || null,
      commission_pct: 5,
      inserted_by: user?.nome,
      inserted_as: user?.ruolo,
      pagato: false,
      stato: 'venduto'
    }]);
    if (err) { setSaveStatus('Errore!'); setError(err.message); }
    else { setSaveStatus('Vendita registrata!'); setShowForm(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }
  };

  // Convert lead to sale
  const convertLeadToSale = async (saleId, valore) => {
    setSaveStatus('Conversione...');
    const { error: err } = await supabase.from('sales').update({ 
      stato: 'venduto', 
      valore: valore 
    }).eq('id', saleId);
    if (err) { setSaveStatus('Errore!'); setError(err.message); }
    else { setSaveStatus('Convertito in vendita!'); setConvertingSale(null); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }
  };

  const updateSale = async (id, updates) => { 
    const sale = sales.find(s => s.id === id);
    
    // Se stiamo segnando come pagato, invia email
    if (updates.pagato === true && !sale?.pagato) {
      const targetName = sale.agente || sale.segnalatore;
      if (targetName) {
        const { data: targetUser } = await supabase.from('user_credentials').select('*').eq('nome', targetName).single();
        if (targetUser?.email) {
          const commRate = sale.agente ? 0.7 : 0.3;
          const commAmount = Number(sale.valore) * (sale.commission_pct || 5) / 100 * commRate;
          
          await sendEmail(
            targetUser.email,
            '💰 Commissione Pagata - KeyPrime',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2C3E50;">Commissione Pagata! 🎉</h2>
              <p>Ciao ${targetName},</p>
              <p>La tua commissione per la vendita seguente è stata pagata:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Progetto:</strong> ${sale.progetto}</p>
                <p><strong>Developer:</strong> ${sale.developer}</p>
                <p><strong>Valore:</strong> ${fmt(sale.valore)} AED</p>
                <p><strong>Commissione:</strong> ${fmt(commAmount)} AED</p>
              </div>
              <p>Grazie per il tuo lavoro!</p>
              <p style="color: #888;">— Team KeyPrime</p>
            </div>
            `
          );
          
          // Log email
          await supabase.from('email_log').insert([{
            destinatario: targetUser.email,
            tipo: 'pagamento_commissione',
            sale_id: sale.id,
            user_id: targetUser.id,
            stato: 'inviata'
          }]);
        }
      }
    }
    
    await supabase.from('sales').update(updates).eq('id', id); 
    loadSales(); 
  };

  const deleteSale = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('sales').delete().eq('id', id); loadSales(); };
  
  const createUser = async (userData) => { 
    const { error: err } = await supabase.from('user_credentials').insert([userData]); 
    if (err) { setError(err.message); return false; } 
    loadUsers(); setShowUserModal(false); return true; 
  };
  
  const deleteUser = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('user_credentials').delete().eq('id', id); loadUsers(); };

  const createCliente = async (data) => {
    const { error: err } = await supabase.from('clienti').insert([{ ...data, created_by: user?.nome, referente: user?.referente }]);
    if (err) { setError(err.message); return false; }
    loadClienti(); setShowClienteModal(false); setEditingCliente(null); return true;
  };

  const updateCliente = async (id, data) => {
    const { error: err } = await supabase.from('clienti').update(data).eq('id', id);
    if (err) { setError(err.message); return false; }
    loadClienti(); setShowClienteModal(false); setEditingCliente(null); return true;
  };

  const deleteCliente = async (id) => { if (!window.confirm('Eliminare cliente?')) return; await supabase.from('clienti').delete().eq('id', id); loadClienti(); };

  const exportToCSV = () => {
    let csv = '\ufeffData,Developer,Agente,Segnalatore,Progetto,Zona,Valore,Comm%,Stato,Referente,Pagato\n';
    filteredSales.forEach(s => { csv += `${s.data},"${s.developer}","${s.agente||''}","${s.segnalatore||''}","${s.progetto}","${s.zona}",${s.valore},${s.commission_pct||5}%,${s.stato||'lead'},${s.referente||''},${s.pagato?'SI':'NO'}\n`; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `KeyPrime_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const filteredSales = sales.filter(s => {
    if (filters.search && !`${s.progetto} ${s.developer} ${s.agente} ${s.segnalatore}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.stato && s.stato !== filters.stato) return false;
    if (filters.agente && s.agente !== filters.agente) return false;
    if (filters.zona && s.zona !== filters.zona) return false;
    if (filters.pagato === 'si' && !s.pagato) return false;
    if (filters.pagato === 'no' && s.pagato) return false;
    return true;
  });

  const ErrorBanner = () => error && (<div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto">✕</button></div>);

  if (view === 'login') return <LoginPage onLogin={handleLogin} loading={loading} error={error} setError={setError} />;

  // ==================== AGENTE / SEGNALATORE VIEW ====================
  if (view === 'agente' || view === 'segnalatore') {
    const type = view;
    const mySales = sales.filter(s => type === 'agente' ? s.agente === user?.nome : s.segnalatore === user?.nome);
    const rate = type === 'agente' ? 0.7 : 0.3;
    const myVendite = mySales.filter(s => s.stato === 'venduto' || s.stato === 'incassato');
    const totalComm = myVendite.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const pagate = myVendite.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const byStato = pipelineStati.reduce((acc, stato) => { acc[stato] = mySales.filter(s => (s.stato || 'lead') === stato); return acc; }, {});

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Logo size="small" />
            <div className="flex items-center gap-4">
              <div className="text-right"><div className="text-slate-400 text-sm">{type === 'agente' ? 'Agente' : 'Segnalatore'}</div><div className="text-white font-medium">{user?.nome}</div></div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
          
          <ErrorBanner />
          {saveStatus && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl px-4 py-2 mb-4 text-center">{saveStatus}</div>}
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4"><div className="text-slate-400 text-sm">Lead Totali</div><div className="text-2xl font-bold text-white">{mySales.length}</div></div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4"><div className="text-slate-400 text-sm">Vendite Chiuse</div><div className="text-2xl font-bold text-emerald-400">{myVendite.length}</div></div>
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-2xl p-4"><div className="text-emerald-300 text-sm">✓ Pagate</div><div className="text-xl font-bold text-emerald-400">{fmt(pagate)} AED</div></div>
            <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-4"><div className="text-red-300 text-sm">⏳ Da Pagare</div><div className="text-xl font-bold text-red-400">{fmt(totalComm - pagate)} AED</div></div>
          </div>

          {/* Action Buttons */}
          {!showForm && !convertingSale && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => setShowForm('lead')} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-semibold">
                <Target className="w-5 h-5" /> Inserisci Lead
              </button>
              <button onClick={() => setShowForm('vendita')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-semibold">
                <DollarSign className="w-5 h-5" /> Registra Vendita
              </button>
            </div>
          )}

          {/* Lead Form */}
          {showForm === 'lead' && (
            <LeadForm type={type} userName={user?.nome} onSubmit={addLead} onCancel={() => setShowForm(null)} />
          )}

          {/* Sale Form */}
          {showForm === 'vendita' && (
            <SaleForm type={type} userName={user?.nome} onSubmit={addSale} onCancel={() => setShowForm(null)} />
          )}

          {/* Convert Lead Modal */}
          {convertingSale && (
            <ConvertLeadModal 
              sale={convertingSale} 
              onConvert={convertLeadToSale} 
              onCancel={() => setConvertingSale(null)} 
            />
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setAgentTab('lista')} className={`px-4 py-2 rounded-xl font-medium ${agentTab === 'lista' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>📋 Lista</button>
            <button onClick={() => setAgentTab('pipeline')} className={`px-4 py-2 rounded-xl font-medium ${agentTab === 'pipeline' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>🎯 Pipeline</button>
            <div className="flex-1" />
            <button onClick={loadSales} className="bg-slate-700 text-white rounded-xl px-3 py-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>

          {/* LISTA VIEW */}
          {agentTab === 'lista' && (
            <>
              {mySales.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun lead o vendita</div>
              ) : (
                <div className="space-y-3">
                  {mySales.map(sale => {
                    const myComm = sale.stato === 'venduto' || sale.stato === 'incassato' 
                      ? Number(sale.valore) * (sale.commission_pct || 5) / 100 * rate 
                      : 0;
                    const showConvertButton = (sale.stato === 'prenotato' || sale.stato === 'trattativa') || (sale.stato === 'venduto' && sale.valore === 0);
                    
                    return (
                      <div key={sale.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium">{sale.progetto}</span>
                              <span className={`px-2 py-0.5 rounded text-xs text-white ${pipelineColors[sale.stato || 'lead']}`}>
                                {pipelineLabels[sale.stato || 'lead']}
                              </span>
                            </div>
                            <div className="text-slate-400 text-sm">{sale.developer} • {sale.zona}</div>
                            {sale.cliente_nome && <div className="text-blue-400 text-xs mt-1">👤 {sale.cliente_nome} {sale.cliente_cognome || ''}</div>}
                          </div>
                          <div className="text-right">
                            {sale.valore > 0 ? (
                              <div className="text-amber-400 font-semibold">{fmt(sale.valore)} AED</div>
                            ) : (
                              <div className="text-slate-500 text-sm">Valore TBD</div>
                            )}
                            <div className="text-slate-500 text-sm">{new Date(sale.data).toLocaleDateString('it-IT')}</div>
                          </div>
                        </div>
                        
                        {/* Pipeline Status Changer */}
                        <div className="flex items-center gap-2 py-2 border-t border-b border-slate-700 my-2 overflow-x-auto">
                          <span className="text-slate-400 text-xs whitespace-nowrap">Stato:</span>
                          {pipelineStati.slice(0, -1).map(stato => (
                            <button
                              key={stato}
                              onClick={() => updateSale(sale.id, { stato })}
                              className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-all ${
                                sale.stato === stato 
                                  ? `${pipelineColors[stato]} text-white` 
                                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                            >
                              {stato}
                            </button>
                          ))}
                        </div>

                        {/* Commission & Actions */}
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            {myComm > 0 ? (
                              <>
                                <span className="text-slate-400">Commissione: </span>
                                <span className="text-amber-300 font-medium">{fmt(myComm)} AED</span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${sale.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {sale.pagato ? '✓ Pagata' : '⏳ Pending'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-500">Commissione da calcolare</span>
                            )}
                          </div>
                          
                          {showConvertButton && (
                            <button 
                              onClick={() => setConvertingSale(sale)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" /> Registra Vendita
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* PIPELINE VIEW */}
          {agentTab === 'pipeline' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pipelineStati.slice(0, -1).map(stato => (
                <div key={stato} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className={`${pipelineColors[stato]} px-3 py-2 text-white font-semibold text-sm flex justify-between items-center`}>
                    <span>{pipelineLabels[stato]}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{byStato[stato]?.length || 0}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[50vh] overflow-y-auto">
                    {byStato[stato]?.map(sale => (
                      <div key={sale.id} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="text-white font-medium text-sm truncate">{sale.progetto || 'Da definire'}</div>
                        <div className="text-slate-400 text-xs truncate">{sale.developer}</div>
                        {sale.cliente_nome && <div className="text-blue-400 text-xs mt-1">👤 {sale.cliente_nome}</div>}
                        {sale.valore > 0 && <div className="text-amber-400 font-semibold text-sm mt-1">{fmt(sale.valore)} AED</div>}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {pipelineStati.slice(0, -1).map((st, i) => {
                            const currentIndex = pipelineStati.indexOf(sale.stato || 'lead');
                            const canMoveTo = Math.abs(i - currentIndex) === 1;
                            if (!canMoveTo || st === sale.stato) return null;
                            return (
                              <button key={st} onClick={() => updateSale(sale.id, { stato: st })} className={`text-xs px-2 py-1 rounded ${pipelineColors[st]} text-white opacity-80 hover:opacity-100`}>
                                {i > currentIndex ? '→' : '←'}
                              </button>
                            );
                          })}
                          {(sale.stato === 'prenotato' || sale.stato === 'trattativa' || (sale.stato === 'venduto' && !sale.valore)) && (
                            <button onClick={() => setConvertingSale(sale)} className="text-xs px-2 py-1 rounded bg-emerald-500 text-white opacity-80 hover:opacity-100">
                              💰
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!byStato[stato] || byStato[stato].length === 0) && (
                      <div className="text-slate-500 text-xs text-center py-4">Vuoto</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== ADMIN VIEW ====================
  if (view === 'admin') {
    const totals = sales.reduce((acc, s) => {
      const comm = Number(s.valore) * (s.commission_pct || 5) / 100;
      const ag = s.agente ? comm * 0.7 : 0;
      const sg = s.segnalatore ? comm * 0.3 : 0;
      const netto = comm - ag - sg;
      const pell = s.referente === 'Pellegrino' ? netto * 0.7 : (s.referente === 'Giovanni' ? netto * 0.3 : 0);
      const giov = s.referente === 'Giovanni' ? netto * 0.7 : (s.referente === 'Pellegrino' ? netto * 0.3 : 0);
      return { valore: acc.valore + Number(s.valore), comm: acc.comm + comm, ag: acc.ag + ag, sg: acc.sg + sg, netto: acc.netto + netto, pell: acc.pell + pell, giov: acc.giov + giov };
    }, { valore: 0, comm: 0, ag: 0, sg: 0, netto: 0, pell: 0, giov: 0 });

    const byStato = pipelineStati.reduce((acc, stato) => { acc[stato] = sales.filter(s => (s.stato || 'lead') === stato); return acc; }, {});
    const byMonth = sales.reduce((acc, s) => { const month = s.data?.substring(0, 7) || 'N/A'; acc[month] = (acc[month] || 0) + Number(s.valore); return acc; }, {});
    const byAgente = sales.reduce((acc, s) => { if (s.agente) acc[s.agente] = (acc[s.agente] || 0) + Number(s.valore); return acc; }, {});
    const byZona = sales.reduce((acc, s) => { acc[s.zona] = (acc[s.zona] || 0) + Number(s.valore); return acc; }, {});
    const uniqueAgenti = [...new Set(sales.map(s => s.agente).filter(Boolean))];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Logo size="small" />
            <div className="flex items-center gap-4">
              <div className="text-right"><div className="text-slate-400 text-sm">Admin</div><div className="text-white font-medium">{user?.nome}</div></div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
          <ErrorBanner />

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['dashboard', 'vendite', 'pipeline', 'clienti', 'utenti'].map(tab => (
              <button key={tab} onClick={() => setAdminTab(tab)} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${adminTab === tab ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                {tab === 'dashboard' && '📊 Dashboard'}
                {tab === 'vendite' && '💰 Vendite'}
                {tab === 'pipeline' && '🎯 Pipeline'}
                {tab === 'clienti' && '👥 CRM'}
                {tab === 'utenti' && '⚙️ Utenti'}
              </button>
            ))}
          </div>

          {adminTab === 'dashboard' && <DashboardTab totals={totals} sales={sales} byStato={byStato} byMonth={byMonth} byAgente={byAgente} byZona={byZona} fmt={fmt} pipelineColors={pipelineColors} />}
          {adminTab === 'vendite' && <VenditeTab sales={filteredSales} allSales={sales} loading={loading} filters={filters} setFilters={setFilters} uniqueAgenti={uniqueAgenti} updateSale={updateSale} deleteSale={deleteSale} loadSales={loadSales} exportToCSV={exportToCSV} totals={totals} fmt={fmt} clienti={clienti} />}
          {adminTab === 'pipeline' && <PipelineTab sales={sales} byStato={byStato} updateSale={updateSale} fmt={fmt} pipelineColors={pipelineColors} pipelineLabels={pipelineLabels} />}
          {adminTab === 'clienti' && <ClientiTab clienti={clienti} loadClienti={loadClienti} createCliente={createCliente} updateCliente={updateCliente} deleteCliente={deleteCliente} showModal={showClienteModal} setShowModal={setShowClienteModal} editingCliente={editingCliente} setEditingCliente={setEditingCliente} sales={sales} />}
          {adminTab === 'utenti' && <UserManagement users={users} loadUsers={loadUsers} createUser={createUser} deleteUser={deleteUser} showUserModal={showUserModal} setShowUserModal={setShowUserModal} />}
        </div>
      </div>
    );
  }

  return null;
}

// ==================== LEAD FORM (COMPLETO) ====================
function LeadForm({ type, userName, onSubmit, onCancel }) {
  const [form, setForm] = useState({ 
    data: new Date().toISOString().split('T')[0], 
    developer: '', 
    progetto: '', 
    zona: '', 
    valore: '',
    altroNome: '',
    stato: 'lead',
    // Dati cliente
    cliente_nome: '',
    cliente_cognome: '',
    cliente_email: '',
    cliente_telefono: '',
    cliente_whatsapp: '',
    cliente_nazionalita: '',
    cliente_budget_min: '',
    cliente_budget_max: '',
    cliente_note: ''
  });
  
  const handleSubmit = () => { 
    if (!form.cliente_nome) { alert('Inserisci almeno il nome del cliente'); return; }
    if (!form.progetto && !form.developer) { alert('Inserisci almeno progetto o developer di interesse'); return; } 
    onSubmit({ 
      data: form.data, 
      developer: form.developer || 'Da definire', 
      progetto: form.progetto || 'Da definire', 
      zona: form.zona || 'Da definire', 
      valore: form.valore ? parseFloat(form.valore) : 0,
      agente: type === 'agente' ? userName : (form.altroNome || null), 
      segnalatore: type === 'segnalatore' ? userName : (form.altroNome || null),
      stato: form.stato,
      // Passa dati cliente per creare anagrafica
      cliente_nome: form.cliente_nome,
      cliente_cognome: form.cliente_cognome,
      cliente_email: form.cliente_email,
      cliente_telefono: form.cliente_telefono,
      cliente_whatsapp: form.cliente_whatsapp,
      cliente_nazionalita: form.cliente_nazionalita,
      cliente_budget_min: form.cliente_budget_min,
      cliente_budget_max: form.cliente_budget_max,
      cliente_note: form.cliente_note
    }); 
  };
  
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  
  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 mb-6 max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" /> Nuovo Lead</h3>
      
      {/* SEZIONE CLIENTE */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Dati Cliente</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">Nome *</label><input type="text" value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} className={inp} placeholder="Mario" /></div>
            <div><label className="block text-slate-400 text-xs mb-1">Cognome</label><input type="text" value={form.cliente_cognome} onChange={(e) => setForm({ ...form, cliente_cognome: e.target.value })} className={inp} placeholder="Rossi" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">Email</label><input type="email" value={form.cliente_email} onChange={(e) => setForm({ ...form, cliente_email: e.target.value })} className={inp} placeholder="mario@email.com" /></div>
            <div><label className="block text-slate-400 text-xs mb-1">Telefono</label><input type="tel" value={form.cliente_telefono} onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value })} className={inp} placeholder="+39 333..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">WhatsApp</label><input type="tel" value={form.cliente_whatsapp} onChange={(e) => setForm({ ...form, cliente_whatsapp: e.target.value })} className={inp} placeholder="+39 333..." /></div>
            <div><label className="block text-slate-400 text-xs mb-1">Nazionalità</label><input type="text" value={form.cliente_nazionalita} onChange={(e) => setForm({ ...form, cliente_nazionalita: e.target.value })} className={inp} placeholder="Italiana" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">Budget Min (AED)</label><input type="number" value={form.cliente_budget_min} onChange={(e) => setForm({ ...form, cliente_budget_min: e.target.value })} className={inp} placeholder="1000000" /></div>
            <div><label className="block text-slate-400 text-xs mb-1">Budget Max (AED)</label><input type="number" value={form.cliente_budget_max} onChange={(e) => setForm({ ...form, cliente_budget_max: e.target.value })} className={inp} placeholder="2000000" /></div>
          </div>
          <div><label className="block text-slate-400 text-xs mb-1">Note Cliente</label><textarea value={form.cliente_note} onChange={(e) => setForm({ ...form, cliente_note: e.target.value })} className={`${inp} h-20`} placeholder="Interessi, preferenze, tempistiche..." /></div>
        </div>
      </div>

      {/* SEZIONE IMMOBILE */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-amber-400" /> Interesse Immobile</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">Developer</label><select value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} className={inp}><option value="">Seleziona</option>{developers.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-slate-400 text-xs mb-1">Zona</label><select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} className={inp}><option value="">Seleziona</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-slate-400 text-xs mb-1">Progetto</label><input type="text" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} className={inp} placeholder="Nome progetto" /></div>
            <div><label className="block text-slate-400 text-xs mb-1">Valore stimato (AED)</label><input type="number" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} className={inp} placeholder="Opzionale" /></div>
          </div>
        </div>
      </div>

      {/* SEZIONE STATO PIPELINE */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <h4 className="text-white font-medium mb-3">Stato Pipeline</h4>
        <div className="flex flex-wrap gap-2">
          {pipelineStati.slice(0, 4).map(stato => (
            <button
              key={stato}
              type="button"
              onClick={() => setForm({ ...form, stato })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                form.stato === stato 
                  ? `${pipelineColors[stato]} text-white` 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {pipelineLabels[stato]}
            </button>
          ))}
        </div>
      </div>

      {/* ALTRI CAMPI */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-slate-400 text-xs mb-1">Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inp} /></div>
          <div><label className="block text-slate-400 text-xs mb-1">{type === 'agente' ? 'Segnalatore' : 'Agente'}</label><input type="text" value={form.altroNome} onChange={(e) => setForm({ ...form, altroNome: e.target.value })} className={inp} placeholder="Opzionale" /></div>
        </div>
      </div>

      {/* BOTTONI */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button>
        <button onClick={handleSubmit} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 font-semibold">Salva Lead</button>
      </div>
    </div>
  );
}

// ==================== SALE FORM ====================
function SaleForm({ type, userName, onSubmit, onCancel }) {
  const [form, setForm] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '', altroNome: '' });
  const handleSubmit = () => { 
    if (!form.developer || !form.progetto || !form.zona || !form.valore) { alert('Compila tutti i campi obbligatori'); return; } 
    onSubmit({ data: form.data, developer: form.developer, progetto: form.progetto, zona: form.zona, valore: parseFloat(form.valore), agente: type === 'agente' ? userName : (form.altroNome || null), segnalatore: type === 'segnalatore' ? userName : (form.altroNome || null) }); 
  };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  return (
    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" /> Registra Vendita Diretta</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-slate-300 text-sm mb-2">Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inp} /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Developer *</label><select value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} className={inp}><option value="">Seleziona</option>{developers.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div><label className="block text-slate-300 text-sm mb-2">Progetto *</label><input type="text" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} className={inp} placeholder="Nome progetto" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-slate-300 text-sm mb-2">Zona *</label><select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} className={inp}><option value="">Seleziona</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
          <div><label className="block text-slate-300 text-sm mb-2">Valore (AED) *</label><input type="number" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} className={inp} placeholder="2000000" /></div>
        </div>
        <div><label className="block text-slate-300 text-sm mb-2">{type === 'agente' ? 'Segnalatore' : 'Agente'} (opzionale)</label><input type="text" value={form.altroNome} onChange={(e) => setForm({ ...form, altroNome: e.target.value })} className={inp} /></div>
        <div className="flex gap-3 pt-4"><button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={handleSubmit} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold">Registra Vendita</button></div>
      </div>
    </div>
  );
}

// ==================== CONVERT LEAD MODAL ====================
function ConvertLeadModal({ sale, onConvert, onCancel }) {
  const [valore, setValore] = useState(sale.valore || '');
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">🎉 Registra Vendita</h3>
        <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
          <div className="text-white font-medium">{sale.progetto}</div>
          <div className="text-slate-400 text-sm">{sale.developer} • {sale.zona}</div>
        </div>
        <div className="mb-4">
          <label className="block text-slate-300 text-sm mb-2">Valore Vendita (AED) *</label>
          <input 
            type="number" 
            value={valore} 
            onChange={(e) => setValore(e.target.value)} 
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg" 
            placeholder="2000000"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button>
          <button 
            onClick={() => valore && onConvert(sale.id, parseFloat(valore))} 
            disabled={!valore}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-xl py-3 font-semibold"
          >
            Conferma Vendita
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD TAB ====================
function DashboardTab({ totals, sales, byStato, byMonth, byAgente, byZona, fmt, pipelineColors }) {
  const sortedMonths = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxMonth = Math.max(...sortedMonths.map(([, v]) => v)) || 1;
  const sortedAgenti = Object.entries(byAgente).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxAgente = sortedAgenti[0]?.[1] || 1;
  const sortedZone = Object.entries(byZona).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-1"><Target className="w-4 h-4" /> Totale Lead</div>
          <div className="text-3xl font-bold text-white">{sales.length}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-300 text-sm mb-1"><DollarSign className="w-4 h-4" /> Volume Vendite</div>
          <div className="text-2xl font-bold text-white">{fmt(totals.valore)} AED</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300 text-sm mb-1"><TrendingUp className="w-4 h-4" /> Commissioni</div>
          <div className="text-2xl font-bold text-white">{fmt(totals.comm)} AED</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-300 text-sm mb-1"><UserCheck className="w-4 h-4" /> Netto KP</div>
          <div className="text-2xl font-bold text-white">{fmt(totals.netto)} AED</div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Pipeline Overview</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Object.entries(byStato).map(([stato, items]) => (
            <div key={stato} className="flex-1 min-w-[100px]">
              <div className={`${pipelineColors[stato]} rounded-lg p-4 text-center text-white`}>
                <div className="text-3xl font-bold">{items.length}</div>
                <div className="text-sm opacity-80 capitalize">{stato}</div>
                <div className="text-xs mt-1 opacity-70">{fmt(items.reduce((s, i) => s + Number(i.valore), 0))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Andamento Mensile</h3>
          <div className="space-y-3">
            {sortedMonths.map(([month, value]) => (
              <div key={month} className="flex items-center gap-3">
                <div className="text-slate-400 text-sm w-20">{month}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${(value / maxMonth) * 100}%` }} />
                </div>
                <div className="text-white text-sm w-24 text-right">{fmt(value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Top Agenti</h3>
          <div className="space-y-3">
            {sortedAgenti.map(([agente, value], i) => (
              <div key={agente} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-600 text-white'}`}>{i + 1}</div>
                <div className="text-white text-sm flex-1 truncate">{agente}</div>
                <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(value / maxAgente) * 100}%` }} />
                </div>
                <div className="text-slate-400 text-sm w-24 text-right">{fmt(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Zone più Vendute</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {sortedZone.map(([zona, value]) => (
            <div key={zona} className="bg-slate-700/50 rounded-lg p-3 text-center">
              <div className="text-white font-medium text-sm truncate">{zona}</div>
              <div className="text-amber-400 font-bold">{fmt(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== VENDITE TAB ====================
function VenditeTab({ sales, allSales, loading, filters, setFilters, uniqueAgenti, updateSale, deleteSale, loadSales, exportToCSV, totals, fmt, clienti }) {
  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <button onClick={loadSales} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cerca..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm w-40" />
          </div>
          <select value={filters.stato} onChange={(e) => setFilters({ ...filters, stato: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Tutti stati</option>
            {pipelineStati.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.agente} onChange={(e) => setFilters({ ...filters, agente: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Tutti agenti</option>
            {uniqueAgenti.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filters.pagato} onChange={(e) => setFilters({ ...filters, pagato: e.target.value })} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">Pagamento</option>
            <option value="si">Pagato</option>
            <option value="no">Non pagato</option>
          </select>
          {(filters.search || filters.stato || filters.agente || filters.pagato) && (
            <button onClick={() => setFilters({ search: '', stato: '', agente: '', zona: '', pagato: '' })} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          )}
        </div>
        <div className="text-slate-400 text-sm mt-2">Mostrando {sales.length} di {allSales.length}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="text-slate-400 text-xs">Lead</div><div className="text-xl font-bold text-white">{sales.length}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="text-slate-400 text-xs">Valore</div><div className="text-lg font-bold text-white">{fmt(totals.valore)}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="text-slate-400 text-xs">Commissioni</div><div className="text-lg font-bold text-amber-400">{fmt(totals.comm)}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="text-slate-400 text-xs">Agenti 70%</div><div className="text-lg font-bold text-blue-400">{fmt(totals.ag)}</div></div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3"><div className="text-slate-400 text-xs">Segnalatori 30%</div><div className="text-lg font-bold text-emerald-400">{fmt(totals.sg)}</div></div>
        <div className="bg-green-900/50 border border-green-700 rounded-xl p-3"><div className="text-green-300 text-xs">Pellegrino</div><div className="text-lg font-bold text-green-400">{fmt(totals.pell)}</div></div>
        <div className="bg-orange-900/50 border border-orange-700 rounded-xl p-3"><div className="text-orange-300 text-xs">Giovanni</div><div className="text-lg font-bold text-orange-400">{fmt(totals.giov)}</div></div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-700/50 text-left">
              <th className="text-slate-300 px-3 py-3">Data</th>
              <th className="text-slate-300 px-3 py-3">Progetto</th>
              <th className="text-slate-300 px-3 py-3">Agente</th>
              <th className="text-slate-300 px-3 py-3">Segnalatore</th>
              <th className="text-slate-300 px-3 py-3 text-right">Valore</th>
              <th className="text-slate-300 px-3 py-3 text-center">%</th>
              <th className="text-slate-300 px-3 py-3 text-center">Stato</th>
              <th className="text-slate-300 px-3 py-3 text-center">Ref.</th>
              <th className="text-slate-300 px-3 py-3 text-center">Pagato</th>
              <th className="text-slate-300 px-3 py-3 text-center">🗑️</th>
            </tr></thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                  <td className="px-3 py-2 text-white">{new Date(s.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-3 py-2"><div className="text-white">{s.progetto}</div><div className="text-slate-500 text-xs">{s.developer} • {s.zona}</div></td>
                  <td className="px-3 py-2 text-blue-400">{s.agente || '-'}</td>
                  <td className="px-3 py-2 text-emerald-400">{s.segnalatore || '-'}</td>
                  <td className="px-3 py-2 text-amber-400 text-right font-medium">{s.valore > 0 ? fmt(s.valore) : '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 rounded px-1 py-1 text-white text-xs w-14">
                      {commissions.map(c => <option key={c} value={c}>{c}%</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select value={s.stato || 'lead'} onChange={(e) => updateSale(s.id, { stato: e.target.value })} className={`${pipelineColors[s.stato || 'lead']} border-0 rounded px-2 py-1 text-white text-xs`}>
                      {pipelineStati.map(st => <option key={st} value={st} className="bg-slate-800">{st}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className={`bg-slate-700 border rounded px-1 py-1 text-xs w-16 ${s.referente ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}>
                      <option value="">--</option>
                      <option value="Pellegrino">Pell.</option>
                      <option value="Giovanni">Giov.</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-2 py-1 rounded text-xs ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {s.pagato ? '✓' : '✗'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center"><button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
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
function PipelineTab({ sales, byStato, updateSale, fmt, pipelineColors, pipelineLabels }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {pipelineStati.map(stato => (
        <div key={stato} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className={`${pipelineColors[stato]} px-4 py-3 text-white font-semibold flex justify-between items-center`}>
            <span>{pipelineLabels[stato]}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{byStato[stato]?.length || 0}</span>
          </div>
          <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {byStato[stato]?.map(sale => (
              <div key={sale.id} className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-white font-medium text-sm truncate">{sale.progetto}</div>
                <div className="text-slate-400 text-xs">{sale.developer}</div>
                <div className="text-slate-500 text-xs">{sale.agente || sale.segnalatore}</div>
                {sale.valore > 0 && <div className="text-amber-400 font-semibold text-sm mt-1">{fmt(sale.valore)} AED</div>}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {pipelineStati.map((st, i) => {
                    const currentIndex = pipelineStati.indexOf(sale.stato || 'lead');
                    const canMoveTo = i === currentIndex + 1 || i === currentIndex - 1;
                    if (!canMoveTo) return null;
                    return (
                      <button key={st} onClick={() => updateSale(sale.id, { stato: st })} className={`text-xs px-2 py-1 rounded ${pipelineColors[st]} text-white opacity-70 hover:opacity-100`}>
                        {i > currentIndex ? '→' : '←'} {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {(!byStato[stato] || byStato[stato].length === 0) && (
              <div className="text-slate-500 text-sm text-center py-4">Vuoto</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== CLIENTI TAB ====================
function ClientiTab({ clienti, loadClienti, createCliente, updateCliente, deleteCliente, showModal, setShowModal, editingCliente, setEditingCliente, sales }) {
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState('');
  const filtered = clienti.filter(c => {
    if (search && !`${c.nome} ${c.cognome} ${c.email} ${c.telefono}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStato && c.stato !== filterStato) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <button onClick={() => { setEditingCliente(null); setShowModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl px-4 py-2 flex items-center gap-2 font-semibold"><UserPlus className="w-4 h-4" /> Nuovo Cliente</button>
        <button onClick={loadClienti} className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4" /></button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm w-48" />
        </div>
        <select value={filterStato} onChange={(e) => setFilterStato(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">Tutti</option>
          {clienteStati.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {clienteStati.map(stato => (
          <div key={stato} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{clienti.filter(c => c.stato === stato).length}</div>
            <div className="text-slate-400 text-xs capitalize">{stato}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cliente => {
          const clienteSales = sales.filter(s => s.cliente_id === cliente.id);
          return (
            <div key={cliente.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-white font-medium">{cliente.nome} {cliente.cognome}</div>
                  <div className="text-slate-400 text-sm">{cliente.nazionalita}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs capitalize ${cliente.stato === 'acquistato' ? 'bg-emerald-500/20 text-emerald-400' : cliente.stato === 'perso' ? 'bg-red-500/20 text-red-400' : cliente.stato === 'trattativa' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600 text-slate-300'}`}>{cliente.stato}</span>
              </div>
              <div className="space-y-1 text-sm mb-3">
                {cliente.telefono && <div className="flex items-center gap-2 text-slate-400"><Phone className="w-3 h-3" /> {cliente.telefono}</div>}
                {cliente.email && <div className="flex items-center gap-2 text-slate-400"><Mail className="w-3 h-3" /> {cliente.email}</div>}
                {cliente.budget_min && <div className="text-slate-400">Budget: {fmt(cliente.budget_min)} - {fmt(cliente.budget_max)} AED</div>}
              </div>
              {clienteSales.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-3">
                  <div className="text-emerald-400 text-xs font-medium">{clienteSales.length} acquist{clienteSales.length > 1 ? 'i' : 'o'}</div>
                </div>
              )}
              {cliente.note && <div className="text-slate-500 text-xs mb-3 line-clamp-2">{cliente.note}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setEditingCliente(cliente); setShowModal(true); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 text-sm flex items-center justify-center gap-1"><Edit2 className="w-3 h-3" /> Modifica</button>
                <button onClick={() => deleteCliente(cliente.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg px-3 py-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessun cliente</div>}
      {showModal && <ClienteModal cliente={editingCliente} onClose={() => { setShowModal(false); setEditingCliente(null); }} onSave={editingCliente ? (data) => updateCliente(editingCliente.id, data) : createCliente} />}
    </>
  );
}

// ==================== CLIENTE MODAL ====================
function ClienteModal({ cliente, onClose, onSave }) {
  const [form, setForm] = useState(cliente || { nome: '', cognome: '', email: '', telefono: '', whatsapp: '', nazionalita: '', note: '', budget_min: '', budget_max: '', fonte: '', stato: 'nuovo' });
  const handleSubmit = async () => { if (!form.nome) { alert('Nome obbligatorio'); return; } await onSave(form); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700 my-8">
        <h3 className="text-xl font-semibold text-white mb-4">{cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</h3>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-300 text-sm mb-1">Nome *</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inp} /></div>
            <div><label className="block text-slate-300 text-sm mb-1">Cognome</label><input type="text" value={form.cognome || ''} onChange={(e) => setForm({ ...form, cognome: e.target.value })} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-300 text-sm mb-1">Email</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></div>
            <div><label className="block text-slate-300 text-sm mb-1">Telefono</label><input type="tel" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-300 text-sm mb-1">WhatsApp</label><input type="tel" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inp} /></div>
            <div><label className="block text-slate-300 text-sm mb-1">Nazionalità</label><input type="text" value={form.nazionalita || ''} onChange={(e) => setForm({ ...form, nazionalita: e.target.value })} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-300 text-sm mb-1">Budget Min</label><input type="number" value={form.budget_min || ''} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} className={inp} /></div>
            <div><label className="block text-slate-300 text-sm mb-1">Budget Max</label><input type="number" value={form.budget_max || ''} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-slate-300 text-sm mb-1">Fonte</label><select value={form.fonte || ''} onChange={(e) => setForm({ ...form, fonte: e.target.value })} className={inp}><option value="">Seleziona</option>{fontiLead.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="block text-slate-300 text-sm mb-1">Stato</label><select value={form.stato || 'nuovo'} onChange={(e) => setForm({ ...form, stato: e.target.value })} className={inp}>{clienteStati.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-slate-300 text-sm mb-1">Note</label><textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${inp} h-24`} /></div>
        </div>
        <div className="flex gap-3 pt-4 mt-4 border-t border-slate-700">
          <button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button>
          <button onClick={handleSubmit} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold">Salva</button>
        </div>
      </div>
    </div>
  );
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin, loading, error, setError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10 flex flex-col items-center"><Logo size="large" /><p className="text-slate-400 mt-4">Sales Management System</p></div>
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto">✕</button></div>}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Accedi</h2>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="space-y-4">
            <div><label className="block text-slate-300 text-sm mb-2">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white" placeholder="Username" /></div>
            <div><label className="block text-slate-300 text-sm mb-2">Password</label><div className="relative"><input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-white" placeholder="Password" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
            <button type="submit" disabled={loading || !username || !password} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-900 rounded-xl py-3 font-semibold mt-6">{loading ? 'Accesso...' : 'Accedi'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== USER MANAGEMENT ====================
function UserManagement({ users, loadUsers, createUser, deleteUser, showUserModal, setShowUserModal }) {
  const [copiedId, setCopiedId] = useState(null);
  const copyCredentials = (u) => { navigator.clipboard.writeText(`KeyPrime\nLink: ${getBaseUrl()}\nUsername: ${u.username}\nPassword: ${u.password}`); setCopiedId(u.id); setTimeout(() => setCopiedId(null), 2000); };
  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-semibold text-white">Gestione Utenti</h2><button onClick={() => setShowUserModal(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl px-4 py-2 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Nuovo</button></div>
      <div className="grid gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div><div className="flex items-center gap-2"><span className="text-white font-medium">{u.nome}</span><span className={`px-2 py-0.5 rounded text-xs ${u.ruolo === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.ruolo === 'agente' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.ruolo}</span></div><div className="text-slate-400 text-sm mt-1">User: <span className="text-white">{u.username}</span> • Pw: <span className="text-white">{u.password}</span>{u.email && <> • <span className="text-white">{u.email}</span></>}</div></div>
              <div className="flex gap-2"><button onClick={() => copyCredentials(u)} className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-1">{copiedId === u.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copiedId === u.id ? 'Copiato!' : 'Copia'}</button>{u.ruolo !== 'admin' && <button onClick={() => deleteUser(u.id)} className="bg-red-500/20 text-red-400 rounded-lg px-3 py-2"><Trash2 className="w-4 h-4" /></button>}</div>
            </div>
          </div>
        ))}
      </div>
      {showUserModal && <NewUserModal onClose={() => setShowUserModal(false)} onCreate={createUser} />}
    </div>
  );
}

function NewUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ nome: '', username: '', password: '', email: '', ruolo: 'agente', referente: 'Pellegrino' });
  const handleSubmit = async () => { if (!form.nome || !form.username || !form.password) { alert('Compila campi obbligatori'); return; } const ok = await onCreate(form); if (ok) onClose(); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Nuovo Utente</h3>
        <div className="space-y-4">
          <div><label className="block text-slate-300 text-sm mb-2">Nome *</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inp} placeholder="Mario Rossi" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Email (per notifiche)</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} placeholder="mario@email.com" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Username *</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inp} placeholder="mario.rossi" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Password *</label><input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} placeholder="password123" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Ruolo</label><select value={form.ruolo} onChange={(e) => setForm({ ...form, ruolo: e.target.value })} className={inp}><option value="agente">Agente</option><option value="segnalatore">Segnalatore</option></select></div>
          <div><label className="block text-slate-300 text-sm mb-2">Referente</label><select value={form.referente} onChange={(e) => setForm({ ...form, referente: e.target.value })} className={inp}><option value="Pellegrino">Pellegrino</option><option value="Giovanni">Giovanni</option></select></div>
          <div className="flex gap-3 pt-4"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={handleSubmit} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold">Crea</button></div>
        </div>
      </div>
    </div>
  );
}
