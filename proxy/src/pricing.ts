/**
 * Anthropic model pricing in USD per million tokens (MTok).
 * Source: https://www.anthropic.com/pricing — last updated 2025-05
 */
const PRICE_TABLE: Record<string, { inputPerMtok: number; outputPerMtok: number }> = {
  // Claude 4 family
  'claude-opus-4-7': { inputPerMtok: 15, outputPerMtok: 75 },
  'claude-opus-4-6': { inputPerMtok: 15, outputPerMtok: 75 },
  'claude-sonnet-4-6': { inputPerMtok: 3, outputPerMtok: 15 },
  'claude-sonnet-4-5': { inputPerMtok: 3, outputPerMtok: 15 },
  'claude-haiku-4-5': { inputPerMtok: 0.8, outputPerMtok: 4 },
  // Claude 3.7
  'claude-3-7-sonnet': { inputPerMtok: 3, outputPerMtok: 15 },
  // Claude 3.5
  'claude-3-5-sonnet': { inputPerMtok: 3, outputPerMtok: 15 },
  'claude-3-5-haiku': { inputPerMtok: 0.8, outputPerMtok: 4 },
  // Claude 3
  'claude-3-opus': { inputPerMtok: 15, outputPerMtok: 75 },
  'claude-3-sonnet': { inputPerMtok: 3, outputPerMtok: 15 },
  'claude-3-haiku': { inputPerMtok: 0.25, outputPerMtok: 1.25 },
}

/** Conservative fallback for unrecognised models — Opus-level so we never under-count. */
const FALLBACK_PRICE = { inputPerMtok: 15, outputPerMtok: 75 }

function getPricing(model: string): { inputPerMtok: number; outputPerMtok: number } {
  // Strip 8-digit date suffix: claude-sonnet-4-6-20260101 → claude-sonnet-4-6
  const normalised = model.replace(/-\d{8}$/, '')

  if (PRICE_TABLE[normalised]) return PRICE_TABLE[normalised]

  // Prefix match for variant names: claude-3-5-sonnet-custom → claude-3-5-sonnet
  const match = Object.entries(PRICE_TABLE).find(([key]) => normalised.startsWith(key))
  return match ? match[1] : FALLBACK_PRICE
}

/**
 * Compute estimated cost in USD for a request/response pair.
 */
export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const { inputPerMtok, outputPerMtok } = getPricing(model)
  return (inputTokens * inputPerMtok + outputTokens * outputPerMtok) / 1_000_000
}
