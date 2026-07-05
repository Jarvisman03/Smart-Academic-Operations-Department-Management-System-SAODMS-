import { NavLink } from 'react-router-dom';
import { Icon } from '../components/ui';
import { navItems } from '../utils/nav';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open, onClose }) {
  const { hasPermission } = useAuth();
  const items = navItems.filter((i) => {
    if (i.perm && !hasPermission(i.perm)) return false;
    if (i.anyPerm && !i.anyPerm.some((p) => hasPermission(p))) return false;
    return true;
  });

  // Auto-close only on small screens (mobile drawer); keep it open on desktop.
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed z-40 lg:static inset-y-0 left-0 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${open ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-0 lg:min-w-0 lg:overflow-hidden'}`}>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-extrabold text-white">S</div>
          <div>
            <div className="text-white font-bold leading-tight">SAODMS</div>
            <div className="text-[10px] text-slate-400 tracking-wide">SIRT · CSE</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon name={item.icon} className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-[11px] text-slate-500 border-t border-slate-800">
          Academic Operations Center
        </div>
      </aside>
    </>
  );
}
