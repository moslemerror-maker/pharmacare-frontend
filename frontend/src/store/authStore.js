import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null, token: null, isAuth: false,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        localStorage.setItem('pc_token', data.token)
        set({ user: data.user, token: data.token, isAuth: true })
        return data.user
      },
      logout: () => {
        localStorage.removeItem('pc_token')
        set({ user: null, token: null, isAuth: false })
      },
      isRole: (...roles) => {
        const u = get().user
        if (!u) return false
        if (u.permissions?.all) return true
        return roles.includes(u.role_name)
      },
      isAdmin: () => get().user?.permissions?.all === true,
    }),
    { name: 'pc_auth', partialize: s => ({ user:s.user, token:s.token, isAuth:s.isAuth }) }
  )
)
