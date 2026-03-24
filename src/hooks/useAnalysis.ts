import { useState, useCallback } from 'react'
import type { AnalysisResult } from '../types/analysis'
import type { LLMService } from '../types/llm'

export function useAnalysis(service: LLMService | null) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (text: string) => {
      if (!service) {
        setError('LLM service not ready')
        return
      }

      setAnalyzing(true)
      setError(null)
      setResult(null)

      try {
        const annotations = await service.analyze(text)
        setResult({ originalText: text, annotations })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Analysis failed')
      } finally {
        setAnalyzing(false)
      }
    },
    [service],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, analyzing, error, analyze, clear }
}
