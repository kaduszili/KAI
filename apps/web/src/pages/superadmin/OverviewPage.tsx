import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, MessageSquare, CreditCard, Key, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalUsers:    number
  freeUsers:     number
  proUsers:      number
  totalMessages: number
}

interface PlatformSettings {
  platformApiKeySet: boolean
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-brand-50 rounded-lg">
            <Icon size={20} className="text-brand-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Platform API Key Card ─────────────────────────────────────────────────────

function PlatformKeyCard() {
  const queryClient = useQueryClient()
  const [editing, setEditing]   = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [error, setError]       = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['superadmin', 'settings'],
    queryFn:  () => api.get<PlatformSettings>('/api/superadmin/settings'),
  })

  const mutation = useMutation({
    mutationFn: (platformApiKey: string | null) =>
      api.patch('/api/superadmin/settings', { platformApiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'settings'] })
      setEditing(false)
      setKeyInput('')
      setError(null)
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Failed to save key')
    },
  })

  function handleSave() {
    if (!keyInput.trim()) {
      setError('Please enter an API key')
      return
    }
    mutation.mutate(keyInput.trim())
  }

  function handleClear() {
    if (!confirm('Remove the platform API key? Users without their own key will lose access.')) return
    mutation.mutate(null)
  }

  function handleCancel() {
    setEditing(false)
    setKeyInput('')
    setError(null)
  }

  if (isLoading) return null

  const isSet = settings?.platformApiKeySet ?? false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key size={18} className="text-slate-500" />
          <CardTitle className="text-base">Platform OpenAI Key</CardTitle>
        </div>
        <CardDescription>
          Used as fallback for users who don't have their own API key configured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSet ? (
                <>
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-sm text-slate-700">API key is configured</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-500">No platform API key set</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                {isSet ? 'Replace key' : 'Add key'}
              </Button>
              {isSet && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  onClick={handleClear}
                  disabled={mutation.isPending}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="sk-..."
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setError(null) }}
              className={error ? 'border-red-400' : ''}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Save key'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin', 'overview'],
    queryFn:  () => api.get<OverviewStats>('/api/superadmin/overview'),
    staleTime: 30_000,
  })

  return (
    <div className="max-w-4xl space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-1">High-level stats and global platform settings.</p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 animate-pulse bg-slate-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            icon={Users}
            label="Total users"
            value={stats?.totalUsers ?? 0}
          />
          <KpiCard
            icon={CreditCard}
            label="Free users"
            value={stats?.freeUsers ?? 0}
            sub={stats?.totalUsers ? `${Math.round((stats.freeUsers / stats.totalUsers) * 100)}%` : undefined}
          />
          <KpiCard
            icon={CreditCard}
            label="Pro users"
            value={stats?.proUsers ?? 0}
            sub={stats?.totalUsers ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}%` : undefined}
          />
          <KpiCard
            icon={MessageSquare}
            label="Total messages"
            value={stats?.totalMessages ?? 0}
          />
        </div>
      )}

      {/* ── Platform Settings ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Platform Settings</h2>
        <PlatformKeyCard />
      </div>

    </div>
  )
}
