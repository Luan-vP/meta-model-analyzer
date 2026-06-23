import { useCallback, useRef, useState } from 'react'
import { analyzeText, type Annotation, type LlmProvider } from '@core'
import { classifyProxyError, type ProxyErrorKind } from '../services/proxy-error'

export type IterationStatus = 'editing' | 'analyzing' | 'analyzed'

export interface Iteration {
  n: number
  text: string
  annotations: Annotation[]
  status: IterationStatus
  error: string | null
  errorKind: ProxyErrorKind | null
}

const makeIteration = (n: number): Iteration => ({
  n,
  text: '',
  annotations: [],
  status: 'editing',
  error: null,
  errorKind: null,
})

export function useIterations(service: LlmProvider | null) {
  const [iterations, setIterations] = useState<Iteration[]>(() => [makeIteration(1)])
  const ref = useRef(iterations)
  ref.current = iterations

  const setText = useCallback((n: number, text: string) => {
    setIterations((prev) => prev.map((it) => (it.n === n ? { ...it, text } : it)))
  }, [])

  const analyze = useCallback(
    async (n: number) => {
      if (!service) return
      const target = ref.current.find((it) => it.n === n)
      if (!target || target.status !== 'editing') return
      const trimmed = target.text.trim()
      if (!trimmed) return

      setIterations((prev) =>
        prev.map((it) =>
          it.n === n ? { ...it, text: trimmed, status: 'analyzing', error: null } : it,
        ),
      )

      try {
        const annotations = await analyzeText(service, trimmed)
        setIterations((prev) => {
          const updated = prev.map((it) =>
            it.n === n ? { ...it, annotations, status: 'analyzed' as const } : it,
          )
          const isLast = updated[updated.length - 1]?.n === n
          return isLast ? [...updated, makeIteration(n + 1)] : updated
        })
      } catch (e) {
        // Log the raw throwable before classification — for local inference
        // (WebLLM) the real cause is otherwise swallowed by the generic UI
        // message. Visible in the in-app debug console (Settings → Debug mode).
        console.error('[analyze] iteration', n, 'failed:', e)
        const { kind, message } = classifyProxyError(e)
        setIterations((prev) =>
          prev.map((it) =>
            it.n === n ? { ...it, status: 'editing' as const, error: message, errorKind: kind } : it,
          ),
        )
      }
    },
    [service],
  )

  return { iterations, analyze, setText }
}
