import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading } from '../components/ui';
import { settingsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEditFeatures = hasPermission('settings:features');
  const canEditAttendance = hasPermission('settings:attendance');
  const canEditAny = canEditFeatures || canEditAttendance;

  useEffect(() => { settingsApi.get().then((r) => setSettings(r.data)).finally(() => setLoading(false)); }, []);

  const save = async () => {
    try {
      const r = await settingsApi.update(settings);
      setSettings(r.data);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Attendance rules, thresholds and features"
        actions={canEditAny ? <button onClick={save} className="btn-primary text-xs">Save</button> : null}
      />
      {!canEditAny && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
          You have read-only access to settings.
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <span className="section-title">Attendance Thresholds</span>
          {!canEditAttendance && <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">read-only</span>}
          <div className="mt-3 space-y-3">
            {['minimum', 'warning', 'critical'].map((k) => (
              <div key={k} className="flex items-center justify-between">
                <label className="text-sm capitalize text-slate-600">{k} %</label>
                <input type="number" disabled={!canEditAttendance} className="input max-w-[100px] disabled:bg-slate-50 disabled:text-slate-400" value={settings.thresholds?.[k] ?? 0}
                  onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, [k]: Number(e.target.value) } })} />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">Late threshold (min)</label>
              <input type="number" disabled={!canEditAttendance} className="input max-w-[100px] disabled:bg-slate-50 disabled:text-slate-400" value={settings.lateThresholdMinutes ?? 10}
                onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: Number(e.target.value) })} />
            </div>
          </div>
        </Card>

        <Card>
          <span className="section-title">Attendance Rules (per year)</span>
          {!canEditAttendance && <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">read-only</span>}
          <p className="text-xs text-slate-400 mt-1 mb-3">
            "Mandatory" flags the year as expected to attend. "Counts toward shortage" includes it in shortage/defaulter reports.
          </p>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((y) => {
              const fallback = { mandatory: y !== 4, countsTowardShortage: y !== 4 };
              const rule = settings.attendanceRules?.[y] || settings.attendanceRules?.[String(y)] || fallback;
              const setRule = (patch) => setSettings({
                ...settings,
                attendanceRules: { ...settings.attendanceRules, [y]: { ...rule, ...patch } },
              });
              return (
                <div key={y} className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium">Year {y}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" disabled={!canEditAttendance} checked={!!rule.mandatory}
                        onChange={(e) => setRule({ mandatory: e.target.checked })} />
                      Mandatory
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" disabled={!canEditAttendance} checked={!!rule.countsTowardShortage}
                        onChange={(e) => setRule({ countsTowardShortage: e.target.checked })} />
                      Counts toward shortage
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <span className="section-title">Features</span>
          {!canEditFeatures && <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">read-only</span>}
          <div className="mt-3 space-y-2">
            {Object.entries(settings.features || {}).map(([k, v]) => (
              <label key={k} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-sm">
                <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                <input type="checkbox" disabled={!canEditFeatures} checked={v} onChange={(e) => setSettings({ ...settings, features: { ...settings.features, [k]: e.target.checked } })} />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <span className="section-title">College Info</span>
          {!canEditFeatures && <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">read-only</span>}
          {canEditFeatures ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-600">Name</label>
                <input className="input max-w-[220px]" value={settings.college?.name ?? ''}
                  onChange={(e) => setSettings({ ...settings, college: { ...settings.college, name: e.target.value } })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-slate-600">Timing</label>
                <div className="flex items-center gap-2">
                  <input className="input max-w-[90px]" value={settings.college?.startTime ?? ''}
                    onChange={(e) => setSettings({ ...settings, college: { ...settings.college, startTime: e.target.value } })} />
                  <span className="text-slate-400">-</span>
                  <input className="input max-w-[90px]" value={settings.college?.endTime ?? ''}
                    onChange={(e) => setSettings({ ...settings, college: { ...settings.college, endTime: e.target.value } })} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{settings.college?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Timing</span><span className="font-medium">{settings.college?.startTime} - {settings.college?.endTime}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Working Days</span><span className="font-medium">{(settings.workingDays || []).length} days</span></div>
            </div>
          )}
        </Card>

        <Card>
          <span className="section-title">Campus Geofence (GPS attendance)</span>
          {!canEditFeatures && <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">read-only</span>}
          <p className="text-xs text-slate-400 mt-1 mb-3">
            When enabled, self check-in (Mark Present) must originate within the radius of this point.
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-sm">
              <span>Enforce geofence</span>
              <input type="checkbox" disabled={!canEditFeatures} checked={!!settings.geofence?.enabled}
                onChange={(e) => setSettings({ ...settings, geofence: { ...settings.geofence, enabled: e.target.checked } })} />
            </label>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">Latitude</label>
              <input type="number" step="any" disabled={!canEditFeatures} className="input max-w-[160px] disabled:bg-slate-50 disabled:text-slate-400" value={settings.geofence?.lat ?? ''}
                onChange={(e) => setSettings({ ...settings, geofence: { ...settings.geofence, lat: e.target.value === '' ? undefined : Number(e.target.value) } })} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">Longitude</label>
              <input type="number" step="any" disabled={!canEditFeatures} className="input max-w-[160px] disabled:bg-slate-50 disabled:text-slate-400" value={settings.geofence?.lng ?? ''}
                onChange={(e) => setSettings({ ...settings, geofence: { ...settings.geofence, lng: e.target.value === '' ? undefined : Number(e.target.value) } })} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600">Radius (metres)</label>
              <input type="number" disabled={!canEditFeatures} className="input max-w-[120px] disabled:bg-slate-50 disabled:text-slate-400" value={settings.geofence?.radiusMeters ?? 200}
                onChange={(e) => setSettings({ ...settings, geofence: { ...settings.geofence, radiusMeters: Number(e.target.value) } })} />
            </div>
            {canEditFeatures && (
              <button
                type="button"
                className="btn-ghost text-xs w-full"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((pos) =>
                    setSettings((s) => ({ ...s, geofence: { ...s.geofence, lat: pos.coords.latitude, lng: pos.coords.longitude } }))
                  );
                }}
              >
                Use my current location
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
