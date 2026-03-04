import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bird, Globe, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { AuthUser } from '@kai/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

const WEBSITE_CATEGORIES = [
  { value: 'portfolio',  label: 'Portfolio' },
  { value: 'ecommerce',  label: 'E-commerce' },
  { value: 'business',   label: 'Business' },
  { value: 'blog',       label: 'Blog' },
  { value: 'saas',       label: 'SaaS' },
  { value: 'agency',     label: 'Agency' },
  { value: 'other',      label: 'Other' },
] as const

type WebsiteCategory = (typeof WEBSITE_CATEGORIES)[number]['value']

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-2 rounded-full transition-all duration-300',
            i < current
              ? 'w-4 bg-brand-600'
              : i === current
                ? 'w-6 bg-brand-600'
                : 'w-2 bg-slate-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

interface StepProps {
  onNext: (data: Partial<FormData>) => void
  onBack?: () => void
  data: FormData
  loading?: boolean
}

interface FormData {
  projectName: string
  websiteUrl: string
  websiteCategory: WebsiteCategory | ''
}

function Step1({ onNext, data }: StepProps) {
  const [name, setName] = useState(data.projectName)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mx-auto">
        <Bot className="w-7 h-7 text-brand-600" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Name your assistant</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Give your AI a name your visitors will see.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-name">Assistant name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Support Bot, Ask Alex…"
          autoFocus
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!name.trim()}
        onClick={() => onNext({ projectName: name.trim() })}
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

function Step2({ onNext, onBack, data, loading }: StepProps) {
  const [url, setUrl]           = useState(data.websiteUrl)
  const [category, setCategory] = useState<WebsiteCategory | ''>(data.websiteCategory)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mx-auto">
        <Globe className="w-7 h-7 text-brand-600" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">About your website</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Helps us tailor the experience. You can change this later.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="website-url">Website URL <span className="text-slate-400">(optional)</span></Label>
          <Input
            id="website-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com"
            type="url"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website-category">Category <span className="text-slate-400">(optional)</span></Label>
          <select
            id="website-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as WebsiteCategory | '')}
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <option value="">Select a category…</option>
            {WEBSITE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          loading={loading}
          onClick={() => onNext({
            websiteUrl:      url,
            websiteCategory: category || undefined,
          } as Partial<FormData>)}
        >
          Finish
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function Step3({ onNext }: StepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mx-auto">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">You're all set!</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Your assistant is ready. Head to your dashboard to get started.
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={() => onNext({})}>
        Go to dashboard
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

export function OnboardingPage() {
  const navigate = useNavigate()
  const setUser  = useAuthStore((s) => s.setUser)
  const user     = useAuthStore((s) => s.user)

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    projectName:     user?.name ?? 'My Assistant',
    websiteUrl:      '',
    websiteCategory: '',
  })

  async function handleStep1(data: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(1)
  }

  async function handleStep2(data: Partial<FormData>) {
    const merged = { ...formData, ...data }
    setFormData(merged)
    setLoading(true)
    setError(null)

    try {
      const res = await api.post<{ user: AuthUser }>('/api/onboarding/complete', {
        projectName:     merged.projectName,
        websiteUrl:      merged.websiteUrl || undefined,
        websiteCategory: merged.websiteCategory || undefined,
      })

      // Update the auth store so AppShell redirects correctly
      setUser(res.user)
      setStep(2)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleStep3() {
    navigate('/dashboard', { replace: true })
  }

  const steps = [
    <Step1 key={0} data={formData} onNext={handleStep1} />,
    <Step2 key={1} data={formData} onNext={handleStep2} onBack={() => setStep(0)} loading={loading} />,
    <Step3 key={2} data={formData} onNext={handleStep3} />,
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Bird className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-slate-900">Bentivi</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {/* Progress */}
        {step < 2 && (
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs text-slate-400">Step {step + 1} of {TOTAL_STEPS - 1}</span>
            <StepDots current={step} total={TOTAL_STEPS - 1} />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Current step */}
        {steps[step]}
      </div>
    </div>
  )
}
