import { describe, it, expect } from 'vitest'
import { computeCostUsd } from './pricing.js'

describe('computeCostUsd', () => {
  it('computes cost for claude-sonnet-4-6 ($3/$15 per MTok)', () => {
    // 1M input + 1M output = $3 + $15 = $18
    expect(computeCostUsd('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBeCloseTo(18)
  })

  it('computes cost for claude-opus-4-7 ($15/$75 per MTok)', () => {
    // 1M input + 1M output = $15 + $75 = $90
    expect(computeCostUsd('claude-opus-4-7', 1_000_000, 1_000_000)).toBeCloseTo(90)
  })

  it('computes cost for claude-haiku-4-5 ($0.80/$4 per MTok)', () => {
    // 1M input + 1M output = $0.80 + $4 = $4.80
    expect(computeCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(4.8)
  })

  it('computes cost for claude-3-haiku ($0.25/$1.25 per MTok)', () => {
    expect(computeCostUsd('claude-3-haiku', 1_000_000, 1_000_000)).toBeCloseTo(1.5)
  })

  it('strips 8-digit date suffix before lookup', () => {
    expect(computeCostUsd('claude-sonnet-4-6-20260101', 1_000_000, 1_000_000)).toBeCloseTo(18)
    expect(computeCostUsd('claude-3-5-sonnet-20241022', 1_000_000, 1_000_000)).toBeCloseTo(18)
  })

  it('uses prefix matching for variant model names', () => {
    // claude-3-5-sonnet-custom should resolve to claude-3-5-sonnet pricing
    expect(computeCostUsd('claude-3-5-sonnet-custom', 1_000_000, 1_000_000)).toBeCloseTo(18)
  })

  it('falls back to Opus pricing for completely unknown models', () => {
    // Fallback = $15 + $75 = $90 per MTok (conservative over-count)
    expect(computeCostUsd('claude-unknown-9000', 1_000_000, 1_000_000)).toBeCloseTo(90)
  })

  it('returns 0 for zero tokens', () => {
    expect(computeCostUsd('claude-sonnet-4-6', 0, 0)).toBe(0)
  })

  it('handles output-only tokens', () => {
    // 0 input + 1k output for sonnet-4-6 = 1000 * 15 / 1_000_000 = $0.000015
    expect(computeCostUsd('claude-sonnet-4-6', 0, 1_000)).toBeCloseTo(0.000015)
  })

  it('handles fractional token counts', () => {
    expect(computeCostUsd('claude-sonnet-4-6', 100, 50)).toBeCloseTo(
      (100 * 3 + 50 * 15) / 1_000_000,
    )
  })
})
