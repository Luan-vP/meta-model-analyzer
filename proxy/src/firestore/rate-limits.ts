import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getFirestoreClient } from './client.js'
import type { RateLimitDoc } from './types.js'

const COLLECTION = 'rate_limits'

export interface RateLimitConfig {
  /** Sustained request rate per minute (also the token refill rate) */
  minRate: number
  /** Hard cap on requests per UTC calendar day */
  dayLimit: number
  /** Token bucket capacity — maximum burst above the sustained rate */
  burst: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Seconds to wait before retrying (set when allowed=false) */
  retryAfterSeconds: number
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  minRate: 20,
  dayLimit: 200,
  burst: 5,
}

function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10) // YYYY-MM-DD
}

/**
 * Token-bucket rate-limit check + increment for a single IP, stored in Firestore.
 *
 * Two limits are enforced atomically in one transaction:
 *   1. Per-minute token bucket  — capacity = burst, refill rate = minRate/min
 *   2. Per-day hard cap         — dayLimit requests per UTC calendar day
 *
 * Returns { allowed: true } when the request may proceed, or
 * { allowed: false, retryAfterSeconds } when it must be rejected.
 *
 * Fails open: callers should let the request through if this throws.
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG,
): Promise<RateLimitResult> {
  const { minRate, dayLimit, burst } = config
  const refillPerMs = minRate / 60_000 // tokens added per millisecond

  const db = getFirestoreClient()
  const docRef = db.collection(COLLECTION).doc(ip)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef)
    const now = Date.now()
    const todayKey = utcDayKey(now)

    let tokens: number
    let dayCount: number

    if (snap.exists) {
      const data = snap.data() as RateLimitDoc
      const elapsed = now - data.lastRefill.toMillis()
      tokens = Math.min(burst, data.tokens + elapsed * refillPerMs)
      dayCount = data.dayKey === todayKey ? data.dayCount : 0
    } else {
      tokens = burst
      dayCount = 0
    }

    // Check daily cap first — cheaper rejection with a long Retry-After
    if (dayCount >= dayLimit) {
      const nowSec = Math.floor(now / 1000)
      // Seconds remaining until next UTC midnight
      const retryAfterSeconds = 86_400 - (nowSec % 86_400)
      return { allowed: false, retryAfterSeconds }
    }

    // Check per-minute token bucket
    if (tokens < 1) {
      const deficit = 1 - tokens
      const retryAfterSeconds = Math.ceil(deficit / (minRate / 60))
      return { allowed: false, retryAfterSeconds }
    }

    // Consume one token and persist state
    const expireAt = Timestamp.fromMillis(now + 25 * 60 * 60 * 1000) // 25-hour TTL
    tx.set(docRef, {
      tokens: tokens - 1,
      lastRefill: Timestamp.fromMillis(now),
      dayCount: dayCount + 1,
      dayKey: todayKey,
      expireAt,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { allowed: true, retryAfterSeconds: 0 }
  })
}

/**
 * Manually delete a rate-limit record (e.g. for testing / admin reset).
 */
export async function resetRateLimit(ip: string): Promise<void> {
  const db = getFirestoreClient()
  await db.collection(COLLECTION).doc(ip).delete()
}
