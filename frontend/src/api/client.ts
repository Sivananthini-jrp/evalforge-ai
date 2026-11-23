// evalforge-ai/frontend/src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://evalforge-ai-nbqz.onrender.com/api', // <-- Paste your actual URL here
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;