// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'customer'
export type UserPlan = 'free' | 'pro'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  plan: UserPlan
  platformTokenCap: number | null
  onboardingDone: boolean
  createdAt: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  plan: UserPlan
  onboardingDone: boolean
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type WebsiteCategory =
  | 'portfolio'
  | 'ecommerce'
  | 'business'
  | 'blog'
  | 'saas'
  | 'agency'
  | 'other'

export interface Project {
  id: string
  userId: string
  name: string
  websiteUrl: string | null
  websiteCategory: WebsiteCategory | null
  createdAt: string
  updatedAt: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatStatus =
  | 'success'
  | 'blocked'
  | 'rate_limited'
  | 'cap_exceeded'
  | 'error'

export interface ChatLogRow {
  id: string
  question: string
  answer: string | null
  tokensPrompt: number
  tokensCompletion: number
  model: string | null
  status: ChatStatus
  ipAddress: string | null
  category: string | null
  createdAt: string
}

// ─── Appearance ───────────────────────────────────────────────────────────────

export interface ThemeConfig {
  global: {
    fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans'
    colorPreset: string | null
  }
  bubble: {
    position: 'bottom-right' | 'bottom-left'
    backgroundColor: string
    iconUrl: string | null
  }
  chatWindow: {
    template: 'default' | 'minimal' | 'rounded'
    headerColor: string
    userMessageColor: string
    aiMessageColor: string
    borderRadius: 'sharp' | 'rounded' | 'pill'
  }
  advanced: {
    customCss: string
  }
}

export const DEFAULT_THEME: ThemeConfig = {
  global: { fontFamily: 'system', colorPreset: null },
  bubble: { position: 'bottom-right', backgroundColor: '#6366f1', iconUrl: null },
  chatWindow: {
    template: 'default',
    headerColor: '#6366f1',
    userMessageColor: '#6366f1',
    aiMessageColor: '#f3f4f6',
    borderRadius: 'rounded',
  },
  advanced: { customCss: '' },
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
  code: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalConversations: number
  totalTokensPrompt: number
  totalTokensCompletion: number
  estimatedCostUsd: number
  statusBreakdown: Record<ChatStatus, number>
}
