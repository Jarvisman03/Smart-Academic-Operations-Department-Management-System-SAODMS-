import Icon from './Icon';

export { default as Icon } from './Icon';

export function Card({ children, className = '', pad = true }) {
  return <div className={`card ${pad ? 'card-pad' : ''} ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = 'brand', icon }) {
  const tones = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-700',
    rose: 'from-rose-500 to-rose-700',
    amber: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-700',
    slate: 'from-slate-600 to-slate-800',
  };
  return (
    <div className="card card-pad flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${tones[tone]} text-white flex items-center justify-center shrink-0`}>
        {icon ? <Icon name={icon} /> : null}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
        <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, className = '' }) {
  return <span className={`badge ${className}`}>{children}</span>;
}

export function Spinner({ className = 'w-6 h-6' }) {
  return (
    <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
      <Spinner className="w-8 h-8" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', hint }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <p className="font-medium text-slate-500">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div className={`card w-full ${widths[size]} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sticky top-0 bg-white">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><Icon name="x" className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, rows, empty = 'No records' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
            {columns.map((c) => <th key={c.key} className="px-3 py-2.5 font-semibold">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">{empty}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={row._id || i} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((c) => <td key={c.key} className="px-3 py-2.5 text-slate-700">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ name, src, size = 'w-9 h-9' }) {
  const init = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  if (src) return <img src={src} alt={name} className={`${size} rounded-full object-cover`} />;
  return (
    <div className={`${size} rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold`}>
      {init}
    </div>
  );
}

// Small icon-only action button used in table rows.
export function IconButton({ icon, label, onClick, tone = 'slate', className = '' }) {
  const tones = {
    slate: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
    brand: 'text-brand-600 hover:text-brand-800 hover:bg-brand-50',
    rose: 'text-rose-500 hover:text-rose-700 hover:bg-rose-50',
    emerald: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
    amber: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50',
  };
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={`p-1.5 rounded-md transition ${tones[tone]} ${className}`}>
      <Icon name={icon} className="w-4 h-4" />
    </button>
  );
}

// Reusable labeled form field. `as` can be input | textarea | select.
export function Field({ label, as = 'input', children, hint, className = '', ...props }) {
  const Cmp = as;
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {as === 'select' ? (
        <select className="input" {...props}>{children}</select>
      ) : as === 'textarea' ? (
        <textarea className="input" {...props} />
      ) : (
        <Cmp className="input" {...props} />
      )}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// Confirmation dialog for destructive/important actions.
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', tone = 'rose', loading }) {
  if (!open) return null;
  const btn = tone === 'rose' ? 'btn-danger' : 'btn-primary';
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={btn} onClick={onConfirm} disabled={loading}>{loading ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}

// Tab bar. tabs: [{ id, label }]
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${active === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Pagination footer. meta: { page, pages, total }
export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
      <span>Page {meta.page} of {meta.pages} · {meta.total} total</span>
      <div className="flex gap-2">
        <button className="btn-ghost text-xs" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Prev</button>
        <button className="btn-ghost text-xs" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</button>
      </div>
    </div>
  );
}
