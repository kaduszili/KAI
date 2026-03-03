import { useQuery }           from '@tanstack/react-query'
import { MessageSquare, CheckCircle2, Zap, ShieldAlert, LayoutDashboard } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyCount { date: string; count: number }
interface RecentLog  { id: string; question: string; status: string; tokens: number; createdAt: string }

interface DashboardStats {
  totalMessages:    number
  successCount:     number
  blockedCount:     number
  rateLimitedCount: number
  capExceededCount: number
  errorCount:       number
  successRate:      number
  monthlyTokens:    number
  monthlyTokenCap:  number
  dailyCounts:      DailyCount[]
  recentLogs:       RecentLog[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffM  = Math.floor(diffMs / 60_000)
  if (diffM < 1)   return 'just now'
  if (diffM < 60)  return `${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24)  return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

/** Short weekday label for a 'YYYY-MM-DD' string. */
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label:     string
  value:     string | number
  sub?:      string
  icon:      React.ElementType
  iconColor: string
  iconBg:    string
}
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${iconBg}`}>
            <Icon size={18} className={iconColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  success:     { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Success' },
  blocked:     { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Blocked' },
  rate_limited:{ bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Rate limited' },
  cap_exceeded:{ bg: 'bg-slate-100', text: 'text-slate-600',  label: 'Cap exceeded' },
  error:       { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Error' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ─── Empty state (no messages yet) ───────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
        <LayoutDashboard size={22} className="text-brand-600" />
      </div>
      <h2 className="text-base font-semibold text-slate-900 mb-1">Your dashboard is ready</h2>
      <p className="text-sm text-slate-500 max-w-xs">
        Analytics and conversation logs will appear here once your assistant starts receiving messages.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: stats, isLoading } = useQuery({
    queryKey:       ['dashboard-stats'],
    queryFn:        () => api.get<DashboardStats>('/api/stats/dashboard'),
    refetchInterval: 30_000,
  })

  const loading = isLoading || !stats

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && stats.totalMessages === 0 && <EmptyState />}

      {!loading && stats.totalMessages > 0 && (
        <div className="space-y-6">

          {/* ── KPI Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Messages"
              value={stats.totalMessages.toLocaleString()}
              icon={MessageSquare}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
            />
            <StatCard
              label="Success Rate"
              value={`${stats.successRate}%`}
              sub={`${stats.successCount.toLocaleString()} successful`}
              icon={CheckCircle2}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Monthly Tokens"
              value={formatNumber(stats.monthlyTokens)}
              sub={`of ${formatNumber(stats.monthlyTokenCap)} cap`}
              icon={Zap}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              label="Blocked"
              value={stats.blockedCount.toLocaleString()}
              sub={stats.rateLimitedCount > 0 ? `+${stats.rateLimitedCount} rate-limited` : undefined}
              icon={ShieldAlert}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
          </div>

          {/* ── 7-day trend ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Messages — last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const maxCount = Math.max(...stats.dailyCounts.map((d) => d.count), 1)
                return (
                  <div className="flex items-end gap-2" style={{ height: '96px' }}>
                    {stats.dailyCounts.map(({ date, count }) => (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-600">
                          {count > 0 ? count : ''}
                        </span>
                        <div
                          className="w-full bg-brand-500 rounded-sm transition-all"
                          style={{
                            height:    `${Math.max((count / maxCount) * 56, count > 0 ? 4 : 0)}px`,
                            opacity:   count > 0 ? 1 : 0.15,
                            minHeight: '2px',
                            backgroundColor: count > 0 ? undefined : '#e2e8f0',
                          }}
                        />
                        <span className="text-[10px] text-slate-400">{dayLabel(date)}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* ── Recent conversations ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Recent conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3 w-full">Message</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">Tokens</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-6 py-3 whitespace-nowrap">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 max-w-0">
                        <p className="truncate text-slate-800">{log.question}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap tabular-nums">
                        {log.tokens > 0 ? log.tokens.toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-400 whitespace-nowrap">
                        {relativeTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
