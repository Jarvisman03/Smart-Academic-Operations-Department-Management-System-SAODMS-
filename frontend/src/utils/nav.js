// Navigation model with permission gating.
// `perm` requires a single permission; `anyPerm` requires any one of the listed permissions.
export const navItems = [
  { to: '/', label: 'Command Center', icon: 'grid', perm: 'dashboard:command' },
  { to: '/approvals', label: 'Approvals', icon: 'inbox', anyPerm: ['leave:approve', 'attendance:approve', 'resource:manage'] },
  { to: '/mark-present', label: 'Mark Present', icon: 'camera', perm: 'attendance:self' },
  { to: '/attendance', label: 'Attendance', icon: 'check', perm: 'attendance:view' },
  { to: '/timetable', label: 'Timetable', icon: 'calendar', perm: 'timetable:view' },
  { to: '/faculty', label: 'Faculty', icon: 'users', perm: 'faculty:view' },
  { to: '/students', label: 'Students', icon: 'user', perm: 'student:view' },
  { to: '/users', label: 'Users', icon: 'shield', perm: 'user:manage' },
  { to: '/structure', label: 'Academic Structure', icon: 'layers', anyPerm: ['subject:manage', 'section:manage', 'department:manage'] },
  { to: '/resources', label: 'Resources', icon: 'building', perm: 'resource:view' },
  { to: '/academic', label: 'Academic', icon: 'book', perm: 'assignment:view' },
  { to: '/tasks', label: 'Tasks', icon: 'briefcase', perm: 'task:manage' },
  { to: '/leaves', label: 'Leaves', icon: 'calendar', anyPerm: ['leave:apply', 'leave:approve'] },
  { to: '/documents', label: 'Documents', icon: 'file', perm: 'document:view' },
  { to: '/messages', label: 'Messages', icon: 'message' },
  { to: '/reports', label: 'Reports', icon: 'download', perm: 'report:generate' },
  { to: '/ai', label: 'AI Assistant', icon: 'sparkles', perm: 'ai:use' },
  { to: '/audit', label: 'Audit Log', icon: 'clock', perm: 'audit:view' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/settings', label: 'Settings', icon: 'cog', perm: 'settings:manage' },
];
