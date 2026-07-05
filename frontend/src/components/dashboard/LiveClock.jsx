import { useEffect, useState } from 'react';
import { Icon } from '../ui';

export default function LiveClock({ day, currentPeriod, college }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const period = currentPeriod;
  return (
    <div className="card card-pad bg-gradient-to-br from-slate-900 to-brand-900 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-brand-200 uppercase tracking-wide">{day} · {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div className="text-4xl font-extrabold tabular-nums mt-1">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>
        <Icon name="clock" className="w-10 h-10 text-brand-300" />
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="bg-white/10 rounded-lg px-3 py-2">
          <div className="text-[10px] text-brand-200 uppercase">Working Hours</div>
          <div className="font-semibold">{college?.startTime} – {college?.endTime}</div>
        </div>
        <div className="bg-white/10 rounded-lg px-3 py-2 flex-1">
          <div className="text-[10px] text-brand-200 uppercase">Current Lecture</div>
          <div className="font-semibold">{period ? `${period.label} (${period.start}–${period.end})` : 'No active lecture'}</div>
        </div>
      </div>
    </div>
  );
}
