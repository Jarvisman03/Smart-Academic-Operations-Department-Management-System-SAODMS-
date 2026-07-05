import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader, Card, StatCard, Loading, EmptyState, Icon, Avatar } from '../components/ui';
import { BarChart, DoughnutChart, LineChart } from '../components/ui/Charts';
import LiveClock from '../components/dashboard/LiveClock';
import FloorMap from '../components/dashboard/FloorMap';
import FacultyCard from '../components/dashboard/FacultyCard';
import { dashboardApi, roomApi, buildingApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { attendanceColor, pct } from '../utils/format';

export default function Dashboard() {
  const { departmentId, user, hasPermission } = useAuth();
  const { dashboard } = useSocket();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [running, setRunning] = useState([]);
  const [labs, setLabs] = useState([]);
  const [attSummary, setAttSummary] = useState(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facFilter, setFacFilter] = useState('all');

  const params = departmentId ? { department: departmentId } : {};

  const loadAll = useCallback(async () => {
    try {
      const [ov, fm, run, lm, as] = await Promise.all([
        dashboardApi.overview(params),
        dashboardApi.facultyMonitor(params),
        dashboardApi.running(params),
        dashboardApi.labMonitor(params),
        dashboardApi.attendanceSummary(params),
      ]);
      setOverview(ov.data);
      setFaculty(fm.data);
      setRunning(run.data);
      setLabs(lm.data);
      setAttSummary(as.data);
      const buildings = await buildingApi.list();
      if (buildings.data?.length) {
        const m = await roomApi.map(buildings.data[0]._id);
        setMap(m.data);
      }
    } catch (e) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime refresh triggers.
  useEffect(() => {
    const sock = dashboard?.current;
    if (!sock) return undefined;
    const refresh = () => loadAll();
    sock.on('attendance:update', refresh);
    sock.on('room:status', refresh);
    sock.on('timetable:change', refresh);
    sock.on('status:refresh', refresh);
    return () => {
      sock.off('attendance:update', refresh);
      sock.off('room:status', refresh);
      sock.off('timetable:change', refresh);
      sock.off('status:refresh', refresh);
    };
  }, [dashboard, loadAll]);

  if (loading) return <Loading label="Loading command center..." />;

  const s = overview?.stats || {};
  const low = attSummary?.lowAttendance;

  const facultyCards = faculty?.cards || [];
  const filtered = facFilter === 'all' ? facultyCards : facultyCards.filter((c) => (facFilter === 'teaching' ? ['teaching', 'lab_duty'].includes(c.status) : c.status === facFilter));

  const quickActions = [
    { label: 'Mark Attendance', to: '/attendance', icon: 'check', perm: 'attendance:mark' },
    { label: 'Timetable', to: '/timetable', icon: 'calendar', perm: 'timetable:view' },
    { label: 'Book Resource', to: '/resources', icon: 'building', perm: 'resource:book' },
    { label: 'Generate Report', to: '/reports', icon: 'file', perm: 'report:generate' },
    { label: 'Announcement', to: '/academic', icon: 'bell', perm: 'announcement:manage' },
    { label: 'AI Assistant', to: '/ai', icon: 'sparkles', perm: 'ai:use' },
  ].filter((a) => !a.perm || hasPermission(a.perm));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        subtitle={`${overview?.college?.shortName} · ${overview?.college?.department} — live department operations`}
        actions={<button onClick={loadAll} className="btn-ghost text-xs">Refresh</button>}
      />

      {/* Section 2: Live clock + current lecture */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <LiveClock day={overview?.day} currentPeriod={overview?.currentPeriod} college={overview?.college} />
        </div>

        {/* Section 3: Quick statistics */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Students Present" value={s.studentsPresent ?? 0} tone="emerald" icon="user" />
          <StatCard label="Students Absent" value={s.studentsAbsent ?? 0} tone="rose" icon="user" />
          <StatCard label="Faculty Present" value={s.facultyPresent ?? 0} tone="brand" icon="users" />
          <StatCard label="Free Faculty" value={s.freeFaculty ?? 0} tone="cyan" icon="users" />
          <StatCard label="Classes Running" value={s.classesRunning ?? 0} tone="brand" icon="book" />
          <StatCard label="Rooms Available" value={s.roomsAvailable ?? 0} tone="slate" icon="building" />
          <StatCard label="Pending Leaves" value={s.pendingLeaves ?? 0} tone="amber" icon="alert" />
          <StatCard label="Upcoming Meetings" value={s.upcomingMeetingsCount ?? 0} tone="slate" icon="calendar" />
        </div>
      </div>

      {/* Section 14: Quick actions */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="section-title">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition">
              <Icon name={a.icon} className="w-5 h-5 text-brand-600" />
              <span className="text-xs font-medium text-slate-600 text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Section 4 & 8: Live faculty monitoring + availability */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="section-title">Live Faculty Monitoring</span>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'teaching', 'available', 'meeting', 'on_leave'].map((f) => (
              <button key={f} onClick={() => setFacFilter(f)} className={`text-xs px-2.5 py-1 rounded-md ${facFilter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length === 0 ? <Card><EmptyState title="No faculty in this state" /></Card> : filtered.map((f) => <FacultyCard key={f.id} f={f} />)}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Section 5: Running classes */}
        <Card>
          <span className="section-title">Running Classes</span>
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {running.length === 0 ? <EmptyState title="No classes running right now" hint="Check back during a lecture slot" /> : running.map((c) => (
              <div key={c.timetableId} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px]">Room</span>
                  <span className="font-bold text-sm">{c.room}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{c.subject}</div>
                  <div className="text-xs text-slate-500">{c.faculty} · Sec {c.section} (Yr {c.year}) · {c.time}</div>
                </div>
                <div className="text-right">
                  {c.attendanceMarked ? (
                    <span className="badge bg-emerald-100 text-emerald-700">{c.present}/{c.total}</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 6: Lab monitoring */}
        <Card>
          <span className="section-title">Laboratory Monitoring</span>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {labs.map((lab) => (
              <div key={lab.id} className={`rounded-lg p-3 border ${lab.status === 'occupied' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">{lab.name}</span>
                  <span className={`badge ${lab.status === 'occupied' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{lab.status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Room {lab.roomNumber} · {lab.workingSystems}/{lab.systems} systems</div>
                {lab.subject && <div className="text-xs text-slate-600 mt-1">{lab.subject} · {lab.faculty}</div>}
                <div className="mt-1"><span className={`badge ${lab.equipmentStatus === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{lab.equipmentStatus}</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section 7: Building monitoring floor map */}
      {map && (
        <Card>
          <span className="section-title">Building Monitor · {map.building?.name} (4 Floors)</span>
          <div className="mt-4">
            <FloorMap floors={map.floors} onRoomClick={(r) => toast(`${r.roomNumber}: ${(r.liveStatus?.status || r.status)}`)} />
          </div>
        </Card>
      )}

      {/* Sections 10-12: Attendance dashboard, analytics, low attendance */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <span className="section-title">Attendance Overview</span>
          <div className="mt-3 space-y-3">
            {['today', 'week', 'month'].map((k) => {
              const a = attSummary?.student?.[k];
              return (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-slate-600">{k}</span>
                  <span className={`font-bold ${attendanceColor(a?.percentage)}`}>{pct(a?.percentage)}</span>
                </div>
              );
            })}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Faculty Present Today</span>
              <span className="font-bold text-brand-600">{attSummary?.faculty?.present}/{attSummary?.faculty?.totalFaculty}</span>
            </div>
          </div>
        </Card>

        <Card>
          <span className="section-title">Attendance by Year</span>
          <div className="mt-3">
            <BarChart
              labels={(attSummary?.byYear || []).map((y) => `Year ${y.key}`)}
              datasets={[{ label: 'Attendance %', data: (attSummary?.byYear || []).map((y) => y.percentage) }]}
              height={200}
            />
          </div>
        </Card>

        {/* Section 12: Low attendance prediction */}
        <Card>
          <span className="section-title">Low Attendance Alerts</span>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-rose-50 p-2"><div className="text-2xl font-bold text-rose-600">{low?.critical ?? 0}</div><div className="text-[10px] text-rose-500">Critical</div></div>
            <div className="rounded-lg bg-amber-50 p-2"><div className="text-2xl font-bold text-amber-600">{low?.warning ?? 0}</div><div className="text-[10px] text-amber-500">Warning</div></div>
            <div className="rounded-lg bg-slate-100 p-2"><div className="text-2xl font-bold text-slate-600">{low?.below ?? 0}</div><div className="text-[10px] text-slate-500">Below 75%</div></div>
          </div>
          <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
            {(low?.criticalList || []).map((st) => (
              <div key={st._id} className="flex items-center gap-2 text-xs">
                <Avatar name={st.user?.name} size="w-6 h-6" />
                <span className="flex-1 truncate">{st.user?.name}</span>
                <span className="font-bold text-rose-600">{pct(st.attendanceSummary?.percentage)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming meetings */}
      {overview?.upcomingMeetings?.length > 0 && (
        <Card>
          <span className="section-title">Upcoming Meetings</span>
          <div className="mt-3 space-y-2">
            {overview.upcomingMeetings.map((m) => (
              <div key={m._id} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-8 rounded bg-amber-400" />
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{m.title}</div>
                  <div className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString()} · {m.startTime}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
