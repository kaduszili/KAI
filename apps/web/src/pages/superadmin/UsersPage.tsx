import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ChevronDown, ChevronRight, X, Check, Copy, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id:               string
  name:             string
  email:            string
  role:             string
  plan:             string
  active:           boolean
  platformTokenCap: number | null
  onboardingDone:   boolean
  createdAt:        string
  projectId:        string | null
  projectName:      string | null
  totalMessages:    number
  monthlyTokens:    number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === 'pro'
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      isPro
        ? 'bg-brand-50 text-brand-700'
        : 'bg-slate-100 text-slate-600',
    ].join(' ')}>
      {isPro ? 'Pro' : 'Free'}
    </span>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users size={36} strokeWidth={1.5} className="text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">No users yet.</p>
      <p className="text-xs text-slate-400 mt-1">
        Users will appear here once they register.
      </p>
    </div>
  )
}

// ─── Edit row ─────────────────────────────────────────────────────────────────

interface EditRowProps {
  user:      AdminUser
  currentId: string   // logged-in superadmin's own ID
  onClose:   () => void
}

function EditRow({ user, currentId, onClose }: EditRowProps) {
  const queryClient = useQueryClient()
  const isSelf      = user.id === currentId
  const isAdmin     = user.role === 'super_admin'

  const [plan,    setPlan]    = useState<'free' | 'pro'>(user.plan as 'free' | 'pro')
  const [capStr,  setCapStr]  = useState<string>(
    user.platformTokenCap !== null ? String(user.platformTokenCap) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (body: { plan?: string; platformTokenCap?: number | null; active?: boolean }) =>
      api.patch(`/api/superadmin/users/${user.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err instanceof ApiError ? err.message : (err?.message ?? 'Failed to save changes'))
    },
  })

  function handleSave() {
    setError(null)

    let platformTokenCap: number | null | undefined = undefined
    if (capStr.trim() === '') {
      platformTokenCap = null
    } else {
      const parsed = parseInt(capStr.trim(), 10)
      if (isNaN(parsed) || parsed < 0) {
        setError('Token cap must be a non-negative integer (or leave blank for no cap)')
        return
      }
      platformTokenCap = parsed
    }

    const body: { plan?: string; platformTokenCap?: number | null } = {}
    if (plan !== user.plan)                          body.plan = plan
    if (platformTokenCap !== user.platformTokenCap) body.platformTokenCap = platformTokenCap

    if (Object.keys(body).length === 0) { onClose(); return }

    mutation.mutate(body)
  }

  function handleToggleActive() {
    mutation.mutate({ active: !user.active })
  }

  return (
    <tr className="bg-slate-50">
      <td colSpan={6} className="px-10 py-5">
        <div className="space-y-4 max-w-md">
          <p className="text-sm font-semibold text-slate-700">
            Edit {user.name || user.email}
            {isAdmin && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                Super Admin
              </span>
            )}
          </p>

          {/* Plan + token cap — only editable for non-admin customers */}
          {!isAdmin && (
            <>
              {/* Plan toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Plan</label>
                <div className="flex gap-2">
                  {(['free', 'pro'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={[
                        'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize',
                        plan === p
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token cap */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Monthly token cap override
                  <span className="ml-1 font-normal text-slate-400">(leave blank for no cap)</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 500000"
                  value={capStr}
                  onChange={(e) => { setCapStr(e.target.value); setError(null) }}
                  className={`w-48 ${error ? 'border-red-400' : ''}`}
                />
              </div>
            </>
          )}

          {/* Activate / Deactivate */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Account status</label>
            {isSelf ? (
              <p className="text-xs text-slate-400">You cannot deactivate your own account.</p>
            ) : user.active ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={mutation.isPending}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Deactivate user
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={mutation.isPending}
                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
              >
                Activate user
              </Button>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Save / Cancel — only show if there's something editable beyond active toggle */}
          {!isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void
}

function InviteModal({ onClose }: InviteModalProps) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [plan,    setPlan]    = useState<'free' | 'pro'>('free')
  const [link,    setLink]    = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ id: string; token: string; link: string; expiresAt: string }>(
        '/api/superadmin/invitations',
        { name: name.trim(), email: email.trim(), plan },
      ),
    onSuccess: (data) => {
      setLink(data.link)
    },
    onError: (err: any) => {
      setError(err instanceof ApiError ? err.message : 'Failed to create invitation')
    },
  })

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSubmit() {
    setError(null)
    if (!name.trim())                    { setError('Name is required'); return }
    if (!email.trim())                   { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email))    { setError('Enter a valid email'); return }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Invite user</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!link ? (
            <>
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="space-y-1.5">
                <Label htmlFor="inv-name">First name</Label>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-email">Email address</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Plan</Label>
                <div className="flex gap-2">
                  {(['free', 'pro'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={[
                        'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize',
                        plan === p
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={handleSubmit} loading={mutation.isPending}>
                  Generate link
                </Button>
              </div>
            </>
          ) : (
            /* Success — show the link */
            <>
              <p className="text-sm text-slate-600">
                Invitation link generated. Copy and share it with <strong>{name}</strong>.
                The link expires in 7 days.
              </p>
              <div className="flex gap-2">
                <Input value={link} readOnly className="font-mono text-xs text-slate-700 bg-slate-50" />
                <Button size="sm" onClick={handleCopy} className="flex-shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              {copied && <p className="text-xs text-green-600">Copied!</p>}
              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const currentId        = useAuthStore((s) => s.user?.id ?? '')
  const [expandedId,      setExpandedId]      = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['superadmin', 'users'],
    queryFn:  () => api.get<AdminUser[]>('/api/superadmin/users'),
    staleTime: 30_000,
  })

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="max-w-6xl">

      {/* ── Invite Modal ────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">All registered users and their usage stats.</p>
        </div>
        <div className="flex items-center gap-3">
          {users && users.length > 0 && (
            <span className="text-sm text-slate-500 tabular-nums">
              {users.length.toLocaleString()} user{users.length !== 1 ? 's' : ''}
            </span>
          )}
          <Button size="sm" onClick={() => setShowInviteModal(true)}>
            Invite user
          </Button>
        </div>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && users && (
        <Card>
          {users.length === 0 ? (
            <EmptyState />
          ) : (
            <CardContent className="p-0">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 w-[40%]">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-24">
                      Plan
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                      Monthly tokens
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                      Total msgs
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                      Token cap
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <>
                      {/* ── Main row ─────────────────────────────────── */}
                      <tr
                        key={user.id}
                        onClick={() => toggleExpand(user.id)}
                        className={[
                          'cursor-pointer group transition-colors',
                          user.active
                            ? 'hover:bg-slate-50/60'
                            : 'bg-slate-50/40 opacity-60 hover:opacity-80',
                        ].join(' ')}
                      >
                        {/* User name + email + badges */}
                        <td className="px-5 py-3 max-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 flex-shrink-0 transition-colors group-hover:text-slate-600">
                              {expandedId === user.id
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                              }
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="truncate text-slate-800 font-medium">
                                  {user.name || '—'}
                                </p>
                                {user.role === 'super_admin' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                    <ShieldCheck size={9} />
                                    Admin
                                  </span>
                                )}
                                {!user.active && (
                                  <span className="inline-flex text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                    Deactivated
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan — show dash for super_admin */}
                        <td className="px-4 py-3">
                          {user.role === 'super_admin'
                            ? <span className="text-slate-300 text-xs">—</span>
                            : <PlanBadge plan={user.plan} />
                          }
                        </td>

                        {/* Monthly tokens */}
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap tabular-nums">
                          {user.monthlyTokens > 0 ? formatNum(user.monthlyTokens) : '—'}
                        </td>

                        {/* Total messages */}
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap tabular-nums">
                          {user.totalMessages > 0 ? user.totalMessages.toLocaleString() : '—'}
                        </td>

                        {/* Token cap override */}
                        <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap tabular-nums">
                          {user.platformTokenCap !== null
                            ? formatNum(user.platformTokenCap)
                            : <span className="text-slate-300">—</span>
                          }
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-3 text-right text-slate-400 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>

                      {/* ── Edit row ─────────────────────────────────── */}
                      {expandedId === user.id && (
                        <EditRow
                          key={`${user.id}-edit`}
                          user={user}
                          currentId={currentId}
                          onClose={() => setExpandedId(null)}
                        />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </CardContent>
          )}
        </Card>
      )}

    </div>
  )
}
