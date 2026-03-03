import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ThemeConfig, DEFAULT_THEME } from '@kai/shared'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicSettings {
  projectId:       string
  openaiApiKeySet: boolean
  openaiModel:     string
  systemMessage:   string
  blockedKeywords: string[]
  themeJson:       unknown
}

interface Project {
  id:   string
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeTheme(stored: unknown): ThemeConfig {
  const s = (stored ?? {}) as Record<string, Record<string, unknown>>
  return {
    global:     { ...DEFAULT_THEME.global,     ...(s.global     ?? {}) },
    bubble:     { ...DEFAULT_THEME.bubble,     ...(s.bubble     ?? {}) },
    chatWindow: { ...DEFAULT_THEME.chatWindow, ...(s.chatWindow ?? {}) },
    advanced:   { ...DEFAULT_THEME.advanced,   ...(s.advanced   ?? {}) },
  }
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value:    string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white flex-shrink-0"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 font-mono text-sm"
        maxLength={7}
      />
    </div>
  )
}

// ─── Widget Preview (Fin/Intercom-inspired) ───────────────────────────────────

function WidgetPreview({
  theme,
  projectName,
}: {
  theme:       ThemeConfig
  projectName: string
}) {
  const { bubble, chatWindow } = theme

  // Border-radius values per setting
  const brMap = {
    sharp:   { msg: '4px',                   assistantBl: '4px', userBr: '4px' },
    rounded: { msg: '12px',                  assistantBl: '4px', userBr: '4px' },
    pill:    { msg: '18px',                  assistantBl: '4px', userBr: '4px' },
  }
  const br = brMap[chatWindow.borderRadius] ?? brMap.rounded

  const botIconSVG = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M12 11V5" />
      <circle cx="12" cy="4" r="1" />
      <path d="M8 15h.01M12 15h.01M16 15h.01" />
    </svg>
  )

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Live preview of your widget appearance.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-slate-100 rounded-b-xl overflow-hidden" style={{ height: 440 }}>

          {/* ── Chat panel ── */}
          <div
            className="absolute bottom-20 right-4 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 358 }}
          >
            {/* Header — white, Fin-style */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {bubble.iconUrl
                    ? <img src={bubble.iconUrl} className="w-full h-full object-cover" alt="" />
                    : botIconSVG
                  }
                </div>
                {/* Accent dot using headerColor */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: chatWindow.headerColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{projectName || 'Your Project'}</p>
                <p className="text-xs text-slate-400">AI Assistant</p>
              </div>
              <span className="text-slate-400 text-sm leading-none">✕</span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
              {/* AI message 1 */}
              <div className="flex flex-col gap-1">
                <div
                  className="self-start text-xs px-3 py-2 leading-relaxed"
                  style={{
                    background:              chatWindow.aiMessageColor,
                    color:                   '#1e293b',
                    borderRadius:            br.msg,
                    borderBottomLeftRadius:  br.assistantBl,
                    maxWidth:                '85%',
                  }}
                >
                  Hi there 👋 How can I help you today?
                </div>
                <span className="text-[10px] text-slate-400 ml-1">{projectName || 'Your Project'} · AI · just now</span>
              </div>

              {/* User message */}
              <div
                className="self-end text-xs px-3 py-2 leading-relaxed"
                style={{
                  background:               chatWindow.userMessageColor,
                  color:                    '#fff',
                  borderRadius:             br.msg,
                  borderBottomRightRadius:  br.userBr,
                  maxWidth:                 '85%',
                }}
              >
                What are your opening hours?
              </div>

              {/* AI message 2 */}
              <div className="flex flex-col gap-1">
                <div
                  className="self-start text-xs px-3 py-2 leading-relaxed"
                  style={{
                    background:             chatWindow.aiMessageColor,
                    color:                  '#1e293b',
                    borderRadius:           br.msg,
                    borderBottomLeftRadius: br.assistantBl,
                    maxWidth:               '85%',
                  }}
                >
                  We're open Mon–Fri, 9am–6pm.
                </div>
                <span className="text-[10px] text-slate-400 ml-1">{projectName || 'Your Project'} · AI · just now</span>
              </div>
            </div>

            {/* Input — pill border, Fin-style */}
            <div className="mx-3 mb-2 border-2 border-slate-200 rounded-2xl px-3 py-2 flex flex-col gap-1.5 flex-shrink-0">
              <span className="text-xs text-slate-400">Type a message…</span>
              <div className="flex justify-end">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: bubble.backgroundColor }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Powered-by strip */}
            <div className="text-center text-[10px] text-slate-400 pb-2 border-t border-slate-50 pt-1.5 flex-shrink-0">
              Powered by KAI
            </div>
          </div>

          {/* Bubble FAB */}
          <div
            className="absolute bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
            style={{ background: bubble.backgroundColor }}
          >
            {bubble.iconUrl
              ? <img src={bubble.iconUrl} className="w-6 h-6 object-contain rounded-full" alt="" />
              : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              )
            }
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AppearancePage() {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => api.get<PublicSettings>('/api/settings'),
  })

  const { data: project } = useQuery({
    queryKey: ['project'],
    queryFn:  () => api.get<Project>('/api/projects/mine'),
  })

  const [theme,   setTheme]   = useState<ThemeConfig>(DEFAULT_THEME)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync theme from fetched settings
  useEffect(() => {
    if (settings?.themeJson) {
      setTheme(mergeTheme(settings.themeJson))
    }
  }, [settings])

  // ── Patch helpers ──────────────────────────────────────────────────────────

  function setBubble(patch: Partial<ThemeConfig['bubble']>) {
    setTheme((t) => ({ ...t, bubble: { ...t.bubble, ...patch } }))
  }

  function setChatWindow(patch: Partial<ThemeConfig['chatWindow']>) {
    setTheme((t) => ({ ...t, chatWindow: { ...t.chatWindow, ...patch } }))
  }

  // ── Icon upload ────────────────────────────────────────────────────────────

  function handleIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBubble({ iconUrl: reader.result as string })
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await api.patch<PublicSettings>('/api/settings', { themeJson: theme })
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save appearance')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const projectName = project?.name ?? 'Your Project'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Appearance</h1>
        <p className="text-sm text-slate-500 mt-1">Customise how your chat widget looks on your website.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Left column — controls ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Bubble card */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Bubble</CardTitle>
              <CardDescription>The floating button that opens the chat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Position */}
              <div className="space-y-1.5">
                <Label htmlFor="bubble-position">Position</Label>
                <select
                  id="bubble-position"
                  value={theme.bubble.position}
                  onChange={(e) => setBubble({ position: e.target.value as ThemeConfig['bubble']['position'] })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
              </div>

              {/* Background colour */}
              <div className="space-y-1.5">
                <Label>Bubble colour</Label>
                <ColorPicker
                  value={theme.bubble.backgroundColor}
                  onChange={(v) => setBubble({ backgroundColor: v })}
                />
              </div>

              {/* Custom icon */}
              <div className="space-y-2">
                <Label>Custom icon <span className="text-slate-400">(optional)</span></Label>

                {theme.bubble.iconUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={theme.bubble.iconUrl}
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                      alt="Bubble icon"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBubble({ iconUrl: null })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml,image/png,image/jpeg"
                  onChange={handleIconFile}
                  className="text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <p className="text-xs text-slate-400">Recommended: 32×32 SVG or PNG. Stored as data URL.</p>
              </div>
            </CardContent>
          </Card>

          {/* Chat window card */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Window</CardTitle>
              <CardDescription>Colours and shape of the chat panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Header accent colour */}
              <div className="space-y-1.5">
                <Label>Header accent colour</Label>
                <p className="text-xs text-slate-400">Used for the status dot in the chat header.</p>
                <ColorPicker
                  value={theme.chatWindow.headerColor}
                  onChange={(v) => setChatWindow({ headerColor: v })}
                />
              </div>

              {/* User message colour */}
              <div className="space-y-1.5">
                <Label>User message colour</Label>
                <ColorPicker
                  value={theme.chatWindow.userMessageColor}
                  onChange={(v) => setChatWindow({ userMessageColor: v })}
                />
              </div>

              {/* AI message colour */}
              <div className="space-y-1.5">
                <Label>AI message colour</Label>
                <ColorPicker
                  value={theme.chatWindow.aiMessageColor}
                  onChange={(v) => setChatWindow({ aiMessageColor: v })}
                />
              </div>

              {/* Border radius */}
              <div className="space-y-1.5">
                <Label htmlFor="border-radius">Message border radius</Label>
                <select
                  id="border-radius"
                  value={theme.chatWindow.borderRadius}
                  onChange={(e) => setChatWindow({ borderRadius: e.target.value as ThemeConfig['chatWindow']['borderRadius'] })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <option value="sharp">Sharp</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Save row */}
          <div className="flex items-center justify-end gap-3 pb-8">
            {error   && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">Appearance saved.</p>}
            <Button onClick={handleSave} loading={saving}>
              Save appearance
            </Button>
          </div>

        </div>

        {/* ── Right column — live preview ───────────────────────────────────── */}
        <div>
          <WidgetPreview theme={theme} projectName={projectName} />
        </div>

      </div>
    </div>
  )
}
