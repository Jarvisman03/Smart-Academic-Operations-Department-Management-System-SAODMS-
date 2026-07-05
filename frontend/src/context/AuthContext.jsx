import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import { setAccessToken, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) { setLoading(false); return; }
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch (e) {
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (e) { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes('*') || perms.includes(perm);
  };

  const departmentId = user?.department?._id || user?.department;

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, hasPermission, departmentId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
