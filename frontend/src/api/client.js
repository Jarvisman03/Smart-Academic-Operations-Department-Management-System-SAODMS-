import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem('saodms_token', token);
  else localStorage.removeItem('saodms_token');
}
export function getAccessToken() {
  if (!accessToken) accessToken = localStorage.getItem('saodms_token');
  return accessToken;
}

// Attach bearer token.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh access token once on 401.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const { data } = await refreshing;
        refreshing = null;
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setAccessToken(null);
        if (!window.location.pathname.includes('/login')) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
