import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Bird, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { AuthUser } from '@kai/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvitationData {
  name:  string
  email: string
  plan:  'free' | 'pro'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InvitationPage() {
  const { token }  = useParams<{ token: string }>()
  const navigate   = useNavigate()
  const setUser    = useAuthStore((s) => s.setUser)

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [expired,    setExpired]    = useState(false)

  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Load invitation details
  useEffect(() => {
    if (!token) { setExpired(true); setLoading(false); return }

    api.get<InvitationData>(`/api/invitations/${token}`)
      .then((data) => { setInvitation(data); setLoading(false) })
      .catch(() => { setExpired(true); setLoading(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post<{ user: AuthUser; token: string }>(
        `/api/invitations/${token}/accept`,
        { password },
      )
      setUser(res.user)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Expired / invalid ──────────────────────────────────────────────────────

  if (expired || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Bird size={22} className="text-slate-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Invitation expired</h1>
          <p className="text-sm text-slate-500">
            This invitation link is invalid or has already been used. Please ask for a new one.
          </p>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const isPro = invitation.plan === 'pro'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Bird size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Bentevi</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Complete your account</h1>
            <p className="text-sm text-slate-500">
              You've been invited to Bentevi. Set a password to get started.
            </p>
          </div>

          {/* Plan badge */}
          <div className="flex items-center gap-2">
            <span className={[
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
              isPro ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600',
            ].join(' ')}>
              {isPro ? 'Pro plan' : 'Free plan'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name — read-only */}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={invitation.name} disabled className="bg-slate-50" />
            </div>

            {/* Email — read-only */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={invitation.email} disabled className="bg-slate-50" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" loading={submitting}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-brand-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
