import { log } from './logger.js'

// Rough pricing for claude-sonnet-4-5 (USD per million tokens).
// Adjust if the deployed model changes.
const INPUT_PRICE_PER_M = 3.0
const OUTPUT_PRICE_PER_M = 15.0

const DAILY_CAP = parseFloat(process.env.DAILY_SPEND_CAP_USD ?? '5.0')

// TODO(gcp): replace with Firestore atomic counter (issue #17/#22) for multi-instance accuracy
let dailySpend = 0
let dayStart = todayMidnightUTC()

function todayMidnightUTC(): number {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime()
}

function resetIfNewDay() {
  const today = todayMidnightUTC()
  if (today > dayStart) {
    log('INFO', 'daily_spend_reset', { previousSpendUSD: dailySpend })
    dailySpend = 0
    dayStart = today
  }
}

export function checkSpendCap(): boolean {
  resetIfNewDay()
  return dailySpend < DAILY_CAP
}

export function recordSpend(inputTokens: number, outputTokens: number) {
  const cost =
    (inputTokens / 1_000_000) * INPUT_PRICE_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M
  dailySpend += cost
  log('INFO', 'spend_recorded', {
    inputTokens,
    outputTokens,
    costUSD: cost,
    dailyTotalUSD: dailySpend,
    capUSD: DAILY_CAP,
  })
}
