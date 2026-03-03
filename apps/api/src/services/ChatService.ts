import OpenAI from 'openai'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db.js'
import { projects, projectSettings, users, chatLogs } from '../schema/index.js'
import { decrypt } from '../lib/crypto.js'
import { logger } from '../lib/logger.js'
import { KnowledgeService }    from './KnowledgeService.js'
import { RateLimiterService }  from './RateLimiterService.js'
import { TokenCapService }     from './TokenCapService.js'
import {
  NotFoundError,
  BlockedError,
  RateLimitError,
  CapExceededError,
  NoApiKeyError,
  AppError,
} from '../types.js'

const knowledgeSvc   = new KnowledgeService()
const rateLimiterSvc = new RateLimiterService()
const tokenCapSvc    = new TokenCapService()

export class ChatService {
  async chat({
    projectId,
    message,
    ipAddress,
  }: {
    projectId: string
    message:   string
    ipAddress: string
  }): Promise<{ answer: string }> {

    // ── 1. Load project + settings + user ────────────────────────────────────

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) throw new NotFoundError('Project not found')

    const settings = await db.query.projectSettings.findFirst({
      where: eq(projectSettings.projectId, projectId),
    })
    if (!settings) throw new NotFoundError('Project settings not found')

    const user = await db.query.users.findFirst({
      where: eq(users.id, project.userId),
    })
    if (!user) throw new NotFoundError('Project owner not found')

    // ── 2. Blocked keywords ───────────────────────────────────────────────────

    const lower = message.toLowerCase()
    const isBlocked = settings.blockedKeywords.some((kw) => lower.includes(kw))
    if (isBlocked) {
      await this.log(projectId, message, null, 'blocked', ipAddress, null, 0, 0)
      throw new BlockedError()
    }

    // ── 3. Rate limit ─────────────────────────────────────────────────────────

    try {
      await rateLimiterSvc.check(ipAddress, projectId, settings.rateLimitPerMinute)
    } catch (err) {
      if (err instanceof RateLimitError) {
        await this.log(projectId, message, null, 'rate_limited', ipAddress, null, 0, 0)
      }
      throw err
    }

    // ── 4. Resolve API key ────────────────────────────────────────────────────

    let apiKey: string | null = null

    if (settings.openaiApiKeyEncrypted) {
      try {
        apiKey = decrypt(settings.openaiApiKeyEncrypted)
      } catch (err) {
        logger.error({ err }, 'Failed to decrypt customer API key')
        throw new NoApiKeyError()
      }
    } else if (user.plan === 'pro' && process.env.PLATFORM_OPENAI_API_KEY) {
      apiKey = process.env.PLATFORM_OPENAI_API_KEY
    }

    if (!apiKey) throw new NoApiKeyError()

    // ── 5. Token cap ──────────────────────────────────────────────────────────

    try {
      await tokenCapSvc.check(projectId, settings.monthlyTokenCap)
    } catch (err) {
      if (err instanceof CapExceededError) {
        await this.log(projectId, message, null, 'cap_exceeded', ipAddress, null, 0, 0)
      }
      throw err
    }

    // ── 6. Compile knowledge ──────────────────────────────────────────────────

    const knowledge = await knowledgeSvc.compileKnowledge(projectId)

    // ── 7. Build system prompt ────────────────────────────────────────────────

    const systemParts: string[] = [
      `You are ${project.name}'s AI assistant. Answer questions helpfully and concisely.`,
    ]
    if (settings.systemMessage?.trim()) systemParts.push(settings.systemMessage.trim())
    if (knowledge) systemParts.push(`\n## Knowledge\n\n${knowledge}`)

    const systemPrompt = systemParts.join('\n\n')

    // ── 8. Call OpenAI ────────────────────────────────────────────────────────

    const model = settings.openaiModel ?? 'gpt-4.1-mini'

    let answer: string
    let tokensPrompt    = 0
    let tokensCompletion = 0

    try {
      const openai = new OpenAI({ apiKey })
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
      })

      answer           = completion.choices[0]?.message?.content ?? ''
      tokensPrompt     = completion.usage?.prompt_tokens     ?? 0
      tokensCompletion = completion.usage?.completion_tokens ?? 0
    } catch (err) {
      logger.error({ err }, 'OpenAI API error')
      await this.log(projectId, message, null, 'error', ipAddress, model, 0, 0)
      throw new AppError('AI service error', 'ai_error', 502)
    }

    // ── 9. Log success ────────────────────────────────────────────────────────

    await this.log(projectId, message, answer, 'success', ipAddress, model, tokensPrompt, tokensCompletion)

    return { answer }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async log(
    projectId:        string,
    question:         string,
    answer:           string | null,
    status:           typeof chatLogs.$inferInsert['status'],
    ipAddress:        string,
    model:            string | null,
    tokensPrompt:     number,
    tokensCompletion: number,
  ) {
    try {
      await db.insert(chatLogs).values({
        projectId,
        question,
        answer:           answer ?? undefined,
        status,
        ipAddress,
        model:            model ?? undefined,
        tokensPrompt,
        tokensCompletion,
      })
    } catch (err) {
      logger.error({ err }, 'Failed to save chat log')
    }
  }
}
