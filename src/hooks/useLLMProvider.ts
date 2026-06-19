import { useState, useEffect, useRef, useCallback } from 'react'
import type { ProviderType } from '../types/llm'
import type { LlmProvider } from '@core'
import { ClaudeProvider } from '@adapters/providers/claude'
import { OllamaProvider } from '@adapters/providers/ollama'

export function useLLMProvider(
  provider: ProviderType,
  apiKey: string,
  webllmModel: string,
  ollamaUrl: string,
  ollamaModel: string,
) {
  const [service, setService] = useState<LlmProvider | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ value: 0, status: '' })
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<LlmProvider | null>(null)
  const cancelledRef = useRef(false)

  const cancelLoading = useCallback(() => {
    cancelledRef.current = true
    serviceRef.current?.dispose()
    serviceRef.current = null
    setService(null)
    setLoading(false)
    setProgress({ value: 0, status: '' })
    setError(null)
  }, [])

  const initializeProvider = useCallback(async () => {
    // Dispose previous service
    serviceRef.current?.dispose()
    cancelledRef.current = false
    setReady(false)
    setError(null)

    if (provider === 'claude') {
      if (!apiKey) {
        setError('Please enter your Claude API key')
        setService(null)
        serviceRef.current = null
        return
      }
      const svc = new ClaudeProvider(apiKey)
      await svc.initialize()
      serviceRef.current = svc
      setService(svc)
      setReady(true)
    } else if (provider === 'ollama') {
      if (!ollamaUrl) {
        setError('Please enter your Ollama server URL')
        setService(null)
        serviceRef.current = null
        return
      }
      const svc = new OllamaProvider(ollamaUrl, ollamaModel)
      await svc.initialize()
      serviceRef.current = svc
      setService(svc)
      setReady(true)
    } else {
      // WebLLM — don't load anything until the user has picked a model.
      if (!webllmModel) {
        setService(null)
        serviceRef.current = null
        return
      }
      setLoading(true)
      setProgress({ value: 0, status: 'Loading WebLLM...' })
      try {
        const { WebLLMService } = await import('../services/webllm-service')
        const svc = new WebLLMService(webllmModel)
        serviceRef.current = svc
        await svc.initialize((value, status) => {
          setProgress({ value, status })
        })
        if (cancelledRef.current) return
        setService(svc)
        setReady(true)
      } catch (e) {
        if (cancelledRef.current) return
        setError(e instanceof Error ? e.message : 'Failed to initialize WebLLM')
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    }
  }, [provider, apiKey, webllmModel, ollamaUrl, ollamaModel])

  useEffect(() => {
    initializeProvider()
    return () => {
      serviceRef.current?.dispose()
    }
  }, [initializeProvider])

  return { service, ready, loading, progress, error, cancelLoading }
}
