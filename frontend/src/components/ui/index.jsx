import { X, AlertTriangle } from 'lucide-react';

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-[1.5px]' : size === 'lg' ? 'w-8 h-8 border-[3px]' : 'w-5 h-5 border-2';
  return (
    <div className={`${s} border-gray-200 border-t-[#1a5e3a] rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><Icon size={24} className="text-gray-400" /></div>}
      <p className="font-semibold text-gray-700">{title}</p>
      {sub && <p className="text-sm text-gray-400 mt-1 max-w-xs">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const maxW = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' }[size];
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${maxW} w-full`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        {danger && <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-red-600" />
        </div>}
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input className="input pl-8" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Active:    'badge-blue',
    Dispensed: 'badge-green',
    Partial:   'badge-yellow',
    Expired:   'badge-red',
    Paid:      'badge-green',
    Unpaid:    'badge-red',
    Pending:   'badge-yellow',
    Received:  'badge-green',
    Cancelled: 'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
}
