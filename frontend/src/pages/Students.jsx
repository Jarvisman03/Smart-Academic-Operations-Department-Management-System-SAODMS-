import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Avatar, Badge, Modal, Field, ConfirmDialog, IconButton, Icon } from '../components/ui';
import { studentApi, sectionApi, attendanceApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { attendanceColor, pct, formatDate } from '../utils/format';

const blank = { name: '', email: '', phone: '', enrollmentNo: '', rollNo: '', year: 2, semester: 3, section: '', gender: 'male', batch: '', guardianName: '', guardianPhone: '' };

export default function Students() {
  const { departmentId, hasPermission } = useAuth();
  const canManage = hasPermission('student:manage');
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await studentApi.list({ ...(departmentId && { department: departmentId }), search, ...(year && { year }) });
      setItems(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [departmentId, search, year]);
  useEffect(() => { sectionApi.list({ ...(departmentId && { department: departmentId }) }).then((r) => setSections(r.data)).catch(() => {}); }, [departmentId]);

  const openCreate = () => { setEditing(null); setForm(blank); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.user?.name || '', email: s.user?.email || '', phone: s.user?.phone || '',
      enrollmentNo: s.enrollmentNo || '', rollNo: s.rollNo || '', year: s.year || 2, semester: s.semester || 3,
      section: s.section?._id || s.section || '', gender: s.gender || 'male', batch: s.batch || '',
      guardianName: s.guardianName || '', guardianPhone: s.guardianPhone || '',
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, year: Number(form.year), semester: Number(form.semester), ...(departmentId && { department: departmentId }) };
      if (!payload.section) delete payload.section;
      if (editing) { await studentApi.update(editing._id, payload); toast.success('Student updated'); }
      else { await studentApi.create(payload); toast.success('Student created'); }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    try { await studentApi.remove(confirm._id); toast.success('Student deactivated'); setConfirm(null); load(); }
    catch { toast.error('Failed'); }
  };

  const openDetail = async (s) => {
    setDetail({ loading: true, student: s });
    try { const r = await attendanceApi.studentHistory(s._id); setDetail({ loading: false, student: s, data: r.data }); }
    catch { setDetail({ loading: false, student: s, data: null }); }
  };

  const columns = [
    { key: 'name', label: 'Student', render: (s) => (
      <button className="flex items-center gap-2 text-left hover:text-brand-700" onClick={() => openDetail(s)}>
        <Avatar name={s.user?.name} src={s.user?.avatar} size="w-8 h-8" />
        <div><div className="font-medium">{s.user?.name}</div><div className="text-xs text-slate-400">{s.enrollmentNo}</div></div>
      </button>
    ) },
    { key: 'year', label: 'Year', render: (s) => `Year ${s.year}` },
    { key: 'section', label: 'Section', render: (s) => s.section?.name || '—' },
    { key: 'gender', label: 'Gender' },
    { key: 'attendance', label: 'Attendance', render: (s) => <span className={`font-bold ${attendanceColor(s.attendanceSummary?.percentage)}`}>{pct(s.attendanceSummary?.percentage)}</span> },
    ...(canManage ? [{ key: 'actions', label: '', render: (s) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="edit" label="Edit" tone="brand" onClick={() => openEdit(s)} />
        <IconButton icon="ban" label="Deactivate" tone="rose" onClick={() => setConfirm(s)} />
      </div>
    ) }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${items.length} students`}
        actions={canManage && <button onClick={openCreate} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />Add Student</button>}
      />
      <Card>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input className="input max-w-xs" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[140px]" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        {loading ? <Loading /> : <Table columns={columns} rows={items} empty="No students found" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
            <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Field label="Enrollment No" value={form.enrollmentNo} onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value })} required disabled={!!editing} />
            <Field label="Roll No" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
            <Field label="Batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="2022-2026" />
            <Field label="Year" as="select" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Field>
            <Field label="Semester" as="select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </Field>
            <Field label="Section" as="select" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              <option value="">—</option>
              {sections.map((sec) => <option key={sec._id} value={sec._id}>Year {sec.year} · {sec.name}</option>)}
            </Field>
            <Field label="Gender" as="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </Field>
            <Field label="Guardian Name" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            <Field label="Guardian Phone" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Student'}</button>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Student Profile" size="lg">
        {detail?.loading ? <Loading /> : detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={detail.student.user?.name} src={detail.student.user?.avatar} size="w-14 h-14" />
              <div>
                <div className="font-semibold text-lg">{detail.student.user?.name}</div>
                <div className="text-sm text-slate-500">{detail.student.enrollmentNo} · Year {detail.student.year} · {detail.student.section?.name || '—'}</div>
              </div>
              <div className="ml-auto text-right">
                <div className={`text-2xl font-bold ${attendanceColor(detail.student.attendanceSummary?.percentage)}`}>{pct(detail.student.attendanceSummary?.percentage)}</div>
                <div className="text-xs text-slate-400">Attendance</div>
              </div>
            </div>
            <div>
              <div className="label">Recent Attendance</div>
              {detail.data?.history?.length ? (
                <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
                  {detail.data.history.slice(0, 30).map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm gap-2">
                      <span className="text-slate-600 flex-1 truncate">{r.subject || 'Class'}</span>
                      <span className="text-xs text-slate-400">{r.date ? formatDate(r.date) : ''}</span>
                      <Badge className={r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : r.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No attendance records yet.</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Deactivate student?"
        message={`${confirm?.user?.name} will be deactivated.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
