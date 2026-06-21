import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '';
const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
