import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell }      from '@/components/layout/AppShell'
import { LoginPage }     from '@/pages/auth/LoginPage'
import { RegisterPage }  from '@/pages/auth/RegisterPage'
import { DashboardPage }  from '@/pages/DashboardPage'
import { OnboardingPage }  from '@/pages/OnboardingPage'
import { KnowledgePage }   from '@/pages/KnowledgePage'
import { SettingsPage }    from '@/pages/SettingsPage'
import { AppearancePage }  from '@/pages/AppearancePage'
import { MessagesPage }    from '@/pages/MessagesPage'
import { OverviewPage }   from '@/pages/superadmin/OverviewPage'
import { UsersPage }      from '@/pages/superadmin/UsersPage'
import { useAuthStore }  from '@/store/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h1>
      <p className="text-sm text-slate-500">Coming in a future phase.</p>
    </div>
  )
}

export function App() {
  const user = useAuthStore((s) => s.user)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={
            user ? <OnboardingPage /> : <Navigate to="/login" replace />
          } />

          {/* Protected — AppShell handles auth + onboarding redirect */}
          <Route element={<AppShell />}>
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/messages"   element={<MessagesPage />} />
            <Route path="/knowledge"  element={<KnowledgePage />} />
            <Route path="/appearance" element={<AppearancePage />} />
            <Route path="/settings"   element={<SettingsPage />} />
            <Route path="/superadmin"        element={<OverviewPage />} />
            <Route path="/superadmin/users"  element={<UsersPage />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={
            user
              ? <Navigate to={user.onboardingDone ? '/dashboard' : '/onboarding'} replace />
              : <Navigate to="/login" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
