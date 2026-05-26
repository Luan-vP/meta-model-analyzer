import type { Context, Next } from 'hono'

// Comma-separated list of allowed origins. In production, set via env var on Cloud Run.
// TODO(gcp): set ALLOWED_ORIGINS in Cloud Run service env to include the proxy's custom domain
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ??
  'http://localhost:5173,http://localhost:4173,https://meta-model-analyzer-6frhukghgq-uc.a.run.app'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin)

  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: allowed ? corsHeaders(origin) : {},
    })
  }

  // Block requests from unlisted origins (non-browser requests have no Origin header and are allowed)
  if (origin && !allowed) {
    return c.json({ error: 'forbidden_origin' }, 403)
  }

  await next()

  if (allowed) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) {
      c.header(k, v)
    }
  }
}
