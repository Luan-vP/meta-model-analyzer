import type { Context, Next } from 'hono'
import { checkRateLimit, DEFAULT_RATE_LIMIT_CONFIG } from '../firestore/rate-limits.js'

/**
 * Hono middleware that enforces a per-IP token-bucket rate limit backed by Firestore.
 *
 * Reads the client IP from the X-Forwarded-For header (injected by Cloud Run).
 * Falls back to "unknown" if the header is absent, so all headerless clients
 * share a single bucket — acceptable since Cloud Run always injects the header.
 *
 * Returns 429 with a Retry-After header on rejection.
 * Fails open (lets the request through) if Firestore is unavailable.
 */
export async function rateLimitMiddleware(c: Context, next: Next): Promise<Response | void> {
  const forwarded = c.req.header('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  let result: { allowed: boolean; retryAfterSeconds: number }
  try {
    result = await checkRateLimit(ip, DEFAULT_RATE_LIMIT_CONFIG)
  } catch (err) {
    console.error('Rate limit check failed, failing open:', err)
    return next()
  }

  if (!result.allowed) {
    c.header('Retry-After', String(result.retryAfterSeconds))
    return c.json(
      { type: 'error', error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } },
      429,
    )
  }

  return next()
}
