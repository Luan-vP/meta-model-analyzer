export type ProxyErrorKind = 'network' | 'rate-limit' | 'spend-cap' | 'server-error' | 'auth' | 'unknown'

export interface ClassifiedError {
  kind: ProxyErrorKind
  message: string
}

export class ProxyFetchError extends Error {
  constructor(
    public readonly kind: ProxyErrorKind,
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ProxyFetchError'
  }
}

export function classifyProxyError(e: unknown): ClassifiedError {
  if (e instanceof ProxyFetchError) {
    switch (e.kind) {
      case 'network':
        return { kind: 'network', message: 'Network unreachable — check your connection and retry, or switch to WebLLM.' }
      case 'rate-limit':
        return { kind: 'rate-limit', message: 'Rate limited — please wait a few minutes, then retry.' }
      case 'spend-cap':
        return { kind: 'spend-cap', message: 'Daily spend cap reached — requests will resume tomorrow.' }
      case 'auth':
        return { kind: 'auth', message: 'Service authentication error — please try again later.' }
      case 'server-error':
        return { kind: 'server-error', message: `Service unavailable — please retry or switch to WebLLM.` }
    }
  }
  return { kind: 'unknown', message: e instanceof Error ? e.message : 'Analysis failed' }
}
