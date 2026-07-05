import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Icon } from '../components/ui';
import { notificationApi } from '../api/endpoints';
import { useSocket } from '../context/SocketContext';
import { formatDate, formatTime } from '../utils/format';

export default function Notifications() {
  const { notifications: sockRef } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => notificationApi.list({ limit: 50 }).then((r) => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sock = sockRef?.current;
    if (!sock) return undefined;
    const handler = (n) => setItems((prev) => [n, ...prev]);
    sock.on('notification:new', handler);
    return () => sock.off('notification:new', handler);
  }, [sockRef]);

  const markAll = async () => {
    await notificationApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const markOne = async (id) => {
    await notificationApi.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const priorityColor = { critical: 'border-l-rose-500', high: 'border-l-amber-500', normal: 'border-l-brand-500', low: 'border-l-slate-300' };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Live department alerts and updates" actions={<button onClick={markAll} className="btn-ghost text-xs">Mark all read</button>} />
      {loading ? <Loading /> : items.length === 0 ? <Card><EmptyState title="No notifications" /></Card> : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n._id} className={`border-l-4 ${priorityColor[n.priority] || priorityColor.normal} ${!n.isRead ? 'bg-brand-50/40' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon name="bell" className="w-4 h-4 text-slate-500" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 text-sm">{n.title}</div>
                    {!n.isRead && <button onClick={() => markOne(n._id)} className="text-xs text-brand-600">Mark read</button>}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <div className="text-[11px] text-slate-400 mt-1">{formatDate(n.createdAt)} · {formatTime(n.createdAt)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
