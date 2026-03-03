import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'customer'])
export const planEnum     = pgEnum('plan',      ['free', 'pro'])

export const chatStatusEnum = pgEnum('chat_status', [
  'success',
  'blocked',
  'rate_limited',
  'cap_exceeded',
  'error',
])

export const websiteCategoryEnum = pgEnum('website_category', [
  'portfolio',
  'ecommerce',
  'business',
  'blog',
  'saas',
  'agency',
  'other',
])

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:               uuid('id').primaryKey().defaultRandom(),
  name:             varchar('name',          { length: 255 }).notNull(),
  email:            varchar('email',         { length: 255 }).notNull().unique(),
  passwordHash:     varchar('password_hash', { length: 255 }).notNull(),
  role:             userRoleEnum('role').notNull().default('customer'),
  plan:             planEnum('plan').notNull().default('free'),
  platformTokenCap: integer('platform_token_cap'),   // null = unlimited (pro plan only)
  onboardingDone:   boolean('onboarding_done').notNull().default(false),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
})

// ─── projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:            varchar('name', { length: 255 }).notNull(),
  websiteUrl:      varchar('website_url', { length: 500 }),
  websiteCategory: websiteCategoryEnum('website_category'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
  updatedAt:       timestamp('updated_at').notNull().defaultNow(),
})

// ─── knowledge ────────────────────────────────────────────────────────────────

export const knowledge = pgTable('knowledge', {
  id:        uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  filename:  varchar('filename', { length: 255 }).notNull(),
  content:   text('content').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── chat_logs ────────────────────────────────────────────────────────────────

export const chatLogs = pgTable('chat_logs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  projectId:        uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  question:         text('question').notNull(),
  answer:           text('answer'),
  tokensPrompt:     integer('tokens_prompt').default(0),
  tokensCompletion: integer('tokens_completion').default(0),
  model:            varchar('model', { length: 100 }),
  status:           chatStatusEnum('status').notNull(),
  ipAddress:        varchar('ip_address', { length: 45 }),
  category:         varchar('category',   { length: 100 }),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
})

// ─── project_settings ─────────────────────────────────────────────────────────

export const projectSettings = pgTable('project_settings', {
  projectId:             uuid('project_id').primaryKey()
                           .references(() => projects.id, { onDelete: 'cascade' }),
  openaiApiKeyEncrypted: text('openai_api_key_encrypted'),              // customer's own key, AES-encrypted
  openaiModel:           varchar('openai_model', { length: 100 }).default('gpt-4.1-mini'),
  systemMessage:         text('system_message').default(''),
  blockedKeywords:       text('blocked_keywords').array().notNull().default([]),
  rateLimitPerMinute:    integer('rate_limit_per_minute').notNull().default(20),
  monthlyTokenCap:       integer('monthly_token_cap').notNull().default(500000),
  themeJson:             jsonb('theme_json').notNull().default({}),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),
})

// ─── platform_settings ────────────────────────────────────────────────────────
// Global key-value settings managed by Super Admin.
// Keys: platform_openai_key_encrypted, default_token_cap, etc.

export const platformSettings = pgTable('platform_settings', {
  id:        uuid('id').primaryKey().defaultRandom(),
  key:       varchar('key',   { length: 255 }).notNull().unique(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── rate_limits ──────────────────────────────────────────────────────────────

export const rateLimits = pgTable('rate_limits', {
  id:           uuid('id').primaryKey().defaultRandom(),
  ipAddress:    varchar('ip_address', { length: 45 }).notNull(),
  projectId:    uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  requestCount: integer('request_count').notNull().default(1),
  windowStart:  timestamp('window_start').notNull().defaultNow(),
})
