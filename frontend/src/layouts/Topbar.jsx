import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { searchApi, notificationApi } from '../api/endpoints';
import { roleLabels } from '../utils/format';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { connected, notifications } = useSocket();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    notificationApi.list({ unread: true, limit: 1 }).then((r) => setUnread(r.meta?.unread || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    const sock = notifications?.current;
    if (!sock) return undefined;
    const handler = () => setUnread((u) => u + 1);
    sock.on('notification:new', handler);
    return () => sock.off('notification:new', handler);
  }, [notifications]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return undefined; }
    const t = setTimeout(() => {
      searchApi.global({ q }).then((r) => setResults(r.data)).catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-20">
      <button onClick={onMenu} className="text-slate-500 hover:text-slate-800" aria-label="Toggle sidebar"><Icon name="menu" /></button>

      <div className="relative flex-1 max-w-md" ref={boxRef}>
        <div className="relative">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search faculty, students, rooms..."
            className="input pl-9"
          />
        </div>
        {results && (
          <div className="absolute mt-1 w-full card p-2 max-h-80 overflow-y-auto z-30" onMouseDown={(e) => e.preventDefault()}>
            {Object.entries(results).every(([, v]) => !v?.length) && <p className="text-sm text-slate-400 p-2">No results</p>}
            {Object.entries(results).map(([group, items]) => (items?.length ? (
              <div key={group} className="mb-1">
                <div className="text-[10px] uppercase text-slate-400 px-2 py-1">{group}</div>
                {items.map((it) => (
                  <div key={it._id} className="px-2 py-1.5 text-sm hover:bg-slate-50 rounded cursor-pointer">
                    {it.user?.name || it.name || it.title || it.roomNumber || it.code}
                  </div>
                ))}
              </div>
            ) : null))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <span className={`badge ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulseDot' : 'bg-slate-400'}`} />
          {connected ? 'Live' : 'Offline'}
        </span>

        <button onClick={() => navigate('/notifications')} className="relative text-slate-500 hover:text-slate-800">
          <Icon name="bell" />
          {unread > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2">
            <Avatar name={user?.name} src={user?.avatar} />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</div>
              <div className="text-[11px] text-slate-400">{roleLabels[user?.role]}</div>
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 card p-1.5 z-30">
              <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50">Profile</button>
              <button onClick={logout} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-rose-50 text-rose-600 flex items-center gap-2">
                <Icon name="logout" className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
