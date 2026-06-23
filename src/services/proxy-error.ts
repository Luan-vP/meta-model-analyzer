import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from '@anthropic-ai/sdk'

export type ProxyErrorKind = 'network' | 'rate-limit' | 'spend-cap' | 'server-error' | 'auth' | 'unknown'

export interface ClassifiedError {
  kind: ProxyErrorKind
  message: string
}

export function classifyProxyError(e: unknown): ClassifiedError {
  if (e instanceof APIConnectionError || e instanceof APIConnectionTimeoutError) {
    return {
      kind: 'network',
      message: 'Network unreachable — check your connection and retry, or switch to WebLLM.',
    }
  }
  if (e instanceof RateLimitError) {
    return { kind: 'rate-limit', message: 'Rate limited — please wait a few minutes, then retry.' }
  }
  if (e instanceof AuthenticationError || e instanceof PermissionDeniedError) {
    return { kind: 'auth', message: 'Authentication failed — check your API key in Settings.' }
  }
  if (e instanceof InternalServerError) {
    return { kind: 'server-error', message: `Service unavailable (${e.status}) — please retry or switch to WebLLM.` }
  }
  // 402 spend cap — no dedicated SDK class, check via base APIError
  if (e instanceof APIError && e.status === 402) {
    return { kind: 'spend-cap', message: 'Daily spend cap reached — requests will resume tomorrow.' }
  }
  return { kind: 'unknown', message: extractErrorMessage(e) }
}

/**
 * Pull a human-meaningful message out of an arbitrary throwable. Local-inference
 * failures (WebLLM/WebGPU) don't throw Anthropic SDK errors — they throw plain
 * Errors, worker `ErrorEvent`s, or bare objects/strings. The old fallback
 * collapsed all of those to "Analysis failed", hiding the actual cause (out of
 * memory, device lost, malformed JSON, …). Surface whatever detail we can.
 */
function extractErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  if (typeof e === 'string' && e) return e
  // Worker failures arrive as ErrorEvent; the message lives on .message.
  if (typeof ErrorEvent !== 'undefined' && e instanceof ErrorEvent && e.message) {
    return e.message
  }
  if (e && typeof e === 'object') {
    const obj = e as { message?: unknown; error?: unknown }
    if (typeof obj.message === 'string' && obj.message) return obj.message
    if (obj.error instanceof Error && obj.error.message) return obj.error.message
    try {
      const json = JSON.stringify(e)
      if (json && json !== '{}') return json
    } catch {
      // fall through
    }
  }
  return 'Analysis failed'
}
