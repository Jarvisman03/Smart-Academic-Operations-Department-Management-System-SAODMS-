import api from './client';

// Thin wrappers around the REST API. Each returns response.data.
const unwrap = (p) => p.then((r) => r.data);

export const authApi = {
  login: (body) => unwrap(api.post('/auth/login', body)),
  me: () => unwrap(api.get('/auth/me')),
  logout: () => unwrap(api.post('/auth/logout')),
  updateProfile: (body) => unwrap(api.put('/auth/profile', body)),
  changePassword: (body) => unwrap(api.post('/auth/change-password', body)),
};

export const dashboardApi = {
  overview: (params) => unwrap(api.get('/dashboard/overview', { params })),
  facultyMonitor: (params) => unwrap(api.get('/dashboard/faculty-monitor', { params })),
  running: (params) => unwrap(api.get('/dashboard/running', { params })),
  labMonitor: (params) => unwrap(api.get('/dashboard/lab-monitor', { params })),
  attendanceSummary: (params) => unwrap(api.get('/dashboard/attendance-summary', { params })),
};

export const userApi = {
  list: (params) => unwrap(api.get('/users', { params })),
  get: (id) => unwrap(api.get(`/users/${id}`)),
  create: (body) => unwrap(api.post('/users', body)),
  update: (id, body) => unwrap(api.put(`/users/${id}`, body)),
  setActive: (id, isActive) => unwrap(api.patch(`/users/${id}/active`, { isActive })),
  resetPassword: (id, newPassword) => unwrap(api.post(`/users/${id}/reset-password`, { newPassword })),
  remove: (id) => unwrap(api.delete(`/users/${id}`)),
};

export const facultyApi = {
  list: (params) => unwrap(api.get('/faculty', { params })),
  get: (id) => unwrap(api.get(`/faculty/${id}`)),
  create: (body) => unwrap(api.post('/faculty', body)),
  update: (id, body) => unwrap(api.put(`/faculty/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/faculty/${id}`)),
};

export const studentApi = {
  list: (params) => unwrap(api.get('/students', { params })),
  get: (id) => unwrap(api.get(`/students/${id}`)),
  create: (body) => unwrap(api.post('/students', body)),
  update: (id, body) => unwrap(api.put(`/students/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/students/${id}`)),
};

export const roomApi = {
  list: (params) => unwrap(api.get('/rooms', { params })),
  map: (buildingId, params) => unwrap(api.get(buildingId ? `/rooms/map/${buildingId}` : '/rooms/map', { params })),
  availability: (params) => unwrap(api.get('/rooms/availability', { params })),
  setStatus: (id, status) => unwrap(api.patch(`/rooms/${id}/status`, { status })),
  create: (body) => unwrap(api.post('/rooms', body)),
  update: (id, body) => unwrap(api.put(`/rooms/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/rooms/${id}`)),
};

export const labApi = {
  list: (params) => unwrap(api.get('/labs', { params })),
  create: (body) => unwrap(api.post('/labs', body)),
  update: (id, body) => unwrap(api.put(`/labs/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/labs/${id}`)),
};

export const equipmentApi = {
  list: (params) => unwrap(api.get('/equipment', { params })),
  create: (body) => unwrap(api.post('/equipment', body)),
  update: (id, body) => unwrap(api.put(`/equipment/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/equipment/${id}`)),
};

export const maintenanceApi = {
  list: (params) => unwrap(api.get('/maintenance', { params })),
  create: (body) => unwrap(api.post('/maintenance', body)),
  update: (id, body) => unwrap(api.put(`/maintenance/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/maintenance/${id}`)),
};

export const buildingApi = {
  list: () => unwrap(api.get('/buildings')),
  create: (body) => unwrap(api.post('/buildings', body)),
  update: (id, body) => unwrap(api.put(`/buildings/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/buildings/${id}`)),
};

export const floorApi = {
  list: (params) => unwrap(api.get('/floors', { params })),
  create: (body) => unwrap(api.post('/floors', body)),
  update: (id, body) => unwrap(api.put(`/floors/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/floors/${id}`)),
};

export const departmentApi = {
  list: (params) => unwrap(api.get('/departments', { params })),
  create: (body) => unwrap(api.post('/departments', body)),
  update: (id, body) => unwrap(api.put(`/departments/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/departments/${id}`)),
};

export const sectionApi = {
  list: (params) => unwrap(api.get('/sections', { params })),
  create: (body) => unwrap(api.post('/sections', body)),
  update: (id, body) => unwrap(api.put(`/sections/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/sections/${id}`)),
};

export const subjectApi = {
  list: (params) => unwrap(api.get('/subjects', { params })),
  create: (body) => unwrap(api.post('/subjects', body)),
  update: (id, body) => unwrap(api.put(`/subjects/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/subjects/${id}`)),
};

export const semesterApi = {
  list: (params) => unwrap(api.get('/semesters', { params })),
  create: (body) => unwrap(api.post('/semesters', body)),
  update: (id, body) => unwrap(api.put(`/semesters/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/semesters/${id}`)),
};

