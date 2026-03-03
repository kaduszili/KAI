import type { UserRole } from '@kai/shared'

// ─── App Errors ───────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code:       string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 'unauthorized', 401) }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super(msg, 'forbidden', 403) }
}

export class NotFoundError extends AppError {
  constructor(msg = 'Not found') { super(msg, 'not_found', 404) }
}

export class ValidationError extends AppError {
  constructor(msg: string) { super(msg, 'validation_error', 422) }
}

export class ConflictError extends AppError {
  constructor(msg: string) { super(msg, 'conflict', 409) }
}

export class RateLimitError extends AppError {
  constructor() { super('Too many requests', 'rate_limited', 429) }
}

export class CapExceededError extends AppError {
  constructor() { super('Monthly usage limit reached', 'cap_exceeded', 429) }
}

export class BlockedError extends AppError {
  constructor() { super('Message contains blocked content', 'blocked', 400) }
}

export class NoApiKeyError extends AppError {
  constructor() { super('No API key configured for this assistant', 'no_api_key', 400) }
}

// ─── Hono Context Variables ───────────────────────────────────────────────────

export type HonoVariables = {
  userId:   string
  userRole: UserRole
}
