import { Avatar } from '../ui';
import { facultyStatusMeta } from '../../utils/format';

export default function FacultyCard({ f }) {
  const meta = facultyStatusMeta[f.status] || facultyStatusMeta.available;
  return (
    <div className="card card-pad">
      <div className="flex items-start gap-3">
        <Avatar name={f.name} src={f.avatar} size="w-11 h-11" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-900 truncate">{f.name}</div>
            <span className={`badge ${meta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${f.status !== 'available' ? 'animate-pulseDot' : ''}`} />
              {meta.label}
            </span>
          </div>
          <div className="text-xs text-slate-500">{f.designation}</div>
          {(f.status === 'teaching' || f.status === 'lab_duty') && (
            <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2 space-y-0.5">
              <div><span className="text-slate-400">Room:</span> {f.room || '—'} · <span className="text-slate-400">Time:</span> {f.time || '—'}</div>
              <div><span className="text-slate-400">Subject:</span> {f.subject || '—'}</div>
              <div><span className="text-slate-400">Batch:</span> {f.batch || '—'} {f.section ? `· Sec ${f.section}` : ''}</div>
            </div>
          )}
          {f.status === 'available' && f.cabin && (
            <div className="mt-2 text-xs text-slate-400">Location: Cabin {f.cabin}</div>
          )}
        </div>
      </div>
    </div>
  );
}
