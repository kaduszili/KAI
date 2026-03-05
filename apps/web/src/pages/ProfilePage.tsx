import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { AuthUser } from '@kai/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id:              string
  name:            string
  websiteUrl:      string | null
  websiteCategory: string | null
}

const WEBSITE_CATEGORIES = [
  { value: 'portfolio',  label: 'Portfolio'  },
  { value: 'ecommerce',  label: 'E-commerce' },
  { value: 'business',   label: 'Business'   },
  { value: 'blog',       label: 'Blog'       },
  { value: 'saas',       label: 'SaaS'       },
  { value: 'agency',     label: 'Agency'     },
  { value: 'other',      label: 'Other'      },
]

const selectCls = 'w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'

// ─── Account Information Card ─────────────────────────────────────────────────

function AccountCard({
  initialName,
  initialEmail,
  onSave,
}: {
  initialName:  string
  initialEmail: string
  onSave: (data: { name: string; email: string }) => Promise<void>
}) {
  const [name,    setName]    = useState(initialName)
  const [email,   setEmail]   = useState(initialEmail)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave({ name: name.trim(), email: email.trim() })
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
        <CardTitle>Account Information</CardTitle>
        <CardDescription>Update your name and email address.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Account updated.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Full name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email address</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!name.trim() || !email.trim()}
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Change Password Card ─────────────────────────────────────────────────────

function PasswordCard({
  onSave,
}: {
  onSave: (data: { currentPassword: string; newPassword: string }) => Promise<void>
}) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    if (newPw !== confirmPw) {
      setError('New passwords do not match')
      return
    }
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave({ currentPassword: currentPw, newPassword: newPw })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!currentPw && !!newPw && !!confirmPw

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Leave blank if you don't want to change your password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Password updated.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Current password</Label>
          <Input
            id="current-pw"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-pw">New password</Label>
          <Input
            id="new-pw"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Confirm new password</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={!canSave}>
            Update password
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Project Details Card ─────────────────────────────────────────────────────

function ProjectDetailsCard({
  project,
  onSave,
}: {
  project: Project
  onSave: (data: { websiteUrl: string; websiteCategory: string }) => Promise<void>
}) {
  const [url,      setUrl]      = useState(project.websiteUrl      ?? '')
  const [category, setCategory] = useState(project.websiteCategory ?? '')
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Sync if project prop changes
  useEffect(() => {
    setUrl(project.websiteUrl ?? '')
    setCategory(project.websiteCategory ?? '')
  }, [project.id])

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      await onSave({ websiteUrl: url, websiteCategory: category })
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
        <CardTitle>Project Details</CardTitle>
        <CardDescription>Details about your website or project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error   && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Project details saved.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website-cat">Website category</Label>
          <select
            id="website-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectCls}
          >
            <option value="">— Select a category —</option>
            {WEBSITE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const qc      = useQueryClient()
  const user    = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project'],
    queryFn:  () => api.get<Project>('/api/projects/mine'),
  })

  async function saveAccount(data: { name: string; email: string }) {
    const updated = await api.patch<AuthUser>('/api/auth/profile', data)
    setUser(updated)
  }

  async function savePassword(data: { currentPassword: string; newPassword: string }) {
    await api.patch('/api/auth/profile', data)
  }

  async function saveProject(data: { websiteUrl: string; websiteCategory: string }) {
    await api.patch('/api/projects/mine', {
      websiteUrl:      data.websiteUrl      || '',
      websiteCategory: data.websiteCategory || undefined,
    })
    qc.invalidateQueries({ queryKey: ['project'] })
  }

  return (
    <div className="max-w-2xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and project details.</p>
      </div>

      <div className="space-y-6">
        <AccountCard
          initialName={user?.name  ?? ''}
          initialEmail={user?.email ?? ''}
          onSave={saveAccount}
        />

        <PasswordCard onSave={savePassword} />

        {projectLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : project ? (
          <ProjectDetailsCard project={project} onSave={saveProject} />
        ) : null}
      </div>

    </div>
  )
}
