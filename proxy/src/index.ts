import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

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
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': contentType },
  })
})

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proxy listening on port ${port}`)
})
