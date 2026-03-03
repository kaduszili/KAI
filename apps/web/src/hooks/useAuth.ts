import { useAuthStore } from '@/store/auth'
import { api, ApiError } from '@/lib/api'
import { useNavigate } from 'react-router'
import type { AuthUser } from '@kai/shared'

export function useAuth() {
  const { user, setUser, clear } = useAuthStore()
  const navigate = useNavigate()

  async function login(email: string, password: string): Promise<AuthUser> {
    const data = await api.post<{ user: AuthUser }>('/api/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  async function register(name: string, email: string, password: string): Promise<AuthUser> {
    const data = await api.post<{ user: AuthUser }>('/api/auth/register', { name, email, password })
    setUser(data.user)
    return data.user
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout', {})
    } catch {
      // ignore errors — clear local state regardless
    }
    clear()
    navigate('/login')
  }

  return { user, login, register, logout, isAuthenticated: user !== null }
}
