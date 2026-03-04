import { desc, eq, ne, sql } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { users, projects, chatLogs, platformSettings } from '../schema/index.js'
import { encrypt, decrypt } from '../lib/crypto.js'
import { NotFoundError, ValidationError } from '../types.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id:               string
  name:             string
  email:            string
  role:             string
  plan:             string
  active:           boolean
  platformTokenCap: number | null
  onboardingDone:   boolean
  createdAt:        string
  projectId:        string | null
  projectName:      string | null
  totalMessages:    number
  monthlyTokens:    number
}

export interface PlatformSettingsPublic {
  platformApiKeySet: boolean
}

const PLATFORM_KEY = 'platform_openai_key_encrypted'

// ─── Service ──────────────────────────────────────────────────────────────────

export class AdminService {

  // ── Users list with stats ─────────────────────────────────────────────────

  async getUsers(): Promise<AdminUser[]> {
    // All users (including super_admins) + their project
    const userRows = await db
      .select({
        id:               users.id,
        name:             users.name,
        email:            users.email,
        role:             users.role,
        plan:             users.plan,
        active:           users.active,
        platformTokenCap: users.platformTokenCap,
        onboardingDone:   users.onboardingDone,
        createdAt:        users.createdAt,
        projectId:        projects.id,
        projectName:      projects.name,
      })
      .from(users)
      .leftJoin(projects, eq(projects.userId, users.id))
      .orderBy(desc(users.createdAt))

    if (userRows.length === 0) return []

    // Aggregate message stats per project (two metrics in one pass)
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)
    const startOfMonthISO = startOfMonth.toISOString()

    const statsRows = await db
      .select({
        projectId:     chatLogs.projectId,
        totalMessages: sql<number>`cast(count(*) as int)`,
        monthlyTokens: sql<number>`cast(coalesce(sum(
          case when ${chatLogs.createdAt} >= ${startOfMonthISO}::timestamptz
               then ${chatLogs.tokensPrompt} + ${chatLogs.tokensCompletion}
               else 0
          end
        ), 0) as int)`,
      })
      .from(chatLogs)
      .groupBy(chatLogs.projectId)

    const statsMap = new Map(statsRows.map((s) => [s.projectId, s]))

    return userRows.map((u) => {
      const stats = u.projectId ? statsMap.get(u.projectId) : undefined
      return {
        id:               u.id,
        name:             u.name,
        email:            u.email,
        role:             u.role,
        plan:             u.plan,
        active:           u.active,
        platformTokenCap: u.platformTokenCap,
        onboardingDone:   u.onboardingDone,
        createdAt:        u.createdAt.toISOString(),
        projectId:        u.projectId ?? null,
        projectName:      u.projectName ?? null,
        totalMessages:    stats?.totalMessages ?? 0,
        monthlyTokens:    stats?.monthlyTokens ?? 0,
      }
    })
  }

  // ── Update user plan / token cap / active status ──────────────────────────

  async updateUser(
    requesterId: string,
    targetUserId: string,
    data: { plan?: string; platformTokenCap?: number | null; active?: boolean },
  ): Promise<void> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    })
    if (!user) throw new NotFoundError('User not found')

    // Prevent a superadmin from deactivating their own account
    if (data.active === false && targetUserId === requesterId) {
      throw new ValidationError('You cannot deactivate your own account')
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (data.plan             !== undefined) patch.plan             = data.plan
    if (data.platformTokenCap !== undefined) patch.platformTokenCap = data.platformTokenCap
    if (data.active           !== undefined) patch.active           = data.active

    await db.update(users).set(patch as any).where(eq(users.id, targetUserId))
  }

  // ── Platform-level settings ───────────────────────────────────────────────

  async getPlatformSettings(): Promise<PlatformSettingsPublic> {
    const row = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.key, PLATFORM_KEY),
    })
    return { platformApiKeySet: !!row?.value }
  }

  async setPlatformApiKey(key: string | null): Promise<void> {
    if (key === null) {
      // Clear the key
      await db
        .delete(platformSettings)
        .where(eq(platformSettings.key, PLATFORM_KEY))
      return
    }

    const encrypted = encrypt(key)
    // Upsert via insert-or-update
    const existing = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.key, PLATFORM_KEY),
    })
    if (existing) {
      await db
        .update(platformSettings)
        .set({ value: encrypted, updatedAt: new Date() })
        .where(eq(platformSettings.key, PLATFORM_KEY))
    } else {
      await db
        .insert(platformSettings)
        .values({ key: PLATFORM_KEY, value: encrypted })
    }
  }

  // ── Platform-wide totals (for overview KPIs) ──────────────────────────────

  async getOverviewStats(): Promise<{
    totalUsers:    number
    freeUsers:     number
    proUsers:      number
    totalMessages: number
  }> {
    const [{ total, free, pro }] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        free:  sql<number>`cast(sum(case when ${users.plan} = 'free' then 1 else 0 end) as int)`,
        pro:   sql<number>`cast(sum(case when ${users.plan} = 'pro'  then 1 else 0 end) as int)`,
      })
      .from(users)
      .where(ne(users.role, 'super_admin'))

    const [{ messages }] = await db
      .select({ messages: sql<number>`cast(count(*) as int)` })
      .from(chatLogs)

    return {
      totalUsers:    total  ?? 0,
      freeUsers:     free   ?? 0,
      proUsers:      pro    ?? 0,
      totalMessages: messages ?? 0,
    }
  }
}

export const adminService = new AdminService()
