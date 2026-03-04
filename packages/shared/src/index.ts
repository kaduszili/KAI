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
    fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans' | 'nunito'
    colorPreset: string | null
  }
  bubble: {
    position: 'bottom-right' | 'bottom-left'
    backgroundColor: string
    iconUrl: string | null
    shape: 'circle' | 'pill'
    label: string
    backgroundType: 'solid' | 'gradient'
    gradientFrom: string
    gradientTo: string
    showAnimation?: boolean
  }
  chatWindow: {
    template: 'default' | 'minimal' | 'rounded'
    headerColor: string
    userMessageColor: string
    aiMessageColor: string
    borderRadius: 'sharp' | 'rounded' | 'pill'
    colorScheme: 'light' | 'dark' | 'auto'
    headerLogoUrl: string | null
    headerTitle: string
    headerSubtitle: string
    darkHeaderColor: string
    darkUserMessageColor: string
    darkAiMessageColor: string
    welcomeText: string
  }
  advanced: {
    customCss: string
  }
}

export const DEFAULT_THEME: ThemeConfig = {
  global: { fontFamily: 'system', colorPreset: null },
  bubble: {
    position: 'bottom-right',
    backgroundColor: '#6366f1',
    iconUrl: null,
    shape: 'circle',
    label: 'AI-mode',
    backgroundType: 'solid',
    gradientFrom: '#6366f1',
    gradientTo: '#8b5cf6',
    showAnimation: false,
  },
  chatWindow: {
    template: 'default',
    headerColor: '#6366f1',
    userMessageColor: '#6366f1',
    aiMessageColor: '#f3f4f6',
    borderRadius: 'rounded',
    colorScheme: 'auto',
    headerLogoUrl: null,
    headerTitle: '',
    headerSubtitle: '',
    darkHeaderColor: '#6366f1',
    darkUserMessageColor: '#6366f1',
    darkAiMessageColor: '#334155',
    welcomeText: '',
  },
  advanced: { customCss: '' },
}

// ─── Error Messages ───────────────────────────────────────────────────────────

export interface ErrorMessages {
  noKnowledge: string   // injected into system prompt when AI has no relevant info
  blocked:     string   // keyword blocked
  rateLimited: string   // too many requests
  capExceeded: string   // monthly token cap reached
  apiError:    string   // OpenAI / server failure
  default:     string   // catch-all fallback
}

export const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  noKnowledge: "I don't have information on that topic.",
  blocked:     'Sorry, that message contains blocked content.',
  rateLimited: "You're sending messages too fast. Please wait a moment.",
  capExceeded: 'Monthly usage limit reached.',
  apiError:    'Something went wrong. Please try again.',
  default:     'Something went wrong. Please try again.',
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
