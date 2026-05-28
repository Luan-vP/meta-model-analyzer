import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimitMiddleware } from './rate-limit.js'

vi.mock('../firestore/rate-limits.js', () => ({
  checkRateLimit: vi.fn(),
  DEFAULT_RATE_LIMIT_CONFIG: { minRate: 20, dayLimit: 200, burst: 5 },
}))

import { checkRateLimit } from '../firestore/rate-limits.js'

const mockCheck = vi.mocked(checkRateLimit)

function buildApp() {
  const app = new Hono()
  app.post('/v1/messages', rateLimitMiddleware, (c) => c.json({ ok: true }))
  return app
}

describe('rateLimitMiddleware', () => {
  let app: Hono

  beforeEach(() => {
    app = buildApp()
    vi.clearAllMocks()
  })

  it('allows request and calls next when under limit', async () => {
    mockCheck.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })

    const res = await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('extracts first IP from x-forwarded-for chain', async () => {
    mockCheck.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })

    await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 172.16.0.1' },
    })

    expect(mockCheck).toHaveBeenCalledWith('1.2.3.4', expect.objectContaining({ minRate: 20, dayLimit: 200, burst: 5 }))
  })

  it('uses "unknown" when x-forwarded-for header is absent', async () => {
    mockCheck.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })

    await app.request('/v1/messages', { method: 'POST' })

    expect(mockCheck).toHaveBeenCalledWith('unknown', expect.any(Object))
  })

  it('returns 429 with Retry-After when rate-limited', async () => {
    mockCheck.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 })

    const res = await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })

    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('42')
    const body = await res.json()
    expect(body).toMatchObject({ type: 'error', error: { type: 'rate_limit_error' } })
  })

  it('returns 429 with Retry-After when daily cap is hit', async () => {
    mockCheck.mockResolvedValue({ allowed: false, retryAfterSeconds: 3600 })

    const res = await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'x-forwarded-for': '5.6.7.8' },
    })

    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('3600')
  })

  it('fails open (passes request through) when Firestore throws', async () => {
    mockCheck.mockRejectedValue(new Error('Firestore unavailable'))

    const res = await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })

    expect(res.status).toBe(200)
  })
})
