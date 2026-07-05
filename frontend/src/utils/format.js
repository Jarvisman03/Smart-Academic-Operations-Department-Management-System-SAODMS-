export const roleLabels = {
  admin: 'Administrator', dean: 'Dean', hod: 'HOD', co_hod: 'Co-HOD',
  faculty: 'Faculty', student: 'Student', lab_assistant: 'Lab Assistant',
};

export const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'dean', label: 'Dean' },
  { value: 'hod', label: 'HOD' },
  { value: 'co_hod', label: 'Co-HOD' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'lab_assistant', label: 'Lab Assistant' },
  { value: 'student', label: 'Student' },
];

export const designationOptions = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lab Assistant', 'Guest Faculty'];

export const facultyStatusMeta = {
  available: { label: 'Available', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  teaching: { label: 'Teaching', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  lab_duty: { label: 'Lab Duty', color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  meeting: { label: 'In Meeting', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  on_leave: { label: 'On Leave', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  exam_duty: { label: 'Exam Duty', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

export const roomStatusMeta = {
  occupied: { label: 'Occupied', color: 'bg-emerald-500', text: 'text-white' },
  free: { label: 'Free', color: 'bg-slate-300', text: 'text-slate-700' },
  reserved: { label: 'Reserved', color: 'bg-amber-400', text: 'text-amber-900' },
  maintenance: { label: 'Maintenance', color: 'bg-rose-500', text: 'text-white' },
};

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function pct(n) {
  return `${Math.round(n || 0)}%`;
}

export function attendanceColor(percentage) {
  if (percentage >= 75) return 'text-emerald-600';
  if (percentage >= 65) return 'text-amber-600';
  return 'text-rose-600';
}
