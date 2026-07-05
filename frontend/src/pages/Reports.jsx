import { useEffect, useState } from 'react';
import { PageHeader, Card, Icon, Table } from '../components/ui';
import { reportApi } from '../api/endpoints';
import { getAccessToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const REPORT_TYPES = [
  { type: 'attendance', label: 'Attendance Report' },
  { type: 'student', label: 'Student Report' },
  { type: 'faculty', label: 'Faculty Report' },
  { type: 'workload', label: 'Faculty Workload' },
  { type: 'room_usage', label: 'Room Usage' },
  { type: 'lab_usage', label: 'Lab Usage' },
];

export default function Reports() {
  const { departmentId } = useAuth();
  const [history, setHistory] = useState([]);
  const [type, setType] = useState('attendance');
  const [format, setFormat] = useState('pdf');

  const loadHistory = () => reportApi.history(departmentId ? { department: departmentId } : {}).then((r) => setHistory(r.data));
  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [departmentId]);

  const download = () => {
    const params = { type, format, ...(departmentId && { department: departmentId }) };
    const url = reportApi.downloadUrl(params);
    // Open in a new tab with auth via fetch->blob for header-based auth.
    fetch(url, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
        setTimeout(loadHistory, 800);
      });
  };

  const columns = [
    { key: 'title', label: 'Report' },
    { key: 'format', label: 'Format', render: (r) => r.format?.toUpperCase() },
    { key: 'rowCount', label: 'Rows' },
    { key: 'generatedBy', label: 'By', render: (r) => r.generatedBy?.name },
    { key: 'createdAt', label: 'Generated', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export department reports" />
      <Card className="mb-5">
        <span className="section-title">Generate New Report</span>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="label">Report Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {REPORT_TYPES.map((r) => <option key={r.type} value={r.type}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={download} className="btn-primary w-full"><Icon name="download" className="w-4 h-4" />Download</button>
          </div>
        </div>
      </Card>
      <Card>
        <span className="section-title">Recent Reports</span>
        <div className="mt-3"><Table columns={columns} rows={history} empty="No reports generated yet" /></div>
      </Card>
    </div>
  );
}
