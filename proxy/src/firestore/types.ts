import type { Timestamp } from 'firebase-admin/firestore'

/**
 * Document shape for rate_limits/{ip}
 *
 * TTL policy must be configured on the `expireAt` field in the GCP console
 * or via Terraform (google_firestore_field resource).
 * Documents are auto-pruned by Firestore once expireAt is in the past.
 */
export interface RateLimitDoc {
  /** Number of requests in the current sliding window */
  count: number
  /** Start of the current time window */
  windowStart: Timestamp
  /** TTL field — Firestore deletes this document after this timestamp */
  expireAt: Timestamp
  /** Last time this document was updated */
  updatedAt: Timestamp
}

/**
 * Document shape for spend/{yyyy-mm-dd}
 *
 * Document ID is a date string in YYYY-MM-DD format (UTC).
 */
export interface SpendDoc {
  /** Accumulated input tokens for the day */
  totalInputTokens: number
  /** Accumulated output tokens for the day */
  totalOutputTokens: number
  /** Accumulated cost in USD for the day */
  totalCostUsd: number
  /** Total number of requests for the day */
  requestCount: number
  /** Last time this document was updated */
  updatedAt: Timestamp
}

export type RateLimitUpdate = Pick<RateLimitDoc, 'count' | 'windowStart' | 'expireAt' | 'updatedAt'>

export interface SpendIncrement {
  inputTokens: number
  outputTokens: number
  costUsd: number
}
