export type ProxyErrorKind = 'network' | 'rate-limit' | 'spend-cap' | 'server-error' | 'auth' | 'unknown'

export interface ClassifiedError {
  kind: ProxyErrorKind
  message: string
}

export function classifyProxyError(e: unknown): ClassifiedError {
  // fetch throws TypeError on network failure (no response)
  if (e instanceof TypeError) {
    return {
      kind: 'network',
      message: 'Network unreachable — check your connection and retry, or switch to WebLLM.',
    }
  }
  const status = (e as { status?: number }).status
  if (typeof status === 'number') {
    if (status === 429) {
      return { kind: 'rate-limit', message: 'Rate limited — please wait a few minutes, then retry.' }
    }
    if (status === 402) {
      return { kind: 'spend-cap', message: 'Daily spend cap reached — requests will resume tomorrow.' }
    }
    if (status === 401 || status === 403) {
      return { kind: 'auth', message: 'Authentication failed — proxy authentication error.' }
    }
    if (status >= 500) {
      return { kind: 'server-error', message: `Service unavailable (${status}) — please retry or switch to WebLLM.` }
    }
  }
  return { kind: 'unknown', message: e instanceof Error ? e.message : 'Analysis failed' }
}
