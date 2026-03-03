import { Outlet, Navigate } from 'react-router'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/auth'

export function AppShell() {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  // Redirect to onboarding if not completed
  if (!user.onboardingDone) return <Navigate to="/onboarding" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
