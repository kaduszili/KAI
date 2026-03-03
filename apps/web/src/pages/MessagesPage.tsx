import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullLogRow {
  id:        string
  question:  string
  answer:    string | null
  tokens:    number
  model:     string | null
  status:    string
  ipAddress: string | null
  createdAt: string
}

interface MessagesPage {
  logs:  FullLogRow[]
  total: number
  page:  number
  limit: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  success:      { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Success'      },
  blocked:      { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Blocked'      },
  rate_limited: { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Rate limited' },
  cap_exceeded: { bg: 'bg-slate-100', text: 'text-slate-600',  label: 'Cap exceeded' },
  error:        { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Error'        },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',          label: 'All'          },
  { value: 'success',      label: 'Success'      },
  { value: 'blocked',      label: 'Blocked'      },
  { value: 'rate_limited', label: 'Rate limited' },
  { value: 'cap_exceeded', label: 'Cap exceeded' },
  { value: 'error',        label: 'Error'        },
]

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <MessageSquare size={36} strokeWidth={1.5} className="text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">
        {filtered ? 'No conversations match this filter.' : 'No conversations yet.'}
      </p>
      {!filtered && (
        <p className="text-xs text-slate-400 mt-1">
          Messages will appear here once your widget receives traffic.
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const [page,       setPage]       = useState(0)
  const [status,     setStatus]     = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey:        ['messages', page, status],
    queryFn:         () => api.get<MessagesPage>(`/api/messages?page=${page}&status=${status}`),
    staleTime:       10_000,
    placeholderData: keepPreviousData,
  })

  function handleStatusChange(s: string) {
    setStatus(s)
    setPage(0)
    setExpandedId(null)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const totalPages = Math.ceil((data?.total ?? 0) / (data?.limit ?? 25))
  const startItem  = (page * (data?.limit ?? 25)) + 1
  const endItem    = Math.min((page + 1) * (data?.limit ?? 25), data?.total ?? 0)

  return (
    <div className="max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Conversation History</h1>
          <p className="text-sm text-slate-500 mt-1">All messages received by your AI assistant.</p>
        </div>
        {data && data.total > 0 && (
          <span className="text-sm text-slate-500 tabular-nums">
            {data.total.toLocaleString()} conversation{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Status filter tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusChange(f.value)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              status === f.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && data && (
        <Card className={isFetching ? 'opacity-70 transition-opacity' : ''}>
          {data.logs.length === 0 ? (
            <EmptyState filtered={status !== 'all'} />
          ) : (
            <>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 px-5 py-3 w-full">
                        Question
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                        Tokens
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.logs.map((log) => (
                      <>
                        {/* ── Main row ───────────────────────────────────── */}
                        <tr
                          key={log.id}
                          onClick={() => toggleExpand(log.id)}
                          className="hover:bg-slate-50/60 cursor-pointer group"
                        >
                          <td className="px-5 py-3 max-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 flex-shrink-0 transition-transform group-hover:text-slate-600">
                                {expandedId === log.id
                                  ? <ChevronDown size={14} />
                                  : <ChevronRight size={14} />
                                }
                              </span>
                              <p className="truncate text-slate-800">{log.question}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap tabular-nums">
                            {log.tokens > 0 ? log.tokens.toLocaleString() : '—'}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400 whitespace-nowrap">
                            {relativeTime(log.createdAt)}
                          </td>
                        </tr>

                        {/* ── Expanded detail row ────────────────────────── */}
                        {expandedId === log.id && (
                          <tr key={`${log.id}-expanded`} className="bg-slate-50">
                            <td colSpan={4} className="px-10 py-4">
                              <div className="space-y-3">

                                {/* Question */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                    Question
                                  </p>
                                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                                    {log.question}
                                  </p>
                                </div>

                                {/* Answer */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                    Answer
                                  </p>
                                  {log.answer ? (
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                      {log.answer}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No answer (message was not processed)</p>
                                  )}
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-400 border-t border-slate-100">
                                  {log.model     && <span>Model: <span className="text-slate-600 font-mono">{log.model}</span></span>}
                                  {log.ipAddress && <span>IP: <span className="text-slate-600 font-mono">{log.ipAddress}</span></span>}
                                  <span>
                                    {new Date(log.createdAt).toLocaleString(undefined, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </CardContent>

              {/* ── Pagination ─────────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <p className="text-sm text-slate-500 tabular-nums">
                    Showing {startItem.toLocaleString()}–{endItem.toLocaleString()} of {data.total.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0 || isFetching}
                      onClick={() => { setPage((p) => p - 1); setExpandedId(null) }}
                    >
                      ← Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1 || isFetching}
                      onClick={() => { setPage((p) => p + 1); setExpandedId(null) }}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

    </div>
  )
}
