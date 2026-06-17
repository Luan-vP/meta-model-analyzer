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
  return { kind: 'unknown', message: e instanceof Error ? e.message : 'Analysis failed' }
}
