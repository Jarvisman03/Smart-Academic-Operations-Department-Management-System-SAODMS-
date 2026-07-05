import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center"><Loading /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (permission && !hasPermission(permission)) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-500 mt-1">You do not have permission to view this page.</p>
      </div>
    );
  }
  return children;
}
