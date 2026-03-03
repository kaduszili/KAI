import { eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { projectSettings, projects } from '../schema/index.js'
import { encrypt } from '../lib/crypto.js'
import { NotFoundError } from '../types.js'

// Public-safe shape — never exposes the encrypted key
export interface PublicSettings {
  projectId:          string
  openaiApiKeySet:    boolean
  openaiModel:        string
  systemMessage:      string
  blockedKeywords:    string[]
  rateLimitPerMinute: number
  monthlyTokenCap:    number
  themeJson:          unknown
  updatedAt:          Date
}

export class SettingsService {
  // ─── Convert DB row → public shape ────────────────────────────────────────

  toPublic(settings: typeof projectSettings.$inferSelect): PublicSettings {
    return {
      projectId:          settings.projectId,
      openaiApiKeySet:    !!settings.openaiApiKeyEncrypted,
      openaiModel:        settings.openaiModel ?? 'gpt-4.1-mini',
      systemMessage:      settings.systemMessage ?? '',
      blockedKeywords:    settings.blockedKeywords,
      rateLimitPerMinute: settings.rateLimitPerMinute,
      monthlyTokenCap:    settings.monthlyTokenCap,
      themeJson:          settings.themeJson,
      updatedAt:          settings.updatedAt,
    }
  }

  // ─── Get project's settings (public-safe) ─────────────────────────────────

  async getByUser(userId: string): Promise<PublicSettings> {
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')

    const settings = await db.query.projectSettings.findFirst({
      where: eq(projectSettings.projectId, project.id),
    })
    if (!settings) throw new NotFoundError('Settings not found')

    return this.toPublic(settings)
  }

  // ─── Full settings update ─────────────────────────────────────────────────

  async update(
    userId: string,
    data: {
      openaiApiKey?:     string | null   // null = clear key
      openaiModel?:      string
      systemMessage?:    string
      blockedKeywords?:  string[]
      themeJson?:        Record<string, unknown>
    },
  ): Promise<PublicSettings> {
    const project = await db.query.projects.findFirst({
      where: eq(projects.userId, userId),
    })
    if (!project) throw new NotFoundError('Project not found')

    const patch: Partial<typeof projectSettings.$inferInsert> = {
      updatedAt: new Date(),
    }

    // API key handling — null clears, string encrypts
    if (data.openaiApiKey === null) {
      patch.openaiApiKeyEncrypted = null
    } else if (data.openaiApiKey && data.openaiApiKey.trim().length > 0) {
      patch.openaiApiKeyEncrypted = encrypt(data.openaiApiKey.trim())
    }

    if (data.openaiModel     !== undefined) patch.openaiModel     = data.openaiModel
    if (data.systemMessage   !== undefined) patch.systemMessage   = data.systemMessage
    if (data.blockedKeywords !== undefined) patch.blockedKeywords = data.blockedKeywords
    if (data.themeJson       !== undefined) patch.themeJson       = data.themeJson

    const [updated] = await db
      .update(projectSettings)
      .set(patch)
      .where(eq(projectSettings.projectId, project.id))
      .returning()

    return this.toPublic(updated)
  }

  // ─── Update blocked keywords (convenience, kept for backward compat) ───────

  async updateKeywords(userId: string, keywords: string[]): Promise<PublicSettings> {
    return this.update(userId, { blockedKeywords: keywords })
  }
}
