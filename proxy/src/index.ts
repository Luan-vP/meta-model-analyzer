import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { createSpendCapMiddleware } from './middleware/spendCap.js'
import { recordSpend } from './firestore/index.js'
import { computeCostUsd } from './pricing.js'

const SECRET_NAME = 'meta-model-analyzer-anthropic-key'
const ANTHROPIC_API_BASE = 'https://api.anthropic.com'
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_DAILY_CAP_USD = 10.0

const app = new Hono()
const port = Number(process.env.PORT ?? 8081)

const dailyCapUsd = process.env.DAILY_SPEND_CAP_USD
  ? Number(process.env.DAILY_SPEND_CAP_USD)
  : DEFAULT_DAILY_CAP_USD

let cachedApiKey: string | null = null

async function getAnthropicApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey

  // Allow direct env override for local development
  if (process.env.ANTHROPIC_API_KEY) {
    cachedApiKey = process.env.ANTHROPIC_API_KEY
    return cachedApiKey
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT is required when ANTHROPIC_API_KEY is not set')
  }

  const client = new SecretManagerServiceClient()
  const name = `projects/${projectId}/secrets/${SECRET_NAME}/versions/latest`
  const [version] = await client.accessSecretVersion({ name })

  const payload = version.payload?.data
  if (!payload) throw new Error('Secret payload is empty')

  cachedApiKey =
    payload instanceof Uint8Array ? Buffer.from(payload).toString('utf-8') : String(payload)
  return cachedApiKey
}

/**
 * Returns a TransformStream that passthrough all bytes unchanged while
 * intercepting Anthropic SSE events to extract token usage for spend tracking.
 */
function createSpendTrackingTransform(model: string): TransformStream<Uint8Array, Uint8Array> {
  let inputTokens = 0
  let outputTokens = 0
  let textBuffer = ''
  const decoder = new TextDecoder()

  function processLine(line: string): void {
    if (!line.startsWith('data: ')) return
    const json = line.slice(6).trim()
    if (!json || json === '[DONE]') return
    try {
      const ev = JSON.parse(json) as Record<string, unknown>
      if (ev['type'] === 'message_start') {
        const usage = (ev['message'] as Record<string, unknown> | undefined)?.['usage'] as
          | Record<string, number>
          | undefined
        if (usage?.['input_tokens'] !== undefined) inputTokens = usage['input_tokens']
      } else if (ev['type'] === 'message_delta') {
        const usage = ev['usage'] as Record<string, number> | undefined
        if (usage?.['output_tokens'] !== undefined) outputTokens = usage['output_tokens']
      }
    } catch {
      // skip non-JSON SSE data lines
    }
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      textBuffer += decoder.decode(chunk, { stream: true })
      const lines = textBuffer.split('\n')
      textBuffer = lines.pop() ?? ''
      lines.forEach(processLine)
      controller.enqueue(chunk)
    },
    flush() {
      // flush any remaining bytes from the decoder
      const tail = decoder.decode()
      if (tail) processLine(tail)

      if (inputTokens > 0 || outputTokens > 0) {
        const costUsd = computeCostUsd(model, inputTokens, outputTokens)
        recordSpend({ inputTokens, outputTokens, costUsd }).catch((err) =>
          console.error('[spend] Failed to record streaming spend:', err),
        )
      }
    },
  })
}

function recordSpendFromJsonResponse(model: string, responseText: string): void {
  try {
    const json = JSON.parse(responseText) as {
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const inputTokens = json.usage?.input_tokens ?? 0
    const outputTokens = json.usage?.output_tokens ?? 0
    if (inputTokens > 0 || outputTokens > 0) {
      const costUsd = computeCostUsd(model, inputTokens, outputTokens)
      recordSpend({ inputTokens, outputTokens, costUsd }).catch((err) =>
        console.error('[spend] Failed to record spend:', err),
      )
    }
  } catch {
    // not a parseable JSON response — skip
  }
}

app.get('/healthz', (c) => c.json({ status: 'ok' }))

app.use('/v1/messages', createSpendCapMiddleware(dailyCapUsd))

app.post('/v1/messages', async (c) => {
  let apiKey: string
  try {
    apiKey = await getAnthropicApiKey()
  } catch (err) {
    console.error('Failed to retrieve Anthropic API key:', err)
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'Service unavailable' } },
      503,
    )
  }

  const body = await c.req.text()

  let model = 'unknown'
  try {
    const parsed = JSON.parse(body) as { model?: string }
    if (typeof parsed.model === 'string') model = parsed.model
  } catch {
    // invalid request body — proceed with unknown model (conservative pricing applies)
  }

  const upstreamHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': c.req.header('anthropic-version') ?? DEFAULT_ANTHROPIC_VERSION,
  }

  const betaHeader = c.req.header('anthropic-beta')
  if (betaHeader) upstreamHeaders['anthropic-beta'] = betaHeader

  let upstream: Response
  try {
    upstream = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    })
  } catch (err) {
    console.error('Failed to reach Anthropic API:', err)
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'Failed to reach upstream' } },
      502,
    )
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/json'

  if (contentType.includes('text/event-stream') && upstream.body) {
    return new Response(upstream.body.pipeThrough(createSpendTrackingTransform(model)), {
      status: upstream.status,
      headers: { 'content-type': contentType },
    })
  }

  const responseText = await upstream.text()
  if (upstream.status === 200) {
    recordSpendFromJsonResponse(model, responseText)
  }
  return new Response(responseText, {
    status: upstream.status,
    headers: { 'content-type': contentType },
  })
})

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proxy listening on port ${port}`)
})
