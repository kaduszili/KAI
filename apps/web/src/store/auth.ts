import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@kai/shared'

interface AuthState {
  user:    AuthUser | null
  setUser: (user: AuthUser | null) => void
  clear:   () => void
}

/**
 * Stores only non-sensitive display info.
 * The JWT lives in an HTTP-only cookie and is never accessible here.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:    null,
      setUser: (user) => set({ user }),
      clear:   () => set({ user: null }),
    }),
    { name: 'kai-auth' },
  ),
)
