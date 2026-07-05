import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { Loading } from './components/ui';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
// Lazy-loaded: pulls in the (large) face-api.js bundle only when opened.
const MarkPresent = lazy(() => import('./pages/MarkPresent'));
import Timetable from './pages/Timetable';
import Faculty from './pages/Faculty';
import Students from './pages/Students';
import Users from './pages/Users';
import Structure from './pages/Structure';
import Resources from './pages/Resources';
import Academic from './pages/Academic';
import Tasks from './pages/Tasks';
import Leaves from './pages/Leaves';
import Approvals from './pages/Approvals';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import AiAssistant from './pages/AiAssistant';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/mark-present" element={<ProtectedRoute permission="attendance:self"><Suspense fallback={<Loading label="Loading camera module…" />}><MarkPresent /></Suspense></ProtectedRoute>} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/students" element={<Students />} />
        <Route path="/users" element={<ProtectedRoute permission="user:manage"><Users /></ProtectedRoute>} />
        <Route path="/structure" element={<Structure />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/academic" element={<Academic />} />
        <Route path="/tasks" element={<ProtectedRoute permission="task:manage"><Tasks /></ProtectedRoute>} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/documents" element={<ProtectedRoute permission="document:view"><Documents /></ProtectedRoute>} />
        <Route path="/messages" element={<Chat />} />
        <Route path="/audit" element={<ProtectedRoute permission="audit:view"><Audit /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute permission="report:generate"><Reports /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute permission="ai:use"><AiAssistant /></ProtectedRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<ProtectedRoute permission="settings:manage"><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
