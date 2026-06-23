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
  // Monotonic token identifying the latest initialization. Rapid provider/model
  // changes (and the auto-probe) can fire several async initializeProvider()
  // calls that overlap. Each captures its own id; any call whose id is no longer
  // current bails out and disposes the engine it built, so a stale load can
  // never install — or dispose — the engine the UI is actually using. Without
  // this, an outdated load would terminate the live worker mid-generation
  // ("Object has already been disposed").
  const initIdRef = useRef(0)

  const cancelLoading = useCallback(() => {
    initIdRef.current++ // invalidate any in-flight initialization
    serviceRef.current?.dispose()
    serviceRef.current = null
    setService(null)
    setReady(false)
    setLoading(false)
    setProgress({ value: 0, status: '' })
    setError(null)
  }, [])

  const initializeProvider = useCallback(async () => {
    const myId = ++initIdRef.current
    const isStale = () => initIdRef.current !== myId
    console.log(`[provider] init #${myId}: provider=${provider} webllmModel=${webllmModel || '(none)'}`)

    // Tear down the previous engine before starting a new one.
    serviceRef.current?.dispose()
    serviceRef.current = null
    setReady(false)
    setError(null)

    if (provider === 'claude') {
      if (!apiKey) {
        setError('Please enter your Claude API key')
        setService(null)
        return
      }
      const svc = new ClaudeProvider(apiKey)
      await svc.initialize()
      if (isStale()) {
        svc.dispose()
        return
      }
      serviceRef.current = svc
      setService(svc)
      setReady(true)
    } else if (provider === 'ollama') {
      if (!ollamaUrl) {
        setError('Please enter your Ollama server URL')
        setService(null)
        return
      }
      const svc = new OllamaProvider(ollamaUrl, ollamaModel)
      await svc.initialize()
      if (isStale()) {
        svc.dispose()
        return
      }
      serviceRef.current = svc
      setService(svc)
      setReady(true)
    } else {
      // WebLLM — don't load anything until the user has picked a model.
      if (!webllmModel) {
        setService(null)
        return
      }
      setLoading(true)
      setProgress({ value: 0, status: 'Loading WebLLM...' })
      try {
        const { WebLLMService } = await import('../services/webllm-service')
        if (isStale()) return
        const svc = new WebLLMService(webllmModel)
        await svc.initialize((value, status) => {
          if (!isStale()) setProgress({ value, status })
        })
        if (isStale()) {
          // A newer init superseded us — discard the engine we just built so it
          // doesn't leak a live worker.
          svc.dispose()
          return
        }
        serviceRef.current = svc
        setService(svc)
        setReady(true)
      } catch (e) {
        if (isStale()) return
        setError(e instanceof Error ? e.message : 'Failed to initialize WebLLM')
      } finally {
        if (!isStale()) setLoading(false)
      }
    }
  }, [provider, apiKey, webllmModel, ollamaUrl, ollamaModel])

  useEffect(() => {
    initializeProvider()
    return () => {
      // Invalidate whatever init is current and dispose its engine when deps
      // change or unmount. Mutating the ref in cleanup is intentional (it's an
      // epoch counter, not a DOM node), so the lint heuristic doesn't apply.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      initIdRef.current++
      serviceRef.current?.dispose()
      serviceRef.current = null
    }
  }, [initializeProvider])

  return { service, ready, loading, progress, error, cancelLoading }
}
