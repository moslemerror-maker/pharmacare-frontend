import axios from 'axios'
// In dev, VITE_API_URL is empty and Vite proxy handles /api → localhost:3001
// In production, set VITE_API_URL to the on-premise backend URL (e.g. http://192.168.1.10:3001)
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
})
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('pc_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('pc_token')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})
export default api
