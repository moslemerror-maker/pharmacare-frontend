import axios from 'axios'
const RAILWAY = 'https://web-production-36db0.up.railway.app'
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || RAILWAY) + '/api',
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
