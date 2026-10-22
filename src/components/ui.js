// Primitive dell'interfaccia KeyPrime.
//
// Vivevano dentro App.js; sono state estratte per poter essere riusate dai
// componenti nuovi (coda di lavoro, inbox lead, messaggi GHL) senza
// duplicarle. I colori arrivano da lib/theme.js.

import React, { useEffect } from 'react';
import {
  Check, X, ChevronRight, ArrowUpRight, ArrowDownRight, Phone, Mail, MessageCircle
} from 'lucide-react';
import { theme } from '../lib/theme';
import { pipelineLabels } from '../lib/costanti';
import { fmt, getInitials, getWhatsAppLink } from '../lib/format';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500' };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${colors[type]} text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-slideUp`}>
      <Check className="w-4 h-4" /><span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Avatar
export const Avatar = ({ nome, cognome, size = 'md', color }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-14 h-14 text-lg' };
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
  const bgColor = color || colors[Math.abs((nome || '').charCodeAt(0) || 0) % colors.length];
  return <div className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}>{getInitials(nome, cognome)}</div>;
};

// Status Badge
export const StatusBadge = ({ status, type = 'pipeline' }) => {
  const config = type === 'pipeline' ? theme.status[status] : type === 'priority' ? theme.priority[status] : theme.status[status];
  if (!config) return null;
  const label = pipelineLabels[status] || status;
  return <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: config.bg, color: config.color }}>{label}</span>;
};

// Card Component
export const Card = ({ children, className = '', hover = false, onClick, padding = 'p-5' }) => (
  <div onClick={onClick} className={`bg-[#141920] border border-[#2b323d] rounded-2xl ${padding} ${hover ? 'hover:border-[#3d4858] hover:bg-[#1b212b] cursor-pointer transition-all duration-200' : ''} ${className}`}>
    {children}
  </div>
);

// Section Header
export const SectionHeader = ({ icon: Icon, title, accent, action, actionLabel, onAction }) => (
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
export const MetricCard = ({ label, value, subValue, icon: Icon, color, trend, onClick }) => (
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
export const ProgressBar = ({ value, max, color = '#A78BFA', height = 'h-2', showLabel = false }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="relative">
      <div className={`${height} bg-zinc-700/50 rounded-full overflow-hidden`}>
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && <span className="absolute right-0 -top-6 text-xs text-zinc-500">{pct.toFixed(0)}%</span>}
    </div>
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action, onAction }) => (
  <Card className="text-center py-12">
    <div className="w-16 h-16 rounded-2xl bg-zinc-700/50 flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-zinc-600" />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
    {action && <button onClick={onAction} className="px-5 py-2.5 bg-oro-500 text-[#0d1116] rounded-xl font-semibold text-sm hover:bg-oro-400 transition-colors">{action}</button>}
  </Card>
);

// Input
export const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
    <input {...props} className="w-full bg-[#141920] border border-[#2b323d] rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#3d4858] focus:ring-1 focus:ring-[#3d4858] transition-all" />
  </div>
);

// Select
export const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-sm text-zinc-400 mb-2">{label}</label>}
    <select {...props} className="w-full bg-[#141920] border border-[#2b323d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3d4858] transition-all appearance-none cursor-pointer">
      {children}
    </select>
  </div>
);

// Button
export const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-oro-500 text-[#0d1116] hover:bg-oro-400 font-semibold',
    secondary: 'bg-zinc-700/50 text-white hover:bg-zinc-700',
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
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-800/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#141920] border border-[#2b323d] rounded-2xl w-full ${sizes[size]} max-h-[85vh] overflow-hidden animate-scaleIn`}>
        <div className="flex items-center justify-between p-5 border-b border-[#2b323d]">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

// Bottom Sheet
export const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4">
      <div className="absolute inset-0 bg-zinc-800/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 md:relative md:max-w-lg md:w-full bg-[#141920] border-t md:border border-[#2b323d] rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-hidden animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-[#2b323d]">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
      </div>
    </div>
  );
};

// Sidebar Nav Item
export const NavItem = ({ icon: Icon, label, active, onClick, accent, badge, isNew }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all relative ${active ? 'bg-white/[0.07] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          style={active ? { boxShadow: `inset 3px 0 0 ${accent || '#c9a84c'}` } : {}}>
    <Icon className="w-5 h-5" style={active ? { color: accent } : {}} />
    <span className="font-medium flex-1">{label}</span>
    {badge > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{badge}</span>}
    {isNew && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded animate-pulse">LIVE</span>}
  </button>
);

// Quick Actions Row
export const QuickActions = ({ phone, whatsapp, email, clienteName }) => (
  <div className="flex gap-2">
    {phone && <a href={`tel:${phone}`} className="flex-1 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Phone className="w-4 h-4" />Chiama</a>}
    {(whatsapp || phone) && <a href={getWhatsAppLink(whatsapp || phone, clienteName ? `Ciao ${clienteName}, ` : '')} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><MessageCircle className="w-4 h-4" />WhatsApp</a>}
    {email && <a href={`mailto:${email}`} className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl py-3 flex items-center justify-center gap-2 text-sm transition-colors"><Mail className="w-4 h-4" />Email</a>}
  </div>
);

