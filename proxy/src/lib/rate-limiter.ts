import type { Context, Next } from 'hono'
import { log } from './logger.js'

// Token bucket: each IP gets CAPACITY tokens, refilling at REFILL_RATE tokens/second.
// TODO(gcp): replace in-memory map with Firestore (issue #17/#21) for multi-instance consistency
const CAPACITY = parseInt(process.env.RATE_LIMIT_CAPACITY ?? '20')
const REFILL_RATE = parseFloat(process.env.RATE_LIMIT_REFILL_PER_SEC ?? '0.5')

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

function clientIP(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function consume(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  let bucket = buckets.get(ip)
  if (!bucket) {
    bucket = { tokens: CAPACITY, lastRefill: now }
    buckets.set(ip, bucket)
  }

  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsed * REFILL_RATE)
  bucket.lastRefill = now

  if (bucket.tokens < 1) {
    const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / REFILL_RATE)
    return { allowed: false, retryAfterSeconds }
  }

  bucket.tokens -= 1
  return { allowed: true }
}

export async function rateLimiterMiddleware(c: Context, next: Next) {
  const ip = clientIP(c)
  const result = consume(ip)
  if (!result.allowed) {
    log('WARNING', 'rate_limit_exceeded', { ip, retryAfterSeconds: result.retryAfterSeconds })
    return c.json(
      { error: 'rate_limit_exceeded', retryAfterSeconds: result.retryAfterSeconds },
      429,
    )
  }
  await next()
}
