import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Avatar, Badge, Modal, Field, ConfirmDialog, IconButton, Pagination, Icon } from '../components/ui';
import { userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { roleLabels, roleOptions, formatDate } from '../utils/format';

const blank = { name: '', email: '', phone: '', password: '', role: 'faculty', department: '' };

export default function Users() {
  const { departmentId } = useAuth();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null); // { type, user }
  const [pwd, setPwd] = useState({ open: false, user: null, value: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await userApi.list({
        page, search, ...(role && { role }), ...(status && { isActive: status }),
      });
      setItems(res.data);
      setMeta(res.meta);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, search, role, status]);

  const openCreate = () => { setEditing(null); setForm({ ...blank, department: departmentId || '' }); setModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role, department: u.department?._id || u.department || '' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.department) delete payload.department;
      if (editing) {
        delete payload.password;
        await userApi.update(editing._id, payload);
        toast.success('User updated');
      } else {
        await userApi.create(payload);
        toast.success('User created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    const { type, user } = confirm;
    try {
      if (type === 'delete') { await userApi.remove(user._id); toast.success('User deleted'); }
      if (type === 'toggle') { await userApi.setActive(user._id, !user.isActive); toast.success(user.isActive ? 'Deactivated' : 'Activated'); }
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const resetPassword = async () => {
    try {
      await userApi.resetPassword(pwd.user._id, pwd.value);
      toast.success('Password reset');
      setPwd({ open: false, user: null, value: '' });
    } catch (err) {
      toast.error('Failed');
    }
  };

  const columns = [
    { key: 'name', label: 'User', render: (u) => (
      <div className="flex items-center gap-2">
        <Avatar name={u.name} src={u.avatar} size="w-8 h-8" />
        <div><div className="font-medium">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div>
      </div>
    ) },
    { key: 'role', label: 'Role', render: (u) => <Badge className="bg-brand-100 text-brand-700">{roleLabels[u.role] || u.role}</Badge> },
    { key: 'phone', label: 'Phone', render: (u) => u.phone || '—' },
    { key: 'status', label: 'Status', render: (u) => <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}>{u.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'created', label: 'Joined', render: (u) => formatDate(u.createdAt) },
    { key: 'actions', label: '', render: (u) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="edit" label="Edit" tone="brand" onClick={() => openEdit(u)} />
        <IconButton icon="key" label="Reset password" tone="amber" onClick={() => setPwd({ open: true, user: u, value: '' })} />
        <IconButton icon={u.isActive ? 'ban' : 'play'} label={u.isActive ? 'Deactivate' : 'Activate'} tone={u.isActive ? 'slate' : 'emerald'} onClick={() => setConfirm({ type: 'toggle', user: u })} />
        <IconButton icon="trash" label="Delete" tone="rose" onClick={() => setConfirm({ type: 'delete', user: u })} />
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create and manage all system accounts and roles"
        actions={<button onClick={openCreate} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />Add User</button>}
      />
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <select className="input max-w-[160px]" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
            <option value="">All Roles</option>
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="input max-w-[150px]" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {loading ? <Loading /> : <Table columns={columns} rows={items} empty="No users found" />}
        <Pagination meta={meta} onPage={setPage} />
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Field label="Role" as="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Field>
          </div>
          {!editing && (
            <Field label="Temporary Password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Leave blank to use the default seed password." />
          )}
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}</button>
        </form>
      </Modal>

      <Modal open={pwd.open} onClose={() => setPwd({ open: false, user: null, value: '' })} title={`Reset password · ${pwd.user?.name || ''}`} size="sm">
        <div className="space-y-3">
          <Field label="New Password" type="text" value={pwd.value} onChange={(e) => setPwd({ ...pwd, value: e.target.value })} />
          <button className="btn-primary w-full" disabled={!pwd.value} onClick={resetPassword}>Reset Password</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        title={confirm?.type === 'delete' ? 'Delete user?' : confirm?.user?.isActive ? 'Deactivate user?' : 'Activate user?'}
        message={confirm?.type === 'delete'
          ? `This permanently removes ${confirm?.user?.name}. This cannot be undone.`
          : `${confirm?.user?.name} will be ${confirm?.user?.isActive ? 'unable' : 'able'} to sign in.`}
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : confirm?.user?.isActive ? 'Deactivate' : 'Activate'}
        tone={confirm?.type === 'delete' || confirm?.user?.isActive ? 'rose' : 'brand'}
      />
    </div>
  );
}
