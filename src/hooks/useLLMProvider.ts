import { useState, useEffect, useRef, useCallback } from 'react'
import type { ProviderType, LLMService } from '../types/llm'
import { ClaudeService } from '../services/claude-service'

export function useLLMProvider(provider: ProviderType, apiKey: string) {
  const [service, setService] = useState<LLMService | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ value: 0, status: '' })
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<LLMService | null>(null)

  const initializeProvider = useCallback(async () => {
    // Dispose previous service
    serviceRef.current?.dispose()
    setReady(false)
    setError(null)

    if (provider === 'claude') {
      if (!apiKey) {
        setError('Please enter your Claude API key')
        setService(null)
        serviceRef.current = null
        return
      }
      const svc = new ClaudeService(apiKey)
      await svc.initialize()
      serviceRef.current = svc
      setService(svc)
      setReady(true)
    } else {
      // WebLLM
      setLoading(true)
      setProgress({ value: 0, status: 'Loading WebLLM...' })
      try {
        const { WebLLMService } = await import('../services/webllm-service')
        const svc = new WebLLMService()
        await svc.initialize((value, status) => {
          setProgress({ value, status })
        })
        serviceRef.current = svc
        setService(svc)
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize WebLLM')
      } finally {
        setLoading(false)
      }
    }
  }, [provider, apiKey])

  useEffect(() => {
    initializeProvider()
    return () => {
      serviceRef.current?.dispose()
    }
  }, [initializeProvider])

  return { service, ready, loading, progress, error }
}
