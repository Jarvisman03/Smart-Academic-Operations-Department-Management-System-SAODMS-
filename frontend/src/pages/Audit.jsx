import { useEffect, useState } from 'react';
import { PageHeader, Card, Loading, Table, Badge, Pagination } from '../components/ui';
import { auditApi } from '../api/endpoints';

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await auditApi.list({ page, ...(action && { action }) });
      setRows(r.data); setMeta(r.meta);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, action]);

  const toneFor = (a = '') => {
    if (a.includes('delete') || a.includes('deactivate') || a.includes('reject')) return 'bg-rose-100 text-rose-700';
    if (a.includes('create') || a.includes('approve')) return 'bg-emerald-100 text-emerald-700';
    if (a.includes('update') || a.includes('status')) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  const columns = [
    { key: 'action', label: 'Action', render: (r) => <Badge className={toneFor(r.action)}>{r.action}</Badge> },
    { key: 'entity', label: 'Entity', render: (r) => r.entity || '—' },
    { key: 'actor', label: 'Actor', render: (r) => r.actor?.name || 'System' },
    { key: 'role', label: 'Role', render: (r) => r.actor?.role || '—' },
    { key: 'ip', label: 'IP', render: (r) => r.ip || '—' },
    { key: 'time', label: 'Time', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="System activity and security trail" />
      <Card>
        <input className="input max-w-xs mb-4" placeholder="Filter by action (e.g. user.create)…" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} />
        {loading ? <Loading /> : <Table columns={columns} rows={rows} empty="No audit records" />}
        <Pagination meta={meta} onPage={setPage} />
      </Card>
    </div>
  );
}
