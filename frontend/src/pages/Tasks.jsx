import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Loading, Modal, Field, Badge, ConfirmDialog, IconButton, Icon } from '../components/ui';
import { taskApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const COLUMNS = [
  { id: 'todo', label: 'To Do', tone: 'bg-slate-100 text-slate-600' },
  { id: 'in_progress', label: 'In Progress', tone: 'bg-brand-100 text-brand-700' },
  { id: 'done', label: 'Done', tone: 'bg-emerald-100 text-emerald-700' },
  { id: 'blocked', label: 'Blocked', tone: 'bg-rose-100 text-rose-700' },
];
const priorityMeta = {
  low: 'bg-slate-100 text-slate-500', medium: 'bg-cyan-100 text-cyan-700',
  high: 'bg-amber-100 text-amber-700', urgent: 'bg-rose-100 text-rose-700',
};
const blank = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' };

export default function Tasks() {
  const { departmentId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await taskApi.list({ ...(departmentId && { department: departmentId }) }); setTasks(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [departmentId]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await taskApi.create({
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        ...(form.dueDate && { dueDate: form.dueDate }),
        ...(departmentId && { department: departmentId }),
      });
      toast.success('Task created');
      setModal(false); setForm(blank); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const move = async (task, status) => {
    try {
      await taskApi.update(task._id, { status, ...(status === 'done' && { completedAt: new Date() }) });
      load();
    } catch { toast.error('Failed'); }
  };

  const remove = async () => {
    try { await taskApi.remove(confirm._id); toast.success('Deleted'); setConfirm(null); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div><PageHeader title="Tasks" /><Loading /></div>;

  return (
    <div>
      <PageHeader
        title="Task Board"
        subtitle="Track department tasks across stages"
        actions={<button onClick={() => setModal(true)} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />New Task</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${col.tone}`}>{col.label}</span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {items.map((t) => (
                  <div key={t._id} className="card card-pad">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-slate-800">{t.title}</h4>
                      <IconButton icon="trash" label="Delete" tone="rose" onClick={() => setConfirm(t)} />
                    </div>
                    {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge className={priorityMeta[t.priority]}>{t.priority}</Badge>
                      {t.dueDate && <span className="text-[11px] text-slate-400">Due {formatDate(t.dueDate)}</span>}
                    </div>
                    <select
                      className="input mt-2 py-1 text-xs"
                      value={t.status}
                      onChange={(e) => move(t, e.target.value)}
                    >
                      {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-slate-300 text-center py-4">No tasks</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Task">
        <form onSubmit={create} className="space-y-3">
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Field label="Description" as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" as="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </Field>
            <Field label="Status" as="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Field>
            <Field label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Field label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma,separated" />
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Create Task'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} title="Delete task?" message={`"${confirm?.title}" will be removed.`} confirmLabel="Delete" />
    </div>
  );
}
