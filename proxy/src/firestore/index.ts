export { getFirestoreClient } from './client.js'
export type { RateLimitDoc, SpendDoc, RateLimitUpdate, SpendIncrement } from './types.js'
export {
  checkAndIncrementRateLimit,
  getRateLimitState,
  resetRateLimit,
} from './rate-limits.js'
export type { RateLimitResult } from './rate-limits.js'
export { recordSpend, getSpend, getTodaySpendUsd, getSpendRange } from './spend.js'
