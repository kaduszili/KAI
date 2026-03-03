import { eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { users, projects } from '../schema/index.js'
import { NotFoundError } from '../types.js'

export class OnboardingService {
  async complete(
    userId: string,
    data: {
      projectName: string
      websiteUrl?: string
      websiteCategory?: typeof projects.$inferSelect['websiteCategory']
    },
  ) {
    // Fetch the user's project
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')

    // Update project with onboarding data
    await db
      .update(projects)
      .set({
        name:            data.projectName,
        websiteUrl:      data.websiteUrl      ?? null,
        websiteCategory: data.websiteCategory ?? null,
        updatedAt:       new Date(),
      })
      .where(eq(projects.id, project.id))

    // Mark user onboarding as done
    await db
      .update(users)
      .set({ onboardingDone: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }
}
