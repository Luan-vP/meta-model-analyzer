import type { Context, Next } from 'hono'
import { getTodaySpendUsd } from '../firestore/index.js'

/**
 * Hono middleware that enforces a global daily USD spend cap (circuit breaker).
 *
 * Reads today's spend from Firestore before every request. Returns 402 Payment
 * Required when the cap is reached. Fails open on Firestore errors so a
 * Firestore outage never takes down the proxy entirely.
 */
export function createSpendCapMiddleware(
  dailyCapUsd: number,
): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      const spentUsd = await getTodaySpendUsd()
      if (spentUsd >= dailyCapUsd) {
        return c.json(
          {
            type: 'error',
            error: {
              type: 'payment_required',
              message: `Daily spending cap of $${dailyCapUsd.toFixed(2)} reached. Spent today: $${spentUsd.toFixed(4)}.`,
            },
          },
          402,
        )
      }
    } catch (err) {
      console.error('[spend-cap] Firestore check failed — allowing request:', err)
    }
    await next()
  }
}