export const timetableApi = {
  weekly: (sectionId) => unwrap(api.get(`/timetable/weekly/${sectionId}`)),
  facultyWeekly: (facultyId) => unwrap(api.get(`/timetable/faculty/${facultyId}/weekly`)),
  roomWeekly: (roomId) => unwrap(api.get(`/timetable/room/${roomId}/weekly`)),
  myWeekly: () => unwrap(api.get('/timetable/my/weekly')),
  list: (params) => unwrap(api.get('/timetable', { params })),
  create: (body) => unwrap(api.post('/timetable', body)),
  update: (id, body) => unwrap(api.put(`/timetable/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/timetable/${id}`)),
  checkConflict: (body) => unwrap(api.post('/timetable/check-conflict', body)),
  generate: (body) => unwrap(api.post('/timetable/generate', body)),
  substitutes: (id, params) => unwrap(api.get(`/timetable/${id}/substitutes`, { params })),
  applySubstitution: (id, body) => unwrap(api.post(`/timetable/${id}/substitution`, body)),
};

export const attendanceApi = {
  list: (params) => unwrap(api.get('/attendance', { params })),
  roster: (sectionId) => unwrap(api.get(`/attendance/roster/${sectionId}`)),
  mark: (body) => unwrap(api.post('/attendance/mark', body)),
  stats: (params) => unwrap(api.get('/attendance/stats', { params })),
  analytics: (params) => unwrap(api.get('/attendance/analytics', { params })),
  low: (params) => unwrap(api.get('/attendance/low', { params })),
  generateQr: (body) => unwrap(api.post('/attendance/qr/generate', body)),
  studentHistory: (id) => unwrap(api.get(`/attendance/student/${id}`)),
  approve: (id) => unwrap(api.post(`/attendance/${id}/approve`)),
};

export const facultyAttendanceApi = {
  today: (params) => unwrap(api.get('/faculty-attendance/today', { params })),
  list: (params) => unwrap(api.get('/faculty-attendance', { params })),
  checkIn: (body) => unwrap(api.post('/faculty-attendance/check-in', body)),
  checkOut: (body) => unwrap(api.post('/faculty-attendance/check-out', body)),
};

export const selfAttendanceApi = {
  status: () => unwrap(api.get('/self-attendance/status')),
  enrollFace: (descriptor) => unwrap(api.post('/self-attendance/enroll-face', { descriptor })),
  checkIn: (body) => unwrap(api.post('/self-attendance/check-in', body)),
};

export const academicApi = {
  assignments: (params) => unwrap(api.get('/assignments', { params })),
  tasks: (params) => unwrap(api.get('/tasks', { params })),
  meetings: (params) => unwrap(api.get('/meetings', { params })),
  events: (params) => unwrap(api.get('/events', { params })),
  announcements: (params) => unwrap(api.get('/announcements', { params })),
  documents: (params) => unwrap(api.get('/documents', { params })),
  calendar: (params) => unwrap(api.get('/calendar', { params })),
  createAnnouncement: (body) => unwrap(api.post('/announcements', body)),
  createMeeting: (body) => unwrap(api.post('/meetings', body)),
  createEvent: (body) => unwrap(api.post('/events', body)),
  createTask: (body) => unwrap(api.post('/tasks', body)),
};

export const leaveApi = {
  list: (params) => unwrap(api.get('/leaves', { params })),
  apply: (body) => unwrap(api.post('/leaves', body)),
  setStatus: (id, body) => unwrap(api.patch(`/leaves/${id}/status`, body)),
};

export const bookingApi = {
  list: (params) => unwrap(api.get('/bookings', { params })),
  create: (body) => unwrap(api.post('/bookings', body)),
  setStatus: (id, status) => unwrap(api.patch(`/bookings/${id}/status`, { status })),
  remove: (id) => unwrap(api.delete(`/bookings/${id}`)),
};

export const taskApi = {
  list: (params) => unwrap(api.get('/tasks', { params })),
  create: (body) => unwrap(api.post('/tasks', body)),
  update: (id, body) => unwrap(api.put(`/tasks/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/tasks/${id}`)),
};

export const documentApi = {
  list: (params) => unwrap(api.get('/documents', { params })),
  upload: (formData) => unwrap(api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  download: (id) => unwrap(api.get(`/documents/${id}/download`)),
  remove: (id) => unwrap(api.delete(`/documents/${id}`)),
};

export const chatApi = {
  list: () => unwrap(api.get('/chat')),
  get: (id) => unwrap(api.get(`/chat/${id}`)),
  direct: (userId) => unwrap(api.post('/chat/direct', { userId })),
  group: (body) => unwrap(api.post('/chat/group', body)),
};

export const auditApi = {
  list: (params) => unwrap(api.get('/audit', { params })),
};

export const notificationApi = {
  list: (params) => unwrap(api.get('/notifications', { params })),
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/read-all')),
  broadcast: (body) => unwrap(api.post('/notifications/broadcast', body)),
};

export const aiApi = {
  chat: (body) => unwrap(api.post('/ai/chat', body)),
  status: () => unwrap(api.get('/ai/status')),
  predictAttendance: (params) => unwrap(api.get('/ai/predict/attendance', { params })),
  predictWorkload: (params) => unwrap(api.get('/ai/predict/workload', { params })),
  predictRooms: (params) => unwrap(api.get('/ai/predict/rooms', { params })),
  risks: (params) => unwrap(api.get('/ai/risks', { params })),
};

export const reportApi = {
  history: (params) => unwrap(api.get('/reports/history', { params })),
  downloadUrl: (params) => {
    const q = new URLSearchParams(params).toString();
    return `${api.defaults.baseURL}/reports/generate?${q}`;
  },
};

export const searchApi = { global: (params) => unwrap(api.get('/search', { params })) };

export const settingsApi = {
  get: () => unwrap(api.get('/settings')),
  update: (body) => unwrap(api.put('/settings', body)),
};

export const metaApi = { constants: () => unwrap(api.get('/meta/constants')) };
