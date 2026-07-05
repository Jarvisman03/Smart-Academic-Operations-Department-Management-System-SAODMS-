import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Avatar, Badge, Modal, Field, ConfirmDialog, IconButton, Icon } from '../components/ui';
import { facultyApi, subjectApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { facultyStatusMeta, designationOptions, formatDate } from '../utils/format';

const blank = { name: '', email: '', phone: '', employeeId: '', designation: 'Assistant Professor', gender: 'male', cabin: '', maxWeeklyLoad: 24, expertise: [] };

export default function Faculty() {
  const { departmentId, hasPermission } = useAuth();
  const canManage = hasPermission('faculty:manage');
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await facultyApi.list({ ...(departmentId && { department: departmentId }), search });
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [departmentId, search]);
  useEffect(() => { subjectApi.list({ ...(departmentId && { department: departmentId }) }).then((r) => setSubjects(r.data)).catch(() => {}); }, [departmentId]);

  const openCreate = () => { setEditing(null); setForm(blank); setModal(true); };
  const openEdit = (f) => {
    setEditing(f);
    setForm({
      name: f.user?.name || '', email: f.user?.email || '', phone: f.user?.phone || '',
      employeeId: f.employeeId || '', designation: f.designation || 'Assistant Professor',
      gender: f.gender || 'male', cabin: f.cabin || '', maxWeeklyLoad: f.maxWeeklyLoad || 24,
      expertise: (f.expertise || []).map((e) => e._id || e),
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, maxWeeklyLoad: Number(form.maxWeeklyLoad), ...(departmentId && { department: departmentId }) };
      if (editing) { await facultyApi.update(editing._id, payload); toast.success('Faculty updated'); }
      else { await facultyApi.create(payload); toast.success('Faculty created'); }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    try { await facultyApi.remove(confirm._id); toast.success('Faculty deactivated'); setConfirm(null); load(); }
    catch (err) { toast.error('Failed'); }
  };

  const openDetail = async (f) => {
    setDetail({ loading: true });
    try { const r = await facultyApi.get(f._id); setDetail({ loading: false, data: r.data }); }
    catch { setDetail(null); toast.error('Failed to load'); }
  };

  const toggleExpertise = (id) => setForm((f) => ({
    ...f, expertise: f.expertise.includes(id) ? f.expertise.filter((x) => x !== id) : [...f.expertise, id],
  }));

  const columns = [
    { key: 'name', label: 'Faculty', render: (f) => (
      <button className="flex items-center gap-2 text-left hover:text-brand-700" onClick={() => openDetail(f)}>
        <Avatar name={f.user?.name} src={f.user?.avatar} size="w-8 h-8" />
        <div><div className="font-medium">{f.user?.name}</div><div className="text-xs text-slate-400">{f.employeeId}</div></div>
      </button>
    ) },
    { key: 'designation', label: 'Designation' },
    { key: 'expertise', label: 'Expertise', render: (f) => (f.expertise || []).map((e) => e.code).join(', ') || '—' },
    { key: 'status', label: 'Status', render: (f) => {
      const m = facultyStatusMeta[f.liveStatus?.status || 'available'] || facultyStatusMeta.available;
      return <Badge className={m.color}>{m.label}</Badge>;
    } },
    { key: 'cabin', label: 'Cabin', render: (f) => f.cabin || '—' },
    ...(canManage ? [{ key: 'actions', label: '', render: (f) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="edit" label="Edit" tone="brand" onClick={() => openEdit(f)} />
        <IconButton icon="ban" label="Deactivate" tone="rose" onClick={() => setConfirm(f)} />
      </div>
    ) }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Faculty"
        subtitle={`${items.length} faculty members`}
        actions={canManage && <button onClick={openCreate} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />Add Faculty</button>}
      />
      <Card>
        <input className="input max-w-xs mb-4" placeholder="Search faculty…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {loading ? <Loading /> : <Table columns={columns} rows={items} empty="No faculty found" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Faculty' : 'Add Faculty'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
            <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Field label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required disabled={!!editing} />
            <Field label="Designation" as="select" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
              {designationOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </Field>
            <Field label="Gender" as="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </Field>
            <Field label="Cabin / Location" value={form.cabin} onChange={(e) => setForm({ ...form, cabin: e.target.value })} />
            <Field label="Max Weekly Load" type="number" value={form.maxWeeklyLoad} onChange={(e) => setForm({ ...form, maxWeeklyLoad: e.target.value })} />
          </div>
          <div>
            <label className="label">Expertise (subjects)</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {subjects.length === 0 && <span className="text-xs text-slate-400">No subjects available</span>}
              {subjects.map((s) => (
                <button type="button" key={s._id} onClick={() => toggleExpertise(s._id)}
                  className={`badge cursor-pointer ${form.expertise.includes(s._id) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {s.code}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Faculty'}</button>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Faculty Profile">
        {detail?.loading ? <Loading /> : detail?.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.data.user?.name} src={detail.data.user?.avatar} size="w-14 h-14" />
              <div>
                <div className="font-semibold text-lg">{detail.data.user?.name}</div>
                <div className="text-sm text-slate-500">{detail.data.designation} · {detail.data.employeeId}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="label">Email</div>{detail.data.user?.email}</div>
              <div><div className="label">Phone</div>{detail.data.user?.phone || '—'}</div>
              <div><div className="label">Cabin</div>{detail.data.cabin || '—'}</div>
              <div><div className="label">Max Weekly Load</div>{detail.data.maxWeeklyLoad} periods</div>
              <div><div className="label">Gender</div>{detail.data.gender || '—'}</div>
              <div><div className="label">Joined</div>{formatDate(detail.data.createdAt)}</div>
            </div>
            <div>
              <div className="label">Expertise</div>
              <div className="flex flex-wrap gap-1.5">
                {(detail.data.expertise || []).length ? detail.data.expertise.map((e) => <Badge key={e._id} className="bg-brand-100 text-brand-700">{e.code} · {e.name}</Badge>) : <span className="text-sm text-slate-400">None</span>}
              </div>
            </div>
            <div>
              <div className="label">Current Status</div>
              <Badge className={(facultyStatusMeta[detail.data.liveStatus?.status || 'available'] || facultyStatusMeta.available).color}>
                {(facultyStatusMeta[detail.data.liveStatus?.status || 'available'] || facultyStatusMeta.available).label}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Deactivate faculty?"
        message={`${confirm?.user?.name} will be deactivated and can no longer sign in.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
