export { getFirestoreClient } from './client.js'
export type { RateLimitDoc, SpendDoc, SpendIncrement } from './types.js'
export {
  checkRateLimit,
  resetRateLimit,
  DEFAULT_RATE_LIMIT_CONFIG,
} from './rate-limits.js'
export type { RateLimitConfig, RateLimitResult } from './rate-limits.js'
export { recordSpend, getSpend, getTodaySpendUsd, getSpendRange } from './spend.js'
