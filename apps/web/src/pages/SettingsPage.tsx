import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { CheckCircle2, AlertCircle, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'
import { ErrorMessages, DEFAULT_ERROR_MESSAGES } from '@kai/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicSettings {
  projectId:          string
  openaiApiKeySet:    boolean
  openaiModel:        string
  systemMessage:      string
  blockedKeywords:    string[]
  rateLimitPerMinute: number
  monthlyTokenCap:    number
  errorMessages:      unknown
}

interface Project {
  id:              string
  name:            string
  websiteUrl:      string | null
  websiteCategory: string | null
}

const MODELS = [
  { value: 'gpt-4.1-mini',  label: 'GPT-4.1 Mini (recommended)' },
  { value: 'gpt-4o-mini',   label: 'GPT-4o Mini' },
  { value: 'gpt-4o',        label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

type SettingsTab = 'general' | 'error-messages'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeErrorMessages(stored: unknown): ErrorMessages {
  const s = (stored ?? {}) as Partial<ErrorMessages>
  return { ...DEFAULT_ERROR_MESSAGES, ...s }
}

// ─── Chatbot Name Card ────────────────────────────────────────────────────────

function ChatbotNameCard({
  initialName,
  onSave,
}: {
  initialName: string
  onSave: (name: string) => Promise<void>
}) {
  const [name,    setName]    = useState(initialName)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave(name.trim())
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chatbot Name</CardTitle>
        <CardDescription>
          The name shown in your chat widget header and placeholder texts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Name saved.</p>}
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Assistant"
            maxLength={255}
          />
          <Button onClick={handleSave} disabled={!name.trim()} loading={saving}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── API Key Card ─────────────────────────────────────────────────────────────

function ApiKeyCard({
  isSet,
  onSave,
  onClear,
}: {
  isSet:   boolean
  onSave:  (key: string) => Promise<void>
  onClear: () => Promise<void>
}) {
  const [key,      setKey]      = useState('')
  const [show,     setShow]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  async function handleSave() {
    if (!key.trim()) return
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave(key.trim())
      setKey('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    setClearing(true); setError(null)
    try {
      await onClear()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to clear key')
    } finally {
      setClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI API Key</CardTitle>
        <CardDescription>
          Your key is encrypted at rest and never exposed in API responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isSet ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={14} />
              Key is configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <AlertCircle size={14} />
              No key configured
            </span>
          )}
        </div>

        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Key saved successfully.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="api-key">{isSet ? 'Replace key' : 'Enter your OpenAI API key'}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button onClick={handleSave} disabled={!key.trim()} loading={saving}>
              Save
            </Button>
          </div>
        </div>

        {isSet && (
          <Button variant="ghost" size="sm" onClick={handleClear} loading={clearing}
            className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Remove key
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Configuration Card ───────────────────────────────────────────────────────

function ConfigCard({
  settings,
  onSave,
}: {
  settings: PublicSettings
  onSave: (data: { openaiModel: string; systemMessage: string }) => Promise<void>
}) {
  const [model,   setModel]   = useState(settings.openaiModel)
  const [sysMsg,  setSysMsg]  = useState(settings.systemMessage)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave({ openaiModel: model, systemMessage: sysMsg })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Model and system behaviour for your assistant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Saved.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="model">Model</Label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="system-msg">
            System message <span className="text-slate-400">(optional)</span>
          </Label>
          <textarea
            id="system-msg"
            value={sysMsg}
            onChange={(e) => setSysMsg(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. Always respond in a friendly, professional tone…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-400 text-right">{sysMsg.length}/2000</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Save configuration</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Embed Script Card ────────────────────────────────────────────────────────

function EmbedCard({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)

  const apiUrl    = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const widgetUrl = `${window.location.origin}/widget.js`
  const script    = `<script src="${widgetUrl}" data-project="${projectId}" data-api-url="${apiUrl}"><\/script>`

  async function handleCopy() {
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed script</CardTitle>
        <CardDescription>
          Paste this before the closing <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on your website.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="rounded-lg bg-slate-950 text-slate-100 text-xs px-4 py-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {script}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Project ID: <code className="font-mono">{projectId}</code>
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Error Messages Card ──────────────────────────────────────────────────────

const ERROR_MESSAGE_FIELDS: {
  key:         keyof ErrorMessages
  label:       string
  description: string
}[] = [
  {
    key:         'noKnowledge',
    label:       'No knowledge',
    description: 'Used when the AI cannot find relevant information in its knowledge base.',
  },
  {
    key:         'blocked',
    label:       'Blocked keyword',
    description: 'Shown when the visitor\'s message matches a blocked keyword.',
  },
  {
    key:         'rateLimited',
    label:       'Rate limited',
    description: 'Shown when the visitor sends too many messages in a short time.',
  },
  {
    key:         'capExceeded',
    label:       'Cap exceeded',
    description: 'Shown when the project\'s monthly token limit has been reached.',
  },
  {
    key:         'apiError',
    label:       'API / server error',
    description: 'Shown when the AI service fails or returns an unexpected error.',
  },
  {
    key:         'default',
    label:       'Default fallback',
    description: 'Catch-all message shown for any other unhandled error.',
  },
]

function ErrorMessagesCard({
  initial,
  onSave,
}: {
  initial: ErrorMessages
  onSave:  (msgs: ErrorMessages) => Promise<void>
}) {
  const [msgs,    setMsgs]    = useState<ErrorMessages>(initial)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function setField(key: keyof ErrorMessages, value: string) {
    setMsgs((m) => ({ ...m, [key]: value }))
  }

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave(msgs)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Messages</CardTitle>
        <CardDescription>
          Customise what your widget visitors see when something goes wrong. Leave a field blank to use the built-in default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Error messages saved.</p>}

        {ERROR_MESSAGE_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`em-${key}`}>{label}</Label>
            <p className="text-xs text-slate-400">{description}</p>
            <textarea
              id={`em-${key}`}
              rows={2}
              maxLength={500}
              value={msgs[key]}
              onChange={(e) => setField(key, e.target.value)}
              placeholder={DEFAULT_ERROR_MESSAGES[key]}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400 text-right tabular-nums">
              {msgs[key].length} / 500
            </p>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={saving}>Save error messages</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const qc = useQueryClient()

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'general') as SettingsTab

  function switchTab(t: SettingsTab) {
    setSearchParams(t === 'general' ? {} : { tab: t })
  }

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => api.get<PublicSettings>('/api/settings'),
  })

  const { data: project } = useQuery({
    queryKey: ['project'],
    queryFn:  () => api.get<Project>('/api/projects/mine'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch<PublicSettings>('/api/settings', data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const projectNameMutation = useMutation({
    mutationFn: (name: string) => api.patch<Project>('/api/projects/mine', { name }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['project'] }),
  })

  async function saveProjectName(name: string) {
    await projectNameMutation.mutateAsync(name)
  }

  async function saveKey(key: string) {
    await updateMutation.mutateAsync({ openaiApiKey: key })
  }

  async function clearKey() {
    await updateMutation.mutateAsync({ openaiApiKey: null })
  }

  async function saveConfig(data: { openaiModel: string; systemMessage: string }) {
    await updateMutation.mutateAsync(data)
  }

  async function saveErrorMessages(msgs: ErrorMessages) {
    await updateMutation.mutateAsync({ errorMessages: msgs })
  }

  if (settingsLoading || !settings) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: 'general',        label: 'General'        },
    { id: 'error-messages', label: 'Error Messages' },
  ]

  return (
    <div className="max-w-2xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your AI assistant.</p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General tab ─────────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="space-y-6">
          {project && (
            <ChatbotNameCard
              initialName={project.name}
              onSave={saveProjectName}
            />
          )}
          <ApiKeyCard
            isSet={settings.openaiApiKeySet}
            onSave={saveKey}
            onClear={clearKey}
          />
          <ConfigCard
            settings={settings}
            onSave={saveConfig}
          />
          {project && <EmbedCard projectId={project.id} />}
        </div>
      )}

      {/* ── Error Messages tab ───────────────────────────────────────────────── */}
      {tab === 'error-messages' && (
        <ErrorMessagesCard
          initial={mergeErrorMessages(settings.errorMessages)}
          onSave={saveErrorMessages}
        />
      )}

    </div>
  )
}
