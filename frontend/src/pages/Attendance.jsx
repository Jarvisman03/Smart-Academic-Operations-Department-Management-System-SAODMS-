import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Avatar, Icon } from '../components/ui';
import { BarChart, DoughnutChart } from '../components/ui/Charts';
import { attendanceApi, sectionApi, subjectApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { attendanceColor, pct } from '../utils/format';

function MarkTab({ departmentId }) {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState(1);
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sectionApi.list(departmentId ? { department: departmentId } : {}).then((r) => setSections(r.data));
    subjectApi.list(departmentId ? { department: departmentId } : {}).then((r) => setSubjects(r.data));
  }, [departmentId]);

  const loadRoster = async (sec) => {
    setSectionId(sec);
    if (!sec) return;
    setLoading(true);
    try {
      const r = await attendanceApi.roster(sec);
      setRoster(r.data);
      const initial = {};
      r.data.forEach((s) => { initial[s._id] = 'present'; });
      setMarks(initial);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setMarks((m) => ({ ...m, [id]: m[id] === 'present' ? 'absent' : 'present' }));

  const submit = async () => {
    if (!sectionId || !subjectId) return toast.error('Select section and subject');
    const section = sections.find((s) => s._id === sectionId);
    const records = roster.map((s) => ({ student: s._id, status: marks[s._id] || 'absent' }));
    try {
      await attendanceApi.mark({
        section: sectionId, subject: subjectId, period: Number(period),
        date: new Date().toISOString(), year: section?.year, records,
        faculty: section?.classTeacher,
      });
      toast.success('Attendance recorded');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to mark');
    }
  };

  const presentCount = Object.values(marks).filter((v) => v === 'present').length;

  return (
    <Card>
      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="label">Section</label>
          <select className="input" value={sectionId} onChange={(e) => loadRoster(e.target.value)}>
            <option value="">Select</option>
            {sections.map((s) => <option key={s._id} value={s._id}>Year {s.year} - {s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Period</label>
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((p) => <option key={p} value={p}>Period {p}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={submit} className="btn-primary w-full" disabled={!roster.length}>Submit ({presentCount}/{roster.length})</button>
        </div>
      </div>

      {loading ? <Loading /> : roster.length === 0 ? (
        <EmptyState title="Select a section to load students" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {roster.map((s) => {
            const present = marks[s._id] === 'present';
            return (
              <button key={s._id} onClick={() => toggle(s._id)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition ${present ? 'border-emerald-300 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <Avatar name={s.user?.name} size="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.user?.name}</div>
                  <div className="text-[11px] text-slate-400">{s.rollNo}</div>
                </div>
                <span className={`badge ${present ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{present ? 'P' : 'A'}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AnalyticsTab({ departmentId }) {
  const [byYear, setByYear] = useState([]);
  const [bySection, setBySection] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const p = departmentId ? { department: departmentId } : {};
    attendanceApi.analytics({ ...p, groupBy: 'year' }).then((r) => setByYear(r.data));
    attendanceApi.analytics({ ...p, groupBy: 'section' }).then((r) => setBySection(r.data));
    attendanceApi.stats(p).then((r) => setStats(r.data));
  }, [departmentId]);

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card>
        <span className="section-title">Today / Week / Month</span>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {['today', 'week', 'month'].map((k) => (
            <div key={k} className="rounded-lg bg-slate-50 p-3">
              <div className={`text-2xl font-bold ${attendanceColor(stats?.[k]?.percentage)}`}>{pct(stats?.[k]?.percentage)}</div>
              <div className="text-xs capitalize text-slate-500">{k}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <span className="section-title">Attendance by Year</span>
        <div className="mt-3"><BarChart labels={byYear.map((y) => `Year ${y.key}`)} datasets={[{ label: '%', data: byYear.map((y) => y.percentage) }]} height={200} /></div>
      </Card>
      <Card className="lg:col-span-2">
        <span className="section-title">Attendance by Section</span>
        <div className="mt-3"><BarChart labels={bySection.map((_, i) => `Sec ${i + 1}`)} datasets={[{ label: '%', data: bySection.map((s) => s.percentage) }]} height={220} /></div>
      </Card>
    </div>
  );
}

function LowTab({ departmentId }) {
  const [data, setData] = useState(null);
  useEffect(() => { attendanceApi.low(departmentId ? { department: departmentId } : {}).then((r) => setData(r.data)); }, [departmentId]);
  if (!data) return <Loading />;
  const groups = [
    { key: 'critical', label: 'Critical', color: 'rose' },
    { key: 'warning', label: 'Warning', color: 'amber' },
    { key: 'below', label: 'Below 75%', color: 'slate' },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <Card key={g.key}>
          <div className="flex items-center justify-between mb-2">
            <span className="section-title">{g.label} ({(data[g.key] || []).length})</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(data[g.key] || []).length === 0 ? <EmptyState title="None" /> : data[g.key].map((s) => (
              <div key={s._id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100">
                <Avatar name={s.user?.name} size="w-8 h-8" />
                <div className="flex-1 min-w-0"><div className="text-sm truncate">{s.user?.name}</div><div className="text-[11px] text-slate-400">{s.section?.name || ''} · Yr {s.year}</div></div>
                <span className={`font-bold ${attendanceColor(s.attendanceSummary?.percentage)}`}>{pct(s.attendanceSummary?.percentage)}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Attendance() {
  const { departmentId, hasPermission } = useAuth();
  const [tab, setTab] = useState(hasPermission('attendance:mark') ? 'mark' : 'analytics');

  const tabs = [
    hasPermission('attendance:mark') && { id: 'mark', label: 'Mark Attendance' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'low', label: 'Low Attendance' },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Record, analyze, and monitor student attendance" />
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'mark' && <MarkTab departmentId={departmentId} />}
      {tab === 'analytics' && <AnalyticsTab departmentId={departmentId} />}
      {tab === 'low' && <LowTab departmentId={departmentId} />}
    </div>
  );
}
