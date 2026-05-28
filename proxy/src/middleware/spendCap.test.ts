import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createSpendCapMiddleware } from './spendCap.js'

vi.mock('../firestore/index.js', () => ({
  getTodaySpendUsd: vi.fn(),
}))

import { getTodaySpendUsd } from '../firestore/index.js'

const mockGetTodaySpendUsd = vi.mocked(getTodaySpendUsd)

function buildApp(capUsd: number) {
  const app = new Hono()
  app.use('/v1/messages', createSpendCapMiddleware(capUsd))
  app.post('/v1/messages', (c) => c.json({ ok: true }))
  return app
}

describe('createSpendCapMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows request when spend is below the cap', async () => {
    mockGetTodaySpendUsd.mockResolvedValue(5.0)
    const res = await buildApp(10.0).request('/v1/messages', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 402 when spend equals the cap', async () => {
    mockGetTodaySpendUsd.mockResolvedValue(10.0)
    const res = await buildApp(10.0).request('/v1/messages', { method: 'POST' })
    expect(res.status).toBe(402)
    const body = await res.json() as { type: string; error: { type: string; message: string } }
    expect(body.type).toBe('error')
    expect(body.error.type).toBe('payment_required')
    expect(body.error.message).toContain('$10.00')
  })

  it('returns 402 when spend exceeds the cap', async () => {
    mockGetTodaySpendUsd.mockResolvedValue(15.75)
    const res = await buildApp(10.0).request('/v1/messages', { method: 'POST' })
    expect(res.status).toBe(402)
  })

  it('includes current spend amount in 402 message', async () => {
    mockGetTodaySpendUsd.mockResolvedValue(12.3456)
    const res = await buildApp(10.0).request('/v1/messages', { method: 'POST' })
    const body = await res.json() as { error: { message: string } }
    expect(body.error.message).toContain('12.3456')
  })

  it('fails open (allows request) when Firestore throws', async () => {
    mockGetTodaySpendUsd.mockRejectedValue(new Error('Firestore unavailable'))
    const res = await buildApp(10.0).request('/v1/messages', { method: 'POST' })
    expect(res.status).toBe(200)
  })

  it('allows request at $0 spend against a $0.01 cap', async () => {
    mockGetTodaySpendUsd.mockResolvedValue(0)
    const res = await buildApp(0.01).request('/v1/messages', { method: 'POST' })
    expect(res.status).toBe(200)
  })
})
