import { Hono } from 'hono'
import Anthropic from '@anthropic-ai/sdk'
import { corsMiddleware } from './lib/cors.js'
import { rateLimiterMiddleware } from './lib/rate-limiter.js'
import { checkSpendCap, recordSpend } from './lib/spend-cap.js'
import { log } from './lib/logger.js'

// TODO(gcp): ANTHROPIC_API_KEY is injected from Secret Manager at deploy time (issue #16)
const client = new Anthropic()

// Only allow specific models to prevent cost surprises
const ALLOWED_MODELS = (process.env.ALLOWED_MODELS ?? 'claude-sonnet-4-5')
  .split(',')
  .map((m) => m.trim())

const app = new Hono()

app.use('*', corsMiddleware)
app.use('/v1/*', rateLimiterMiddleware)

app.post('/v1/messages', async (c) => {
  if (!checkSpendCap()) {
    log('WARNING', 'spend_cap_exceeded')
    return c.json({ error: 'spend_cap_exceeded' }, 402)
  }

  let body: Anthropic.MessageCreateParamsNonStreaming
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  if (!ALLOWED_MODELS.includes(body.model)) {
    return c.json({ error: 'model_not_allowed', allowedModels: ALLOWED_MODELS }, 400)
  }

  // Force non-streaming; the frontend doesn't use streaming
  body = { ...body, stream: false }

  const startMs = Date.now()
  try {
    const response = await client.messages.create(body)
    recordSpend(response.usage.input_tokens, response.usage.output_tokens)
    log('INFO', 'request_completed', {
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - startMs,
    })
    return c.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('ERROR', 'anthropic_error', { message, latencyMs: Date.now() - startMs })
    return c.json({ error: 'upstream_error', message }, 502)
  }
})

app.get('/health', (c) => c.json({ status: 'ok' }))

export { app }
