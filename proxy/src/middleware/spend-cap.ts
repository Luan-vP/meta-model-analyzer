import type { Context, Next } from 'hono'
import { getTodaySpendUsd } from '../firestore/spend.js'

const DEFAULT_DAILY_SPEND_CAP_USD = 5.0

/**
 * Hono middleware that enforces a global daily spend cap backed by Firestore.
 *
 * Reads DAILY_SPEND_CAP_USD from the environment (default $5.00).
 * Returns 402 when the accumulated cost for the current UTC day meets or
 * exceeds the cap.
 *
 * Fails open (lets the request through) if Firestore is unavailable.
 */
export async function spendCapMiddleware(c: Context, next: Next): Promise<Response | void> {
  const cap = Number(process.env.DAILY_SPEND_CAP_USD ?? DEFAULT_DAILY_SPEND_CAP_USD)

  let todaySpend: number
  try {
    todaySpend = await getTodaySpendUsd()
  } catch (err) {
    console.error('Spend cap check failed, failing open:', err)
    return next()
  }

  if (todaySpend >= cap) {
    return c.json(
      { type: 'error', error: { type: 'spend_cap_exceeded', message: 'Daily spend cap reached' } },
      402,
    )
  }

  return next()
}
