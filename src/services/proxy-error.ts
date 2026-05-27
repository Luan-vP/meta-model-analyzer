import Anthropic from '@anthropic-ai/sdk'

export type ProxyErrorKind = 'network' | 'rate-limit' | 'spend-cap' | 'server-error' | 'auth' | 'unknown'

export interface ClassifiedError {
  kind: ProxyErrorKind
  message: string
}

export function classifyProxyError(e: unknown): ClassifiedError {
  if (e instanceof Anthropic.APIConnectionError || e instanceof Anthropic.APIConnectionTimeoutError) {
    return {
      kind: 'network',
      message: 'Network unreachable — check your connection and retry, or switch to WebLLM.',
    }
  }
  if (e instanceof Anthropic.APIStatusError) {
    if (e.status === 429) {
      return { kind: 'rate-limit', message: 'Rate limited — please wait a few minutes, then retry.' }
    }
    if (e.status === 402) {
      return { kind: 'spend-cap', message: 'Daily spend cap reached — requests will resume tomorrow.' }
    }
    if (e.status === 401 || e.status === 403) {
      return { kind: 'auth', message: 'Authentication failed — check your API key in Settings.' }
    }
    if (e.status >= 500) {
      return { kind: 'server-error', message: `Service unavailable (${e.status}) — please retry or switch to WebLLM.` }
    }
  }
  return { kind: 'unknown', message: e instanceof Error ? e.message : 'Analysis failed' }
}
