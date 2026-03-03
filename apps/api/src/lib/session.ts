import { sign, verify } from 'hono/jwt'
import type { UserRole } from '@kai/shared'

interface TokenPayload {
  sub:  string
  role: UserRole
  iat:  number
  exp:  number
}

const secret    = () => process.env.JWT_SECRET!
const expiresIn = 7 * 24 * 60 * 60 // 7 days in seconds

export async function signToken(userId: string, role: UserRole): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign({ sub: userId, role, iat: now, exp: now + expiresIn }, secret())
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  return verify(token, secret(), 'HS256') as Promise<TokenPayload>
}

export const COOKIE_NAME    = 'kai_token'
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'Strict' as const,
  path:     '/',
  maxAge:   expiresIn,
}
