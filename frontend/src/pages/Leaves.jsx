import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, Table, Badge, Modal, Field, Tabs, Icon, IconButton } from '../components/ui';
import { leaveApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const statusMeta = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const blank = { type: 'casual', fromDate: '', toDate: '', reason: '' };

export default function Leaves() {
  const { hasPermission } = useAuth();
  const canApply = hasPermission('leave:apply');
  const canApprove = hasPermission('leave:approve');
  const [tab, setTab] = useState(canApprove ? 'all' : 'mine');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = tab === 'mine' ? { mine: true } : {};
      const r = await leaveApi.list(params);
      setRows(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const apply = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leaveApi.apply(form);
      toast.success('Leave applied');
      setModal(false); setForm(blank); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const decide = async (leave, status) => {
    try { await leaveApi.setStatus(leave._id, { status }); toast.success(`Leave ${status}`); load(); }
    catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'applicant', label: 'Applicant', render: (l) => l.applicant?.name || '—' },
    { key: 'type', label: 'Type', render: (l) => <span className="capitalize">{l.type}</span> },
    { key: 'from', label: 'From', render: (l) => formatDate(l.fromDate) },
    { key: 'to', label: 'To', render: (l) => formatDate(l.toDate) },
    { key: 'days', label: 'Days' },
    { key: 'reason', label: 'Reason', render: (l) => <span className="text-slate-500">{l.reason}</span> },
    { key: 'status', label: 'Status', render: (l) => <Badge className={statusMeta[l.status]}>{l.status}</Badge> },
    ...(canApprove ? [{ key: 'actions', label: '', render: (l) => l.status === 'pending' ? (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="check" label="Approve" tone="emerald" onClick={() => decide(l, 'approved')} />
        <IconButton icon="ban" label="Reject" tone="rose" onClick={() => decide(l, 'rejected')} />
      </div>
    ) : null }] : []),
  ];

  const tabs = [];
  if (canApprove) tabs.push({ id: 'all', label: 'All Requests' });
  if (canApply) tabs.push({ id: 'mine', label: 'My Leaves' });

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Apply for and approve faculty leave requests"
        actions={canApply && <button onClick={() => setModal(true)} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />Apply Leave</button>}
      />
      {tabs.length > 1 && <Tabs tabs={tabs} active={tab} onChange={setTab} />}
      <Card>
        {loading ? <Loading /> : <Table columns={columns} rows={rows} empty="No leave requests" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Apply for Leave">
        <form onSubmit={apply} className="space-y-3">
          <Field label="Type" as="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="casual">Casual</option><option value="medical">Medical</option>
            <option value="earned">Earned</option><option value="duty">Duty</option><option value="other">Other</option>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
            <Field label="To" type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
          </div>
          <Field label="Reason" as="textarea" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
        </form>
      </Modal>
    </div>
  );
}
