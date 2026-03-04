import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ThemeConfig, DEFAULT_THEME } from '@kai/shared'
import { Code, ChevronDown } from 'lucide-react'
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

const fontDisplayNames: Record<string, string> = {
  'system':    'System default',
  'inter':     'Inter',
  'roboto':    'Roboto',
  'open-sans': 'Open Sans',
  'nunito':    'Nunito',
}

const googleFontParams: Record<string, string> = {
  'inter':     'Inter:wght@400;500;600',
  'roboto':    'Roboto:wght@400;500;700',
  'open-sans': 'Open+Sans:wght@400;500;600',
  'nunito':    'Nunito:wght@400;500;600',
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

// ─── LightDarkPicker ──────────────────────────────────────────────────────────

function LightDarkPicker({
  label,
  lightValue,
  onLightChange,
  darkValue,
  onDarkChange,
  showDark,
}: {
  label:         string
  lightValue:    string
  onLightChange: (v: string) => void
  darkValue:     string
  onDarkChange:  (v: string) => void
  showDark:      boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className={showDark ? 'flex gap-6' : ''}>
        <div className="space-y-1">
          {showDark && <p className="text-xs text-slate-400">Light</p>}
          <ColorPicker value={lightValue} onChange={onLightChange} />
        </div>
        {showDark && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400">Dark</p>
            <ColorPicker value={darkValue} onChange={onDarkChange} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PillTabBar ───────────────────────────────────────────────────────────────

function PillTabBar<T extends string>({
  value,
  options,
  onChange,
}: {
  value:   T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={[
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            value === opt.id
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionLabel({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pt-4 border-t border-slate-100">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
  )
}

// ─── Widget Preview ───────────────────────────────────────────────────────────

function WidgetPreview({
  theme,
  projectName,
}: {
  theme:       ThemeConfig
  projectName: string
}) {
  const { bubble, chatWindow, global: g } = theme
  const isLeft = bubble.position === 'bottom-left'
  const hSide  = isLeft ? 'left-4' : 'right-4'

  // Compute bubble background (gradient or solid)
  const bubbleBgStyle = bubble.backgroundType === 'gradient'
    ? `linear-gradient(135deg, ${bubble.gradientFrom}, ${bubble.gradientTo})`
    : bubble.backgroundColor

  // Dark mode detection
  const isDark =
    chatWindow.colorScheme === 'dark' ||
    (chatWindow.colorScheme === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Font CSS
  const fontKey = g.fontFamily ?? 'system'
  const fontName = fontKey === 'system' ? null : fontDisplayNames[fontKey]
  const fontCss  = fontName ? `'${fontName}', sans-serif` : 'inherit'

  // Load Google Font into the document when non-system
  useEffect(() => {
    if (fontKey === 'system') return
    const param = googleFontParams[fontKey]
    if (!param) return
    const id = `kai-preview-font-${fontKey}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${param}&display=swap`
    document.head.appendChild(link)
  }, [fontKey])

  // Border-radius values per setting
  const brMap = {
    sharp:   { msg: '4px',  assistantBl: '4px', userBr: '4px' },
    rounded: { msg: '12px', assistantBl: '4px', userBr: '4px' },
    pill:    { msg: '18px', assistantBl: '4px', userBr: '4px' },
  }
  const br = brMap[chatWindow.borderRadius] ?? brMap.rounded

  // Theme-aware color tokens for preview
  const panelBg     = isDark ? '#1e293b' : '#fff'
  const headerBg    = isDark ? '#1e293b' : '#fff'
  const headerBdr   = isDark ? '#334155' : '#f1f5f9'
  const titleColor  = isDark ? '#f8fafc' : '#0f172a'
  const subColor    = isDark ? '#94a3b8' : '#9ca3af'
  const inputBdr    = isDark ? '#334155' : '#e2e8f0'
  const footerColor = isDark ? '#475569' : '#9ca3af'
  const footerBdr   = isDark ? '#334155' : '#f1f5f9'
  const attrColor   = isDark ? '#64748b' : '#9ca3af'

  // User-configurable colors (light vs dark)
  const accentColor = isDark
    ? (chatWindow.darkHeaderColor || chatWindow.headerColor)
    : chatWindow.headerColor
  const userMsgBg   = isDark
    ? (chatWindow.darkUserMessageColor || chatWindow.userMessageColor)
    : chatWindow.userMessageColor
  const aiMsgBg     = isDark
    ? (chatWindow.darkAiMessageColor || '#334155')
    : chatWindow.aiMessageColor
  const aiMsgColor  = isDark ? '#e2e8f0' : '#1e293b'

  // Resolved header content
  const displayTitle    = chatWindow.headerTitle.trim()    || projectName
  const displaySubtitle = chatWindow.headerSubtitle.trim() || 'Bentivi'
  const headerLogo      = chatWindow.headerLogoUrl !== null ? chatWindow.headerLogoUrl : bubble.iconUrl

  const botIconSVG = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7h.01"/>
      <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/>
      <path d="m20 7 2 .5-2 .5"/>
      <path d="M10 18v3"/>
      <path d="M14 17.75V21"/>
      <path d="M7 18a6 6 0 0 0 3.84-10.61"/>
    </svg>
  )

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Live preview of your widget appearance.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="relative bg-slate-100 rounded-b-xl overflow-hidden"
          style={{ height: 540, fontFamily: fontCss }}
        >

          {/* ── Chat panel ── */}
          <div
            className={`absolute bottom-20 ${hSide} w-72 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            style={{ height: 440, background: panelBg }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: headerBg, borderBottom: `1px solid ${headerBdr}` }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: isDark ? '#273549' : '#f1f5f9' }}
                >
                  {headerLogo
                    ? <img src={headerLogo} className="w-full h-full object-cover" alt="" />
                    : botIconSVG
                  }
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: accentColor, borderColor: headerBg }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: titleColor }}>
                  {displayTitle}
                </p>
                <p className="text-xs" style={{ color: subColor }}>{displaySubtitle}</p>
              </div>
              <span style={{ color: subColor }} className="text-sm leading-none">✕</span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden" style={{ background: panelBg }}>
              {/* AI message 1 */}
              <div className="flex flex-col gap-1">
                <div
                  className="self-start text-xs px-3 py-2 leading-relaxed"
                  style={{
                    background:             aiMsgBg,
                    color:                  aiMsgColor,
                    borderRadius:           br.msg,
                    borderBottomLeftRadius: br.assistantBl,
                    maxWidth:               '85%',
                  }}
                >
                  Hi there 👋 How can I help you today?
                </div>
                <span className="text-[10px] ml-1" style={{ color: attrColor }}>
                  {displayTitle} · AI · just now
                </span>
              </div>

              {/* User message */}
              <div
                className="self-end text-xs px-3 py-2 leading-relaxed"
                style={{
                  background:              userMsgBg,
                  color:                   '#fff',
                  borderRadius:            br.msg,
                  borderBottomRightRadius: br.userBr,
                  maxWidth:                '85%',
                }}
              >
                What are your opening hours?
              </div>

              {/* AI message 2 */}
              <div className="flex flex-col gap-1">
                <div
                  className="self-start text-xs px-3 py-2 leading-relaxed"
                  style={{
                    background:             aiMsgBg,
                    color:                  aiMsgColor,
                    borderRadius:           br.msg,
                    borderBottomLeftRadius: br.assistantBl,
                    maxWidth:               '85%',
                  }}
                >
                  We're open Mon–Fri, 9am–6pm.
                </div>
                <span className="text-[10px] ml-1" style={{ color: attrColor }}>
                  {displayTitle} · AI · just now
                </span>
              </div>
            </div>

            {/* Input row */}
            <div
              className="mx-3 mb-2 rounded-2xl px-3 py-2 flex flex-col gap-1.5 flex-shrink-0"
              style={{ border: `2px solid ${inputBdr}`, background: panelBg }}
            >
              <span className="text-xs" style={{ color: subColor }}>Type a message…</span>
              <div className="flex justify-end">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: bubbleBgStyle }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Powered-by strip */}
            <div
              className="text-center text-[10px] pb-2 pt-1.5 flex-shrink-0"
              style={{ color: footerColor, background: panelBg, borderTop: `1px solid ${footerBdr}` }}
            >
              Powered by Bentivi
            </div>
          </div>

          {/* ── Bubble FAB ── (shows chevron-down since panel is open in preview) */}
          {bubble.shape === 'pill' ? (
            <div
              className={`absolute bottom-4 ${hSide} h-14 px-4 rounded-full shadow-lg flex items-center gap-2 cursor-pointer`}
              style={{ background: bubbleBgStyle, color: '#fff' }}
            >
              <ChevronDown size={20} />
              <span className="text-sm font-semibold">{bubble.label || 'AI-mode'}</span>
            </div>
          ) : (
            <div
              className={`absolute bottom-4 ${hSide} w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer`}
              style={{ background: bubbleBgStyle }}
            >
              <ChevronDown size={22} color="white" />
            </div>
          )}

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

  const fileInputRef       = useRef<HTMLInputElement>(null)
  const headerLogoInputRef = useRef<HTMLInputElement>(null)

  // Sync theme from fetched settings
  useEffect(() => {
    if (settings?.themeJson) {
      setTheme(mergeTheme(settings.themeJson))
    }
  }, [settings])

  // ── Patch helpers ──────────────────────────────────────────────────────────

  function setGlobal(patch: Partial<ThemeConfig['global']>) {
    setTheme((t) => ({ ...t, global: { ...t.global, ...patch } }))
  }

  function setBubble(patch: Partial<ThemeConfig['bubble']>) {
    setTheme((t) => ({ ...t, bubble: { ...t.bubble, ...patch } }))
  }

  function setChatWindow(patch: Partial<ThemeConfig['chatWindow']>) {
    setTheme((t) => ({ ...t, chatWindow: { ...t.chatWindow, ...patch } }))
  }

  function setAdvanced(patch: Partial<ThemeConfig['advanced']>) {
    setTheme((t) => ({ ...t, advanced: { ...t.advanced, ...patch } }))
  }

  // ── Icon uploads ───────────────────────────────────────────────────────────

  function handleIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBubble({ iconUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleHeaderLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setChatWindow({ headerLogoUrl: reader.result as string })
    reader.readAsDataURL(file)
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

  const projectName = project?.name ?? 'Bentivi'
  const showDark    = theme.chatWindow.colorScheme !== 'light'

  const selectCls = 'w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Appearance</h1>
          <p className="text-sm text-slate-500 mt-1">Customise how your chat widget looks on your website.</p>
        </div>
        <div className="flex items-center gap-3">
          {error   && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Appearance saved.</p>}
          <Button onClick={handleSave} loading={saving}>
            Save appearance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Left column — controls ────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Chat Bubble card ─────────────────────────────────────────────── */}
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
                  className={selectCls}
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
              </div>

              {/* Shape */}
              <div className="space-y-1.5">
                <Label>Shape</Label>
                <PillTabBar
                  value={theme.bubble.shape}
                  options={[
                    { id: 'circle', label: 'Circle' },
                    { id: 'pill',   label: 'Pill'   },
                  ]}
                  onChange={(v) => setBubble({ shape: v })}
                />
              </div>

              {/* Pill label — only shown when shape is pill */}
              {theme.bubble.shape === 'pill' && (
                <div className="space-y-1.5">
                  <Label htmlFor="bubble-label">Pill label</Label>
                  <Input
                    id="bubble-label"
                    value={theme.bubble.label}
                    onChange={(e) => setBubble({ label: e.target.value })}
                    placeholder="AI-mode"
                    maxLength={24}
                  />
                </div>
              )}

              {/* Background — Solid / Gradient tabs */}
              <div className="space-y-3">
                <Label>Background</Label>
                <PillTabBar
                  value={theme.bubble.backgroundType}
                  options={[
                    { id: 'solid',    label: 'Solid'    },
                    { id: 'gradient', label: 'Gradient' },
                  ]}
                  onChange={(v) => setBubble({ backgroundType: v })}
                />

                {theme.bubble.backgroundType === 'solid' ? (
                  <ColorPicker
                    value={theme.bubble.backgroundColor}
                    onChange={(v) => setBubble({ backgroundColor: v })}
                  />
                ) : (
                  <div className="flex gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">From</p>
                      <ColorPicker
                        value={theme.bubble.gradientFrom}
                        onChange={(v) => setBubble({ gradientFrom: v })}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">To</p>
                      <ColorPicker
                        value={theme.bubble.gradientTo}
                        onChange={(v) => setBubble({ gradientTo: v })}
                      />
                    </div>
                  </div>
                )}
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

          {/* ── Chat Window card ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Window</CardTitle>
              <CardDescription>Appearance and content of the chat panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* ── Global ──────────────────────────────────────────────────── */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Global</p>

                {/* Color scheme */}
                <div className="space-y-1.5">
                  <Label htmlFor="color-scheme">Color scheme</Label>
                  <select
                    id="color-scheme"
                    value={theme.chatWindow.colorScheme}
                    onChange={(e) => setChatWindow({ colorScheme: e.target.value as ThemeConfig['chatWindow']['colorScheme'] })}
                    className={selectCls}
                  >
                    <option value="auto">Auto (follows browser)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Font family */}
                <div className="space-y-1.5">
                  <Label htmlFor="font-family">Font</Label>
                  <select
                    id="font-family"
                    value={theme.global.fontFamily}
                    onChange={(e) => setGlobal({ fontFamily: e.target.value as ThemeConfig['global']['fontFamily'] })}
                    className={selectCls}
                  >
                    <option value="system">System default</option>
                    <option value="inter">Inter</option>
                    <option value="open-sans">Open Sans</option>
                    <option value="roboto">Roboto</option>
                    <option value="nunito">Nunito</option>
                  </select>
                </div>
              </div>

              {/* ── Header ──────────────────────────────────────────────────── */}
              <SectionLabel
                title="Header"
                description="The top bar of the chat panel."
              />
              <div className="space-y-4">

                {/* Header accent colour — light + dark */}
                <LightDarkPicker
                  label="Accent colour"
                  lightValue={theme.chatWindow.headerColor}
                  onLightChange={(v) => setChatWindow({ headerColor: v })}
                  darkValue={theme.chatWindow.darkHeaderColor}
                  onDarkChange={(v) => setChatWindow({ darkHeaderColor: v })}
                  showDark={showDark}
                />

                {/* Header logo */}
                <div className="space-y-2">
                  <Label>Logo <span className="text-slate-400">(optional)</span></Label>

                  {theme.chatWindow.headerLogoUrl && (
                    <div className="flex items-center gap-3">
                      <img
                        src={theme.chatWindow.headerLogoUrl}
                        className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                        alt="Header logo"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatWindow({ headerLogoUrl: null })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  <input
                    ref={headerLogoInputRef}
                    type="file"
                    accept=".svg,image/svg+xml,image/png,image/jpeg"
                    onChange={handleHeaderLogoFile}
                    className="text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <p className="text-xs text-slate-400">
                    Recommended: 32×32 SVG or PNG. Leave empty to use the chat bubble icon.
                  </p>
                </div>

                {/* Header title */}
                <div className="space-y-1.5">
                  <Label htmlFor="header-title">Title</Label>
                  <Input
                    id="header-title"
                    value={theme.chatWindow.headerTitle}
                    onChange={(e) => setChatWindow({ headerTitle: e.target.value })}
                    placeholder={projectName}
                    maxLength={60}
                  />
                  <p className="text-xs text-slate-400">Leave empty to use the project name.</p>
                </div>

                {/* Header description */}
                <div className="space-y-1.5">
                  <Label htmlFor="header-subtitle">Description</Label>
                  <Input
                    id="header-subtitle"
                    value={theme.chatWindow.headerSubtitle}
                    onChange={(e) => setChatWindow({ headerSubtitle: e.target.value })}
                    placeholder="Bentivi"
                    maxLength={80}
                  />
                  <p className="text-xs text-slate-400">Leave empty to use "Bentivi".</p>
                </div>
              </div>

              {/* ── Body ────────────────────────────────────────────────────── */}
              <SectionLabel
                title="Body"
                description="Message bubbles and the empty state."
              />
              <div className="space-y-4">

                {/* User message colour — light + dark */}
                <LightDarkPicker
                  label="User message colour"
                  lightValue={theme.chatWindow.userMessageColor}
                  onLightChange={(v) => setChatWindow({ userMessageColor: v })}
                  darkValue={theme.chatWindow.darkUserMessageColor}
                  onDarkChange={(v) => setChatWindow({ darkUserMessageColor: v })}
                  showDark={showDark}
                />

                {/* AI message colour — light + dark */}
                <LightDarkPicker
                  label="AI message colour"
                  lightValue={theme.chatWindow.aiMessageColor}
                  onLightChange={(v) => setChatWindow({ aiMessageColor: v })}
                  darkValue={theme.chatWindow.darkAiMessageColor}
                  onDarkChange={(v) => setChatWindow({ darkAiMessageColor: v })}
                  showDark={showDark}
                />

                {/* Welcome text */}
                <div className="space-y-1.5">
                  <Label htmlFor="welcome-text">Welcome text</Label>
                  <Input
                    id="welcome-text"
                    value={theme.chatWindow.welcomeText}
                    onChange={(e) => setChatWindow({ welcomeText: e.target.value })}
                    placeholder={`Ask me anything about ${projectName}!`}
                    maxLength={120}
                  />
                  <p className="text-xs text-slate-400">
                    Shown before the first message. Leave empty for the default.
                  </p>
                </div>

                {/* Message border radius */}
                <div className="space-y-1.5">
                  <Label htmlFor="border-radius">Message border radius</Label>
                  <select
                    id="border-radius"
                    value={theme.chatWindow.borderRadius}
                    onChange={(e) => setChatWindow({ borderRadius: e.target.value as ThemeConfig['chatWindow']['borderRadius'] })}
                    className={selectCls}
                  >
                    <option value="sharp">Sharp</option>
                    <option value="rounded">Rounded</option>
                    <option value="pill">Pill</option>
                  </select>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── Advanced card ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code size={16} className="text-slate-500" />
                <CardTitle>Advanced</CardTitle>
              </div>
              <CardDescription>
                Write custom CSS to override any widget styles. Rules are scoped to the widget's shadow DOM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="custom-css">Custom CSS</Label>
              <textarea
                id="custom-css"
                rows={10}
                maxLength={5000}
                value={theme.advanced.customCss}
                onChange={(e) => setAdvanced({ customCss: e.target.value })}
                placeholder={`/* Examples:\n#kai-bubble { box-shadow: 0 8px 24px rgba(0,0,0,0.25); }\n#kai-panel { border: 2px solid #6366f1; }\n.kai-msg.user { font-weight: 600; } */`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 resize-y"
                spellCheck={false}
              />
              <p className="text-xs text-slate-400 text-right tabular-nums">
                {theme.advanced.customCss.length} / 5 000
              </p>
            </CardContent>
          </Card>

        </div>

        {/* ── Right column — live preview ───────────────────────────────────── */}
        <div>
          <WidgetPreview theme={theme} projectName={projectName} />
        </div>

      </div>
    </div>
  )
}
