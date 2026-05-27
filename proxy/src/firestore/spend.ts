import { FieldValue } from 'firebase-admin/firestore'
import { getFirestoreClient } from './client.js'
import type { SpendDoc, SpendIncrement } from './types.js'

const COLLECTION = 'spend'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Atomically add token counts and cost to today's spend document.
 * Creates the document if it does not exist yet.
 */
export async function recordSpend(increment: SpendIncrement): Promise<void> {
  const db = getFirestoreClient()
  const docRef = db.collection(COLLECTION).doc(todayKey())

  await docRef.set(
    {
      totalInputTokens: FieldValue.increment(increment.inputTokens),
      totalOutputTokens: FieldValue.increment(increment.outputTokens),
      totalCostUsd: FieldValue.increment(increment.costUsd),
      requestCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * Return the spend document for the given date (defaults to today).
 * Returns null if no spend has been recorded for that date yet.
 */
export async function getSpend(date?: Date): Promise<SpendDoc | null> {
  const db = getFirestoreClient()
  const key = date ? dateKey(date) : todayKey()
  const snap = await db.collection(COLLECTION).doc(key).get()
  return snap.exists ? (snap.data() as SpendDoc) : null
}

/**
 * Return the total cost in USD accumulated so far today.
 * Returns 0 if no spend has been recorded.
 */
export async function getTodaySpendUsd(): Promise<number> {
  const doc = await getSpend()
  return doc?.totalCostUsd ?? 0
}

/**
 * Return spend documents for a date range [from, to] inclusive.
 * Both dates default to today when omitted.
 */
export async function getSpendRange(from: Date, to: Date): Promise<Record<string, SpendDoc>> {
  const db = getFirestoreClient()
  const fromKey = dateKey(from)
  const toKey = dateKey(to)

  const snap = await db
    .collection(COLLECTION)
    .where('__name__', '>=', fromKey)
    .where('__name__', '<=', toKey)
    .get()

  const result: Record<string, SpendDoc> = {}
  snap.forEach((doc) => {
    result[doc.id] = doc.data() as SpendDoc
  })
  return result
}
