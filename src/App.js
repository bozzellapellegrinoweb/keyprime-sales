import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Download, Trash2, Check, RefreshCw, AlertCircle, LogOut, Eye, EyeOff, Copy, UserPlus } from 'lucide-react';

const supabase = createClient(
  'https://wqtylxrrerhbxagdzftn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ'
);

const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];
const getBaseUrl = () => typeof window !== 'undefined' ? window.location.origin : '';

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

const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [adminTab, setAdminTab] = useState('vendite');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    const username = params.get('user');
    if (role && username) {
      verifyDirectAccess(username, role);
    } else {
      const savedUser = localStorage.getItem('keyprime_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setView(parsed.ruolo === 'admin' ? 'admin' : parsed.ruolo);
      }
    }
  }, []);

  const verifyDirectAccess = async (username, role) => {
    const { data } = await supabase.from('user_credentials').select('*').eq('username', username).eq('ruolo', role).eq('attivo', true).single();
    if (data) {
      setUser(data);
      localStorage.setItem('keyprime_user', JSON.stringify(data));
      setView(role === 'admin' ? 'admin' : role);
    }
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

  useEffect(() => { if (user) { loadSales(); if (user.ruolo === 'admin') loadUsers(); } }, [user]);

  const handleLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('user_credentials').select('*').eq('username', username).eq('password', password).eq('attivo', true).single();
    if (err || !data) { setError('Credenziali non valide'); setLoading(false); return; }
    setUser(data);
    localStorage.setItem('keyprime_user', JSON.stringify(data));
    setView(data.ruolo === 'admin' ? 'admin' : data.ruolo);
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('keyprime_user');
    setView('login');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const addSale = async (saleData) => {
    setSaveStatus('Salvataggio...');
    const { error: err } = await supabase.from('sales').insert([{
      ...saleData, referente: user?.referente || null, commission_pct: 5, inserted_by: user?.nome, inserted_as: user?.ruolo, pagato: false
    }]);
    if (err) { setSaveStatus('Errore!'); setError(err.message); }
    else { setSaveStatus('Salvato!'); setShowForm(false); loadSales(); setTimeout(() => setSaveStatus(''), 2000); }
  };

  const updateSale = async (id, updates) => { await supabase.from('sales').update(updates).eq('id', id); loadSales(); };
  const deleteSale = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('sales').delete().eq('id', id); loadSales(); };
  const createUser = async (userData) => { const { error: err } = await supabase.from('user_credentials').insert([userData]); if (err) { setError(err.message); return false; } loadUsers(); setShowUserModal(false); return true; };
  const deleteUser = async (id) => { if (!window.confirm('Eliminare?')) return; await supabase.from('user_credentials').delete().eq('id', id); loadUsers(); };

  const exportToCSV = () => {
    let csv = '\ufeffData,Developer,Agente,Segnalatore,Progetto,Zona,Valore,Comm%,Referente,Pagato\n';
    sales.forEach(s => { csv += `${s.data},"${s.developer}","${s.agente||''}","${s.segnalatore||''}","${s.progetto}","${s.zona}",${s.valore},${s.commission_pct||5}%,${s.referente||''},${s.pagato?'SI':'NO'}\n`; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `KeyPrime_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const ErrorBanner = () => error && (<div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span><button onClick={() => setError(null)} className="ml-auto">✕</button></div>);

  if (view === 'login') return <LoginPage onLogin={handleLogin} loading={loading} error={error} setError={setError} />;

  if (view === 'agente' || view === 'segnalatore') {
    const type = view;
    const mySales = sales.filter(s => type === 'agente' ? s.agente === user?.nome : s.segnalatore === user?.nome);
    const rate = type === 'agente' ? 0.7 : 0.3;
    const totalComm = mySales.reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);
    const pagate = mySales.filter(s => s.pagato).reduce((sum, s) => sum + (Number(s.valore) * (s.commission_pct || 5) / 100 * rate), 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Logo size="small" />
            <div className="flex items-center gap-4">
              <div className="text-right"><div className="text-slate-400 text-sm">{type === 'agente' ? 'Agente' : 'Segnalatore'}</div><div className="text-white font-medium">{user?.nome}</div></div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
          <ErrorBanner />
          {saveStatus && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-xl px-4 py-2 mb-4 text-center">{saveStatus}</div>}
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4"><div className="text-slate-400 text-sm">Vendite</div><div className="text-3xl font-bold text-white">{mySales.length}</div></div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4"><div className="text-slate-400 text-sm">Commissioni</div><div className="text-2xl font-bold text-amber-400">{fmt(totalComm)} AED</div></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4"><div className="text-emerald-300 text-sm">✓ Pagate</div><div className="text-xl font-bold text-emerald-400">{fmt(pagate)} AED</div></div>
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4"><div className="text-red-300 text-sm">⏳ Da Pagare</div><div className="text-xl font-bold text-red-400">{fmt(totalComm - pagate)} AED</div></div>
          </div>

          {!showForm ? (<button onClick={() => setShowForm(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl p-4 flex items-center justify-center gap-2 mb-6 font-semibold"><Plus className="w-5 h-5" /> Nuova {type === 'agente' ? 'Vendita' : 'Segnalazione'}</button>) : (<SaleForm type={type} userName={user?.nome} onSubmit={addSale} onCancel={() => setShowForm(false)} />)}

          <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-semibold text-white">Le tue {type === 'agente' ? 'vendite' : 'segnalazioni'}</h3><button onClick={loadSales} className="text-slate-400 hover:text-white"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button></div>

          {mySales.length === 0 ? (<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500">Nessuna vendita</div>) : (
            <div className="space-y-3">
              {mySales.map(sale => {
                const myComm = Number(sale.valore) * (sale.commission_pct || 5) / 100 * rate;
                return (
                  <div key={sale.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div><div className="text-white font-medium">{sale.progetto}</div><div className="text-slate-400 text-sm">{sale.developer} • {sale.zona}</div></div>
                      <div className="text-right"><div className="text-amber-400 font-semibold">{fmt(sale.valore)} AED</div><div className="text-slate-500 text-sm">{new Date(sale.data).toLocaleDateString('it-IT')}</div></div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                      <div className="text-sm"><span className="text-slate-400">Commissione: </span><span className="text-amber-300 font-medium">{fmt(myComm)} AED</span><span className="text-slate-500"> ({sale.commission_pct || 5}%)</span></div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${sale.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{sale.pagato ? '✓ Pagata' : '⏳ Non pagata'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

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

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Logo size="small" />
            <div className="flex items-center gap-4"><div className="text-right"><div className="text-slate-400 text-sm">Admin</div><div className="text-white font-medium">{user?.nome}</div></div><button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button></div>
          </div>
          <ErrorBanner />

          <div className="flex gap-2 mb-6">
            <button onClick={() => setAdminTab('vendite')} className={`px-4 py-2 rounded-xl font-medium ${adminTab === 'vendite' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>📊 Vendite</button>
            <button onClick={() => setAdminTab('utenti')} className={`px-4 py-2 rounded-xl font-medium ${adminTab === 'utenti' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-white'}`}>👥 Utenti</button>
          </div>

          {adminTab === 'vendite' && (
            <>
              <div className="flex gap-2 mb-6">
                <button onClick={loadSales} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 py-2 flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><div className="text-slate-400 text-xs">Vendite</div><div className="text-2xl font-bold text-white">{sales.length}</div></div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><div className="text-slate-400 text-xs">Valore</div><div className="text-lg font-bold text-white">{fmt(totals.valore)}</div></div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><div className="text-slate-400 text-xs">Commissioni</div><div className="text-lg font-bold text-amber-400">{fmt(totals.comm)}</div></div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><div className="text-slate-400 text-xs">Agenti 70%</div><div className="text-lg font-bold text-blue-400">{fmt(totals.ag)}</div></div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4"><div className="text-slate-400 text-xs">Segnalatori 30%</div><div className="text-lg font-bold text-emerald-400">{fmt(totals.sg)}</div></div>
                <div className="bg-green-900/50 border border-green-700 rounded-xl p-4"><div className="text-green-300 text-xs">Pellegrino</div><div className="text-lg font-bold text-green-400">{fmt(totals.pell)}</div></div>
                <div className="bg-orange-900/50 border border-orange-700 rounded-xl p-4"><div className="text-orange-300 text-xs">Giovanni</div><div className="text-lg font-bold text-orange-400">{fmt(totals.giov)}</div></div>
              </div>

              <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center"><div><div className="text-amber-300 text-sm">Netto KeyPrime</div><div className="text-2xl font-bold text-amber-400">{fmt(totals.netto)} AED</div></div><div className="text-right">{Math.abs(totals.netto - totals.pell - totals.giov) < 1 ? <span className="text-emerald-400 text-sm"><Check className="w-4 h-4 inline" /> OK</span> : <span className="text-red-400 text-sm">⚠️ Assegna referenti</span>}</div></div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-700/50 text-left"><th className="text-slate-300 px-3 py-3">Data</th><th className="text-slate-300 px-3 py-3">Developer</th><th className="text-slate-300 px-3 py-3">Progetto</th><th className="text-slate-300 px-3 py-3">Agente</th><th className="text-slate-300 px-3 py-3">Segnalatore</th><th className="text-slate-300 px-3 py-3 text-right">Valore</th><th className="text-slate-300 px-3 py-3 text-center">%</th><th className="text-slate-300 px-3 py-3 text-center">Ref.</th><th className="text-slate-300 px-3 py-3 text-center">Pagato</th><th className="text-slate-300 px-3 py-3 text-center">🗑️</th></tr></thead>
                    <tbody>
                      {sales.map(s => (
                        <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-white">{new Date(s.data).toLocaleDateString('it-IT')}</td>
                          <td className="px-3 py-2 text-white">{s.developer}</td>
                          <td className="px-3 py-2 text-white">{s.progetto}</td>
                          <td className="px-3 py-2 text-blue-400">{s.agente || '-'}</td>
                          <td className="px-3 py-2 text-emerald-400">{s.segnalatore || '-'}</td>
                          <td className="px-3 py-2 text-amber-400 text-right">{fmt(s.valore)}</td>
                          <td className="px-3 py-2 text-center"><select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 rounded px-1 py-1 text-white text-xs w-14">{commissions.map(c => <option key={c} value={c}>{c}%</option>)}</select></td>
                          <td className="px-3 py-2 text-center"><select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className={`bg-slate-700 border rounded px-1 py-1 text-xs w-20 ${s.referente ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}><option value="">--</option><option value="Pellegrino">Pell.</option><option value="Giovanni">Giov.</option></select></td>
                          <td className="px-3 py-2 text-center"><button onClick={() => updateSale(s.id, { pagato: !s.pagato })} className={`px-2 py-1 rounded text-xs ${s.pagato ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.pagato ? '✓ Sì' : '✗ No'}</button></td>
                          <td className="px-3 py-2 text-center"><button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {adminTab === 'utenti' && <UserManagement users={users} loadUsers={loadUsers} createUser={createUser} deleteUser={deleteUser} showUserModal={showUserModal} setShowUserModal={setShowUserModal} />}
        </div>
      </div>
    );
  }
  return null;
}

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

function SaleForm({ type, userName, onSubmit, onCancel }) {
  const [form, setForm] = useState({ data: new Date().toISOString().split('T')[0], developer: '', progetto: '', zona: '', valore: '', altroNome: '' });
  const handleSubmit = () => { if (!form.developer || !form.progetto || !form.zona || !form.valore) { alert('Compila tutti i campi'); return; } onSubmit({ data: form.data, developer: form.developer, progetto: form.progetto, zona: form.zona, valore: parseFloat(form.valore), agente: type === 'agente' ? userName : (form.altroNome || null), segnalatore: type === 'segnalatore' ? userName : (form.altroNome || null) }); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Nuova {type === 'agente' ? 'Vendita' : 'Segnalazione'}</h3>
      <div className="space-y-4">
        <div><label className="block text-slate-300 text-sm mb-2">Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inp} /></div>
        <div><label className="block text-slate-300 text-sm mb-2">Developer</label><select value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} className={inp}><option value="">Seleziona</option>{developers.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
        <div><label className="block text-slate-300 text-sm mb-2">Progetto</label><input type="text" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} className={inp} placeholder="Nome progetto" /></div>
        <div><label className="block text-slate-300 text-sm mb-2">Zona</label><select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} className={inp}><option value="">Seleziona</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
        <div><label className="block text-slate-300 text-sm mb-2">Valore (AED)</label><input type="number" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} className={inp} placeholder="2000000" /></div>
        <div><label className="block text-slate-300 text-sm mb-2">{type === 'agente' ? 'Segnalatore' : 'Agente'} (opzionale)</label><input type="text" value={form.altroNome} onChange={(e) => setForm({ ...form, altroNome: e.target.value })} className={inp} /></div>
        <div className="flex gap-3 pt-4"><button onClick={onCancel} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={handleSubmit} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold">Salva</button></div>
      </div>
    </div>
  );
}

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
              <div><div className="flex items-center gap-2"><span className="text-white font-medium">{u.nome}</span><span className={`px-2 py-0.5 rounded text-xs ${u.ruolo === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.ruolo === 'agente' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{u.ruolo}</span></div><div className="text-slate-400 text-sm mt-1">User: <span className="text-white">{u.username}</span> • Pw: <span className="text-white">{u.password}</span></div></div>
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
  const [form, setForm] = useState({ nome: '', username: '', password: '', ruolo: 'agente', referente: 'Pellegrino' });
  const handleSubmit = async () => { if (!form.nome || !form.username || !form.password) { alert('Compila tutti i campi'); return; } const ok = await onCreate(form); if (ok) onClose(); };
  const inp = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Nuovo Utente</h3>
        <div className="space-y-4">
          <div><label className="block text-slate-300 text-sm mb-2">Nome completo</label><input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inp} placeholder="Mario Rossi" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Username</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inp} placeholder="mario.rossi" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Password</label><input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} placeholder="password123" /></div>
          <div><label className="block text-slate-300 text-sm mb-2">Ruolo</label><select value={form.ruolo} onChange={(e) => setForm({ ...form, ruolo: e.target.value })} className={inp}><option value="agente">Agente</option><option value="segnalatore">Segnalatore</option></select></div>
          <div><label className="block text-slate-300 text-sm mb-2">Referente</label><select value={form.referente} onChange={(e) => setForm({ ...form, referente: e.target.value })} className={inp}><option value="Pellegrino">Pellegrino</option><option value="Giovanni">Giovanni</option></select></div>
          <div className="flex gap-3 pt-4"><button onClick={onClose} className="flex-1 bg-slate-700 text-white rounded-xl py-3">Annulla</button><button onClick={handleSubmit} className="flex-1 bg-amber-500 text-slate-900 rounded-xl py-3 font-semibold">Crea Utente</button></div>
        </div>
      </div>
    </div>
  );
}
