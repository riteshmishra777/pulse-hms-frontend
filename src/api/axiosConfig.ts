import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // sessionStorage first (tab-specific token), fallback to localStorage
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token truly expired — clear both storages and redirect
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // 403 = permission denied for this action, do NOT redirect
    return Promise.reject(error);
  }
);

export default api;