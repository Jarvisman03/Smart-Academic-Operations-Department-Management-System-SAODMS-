import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Modal, Tabs, Field, Icon } from '../components/ui';
import { timetableApi, sectionApi, facultyApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const blankForm = { subjectName: '', faculty: '', roomName: '', type: 'theory', startTime: '', endTime: '' };

export default function Timetable() {
  const { departmentId, hasPermission } = useAuth();
  const canManage = hasPermission('timetable:manage');

  const [view, setView] = useState('section'); // section | faculty
  const [sections, setSections] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selId, setSelId] = useState('');
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editCell, setEditCell] = useState(null); // { day, period, entry }
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(null); // entry being dragged

  const [subModal, setSubModal] = useState(null);
  const [subs, setSubs] = useState([]);

  // Base data. Some lists are permission-gated (e.g. faculty:view is
  // manager-only), so load them independently and ignore failures.
  useEffect(() => {
    const params = departmentId ? { department: departmentId } : {};
    sectionApi.list(params).then((r) => setSections(r.data || [])).catch(() => setSections([]));
    facultyApi.list({ ...params, limit: 200 }).then((r) => setFaculties(r.data || [])).catch(() => setFaculties([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const options = view === 'section' ? sections : faculties;
  const selectedSection = useMemo(() => sections.find((s) => s._id === selId), [sections, selId]);

  // Pick a default option when the view or its list changes.
  useEffect(() => {
    if (options.length) setSelId((prev) => (options.some((o) => o._id === prev) ? prev : options[0]._id));
    else setSelId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, options.length]);

  // Load grid whenever selection changes.
  useEffect(() => {
    if (!selId) { setGrid(null); return; }
    let cancelled = false;
    setLoading(true);
    const loader = view === 'section' ? timetableApi.weekly(selId) : timetableApi.facultyWeekly(selId);
    loader.then((r) => { if (!cancelled) setGrid(r.data); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [view, selId]);

  const reload = () => timetableApi.weekly(selId).then((r) => setGrid(r.data));

  const optionLabel = (o) => {
    if (view === 'section') return `Year ${o.year} - Section ${o.name}`;
    return o.user?.name || o.employeeId;
  };

  const generate = async () => {
    if (!selId || view !== 'section') return;
    try {
      const r = await timetableApi.generate({ section: selId, clearExisting: true });
      toast.success(`Generated ${r.data.created} entries`);
      reload();
    } catch (e) { toast.error('Generation failed'); }
  };

  // Default start/end clock times for a starting period + span, from the grid template.
  const periodTimes = (startPeriod, span = 1) => {
    const list = grid?.periods || [];
    const idx = list.findIndex((p) => p.period === Number(startPeriod));
    if (idx === -1) return { start: '', end: '' };
    const last = list[Math.min(idx + Math.max(1, span) - 1, list.length - 1)];
    return { start: list[idx].start, end: last.end };
  };

  const openEditor = (day, period, entry) => {
    if (view !== 'section' || !canManage) return;
    setEditCell({ day, period, entry: entry || null });
    if (entry) {
      const t = periodTimes(period, 1);
      setForm({
        subjectName: entry.subject?.name || entry.subjectName || '',
        faculty: entry.faculty?._id || '',
        roomName: entry.room?.roomNumber || entry.roomName || '',
        type: entry.type || 'theory',
        startTime: entry.startTime || t.start, endTime: entry.endTime || t.end,
      });
    } else {
      const t = periodTimes(period, 1);
      setForm({ ...blankForm, startTime: t.start, endTime: t.end });
    }
  };

  const saveEntry = async () => {
    if (!form.subjectName.trim() || !form.faculty || !form.roomName.trim()) { toast.error('Subject, faculty and room are required'); return; }
    if (!form.startTime || !form.endTime) { toast.error('Start and end time are required'); return; }
    if (form.endTime <= form.startTime) { toast.error('End time must be after start time'); return; }
    setSaving(true);
    try {
      const body = {
        department: selectedSection.department?._id || selectedSection.department || departmentId,
        section: selectedSection._id,
        year: selectedSection.year,
        day: editCell.day,
        period: editCell.period,
        periodSpan: 1,
        subjectName: form.subjectName.trim(),
        faculty: form.faculty,
        roomName: form.roomName.trim(),
        type: form.type,
        startTime: form.startTime,
        endTime: form.endTime,
      };
      if (editCell.entry) await timetableApi.update(editCell.entry._id, body);
      else await timetableApi.create(body);
      toast.success(editCell.entry ? 'Class updated' : 'Class added');
      setEditCell(null);
      reload();
    } catch (e) {
      const conflicts = e?.response?.data?.errors;
      if (Array.isArray(conflicts) && conflicts.length) toast.error(conflicts.map((c) => c.message).join(' · '));
      else toast.error(e?.response?.data?.message || 'Could not save');
    } finally { setSaving(false); }
  };

  const deleteEntry = async () => {
    if (!editCell?.entry) return;
    setSaving(true);
    try {
      await timetableApi.remove(editCell.entry._id);
      toast.success('Class removed');
      setEditCell(null);
      reload();
    } catch (e) { toast.error('Could not delete'); } finally { setSaving(false); }
  };

  // Drag a class to an empty slot (section view only).
  const onDrop = async (day, period) => {
    if (!drag || view !== 'section' || !canManage) return;
    const moving = drag;
    setDrag(null);
    if (moving.day === day && moving.period === period) return;
    try {
      await timetableApi.update(moving._id, {
        department: moving.department?._id || moving.department,
        section: moving.section?._id || moving.section || selId,
        year: moving.year,
        subjectName: moving.subject?.name || moving.subjectName,
        faculty: moving.faculty?._id,
        roomName: moving.room?.roomNumber || moving.roomName,
        type: moving.type,
        // Preserve the duration (in periods); the backend snaps times to the
        // destination period's template since custom times don't carry across slots.
        periodSpan: moving.periodSpan || 1,
        day,
        period,
      });
      toast.success('Class moved');
      reload();
    } catch (e) {
      const conflicts = e?.response?.data?.errors;
      if (Array.isArray(conflicts) && conflicts.length) toast.error(conflicts.map((c) => c.message).join(' · '));
      else toast.error('Move created a conflict');
    }
  };

  const openSubstitutes = async (entry) => {
    setSubModal(entry);
    try { const r = await timetableApi.substitutes(entry._id); setSubs(r.data.suggestions || []); }
    catch (e) { setSubs([]); }
  };

  const roomLabel = (cell) => cell.room?.roomNumber || cell.roomName;
  const cellSecondary = (cell) => {
    if (view === 'section') return [cell.faculty?.user?.name, roomLabel(cell) ? `Room ${roomLabel(cell)}` : ''];
    return [cell.section ? `Y${cell.section.year} ${cell.section.name}` : '', roomLabel(cell) ? `Room ${roomLabel(cell)}` : ''];
  };

  return (
    <div>
      <PageHeader
        title="Smart Timetable"
        subtitle="Weekly schedule with conflict detection, editing and auto-generation"
        actions={view === 'section' && canManage && <button onClick={generate} className="btn-primary text-xs">Auto-Generate</button>}
      />

      <Tabs
        tabs={[{ id: 'section', label: 'By Section' }, { id: 'faculty', label: 'By Faculty' }]}
        active={view}
        onChange={setView}
      />

      <div className="mb-4 max-w-xs">
        <select className="input" value={selId} onChange={(e) => setSelId(e.target.value)}>
          {options.length === 0 && <option value="">No {view}s available</option>}
          {options.map((o) => <option key={o._id} value={o._id}>{optionLabel(o)}</option>)}
        </select>
      </div>

      {view === 'section' && canManage && (
        <p className="text-xs text-slate-400 mb-2">Click an empty slot to add a class · click a class to edit · drag a class to move it.</p>
      )}

      {loading ? <Loading /> : !grid ? <EmptyState title={`Select a ${view}`} /> : (
        <Card pad={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Day / Period</th>
                {grid.periods.map((p) => (
                  <th key={p.period} className="px-3 py-3 text-center text-xs font-semibold text-slate-500 min-w-[130px]">
                    {p.label}<div className="text-[10px] font-normal text-slate-400">{p.start}-{p.end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(grid.days || []).map((day) => (
                <tr key={day} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-slate-700">{day}</td>
                  {grid.periods.map((p) => {
                    const cell = grid.grid[day]?.[p.period];
                    if (cell && cell._covered) return null; // covered by a preceding multi-period class
                    const isEntry = cell && !cell._covered;
                    const span = isEntry ? (cell.periodSpan || 1) : 1;
                    const [line2, line3] = isEntry ? cellSecondary(cell) : [];
                    return (
                      <td
                        key={p.period}
                        colSpan={span}
                        className="px-1.5 py-1.5 align-top"
                        onDragOver={(e) => { if (!isEntry && drag) e.preventDefault(); }}
                        onDrop={() => !isEntry && onDrop(day, p.period)}
                      >
                        {isEntry ? (
                          <div
                            draggable={view === 'section' && canManage}
                            onDragStart={() => setDrag(cell)}
                            onDragEnd={() => setDrag(null)}
                            onClick={() => openEditor(day, p.period, cell)}
                            className={`w-full text-left rounded-lg p-2 text-xs cursor-pointer ${cell.type === 'lab' ? 'bg-cyan-50 border border-cyan-200' : cell.type === 'library' ? 'bg-amber-50 border border-amber-200' : 'bg-brand-50 border border-brand-200'} hover:ring-1 hover:ring-brand-300`}
                          >
                            <div className="font-semibold text-slate-800 truncate">{cell.subject?.name || cell.subjectName}</div>
                            {cell.startTime && <div className="text-[10px] text-slate-400">{cell.startTime}-{cell.endTime}</div>}
                            <div className="text-slate-500 truncate">{line2}</div>
                            <div className="text-slate-400 truncate">{line3}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEditor(day, p.period, null)}
                            disabled={view !== 'section' || !canManage}
                            className={`h-14 w-full rounded-lg bg-slate-50/60 ${view === 'section' && canManage ? 'hover:bg-brand-50 hover:border hover:border-dashed hover:border-brand-300 flex items-center justify-center text-slate-300 hover:text-brand-500' : ''}`}
                          >
                            {view === 'section' && canManage && <Icon name="plus" className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add / edit class */}
      <Modal open={!!editCell} onClose={() => setEditCell(null)} title={editCell?.entry ? 'Edit class' : 'Add class'}>
        <p className="text-sm text-slate-500 mb-4">{editCell?.day} · Period {editCell?.period}</p>
        <div className="space-y-3">
          <Field label="Subject" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="e.g. Data Structures" />
          <Field as="select" label="Faculty" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })}>
            <option value="">Select faculty</option>
            {faculties.map((f) => <option key={f._id} value={f._id}>{f.user?.name || f.employeeId}</option>)}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room" value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })} placeholder="e.g. A-101" />
            <Field as="select" label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
              <option value="tutorial">Tutorial</option>
              <option value="library">Library</option>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Field label="End time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} hint="Sets the class duration." />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-5">
          <div>
            {editCell?.entry && (
              <button className="btn-ghost text-rose-600 text-xs" onClick={deleteEntry} disabled={saving}>Delete</button>
            )}
          </div>
          <div className="flex gap-2">
            {editCell?.entry && (
              <button className="btn-ghost text-xs" onClick={() => { const en = editCell.entry; setEditCell(null); openSubstitutes(en); }} disabled={saving}>Substitute</button>
            )}
            <button className="btn-primary text-xs" onClick={saveEntry} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      {/* Substitute suggestions */}
      <Modal open={!!subModal} onClose={() => setSubModal(null)} title="Substitute Suggestions">
        <p className="text-sm text-slate-500 mb-3">{subModal?.subject?.name || subModal?.subjectName} · {subModal?.day}</p>
        {subs.length === 0 ? <EmptyState title="No free faculty found" /> : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.faculty._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100">
                <div>
                  <div className="font-medium text-sm">{s.faculty.name}</div>
                  <div className="text-xs text-slate-400">{s.faculty.designation} · Load {s.weeklyLoad}/{s.maxLoad}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.hasExpertise && <span className="badge bg-emerald-100 text-emerald-700">Expert</span>}
                  <span className="badge bg-brand-100 text-brand-700">Score {s.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
