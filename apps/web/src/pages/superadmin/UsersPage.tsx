import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id:               string
  name:             string
  email:            string
  plan:             string
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
  user:    AdminUser
  onClose: () => void
}

function EditRow({ user, onClose }: EditRowProps) {
  const queryClient = useQueryClient()
  const [plan,    setPlan]    = useState<'free' | 'pro'>(user.plan as 'free' | 'pro')
  const [capStr,  setCapStr]  = useState<string>(
    user.platformTokenCap !== null ? String(user.platformTokenCap) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (body: { plan?: string; platformTokenCap?: number | null }) =>
      api.patch(`/api/superadmin/users/${user.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Failed to save changes')
    },
  })

  function handleSave() {
    setError(null)

    // Validate token cap
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

  return (
    <tr className="bg-slate-50">
      <td colSpan={6} className="px-10 py-5">
        <div className="space-y-4 max-w-md">
          <p className="text-sm font-semibold text-slate-700">
            Edit {user.name || user.email}
          </p>

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

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">All registered users and their usage stats.</p>
        </div>
        {users && users.length > 0 && (
          <span className="text-sm text-slate-500 tabular-nums">
            {users.length.toLocaleString()} user{users.length !== 1 ? 's' : ''}
          </span>
        )}
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
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
                        className="hover:bg-slate-50/60 cursor-pointer group"
                      >
                        {/* User name + email */}
                        <td className="px-5 py-3 max-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 flex-shrink-0 transition-colors group-hover:text-slate-600">
                              {expandedId === user.id
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                              }
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-slate-800 font-medium">
                                {user.name || '—'}
                              </p>
                              <p className="truncate text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3">
                          <PlanBadge plan={user.plan} />
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
