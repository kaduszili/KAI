import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Pencil, Trash2, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeFile {
  id:        string
  projectId: string
  filename:  string
  content:   string
  createdAt: string
  updatedAt: string
}

interface ProjectSettings {
  projectId:       string
  blockedKeywords: string[]
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const fetchFiles    = () => api.get<KnowledgeFile[]>('/api/knowledge')
const fetchSettings = () => api.get<ProjectSettings>('/api/settings')

// ─── File Editor ──────────────────────────────────────────────────────────────

interface EditorProps {
  file:     KnowledgeFile | null   // null = new file
  onSave:   (filename: string, content: string) => Promise<void>
  onCancel: () => void
  saving:   boolean
  error:    string | null
}

function FileEditor({ file, onSave, onCancel, saving, error }: EditorProps) {
  const [filename, setFilename] = useState(file?.filename ?? '')
  const [content,  setContent]  = useState(file?.content  ?? '')

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">
          {file ? 'Edit file' : 'New file'}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filename */}
      <div className="space-y-1.5">
        <Label htmlFor="filename">Filename</Label>
        <Input
          id="filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="e.g. about.md, faq.md…"
          autoFocus={!file}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
        <Label htmlFor="content">Content <span className="text-slate-400">(Markdown)</span></Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your knowledge content here in Markdown…"
          className="flex-1 min-h-[400px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 placeholder:text-slate-400"
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          loading={saving}
          disabled={!filename.trim()}
          onClick={() => onSave(filename, content)}
        >
          {file ? 'Save changes' : 'Create file'}
        </Button>
      </div>
    </div>
  )
}

// ─── Keyword Blocker ──────────────────────────────────────────────────────────

interface KeywordBlockerProps {
  keywords:  string[]
  onUpdate:  (keywords: string[]) => Promise<void>
  saving:    boolean
}

function KeywordBlocker({ keywords, onUpdate, saving }: KeywordBlockerProps) {
  const [input, setInput] = useState('')

  function addKeyword() {
    const kw = input.trim().toLowerCase()
    if (!kw || keywords.includes(kw)) return
    onUpdate([...keywords, kw])
    setInput('')
  }

  function removeKeyword(kw: string) {
    onUpdate(keywords.filter((k) => k !== kw))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Blocked keywords</h3>
      <p className="text-xs text-slate-500 mb-4">
        Messages containing these words will be automatically rejected.
      </p>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
          placeholder="Add a keyword…"
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={addKeyword}
          disabled={!input.trim() || saving}
          loading={saving}
        >
          Add
        </Button>
      </div>

      {/* Tag list */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-700 font-medium"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {keywords.length === 0 && (
        <p className="mt-3 text-xs text-slate-400">No keywords blocked yet.</p>
      )}
    </div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  filename: string
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}

function DeleteConfirm({ filename, onConfirm, onCancel, loading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Delete file?</h3>
        <p className="text-sm text-slate-500 mb-5">
          <span className="font-medium text-slate-700">{filename}</span> will be permanently deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = 'list' | 'editor'
type Tab  = 'files' | 'keywords'

export function KnowledgePage() {
  const qc = useQueryClient()

  const [view,        setView]        = useState<View>('list')
  const [tab,         setTab]         = useState<Tab>('files')
  const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null)
  const [deletingFile, setDeletingFile] = useState<KnowledgeFile | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [kwSaving,    setKwSaving]    = useState(false)

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn:  fetchFiles,
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn:  fetchSettings,
  })

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      api.post<KnowledgeFile>('/api/knowledge', { filename, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setView('list')
      setEditingFile(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, filename, content }: { id: string; filename: string; content: string }) =>
      api.patch<KnowledgeFile>(`/api/knowledge/${id}`, { filename, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setView('list')
      setEditingFile(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/knowledge/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setDeletingFile(null)
    },
  })

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleSave(filename: string, content: string) {
    setEditorError(null)
    try {
      if (editingFile) {
        await updateMutation.mutateAsync({ id: editingFile.id, filename, content })
      } else {
        await createMutation.mutateAsync({ filename, content })
      }
    } catch (err) {
      setEditorError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  async function handleUpdateKeywords(keywords: string[]) {
    setKwSaving(true)
    try {
      await api.patch('/api/settings', { blockedKeywords: keywords })
      qc.invalidateQueries({ queryKey: ['settings'] })
    } finally {
      setKwSaving(false)
    }
  }

  function openNew() {
    setEditingFile(null)
    setEditorError(null)
    setView('editor')
  }

  function openEdit(file: KnowledgeFile) {
    setEditingFile(file)
    setEditorError(null)
    setView('editor')
  }

  function cancelEditor() {
    setView('list')
    setEditingFile(null)
    setEditorError(null)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ─── Editor view ──────────────────────────────────────────────────────────

  if (view === 'editor') {
    return (
      <div>
        <FileEditor
          file={editingFile}
          onSave={handleSave}
          onCancel={cancelEditor}
          saving={isSaving}
          error={editorError}
        />
      </div>
    )
  }

  // ─── List view ────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'files',    label: 'Files'            },
    { id: 'keywords', label: 'Blocked Keywords' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your assistant's knowledge and content filters.
          </p>
        </div>
        {tab === 'files' && (
          <Button onClick={openNew}>
            <Plus size={15} />
            New file
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
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

      {/* ── Files tab ──────────────────────────────────────────────────────── */}
      {tab === 'files' && (
        filesLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
              <FileText size={20} className="text-brand-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">No files yet</h2>
            <p className="text-sm text-slate-500 mb-4 max-w-xs">
              Add markdown files to give your assistant knowledge about your business.
            </p>
            <Button size="sm" onClick={openNew}>
              <Plus size={14} />
              Create first file
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-slate-300 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} className="text-brand-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.filename}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {file.content.length.toLocaleString()} chars ·{' '}
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingFile(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Blocked Keywords tab ───────────────────────────────────────────── */}
      {tab === 'keywords' && (
        <KeywordBlocker
          keywords={settings?.blockedKeywords ?? []}
          onUpdate={handleUpdateKeywords}
          saving={kwSaving}
        />
      )}

      {/* Delete modal */}
      {deletingFile && (
        <DeleteConfirm
          filename={deletingFile.filename}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deletingFile.id)}
          onCancel={() => setDeletingFile(null)}
        />
      )}
    </div>
  )
}
