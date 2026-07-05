import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Badge, StatCard, Icon } from '../components/ui';
import { leaveApi, bookingApi, attendanceApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

export default function Approvals() {
  const { hasPermission } = useAuth();
  const canLeave = hasPermission('leave:approve');
  const canBooking = hasPermission('resource:manage');
  const canAttendance = hasPermission('attendance:approve');

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [corrections, setCorrections] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [lv, bk, at] = await Promise.all([
        canLeave ? leaveApi.list({ status: 'pending' }).then((r) => r.data).catch(() => []) : Promise.resolve([]),
        canBooking ? bookingApi.list({ status: 'pending' }).then((r) => r.data).catch(() => []) : Promise.resolve([]),
        canAttendance ? attendanceApi.list({ limit: 100 }).then((r) => (r.data || []).filter((a) => a.approvalStatus === 'correction_requested')).catch(() => []) : Promise.resolve([]),
      ]);
      setLeaves(lv); setBookings(bk); setCorrections(at);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const decideLeave = async (l, status) => {
    try { await leaveApi.setStatus(l._id, { status }); toast.success(`Leave ${status}`); load(); } catch { toast.error('Failed'); }
  };
  const decideBooking = async (b, status) => {
    try { await bookingApi.setStatus(b._id, status); toast.success(`Booking ${status}`); load(); } catch { toast.error('Failed'); }
  };
  const approveCorrection = async (a) => {
    try { await attendanceApi.approve(a._id); toast.success('Correction approved'); load(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div><PageHeader title="Approvals" /><Loading /></div>;

  const total = leaves.length + bookings.length + corrections.length;

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Pending requests awaiting your decision" actions={<button onClick={load} className="btn-ghost text-xs"><Icon name="refresh" className="w-4 h-4" />Refresh</button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pending Total" value={total} tone="brand" icon="inbox" />
        {canLeave && <StatCard label="Leaves" value={leaves.length} tone="amber" icon="calendar" />}
        {canBooking && <StatCard label="Bookings" value={bookings.length} tone="cyan" icon="building" />}
        {canAttendance && <StatCard label="Corrections" value={corrections.length} tone="rose" icon="check" />}
      </div>

      {total === 0 && <Card><EmptyState title="All caught up!" hint="There are no pending approvals right now." /></Card>}

      {canLeave && leaves.length > 0 && (
        <section className="mb-6">
          <h2 className="section-title mb-2">Leave Requests</h2>
          <div className="space-y-2">
            {leaves.map((l) => (
              <Card key={l._id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{l.applicant?.name} <Badge className="bg-slate-100 text-slate-600 capitalize ml-1">{l.type}</Badge></div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDate(l.fromDate)} → {formatDate(l.toDate)} · {l.days} day(s) · {l.reason}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-xs" onClick={() => decideLeave(l, 'approved')}><Icon name="check" className="w-4 h-4" />Approve</button>
                  <button className="btn-danger text-xs" onClick={() => decideLeave(l, 'rejected')}><Icon name="ban" className="w-4 h-4" />Reject</button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {canBooking && bookings.length > 0 && (
        <section className="mb-6">
          <h2 className="section-title mb-2">Resource Bookings</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b._id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">Room {b.room?.roomNumber} · {b.purpose}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{b.bookedBy?.name} · {formatDate(b.date)} · {b.startTime}-{b.endTime}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-xs" onClick={() => decideBooking(b, 'approved')}><Icon name="check" className="w-4 h-4" />Approve</button>
                  <button className="btn-danger text-xs" onClick={() => decideBooking(b, 'rejected')}><Icon name="ban" className="w-4 h-4" />Reject</button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {canAttendance && corrections.length > 0 && (
        <section className="mb-6">
          <h2 className="section-title mb-2">Attendance Corrections</h2>
          <div className="space-y-2">
            {corrections.map((a) => (
              <Card key={a._id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{a.subject?.name || 'Class'} · {a.section?.name || ''}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDate(a.date)} · Period {a.period} · {a.faculty?.user?.name || ''}</div>
                </div>
                <button className="btn-primary text-xs" onClick={() => approveCorrection(a)}><Icon name="check" className="w-4 h-4" />Approve</button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
