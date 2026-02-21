import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Download, Trash2, ArrowLeft, Check, RefreshCw, AlertCircle } from 'lucide-react';

// ============================================
// SUPABASE CLIENT
// ============================================
const supabase = createClient(
  'https://wqtylxrrerhbxagdzftn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdHlseHJyZXJoYnhhZ2R6ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjkyNjAsImV4cCI6MjA4NzI0NTI2MH0.oXUs9ITNi6lEFat_5FH0x-Exw5MDgRhwx6T0yL3xiWQ'
);

// ============================================
// CONSTANTS
// ============================================
const zones = ['Palm Jumeirah', 'Dubai Marina', 'Downtown', 'Dubai Creek', 'JBR', 'Business Bay', 'JLT', 'DIFC', 'MBR City', 'Dubai Hills', 'Altro'];
const developers = ['Emaar', 'Damac', 'Sobha', 'Meraas', 'Nakheel', 'Dubai Properties', 'Azizi', 'Danube', 'Binghatti', 'Altro'];
const commissions = [2, 4, 5, 6];

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [view, setView] = useState('home');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Load sales from Supabase
  const loadSales = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try view first
      let { data, error } = await supabase
        .from('sales_with_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // Fallback to regular table
        const result = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      setSales(data || []);
    } catch (e) {
      console.error('Load error:', e);
      setError('Errore caricamento: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleViewChange = (newView) => {
    if ((newView === 'agente' || newView === 'segnalatore') && !userName) {
      setPendingView(newView);
      setShowNameModal(true);
    } else {
      setView(newView);
      setShowForm(false);
    }
  };

  const confirmUserName = () => {
    if (userNameInput.trim()) {
      setUserName(userNameInput.trim());
      setShowNameModal(false);
      setView(pendingView);
      setPendingView(null);
      setUserNameInput('');
    }
  };

  const addSale = async (saleData) => {
    setSaveStatus('Salvataggio...');
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([{
          data: saleData.data,
          developer: saleData.developer,
          progetto: saleData.progetto,
          zona: saleData.zona,
          valore: Number(saleData.valore),
          agente: saleData.agente || null,
          segnalatore: saleData.segnalatore || null,
          referente: null,
          commission_pct: 5,
          inserted_by: saleData.inserted_by,
          inserted_as: saleData.inserted_as
        }])
        .select();
      
      if (error) throw error;
      
      setSaveStatus('Salvato!');
      setShowForm(false);
      loadSales();
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (e) {
      console.error('Insert error:', e);
      setSaveStatus('Errore!');
      setError('Errore salvataggio: ' + e.message);
    }
  };

  const updateSale = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      loadSales();
    } catch (e) {
      console.error('Update error:', e);
      setError('Errore aggiornamento: ' + e.message);
    }
  };

  const deleteSale = async (id) => {
    if (!window.confirm('Eliminare questa vendita?')) return;
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadSales();
    } catch (e) {
      console.error('Delete error:', e);
      setError('Errore eliminazione: ' + e.message);
    }
  };

  const exportToCSV = () => {
    let csv = '\ufeffData,Developer,Agente,Segnalatore,Progetto,Zona,Valore (AED),Comm %,Referente,Comm Totale,Agente 70%,Segnal 30%,Netto KP,Pellegrino,Giovanni\n';
    sales.forEach(s => {
      const commTotale = Number(s.comm_totale) || (Number(s.valore) * (s.commission_pct || 5) / 100);
      const agente70 = Number(s.agente_70) || (s.agente ? commTotale * 0.7 : 0);
      const segnal30 = Number(s.segnalatore_30) || (s.segnalatore ? commTotale * 0.3 : 0);
      const nettoKP = Number(s.netto_kp) || (commTotale - agente70 - segnal30);
      const pellegrino = Number(s.pellegrino_quota) || (s.referente === 'Pellegrino' ? nettoKP * 0.7 : (s.referente === 'Giovanni' ? nettoKP * 0.3 : 0));
      const giovanni = Number(s.giovanni_quota) || (s.referente === 'Giovanni' ? nettoKP * 0.7 : (s.referente === 'Pellegrino' ? nettoKP * 0.3 : 0));
      
      csv += `${s.data},"${s.developer}","${s.agente || ''}","${s.segnalatore || ''}","${s.progetto}","${s.zona}",${s.valore},${s.commission_pct || 5}%,${s.referente || ''},${commTotale.toFixed(0)},${agente70.toFixed(0)},${segnal30.toFixed(0)},${nettoKP.toFixed(0)},${pellegrino.toFixed(0)},${giovanni.toFixed(0)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KeyPrime_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Logo
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
          <span style={{ color: '#2C3E50' }}>KEY</span>
          <span style={{ color: '#3D5A6C' }}>PRIME</span>
        </div>
        <div className={`tracking-widest ${size === 'large' ? 'text-sm' : 'text-xs'}`} style={{ color: '#C9B99A' }}>
          real estate brokerage
        </div>
      </div>
    </div>
  );

  const fmt = (n) => (n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Sale Form
  const SaleForm = ({ type, onSubmit, onCancel }) => {
    const [form, setForm] = useState({
      data: new Date().toISOString().split('T')[0],
      developer: '',
      developerAltro: '',
      progetto: '',
      zona: '',
      zonaAltro: '',
      valore: '',
      altroNome: ''
    });

    const handleSubmit = () => {
      if (!form.developer || !form.progetto || !form.zona || !form.valore) {
        alert('Compila tutti i campi obbligatori');
        return;
      }
      onSubmit({
        data: form.data,
        developer: form.developer === 'Altro' ? form.developerAltro : form.developer,
        progetto: form.progetto,
        zona: form.zona === 'Altro' ? form.zonaAltro : form.zona,
        valore: parseFloat(form.valore),
        agente: type === 'agente' ? userName : (form.altroNome || null),
        segnalatore: type === 'segnalatore' ? userName : (form.altroNome || null),
        inserted_by: userName,
        inserted_as: type
      });
    };

    const inputClass = "w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50";

    return (
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Nuova {type === 'agente' ? 'Vendita' : 'Segnalazione'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Data *</label>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">Developer *</label>
            <select value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} className={inputClass}>
              <option value="">Seleziona</option>
              {developers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {form.developer === 'Altro' && <input type="text" value={form.developerAltro} onChange={(e) => setForm({ ...form, developerAltro: e.target.value })} placeholder="Nome developer" className={`${inputClass} mt-2`} />}
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">Progetto *</label>
            <input type="text" value={form.progetto} onChange={(e) => setForm({ ...form, progetto: e.target.value })} placeholder="Nome progetto" className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">Zona *</label>
            <select value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} className={inputClass}>
              <option value="">Seleziona</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            {form.zona === 'Altro' && <input type="text" value={form.zonaAltro} onChange={(e) => setForm({ ...form, zonaAltro: e.target.value })} placeholder="Nome zona" className={`${inputClass} mt-2`} />}
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">Valore Unità (AED) *</label>
            <input type="number" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} placeholder="2000000" className={inputClass} />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">{type === 'agente' ? 'Segnalatore (opzionale)' : 'Agente (opzionale)'}</label>
            <input type="text" value={form.altroNome} onChange={(e) => setForm({ ...form, altroNome: e.target.value })} placeholder={type === 'agente' ? 'Nome segnalatore' : 'Nome agente'} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Annulla</button>
            <button onClick={handleSubmit} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl py-3 font-semibold transition-colors">Salva</button>
          </div>
        </div>
      </div>
    );
  };

  // Error banner
  const ErrorBanner = () => error && (
    <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <span className="text-sm break-all">{error}</span>
      <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 flex-shrink-0">✕</button>
    </div>
  );

  // HOME
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10 flex flex-col items-center">
            <Logo size="large" />
            <p className="text-slate-400 mt-4">Sales Management System</p>
            {loading && <p className="text-amber-400 mt-2 text-sm">Connessione...</p>}
          </div>

          <ErrorBanner />

          <div className="space-y-4">
            <button onClick={() => handleViewChange('agente')} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">👤</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Sono un Agente</div>
                <div className="text-blue-200 text-sm">Inserisci le tue vendite</div>
              </div>
            </button>

            <button onClick={() => handleViewChange('segnalatore')} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🤝</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Sono un Segnalatore</div>
                <div className="text-emerald-200 text-sm">Inserisci le tue segnalazioni</div>
              </div>
            </button>

            <button onClick={() => setView('admin')} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 rounded-xl p-5 flex items-center gap-4 transition-all shadow-lg">
              <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Admin Dashboard</div>
                <div className="text-amber-800 text-sm">Gestisci e esporta dati</div>
              </div>
            </button>
          </div>

          {sales.length > 0 && (
            <div className="mt-8 text-center text-slate-400 text-sm">
              📊 {sales.length} vendite nel database
            </div>
          )}
        </div>

        {showNameModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Come ti chiami?</h3>
              <input type="text" value={userNameInput} onChange={(e) => setUserNameInput(e.target.value)} placeholder="Il tuo nome completo" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4" onKeyDown={(e) => e.key === 'Enter' && confirmUserName()} autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setShowNameModal(false); setPendingView(null); setUserNameInput(''); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-colors">Annulla</button>
                <button onClick={confirmUserName} disabled={!userNameInput.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-slate-900 rounded-xl py-3 font-semibold transition-colors">Conferma</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // AGENTE / SEGNALATORE
  if (view === 'agente' || view === 'segnalatore') {
    const type = view;
    const mySales = sales.filter(s => type === 'agente' ? s.agente === userName : s.segnalatore === userName);
    const color = type === 'agente' ? 'blue' : 'emerald';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setView('home'); setUserName(''); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Home
            </button>
            <div className="text-right">
              <div className="text-slate-400 text-sm">{type === 'agente' ? 'Agente' : 'Segnalatore'}</div>
              <div className="text-white font-medium">{userName}</div>
            </div>
          </div>

          <ErrorBanner />

          {saveStatus && (
            <div className={`${saveStatus.includes('Errore') ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'} border rounded-xl px-4 py-2 mb-4 text-center text-sm flex items-center justify-center gap-2`}>
              {saveStatus.includes('Errore') ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />} {saveStatus}
            </div>
          )}

          <div className={`bg-gradient-to-r ${color === 'blue' ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' : 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30'} border rounded-2xl p-6 mb-6`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-400 text-sm">Vendite</div>
                <div className="text-3xl font-bold text-white">{mySales.length}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm">Valore Totale</div>
                <div className="text-2xl font-bold text-white">{fmt(mySales.reduce((sum, s) => sum + Number(s.valore || 0), 0))} AED</div>
              </div>
            </div>
          </div>

          {!showForm ? (
            <button onClick={() => setShowForm(true)} className={`w-full bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'} text-white rounded-xl p-4 flex items-center justify-center gap-2 mb-6 transition-all`}>
              <Plus className="w-5 h-5" /> Nuova {type === 'agente' ? 'Vendita' : 'Segnalazione'}
            </button>
          ) : (
            <SaleForm type={type} onSubmit={addSale} onCancel={() => setShowForm(false)} />
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Le tue {type === 'agente' ? 'vendite' : 'segnalazioni'}</h3>
            <button onClick={loadSales} className="text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="text-center text-slate-400 py-8">Caricamento...</div>
          ) : mySales.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
              Nessuna {type === 'agente' ? 'vendita' : 'segnalazione'} ancora
            </div>
          ) : (
            <div className="space-y-3">
              {mySales.map(sale => (
                <div key={sale.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{sale.progetto}</div>
                      <div className="text-slate-400 text-sm">{sale.developer} • {sale.zona}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-semibold">{fmt(sale.valore)} AED</div>
                      <div className="text-slate-500 text-sm">{new Date(sale.data).toLocaleDateString('it-IT')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (view === 'admin') {
    const totals = sales.reduce((acc, s) => {
      const commTotale = Number(s.comm_totale) || (Number(s.valore) * (s.commission_pct || 5) / 100);
      const agente70 = Number(s.agente_70) || (s.agente ? commTotale * 0.7 : 0);
      const segnal30 = Number(s.segnalatore_30) || (s.segnalatore ? commTotale * 0.3 : 0);
      const nettoKP = Number(s.netto_kp) || (commTotale - agente70 - segnal30);
      const pellegrino = Number(s.pellegrino_quota) || (s.referente === 'Pellegrino' ? nettoKP * 0.7 : (s.referente === 'Giovanni' ? nettoKP * 0.3 : 0));
      const giovanni = Number(s.giovanni_quota) || (s.referente === 'Giovanni' ? nettoKP * 0.7 : (s.referente === 'Pellegrino' ? nettoKP * 0.3 : 0));
      
      return {
        valore: acc.valore + Number(s.valore || 0),
        commTotale: acc.commTotale + commTotale,
        agente70: acc.agente70 + agente70,
        segnal30: acc.segnal30 + segnal30,
        nettoKP: acc.nettoKP + nettoKP,
        pellegrino: acc.pellegrino + pellegrino,
        giovanni: acc.giovanni + giovanni
      };
    }, { valore: 0, commTotale: 0, agente70: 0, segnal30: 0, nettoKP: 0, pellegrino: 0, giovanni: 0 });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Home
            </button>
            <Logo size="small" />
            <div className="flex gap-2">
              <button onClick={loadSales} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Aggiorna
              </button>
              <button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>

          <ErrorBanner />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs">Vendite</div>
              <div className="text-2xl font-bold text-white">{sales.length}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs">Valore Totale</div>
              <div className="text-lg font-bold text-white">{fmt(totals.valore)}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs">Commissioni</div>
              <div className="text-lg font-bold text-amber-400">{fmt(totals.commTotale)}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs">Agenti 70%</div>
              <div className="text-lg font-bold text-blue-400">{fmt(totals.agente70)}</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs">Segnalatori 30%</div>
              <div className="text-lg font-bold text-emerald-400">{fmt(totals.segnal30)}</div>
            </div>
            <div className="bg-green-900/50 border border-green-700 rounded-xl p-4">
              <div className="text-green-300 text-xs">Pellegrino</div>
              <div className="text-lg font-bold text-green-400">{fmt(totals.pellegrino)}</div>
            </div>
            <div className="bg-orange-900/50 border border-orange-700 rounded-xl p-4">
              <div className="text-orange-300 text-xs">Giovanni</div>
              <div className="text-lg font-bold text-orange-400">{fmt(totals.giovanni)}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <div className="text-amber-300 text-sm">Netto KeyPrime</div>
                <div className="text-2xl font-bold text-amber-400">{fmt(totals.nettoKP)} AED</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm">P + G = {fmt(totals.pellegrino + totals.giovanni)} AED</div>
                {Math.abs(totals.nettoKP - totals.pellegrino - totals.giovanni) < 1 ? (
                  <div className="text-emerald-400 text-sm flex items-center gap-1 justify-end"><Check className="w-4 h-4" /> OK</div>
                ) : (
                  <div className="text-red-400 text-sm">⚠️ Assegna referenti</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-700/50 text-left">
                    <th className="text-slate-300 font-medium px-3 py-3">Data</th>
                    <th className="text-slate-300 font-medium px-3 py-3">Developer</th>
                    <th className="text-slate-300 font-medium px-3 py-3">Progetto</th>
                    <th className="text-slate-300 font-medium px-3 py-3">Zona</th>
                    <th className="text-slate-300 font-medium px-3 py-3">Agente</th>
                    <th className="text-slate-300 font-medium px-3 py-3">Segnalatore</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Valore</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-center">%</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Comm.</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Ag.70%</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Seg.30%</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Netto</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-center">Ref.</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Pell.</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-right">Giov.</th>
                    <th className="text-slate-300 font-medium px-3 py-3 text-center">🗑️</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="16" className="text-center text-slate-400 py-8">Caricamento...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan="16" className="text-center text-slate-500 py-8">Nessuna vendita</td></tr>
                  ) : (
                    sales.map(s => {
                      const commTotale = Number(s.comm_totale) || (Number(s.valore) * (s.commission_pct || 5) / 100);
                      const agente70 = Number(s.agente_70) || (s.agente ? commTotale * 0.7 : 0);
                      const segnal30 = Number(s.segnalatore_30) || (s.segnalatore ? commTotale * 0.3 : 0);
                      const nettoKP = Number(s.netto_kp) || (commTotale - agente70 - segnal30);
                      const pellegrino = Number(s.pellegrino_quota) || (s.referente === 'Pellegrino' ? nettoKP * 0.7 : (s.referente === 'Giovanni' ? nettoKP * 0.3 : 0));
                      const giovanni = Number(s.giovanni_quota) || (s.referente === 'Giovanni' ? nettoKP * 0.7 : (s.referente === 'Pellegrino' ? nettoKP * 0.3 : 0));

                      return (
                        <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                          <td className="px-3 py-2 text-white">{new Date(s.data).toLocaleDateString('it-IT')}</td>
                          <td className="px-3 py-2 text-white">{s.developer}</td>
                          <td className="px-3 py-2 text-white">{s.progetto}</td>
                          <td className="px-3 py-2 text-slate-400">{s.zona}</td>
                          <td className="px-3 py-2 text-blue-400">{s.agente || '-'}</td>
                          <td className="px-3 py-2 text-emerald-400">{s.segnalatore || '-'}</td>
                          <td className="px-3 py-2 text-amber-400 text-right font-medium">{fmt(s.valore)}</td>
                          <td className="px-3 py-2 text-center">
                            <select value={s.commission_pct || 5} onChange={(e) => updateSale(s.id, { commission_pct: parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 rounded px-1 py-1 text-white text-xs w-12">
                              {commissions.map(c => <option key={c} value={c}>{c}%</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-amber-300 text-right">{fmt(commTotale)}</td>
                          <td className="px-3 py-2 text-blue-300 text-right">{fmt(agente70)}</td>
                          <td className="px-3 py-2 text-emerald-300 text-right">{fmt(segnal30)}</td>
                          <td className="px-3 py-2 text-amber-200 text-right font-medium">{fmt(nettoKP)}</td>
                          <td className="px-3 py-2 text-center">
                            <select value={s.referente || ''} onChange={(e) => updateSale(s.id, { referente: e.target.value || null })} className={`bg-slate-700 border rounded px-1 py-1 text-xs w-20 ${s.referente ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}>
                              <option value="">--</option>
                              <option value="Pellegrino">Pell.</option>
                              <option value="Giovanni">Giov.</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-green-400 text-right">{fmt(pellegrino)}</td>
                          <td className="px-3 py-2 text-orange-400 text-right">{fmt(giovanni)}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sales.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-700/70 font-bold">
                      <td colSpan="6" className="px-3 py-3 text-white">TOTALE</td>
                      <td className="px-3 py-3 text-amber-400 text-right">{fmt(totals.valore)}</td>
                      <td></td>
                      <td className="px-3 py-3 text-amber-300 text-right">{fmt(totals.commTotale)}</td>
                      <td className="px-3 py-3 text-blue-300 text-right">{fmt(totals.agente70)}</td>
                      <td className="px-3 py-3 text-emerald-300 text-right">{fmt(totals.segnal30)}</td>
                      <td className="px-3 py-3 text-amber-200 text-right">{fmt(totals.nettoKP)}</td>
                      <td></td>
                      <td className="px-3 py-3 text-green-400 text-right">{fmt(totals.pellegrino)}</td>
                      <td className="px-3 py-3 text-orange-400 text-right">{fmt(totals.giovanni)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
