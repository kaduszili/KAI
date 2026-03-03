import { and, eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { projects } from '../schema/index.js'
import { NotFoundError, ForbiddenError } from '../types.js'

export class ProjectService {
  // ─── Get user's project ────────────────────────────────────────────────────

  async getByUser(userId: string) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')
    return project
  }

  // ─── Update project ────────────────────────────────────────────────────────

  async update(
    projectId: string,
    userId: string,
    data: {
      name?: string
      websiteUrl?: string
      websiteCategory?: typeof projects.$inferSelect['websiteCategory']
    },
  ) {
    // Verify ownership
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    })
    if (!project) throw new ForbiddenError('Project not found or access denied')

    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined)            updates.name            = data.name
    if (data.websiteUrl !== undefined)      updates.websiteUrl      = data.websiteUrl
    if (data.websiteCategory !== undefined) updates.websiteCategory = data.websiteCategory

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning()

    return updated
  }
}
