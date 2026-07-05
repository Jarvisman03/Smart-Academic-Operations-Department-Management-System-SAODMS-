import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Badge, Modal, Field, ConfirmDialog, IconButton, Icon } from '../components/ui';
import { documentApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const CATEGORIES = ['notes', 'syllabus', 'circular', 'form', 'report', 'other'];

export default function Documents() {
  const { departmentId, hasPermission } = useAuth();
  const canManage = hasPermission('document:manage');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'notes', tags: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const r = await documentApi.list({ ...(departmentId && { department: departmentId }), ...(search && { search }), ...(category && { category }) });
      setRows(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [departmentId, search, category]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a file');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name || file.name);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('tags', form.tags);
      if (departmentId) fd.append('department', departmentId);
      await documentApi.upload(fd);
      toast.success('Document uploaded');
      setModal(false); setForm({ name: '', description: '', category: 'notes', tags: '' }); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const download = async (d) => {
    try {
      const r = await documentApi.download(d._id);
      const url = r.data?.url;
      if (url) window.open(url.startsWith('http') ? url : `${window.location.origin}${url}`, '_blank');
    } catch { toast.error('Download failed'); }
  };

  const remove = async () => {
    try { await documentApi.remove(confirm._id); toast.success('Deleted'); setConfirm(null); load(); }
    catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Document', render: (d) => (
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center"><Icon name="file" className="w-4 h-4" /></span>
        <div><div className="font-medium">{d.name}</div><div className="text-xs text-slate-400">{d.description || d.fileType}</div></div>
      </div>
    ) },
    { key: 'category', label: 'Category', render: (d) => <Badge className="bg-slate-100 text-slate-600 capitalize">{d.category || 'other'}</Badge> },
    { key: 'size', label: 'Size', render: (d) => d.size ? `${(d.size / 1024).toFixed(0)} KB` : '—' },
    { key: 'by', label: 'Uploaded by', render: (d) => d.uploadedBy?.name || '—' },
    { key: 'date', label: 'Date', render: (d) => formatDate(d.createdAt) },
    { key: 'downloads', label: 'Downloads', render: (d) => d.downloads || 0 },
    { key: 'actions', label: '', render: (d) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="download" label="Download" tone="brand" onClick={() => download(d)} />
        {canManage && <IconButton icon="trash" label="Delete" tone="rose" onClick={() => setConfirm(d)} />}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Department document library"
        actions={canManage && <button onClick={() => setModal(true)} className="btn-primary text-xs"><Icon name="upload" className="w-4 h-4" />Upload</button>}
      />
      <Card>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input className="input max-w-xs" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        {loading ? <Loading /> : <Table columns={columns} rows={rows} empty="No documents yet" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Document">
        <form onSubmit={upload} className="space-y-3">
          <div>
            <label className="label">File</label>
            <input ref={fileRef} type="file" className="input" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Defaults to file name" />
          <Field label="Description" as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" as="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </Field>
            <Field label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma,separated" />
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} title="Delete document?" message={`"${confirm?.name}" will be permanently removed.`} confirmLabel="Delete" />
    </div>
  );
}
