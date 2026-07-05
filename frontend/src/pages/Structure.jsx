import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Modal, Field, ConfirmDialog, IconButton, Tabs, Badge, Icon } from '../components/ui';
import { subjectApi, sectionApi, semesterApi, departmentApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const YEARS = [1, 2, 3, 4];
const SEMS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Structure() {
  const { departmentId, hasPermission } = useAuth();
  const [tab, setTab] = useState('subjects');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const configs = useMemo(() => ({
    subjects: {
      api: subjectApi, perm: 'subject:manage', label: 'Subject',
      blank: { name: '', code: '', year: 2, semester: 3, credits: 3, type: 'theory', weeklyLectures: 3 },
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'year', label: 'Year', render: (r) => `Year ${r.year}` },
        { key: 'semester', label: 'Sem', render: (r) => r.semester },
        { key: 'type', label: 'Type', render: (r) => <Badge className="bg-slate-100 text-slate-600 capitalize">{r.type}</Badge> },
        { key: 'credits', label: 'Credits' },
      ],
      toForm: (r) => ({ name: r.name, code: r.code, year: r.year, semester: r.semester, credits: r.credits, type: r.type, weeklyLectures: r.weeklyLectures }),
      numeric: ['year', 'semester', 'credits', 'weeklyLectures'],
    },
    sections: {
      api: sectionApi, perm: 'section:manage', label: 'Section',
      blank: { name: '', year: 2, semester: 3, batch: '', strength: 0 },
      columns: [
        { key: 'name', label: 'Section' },
        { key: 'year', label: 'Year', render: (r) => `Year ${r.year}` },
        { key: 'semester', label: 'Sem' },
        { key: 'batch', label: 'Batch', render: (r) => r.batch || '—' },
        { key: 'strength', label: 'Strength' },
      ],
      toForm: (r) => ({ name: r.name, year: r.year, semester: r.semester, batch: r.batch || '', strength: r.strength || 0 }),
      numeric: ['year', 'semester', 'strength'],
    },
    semesters: {
      api: semesterApi, perm: 'department:manage', label: 'Semester', noDept: true,
      blank: { name: '', academicYear: '', number: 1, type: 'odd', isCurrent: false },
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'academicYear', label: 'Academic Year' },
        { key: 'number', label: 'Number' },
        { key: 'type', label: 'Type', render: (r) => <Badge className="bg-slate-100 text-slate-600 capitalize">{r.type}</Badge> },
        { key: 'isCurrent', label: 'Current', render: (r) => r.isCurrent ? <Badge className="bg-emerald-100 text-emerald-700">Current</Badge> : '—' },
      ],
      toForm: (r) => ({ name: r.name, academicYear: r.academicYear, number: r.number, type: r.type, isCurrent: r.isCurrent }),
      numeric: ['number'],
    },
    departments: {
      api: departmentApi, perm: 'department:manage', label: 'Department', noDept: true,
      blank: { name: '', code: '' },
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ],
      toForm: (r) => ({ name: r.name, code: r.code }),
      numeric: [],
    },
  }), []);

  const cfg = configs[tab];
  const canManage = hasPermission(cfg.perm);

  const load = async () => {
    setLoading(true);
    try {
      const params = cfg.noDept ? {} : (departmentId ? { department: departmentId } : {});
      const r = await cfg.api.list(params);
      setRows(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, departmentId]);

  const openCreate = () => { setEditing(null); setForm(cfg.blank); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm(cfg.toForm(r)); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      cfg.numeric.forEach((k) => { if (payload[k] !== undefined) payload[k] = Number(payload[k]); });
      if (!cfg.noDept && departmentId) payload.department = departmentId;
      if (editing) { await cfg.api.update(editing._id, payload); toast.success(`${cfg.label} updated`); }
      else { await cfg.api.create(payload); toast.success(`${cfg.label} created`); }
      setModal(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    try { await cfg.api.remove(confirm._id); toast.success(`${cfg.label} deleted`); setConfirm(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const columns = [
    ...cfg.columns,
    ...(canManage ? [{ key: 'actions', label: '', render: (r) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="edit" label="Edit" tone="brand" onClick={() => openEdit(r)} />
        <IconButton icon="trash" label="Delete" tone="rose" onClick={() => setConfirm(r)} />
      </div>
    ) }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Academic Structure"
        subtitle="Manage subjects, sections, semesters and departments"
        actions={canManage && <button onClick={openCreate} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />New {cfg.label}</button>}
      />
      <Tabs
        tabs={[
          { id: 'subjects', label: 'Subjects' },
          { id: 'sections', label: 'Sections' },
          { id: 'semesters', label: 'Semesters' },
          { id: 'departments', label: 'Departments' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <Card>
        {loading ? <Loading /> : <Table columns={columns} rows={rows} empty={`No ${tab} found`} />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={`${editing ? 'Edit' : 'New'} ${cfg.label}`}>
        <form onSubmit={save} className="space-y-3">
          {tab === 'subjects' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Field label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                <Field label="Year" as="select" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>{YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}</Field>
                <Field label="Semester" as="select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>{SEMS.map((s) => <option key={s} value={s}>Sem {s}</option>)}</Field>
                <Field label="Type" as="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="theory">Theory</option><option value="lab">Lab</option><option value="elective">Elective</option><option value="project">Project</option>
                </Field>
                <Field label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
                <Field label="Weekly Lectures" type="number" value={form.weeklyLectures} onChange={(e) => setForm({ ...form, weeklyLectures: e.target.value })} />
              </div>
            </>
          )}
          {tab === 'sections' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="A" />
              <Field label="Batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="2022-2026" />
              <Field label="Year" as="select" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>{YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}</Field>
              <Field label="Semester" as="select" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>{SEMS.map((s) => <option key={s} value={s}>Sem {s}</option>)}</Field>
              <Field label="Strength" type="number" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
            </div>
          )}
          {tab === 'semesters' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Odd 2025" />
              <Field label="Academic Year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2025-2026" />
              <Field label="Number" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              <Field label="Type" as="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="odd">Odd</option><option value="even">Even</option>
              </Field>
              <label className="flex items-center gap-2 text-sm col-span-2">
                <input type="checkbox" checked={!!form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} /> Current semester
              </label>
            </div>
          )}
          {tab === 'departments' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Field label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
          )}
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : `Create ${cfg.label}`}</button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title={`Delete ${cfg.label.toLowerCase()}?`}
        message={`This permanently removes "${confirm?.name || confirm?.code}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}
