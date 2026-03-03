import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { users, projects, projectSettings } from '../schema/index.js'
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../types.js'

const DEFAULT_THEME = {
  global:     { fontFamily: 'system', colorPreset: null },
  bubble:     { position: 'bottom-right', backgroundColor: '#6366f1', iconUrl: null },
  chatWindow: {
    template: 'default',
    headerColor: '#6366f1',
    userMessageColor: '#6366f1',
    aiMessageColor: '#f3f4f6',
    borderRadius: 'rounded',
  },
  advanced: { customCss: '' },
}

const BCRYPT_ROUNDS = 12

export class AuthService {
  // ─── Register ───────────────────────────────────────────────────────────────

  async register(name: string, email: string, password: string) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters')
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    if (existing) throw new ConflictError('An account with that email already exists')

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Create user
    const [user] = await db
      .insert(users)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning()

    // Auto-provision project + settings
    const [project] = await db
      .insert(projects)
      .values({ userId: user.id, name: 'My Assistant' })
      .returning()

    await db.insert(projectSettings).values({
      projectId: project.id,
      themeJson: DEFAULT_THEME,
    })

    return this.toPublic(user)
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    if (!user) throw new UnauthorizedError('Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid email or password')

    return this.toPublic(user)
  }

  // ─── Get by ID ──────────────────────────────────────────────────────────────

  async getById(id: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    })
    if (!user) throw new NotFoundError('User not found')
    return this.toPublic(user)
  }

  // ─── Update Profile ─────────────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) throw new NotFoundError('User not found')

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() }

    if (data.name) {
      updates.name = data.name
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      })
      if (existing) throw new ConflictError('Email already in use')
      updates.email = data.email.toLowerCase()
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new ValidationError('Current password is required to set a new password')
      }
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
      if (!valid) throw new UnauthorizedError('Current password is incorrect')
      if (data.newPassword.length < 8) {
        throw new ValidationError('New password must be at least 8 characters')
      }
      updates.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS)
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning()

    return this.toPublic(updated)
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private toPublic(user: typeof users.$inferSelect) {
    return {
      id:              user.id,
      name:            user.name,
      email:           user.email,
      role:            user.role,
      plan:            user.plan,
      onboardingDone:  user.onboardingDone,
    }
  }
}
