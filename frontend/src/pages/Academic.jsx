import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Modal, Icon } from '../components/ui';
import { academicApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

export default function Academic() {
  const { departmentId, hasPermission } = useAuth();
  const [tab, setTab] = useState('announcements');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal', audience: ['all'] });

  const params = departmentId ? { department: departmentId } : {};

  const load = async () => {
    setLoading(true);
    try {
      const [ann, meet, ev, asg, cal] = await Promise.all([
        academicApi.announcements(params),
        academicApi.meetings(params),
        academicApi.events(params),
        academicApi.assignments(params),
        academicApi.calendar(params),
      ]);
      setData({ announcements: ann.data, meetings: meet.data, events: ev.data, assignments: asg.data, calendar: cal.data });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [departmentId]);

  const createAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await academicApi.createAnnouncement(form);
      toast.success('Announcement published');
      setModal(false);
      setForm({ title: '', body: '', priority: 'normal', audience: ['all'] });
      load();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const tabs = ['announcements', 'meetings', 'events', 'assignments', 'calendar'];

  return (
    <div>
      <PageHeader
        title="Academic Management"
        subtitle="Announcements, meetings, events, assignments and calendar"
        actions={hasPermission('announcement:manage') && <button onClick={() => setModal(true)} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />New Announcement</button>}
      />
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t}</button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div className="space-y-3">
          {tab === 'announcements' && (data.announcements?.length ? data.announcements.map((a) => (
            <Card key={a._id}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{a.pinned && '📌 '}{a.title}</h3>
                <span className={`badge ${a.priority === 'high' || a.priority === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{a.priority}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{a.body}</p>
              <div className="text-xs text-slate-400 mt-2">{a.author?.name} · {formatDate(a.createdAt)}</div>
            </Card>
          )) : <EmptyState title="No announcements" />)}

          {tab === 'meetings' && (data.meetings?.length ? data.meetings.map((m) => (
            <Card key={m._id}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{m.title}</h3>
                <span className="badge bg-amber-100 text-amber-700">{m.status}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{m.agenda}</p>
              <div className="text-xs text-slate-400 mt-2">{formatDate(m.date)} · {m.startTime}-{m.endTime}</div>
            </Card>
          )) : <EmptyState title="No meetings" />)}

          {tab === 'events' && (data.events?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.events.map((ev) => (
                <Card key={ev._id}>
                  <span className="badge bg-brand-100 text-brand-700 mb-2">{ev.category}</span>
                  <h3 className="font-semibold text-slate-800">{ev.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{ev.description}</p>
                  <div className="text-xs text-slate-400 mt-2">{formatDate(ev.startDate)} · {ev.venue}</div>
                </Card>
              ))}
            </div>
          ) : <EmptyState title="No events" />)}

          {tab === 'assignments' && (data.assignments?.length ? data.assignments.map((a) => (
            <Card key={a._id}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{a.title}</h3>
                <span className="badge bg-slate-100 text-slate-600">{a.submissions?.length || 0} submissions</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">Due {a.dueDate ? formatDate(a.dueDate) : '—'} · Max {a.maxMarks} marks</div>
            </Card>
          )) : <EmptyState title="No assignments" />)}

          {tab === 'calendar' && (data.calendar?.length ? (
            <Card>
              <div className="space-y-2">
                {data.calendar.map((c) => (
                  <div key={`${c.type}-${c.id}`} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full bg-${c.color}-500`} style={{ backgroundColor: ({ indigo: '#6366f1', amber: '#f59e0b', rose: '#f43f5e' })[c.color] }} />
                    <span className="w-24 text-xs text-slate-400">{formatDate(c.date)}</span>
                    <span className="badge bg-slate-100 text-slate-500 capitalize">{c.type}</span>
                    <span className="text-slate-700">{c.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : <EmptyState title="No calendar items this month" />)}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement">
        <form onSubmit={createAnnouncement} className="space-y-3">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Message</label><textarea className="input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
          <div><label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <button className="btn-primary w-full">Publish</button>
        </form>
      </Modal>
    </div>
  );
}
