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
  retryAttempt: number
  retryMax: number
}

const makeIteration = (n: number): Iteration => ({
  n,
  text: '',
  annotations: [],
  status: 'editing',
  error: null,
  errorKind: null,
  retryAttempt: 0,
  retryMax: 0,
})

export function useIterations(service: LlmProvider | null, maxRetries: number) {
  const [iterations, setIterations] = useState<Iteration[]>(() => [makeIteration(1)])
  const ref = useRef(iterations)
  ref.current = iterations
  const maxRetriesRef = useRef(maxRetries)
  maxRetriesRef.current = maxRetries

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
        let annotations = await analyzeText(service, trimmed)
        let attempt = 0
        while (annotations.length === 0 && attempt < maxRetriesRef.current) {
          attempt++
          setIterations((prev) =>
            prev.map((it) =>
              it.n === n
                ? { ...it, status: 'analyzing', retryAttempt: attempt, retryMax: maxRetriesRef.current }
                : it,
            ),
          )
          annotations = await analyzeText(service, trimmed)
        }
        setIterations((prev) => {
          const updated = prev.map((it) =>
            it.n === n
              ? { ...it, annotations, status: 'analyzed' as const, retryAttempt: 0, retryMax: 0 }
              : it,
          )
          const isLast = updated[updated.length - 1]?.n === n
          return isLast ? [...updated, makeIteration(n + 1)] : updated
        })
      } catch (e) {
        const { kind, message } = classifyProxyError(e)
        setIterations((prev) =>
          prev.map((it) =>
            it.n === n
              ? { ...it, status: 'editing' as const, error: message, errorKind: kind, retryAttempt: 0 }
              : it,
          ),
        )
      }
    },
    [service],
  )

  return { iterations, analyze, setText }
}
