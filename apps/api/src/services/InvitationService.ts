import crypto   from 'crypto'
import bcrypt   from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import { db }   from '../lib/db.js'
import { invitations, users, projects, projectSettings } from '../schema/index.js'
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../types.js'

const BCRYPT_ROUNDS       = 12
const INVITE_TTL_MS       = 7 * 24 * 60 * 60 * 1000   // 7 days
const FREE_TOKEN_CAP      = 10_000
const PRO_PLATFORM_CAP    = 200_000

const DEFAULT_THEME = {
  global:     { fontFamily: 'system', colorPreset: null },
  bubble:     { position: 'bottom-right', backgroundColor: '#6366f1', iconUrl: null },
  chatWindow: {
    template:         'default',
    headerColor:      '#6366f1',
    userMessageColor: '#6366f1',
    aiMessageColor:   '#f3f4f6',
    borderRadius:     'rounded',
  },
  advanced: { customCss: '' },
}

export class InvitationService {

  // ─── Create invitation ────────────────────────────────────────────────────

  async create(
    createdById: string,
    data: { name: string; email: string; plan: 'free' | 'pro' },
  ) {
    const email = data.email.toLowerCase()

    // Check if email already has an account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if (existingUser) {
      throw new ConflictError('A user with this email already exists')
    }

    // Revoke any prior unused invitations for this email before creating a new one
    await db
      .update(invitations)
      .set({ used: true })
      .where(and(eq(invitations.email, email), eq(invitations.used, false)))

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

    const [inv] = await db
      .insert(invitations)
      .values({
        token,
        email,
        name:        data.name,
        plan:        data.plan,
        expiresAt,
        createdById,
      })
      .returning()

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
    const link   = `${appUrl}/invite/${token}`

    return {
      id:        inv.id,
      token:     inv.token,
      link,
      expiresAt: inv.expiresAt,
    }
  }

  // ─── Get invitation by token (public, for prefill) ────────────────────────

  async getByToken(token: string) {
    const inv = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, token),
        eq(invitations.used, false),
        gt(invitations.expiresAt, new Date()),
      ),
    })

    if (!inv) throw new NotFoundError('Invitation not found or has expired')

    return {
      name:  inv.name,
      email: inv.email,
      plan:  inv.plan,
    }
  }

  // ─── Accept invitation — create user account ──────────────────────────────

  async accept(token: string, password: string) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters')
    }

    const inv = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, token),
        eq(invitations.used, false),
        gt(invitations.expiresAt, new Date()),
      ),
    })

    if (!inv) throw new NotFoundError('Invitation not found or has expired')

    // Guard: email might have been registered after invitation was sent
    const existing = await db.query.users.findFirst({
      where: eq(users.email, inv.email),
    })
    if (existing) throw new ConflictError('An account with this email already exists')

    const passwordHash  = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const monthlyTokenCap = inv.plan === 'pro' ? PRO_PLATFORM_CAP : FREE_TOKEN_CAP

    // Create user with invitation's plan
    const [user] = await db
      .insert(users)
      .values({
        name:         inv.name,
        email:        inv.email,
        passwordHash,
        plan:         inv.plan,
      })
      .returning()

    // Auto-provision project + settings
    const [project] = await db
      .insert(projects)
      .values({ userId: user.id, name: 'My Assistant' })
      .returning()

    await db.insert(projectSettings).values({
      projectId:      project.id,
      themeJson:      DEFAULT_THEME,
      monthlyTokenCap,
    })

    // Mark invitation as used
    await db
      .update(invitations)
      .set({ used: true })
      .where(eq(invitations.id, inv.id))

    return {
      id:             user.id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      plan:           user.plan,
      onboardingDone: user.onboardingDone,
    }
  }
}
