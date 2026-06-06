import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { generateRequestId, hashIp, logRequest } from './logger.js'
import { rateLimitMiddleware } from './middleware/rate-limit.js'
import { spendCapMiddleware } from './middleware/spend-cap.js'
import { recordSpend } from './firestore/spend.js'

const SECRET_NAME = 'meta-model-analyzer-anthropic-key'
const ANTHROPIC_API_BASE = 'https://api.anthropic.com'
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://meta-model-analyzer-6frhukghgq-uc.a.run.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

function buildAllowedOrigins(): Set<string> {
  const env = process.env.PROXY_ALLOWED_ORIGINS
  if (env) {
    return new Set(env.split(',').map((o) => o.trim()).filter(Boolean))
  }
  return new Set(DEFAULT_ALLOWED_ORIGINS)
}

const allowedOrigins = buildAllowedOrigins()

const app = new Hono()
const port = Number(process.env.PORT ?? 8081)

app.use('*', async (c, next) => {
  const origin = c.req.header('origin')

  if (!origin) {
    return next()
  }

  if (!allowedOrigins.has(origin)) {
    return c.json(
      { type: 'error', error: { type: 'forbidden', message: 'Origin not allowed' } },
      403,
    )
  }

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, anthropic-version, anthropic-beta',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    })
  }

  await next()

  c.header('Access-Control-Allow-Origin', origin)
  c.header('Vary', 'Origin')
})

const MODEL_PRICE_USD: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.8e-6, output: 4e-6 },
  'claude-sonnet-4-5': { input: 3e-6, output: 15e-6 },
  'claude-sonnet-4-6': { input: 3e-6, output: 15e-6 },
  'claude-opus-4-8': { input: 15e-6, output: 75e-6 },
}
const DEFAULT_PRICE = { input: 3e-6, output: 15e-6 }

function computeCostUsd(model: string | null, tokensIn: number, tokensOut: number): number {
  const price = (model && MODEL_PRICE_USD[model]) ?? DEFAULT_PRICE
  return tokensIn * price.input + tokensOut * price.output
}

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

  cachedApiKey = payload instanceof Uint8Array ? Buffer.from(payload).toString('utf-8') : String(payload)
  return cachedApiKey
}

app.get('/healthz', (c) => c.json({ status: 'ok' }))

app.post('/v1/messages', rateLimitMiddleware, spendCapMiddleware, async (c) => {
  const requestId = generateRequestId()
  const rawIp =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    ''
  const ipHash = rawIp ? hashIp(rawIp) : 'unknown'
  const startMs = Date.now()


  let apiKey: string
  try {
    apiKey = await getAnthropicApiKey()
  } catch (err) {
    console.error('Failed to retrieve Anthropic API key:', err)
    logRequest({
      request_id: requestId,
      ip_hash: ipHash,
      model: null,
      tokens_in: null,
      tokens_out: null,
      latency_ms: Date.now() - startMs,
      status: 503,
    })
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'Service unavailable' } },
      503,
    )
  }

  const body = await c.req.text()

  let model: string | null = null
  let isStream = false
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    model = typeof parsed.model === 'string' ? parsed.model : null
    isStream = parsed.stream === true
  } catch {
    // not valid JSON — log with null model
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
    logRequest({
      request_id: requestId,
      ip_hash: ipHash,
      model,
      tokens_in: null,
      tokens_out: null,
      latency_ms: Date.now() - startMs,
      status: 502,
    })
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'Failed to reach upstream' } },
      502,
    )
  }

  const latencyMs = Date.now() - startMs
  const contentType = upstream.headers.get('content-type') ?? 'application/json'

  // For non-streaming 200 responses, buffer to extract token usage
  if (!isStream && upstream.status === 200) {
    const responseText = await upstream.text()
    let tokensIn: number | null = null
    let tokensOut: number | null = null
    try {
      const responseJson = JSON.parse(responseText) as {
        usage?: { input_tokens?: number; output_tokens?: number }
      }
      tokensIn = responseJson.usage?.input_tokens ?? null
      tokensOut = responseJson.usage?.output_tokens ?? null
    } catch {
      // ignore
    }
    logRequest({
      request_id: requestId,
      ip_hash: ipHash,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latencyMs,
      status: upstream.status,
    })
    if (tokensIn !== null && tokensOut !== null) {
      const costUsd = computeCostUsd(model, tokensIn, tokensOut)
      recordSpend({ inputTokens: tokensIn, outputTokens: tokensOut, costUsd }).catch((err) => {
        console.error('Failed to record spend:', err)
      })
    }
    return new Response(responseText, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    })
  }

  // Streaming or non-200 responses — pass through without buffering
  logRequest({
    request_id: requestId,
    ip_hash: ipHash,
    model,
    tokens_in: null,
    tokens_out: null,
    latency_ms: latencyMs,
    status: upstream.status,
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': contentType },
  })
})

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proxy listening on port ${port}`)
})
