import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getFirestoreClient } from './client.js'
import type { RateLimitDoc } from './types.js'

const COLLECTION = 'rate_limits'

/**
 * Default sliding-window config.
 * Consuming code (.5 rate-limit middleware) can override these.
 */
const DEFAULT_WINDOW_MS = 60_000 // 1 minute
const DEFAULT_TTL_MS = 2 * DEFAULT_WINDOW_MS // keep doc alive for 2 windows after last touch

export interface RateLimitResult {
  allowed: boolean
  count: number
  windowStart: Date
  resetsAt: Date
}

/**
 * Atomically increment the request counter for an IP address within the
 * current sliding window and return whether the request is allowed.
 *
 * If the current window has expired, the counter resets to 1.
 *
 * @param ip          - Client IP address (used as the document ID)
 * @param maxRequests - Maximum allowed requests per window
 * @param windowMs    - Window duration in milliseconds (default: 60 s)
 * @param ttlMs       - How long after the window start to keep the document
 *                      alive for TTL pruning (default: 2× windowMs)
 */
export async function checkAndIncrementRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number = DEFAULT_WINDOW_MS,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<RateLimitResult> {
  const db = getFirestoreClient()
  const docRef = db.collection(COLLECTION).doc(ip)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef)
    const now = Date.now()

    let count: number
    let windowStart: number

    if (snap.exists) {
      const data = snap.data() as RateLimitDoc
      const existingWindowStart = data.windowStart.toMillis()

      if (now - existingWindowStart < windowMs) {
        // Same window — increment
        count = data.count + 1
        windowStart = existingWindowStart
      } else {
        // Window expired — reset
        count = 1
        windowStart = now
      }
    } else {
      count = 1
      windowStart = now
    }

    const expireAt = Timestamp.fromMillis(windowStart + ttlMs)
    const windowStartTs = Timestamp.fromMillis(windowStart)

    tx.set(docRef, {
      count,
      windowStart: windowStartTs,
      expireAt,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      allowed: count <= maxRequests,
      count,
      windowStart: new Date(windowStart),
      resetsAt: new Date(windowStart + windowMs),
    }
  })
}

/**
 * Read the current rate-limit state for an IP without modifying it.
 * Returns null if no record exists (no requests seen yet).
 */
export async function getRateLimitState(ip: string): Promise<RateLimitDoc | null> {
  const db = getFirestoreClient()
  const snap = await db.collection(COLLECTION).doc(ip).get()
  return snap.exists ? (snap.data() as RateLimitDoc) : null
}

/**
 * Manually delete a rate-limit record (e.g. for testing / admin reset).
 */
export async function resetRateLimit(ip: string): Promise<void> {
  const db = getFirestoreClient()
  await db.collection(COLLECTION).doc(ip).delete()
}
