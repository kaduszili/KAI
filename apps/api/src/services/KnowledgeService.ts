import { and, eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { knowledge, projects } from '../schema/index.js'
import { NotFoundError, ForbiddenError, ValidationError } from '../types.js'

export class KnowledgeService {
  // ─── Verify project ownership ────────────────────────────────────────────────

  private async assertOwnership(projectId: string, userId: string) {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    })
    if (!project) throw new ForbiddenError('Project not found or access denied')
    return project
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  async list(userId: string) {
    // Get the user's project first
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')

    return db.query.knowledge.findMany({
      where: eq(knowledge.projectId, project.id),
      columns: { id: true, projectId: true, filename: true, content: true, createdAt: true, updatedAt: true },
    })
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, filename: string, content: string) {
    if (!filename.trim()) throw new ValidationError('Filename is required')

    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')

    // Prevent duplicate filenames within a project
    const existing = await db.query.knowledge.findFirst({
      where: and(eq(knowledge.projectId, project.id), eq(knowledge.filename, filename.trim())),
    })
    if (existing) throw new ValidationError('A file with that name already exists')

    const [file] = await db
      .insert(knowledge)
      .values({ projectId: project.id, filename: filename.trim(), content })
      .returning()

    return file
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(fileId: string, userId: string, data: { filename?: string; content?: string }) {
    const file = await db.query.knowledge.findFirst({
      where: eq(knowledge.id, fileId),
    })
    if (!file) throw new NotFoundError('File not found')

    await this.assertOwnership(file.projectId, userId)

    // Check for duplicate filename if renaming
    if (data.filename && data.filename.trim() !== file.filename) {
      const existing = await db.query.knowledge.findFirst({
        where: and(eq(knowledge.projectId, file.projectId), eq(knowledge.filename, data.filename.trim())),
      })
      if (existing) throw new ValidationError('A file with that name already exists')
    }

    const updates: Partial<typeof knowledge.$inferInsert> = { updatedAt: new Date() }
    if (data.filename !== undefined) updates.filename = data.filename.trim()
    if (data.content !== undefined) updates.content  = data.content

    const [updated] = await db
      .update(knowledge)
      .set(updates)
      .where(eq(knowledge.id, fileId))
      .returning()

    return updated
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  async delete(fileId: string, userId: string) {
    const file = await db.query.knowledge.findFirst({
      where: eq(knowledge.id, fileId),
    })
    if (!file) throw new NotFoundError('File not found')

    await this.assertOwnership(file.projectId, userId)

    await db.delete(knowledge).where(eq(knowledge.id, fileId))
  }

  // ─── Compile (used by ChatService in Phase 4) ────────────────────────────────

  async compileKnowledge(projectId: string): Promise<string> {
    const files = await db.query.knowledge.findMany({
      where: eq(knowledge.projectId, projectId),
    })

    if (files.length === 0) return ''

    return files
      .map((f) => `# ${f.filename}\n\n${f.content}`)
      .join('\n\n---\n\n')
  }
}
