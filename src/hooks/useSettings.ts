import { useState, useCallback } from 'react'
import { DEFAULT_OLLAMA_URL, DEFAULT_OLLAMA_MODEL } from '@adapters/providers/ollama'
import type { ProviderType } from '../types/llm'
import { pickDefaultWebLLMModel, type ProbeResult } from '../services/device-probe'

const STORAGE_KEYS = {
  apiKey: 'mma-claude-api-key',
  provider: 'mma-provider',
  webllmModel: 'mma-webllm-model',
  ollamaUrl: 'mma-ollama-url',
  ollamaModel: 'mma-ollama-model',
  debugMode: 'mma-debug-mode',
  maxRetries: 'mma-max-retries',
} as const

export function useSettings() {
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.apiKey) ?? '')
  const [provider, setProviderState] = useState<ProviderType>(
    () => (localStorage.getItem(STORAGE_KEYS.provider) as ProviderType) ?? 'webllm',
  )
  const [webllmModel, setWebllmModelState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.webllmModel) ?? '',
  )
  const [ollamaUrl, setOllamaUrlState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.ollamaUrl) ?? DEFAULT_OLLAMA_URL,
  )
  const [ollamaModel, setOllamaModelState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.ollamaModel) ?? DEFAULT_OLLAMA_MODEL,
  )
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null)
  const [debugMode, setDebugModeState] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.debugMode) === '1',
  )
  const [maxRetries, setMaxRetriesState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.maxRetries)
    const raw = stored === null ? NaN : Number(stored)
    return Number.isFinite(raw) && raw >= 0 && raw <= 5 ? raw : 3
  })

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    setApiKeyState(key)
  }, [])

  const setProvider = useCallback((p: ProviderType) => {
    localStorage.setItem(STORAGE_KEYS.provider, p)
    setProviderState(p)
  }, [])

  const setWebllmModel = useCallback((id: string) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.webllmModel, id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.webllmModel)
    }
    setWebllmModelState(id)
  }, [])

  const setOllamaUrl = useCallback((url: string) => {
    localStorage.setItem(STORAGE_KEYS.ollamaUrl, url)
    setOllamaUrlState(url)
  }, [])

  const setOllamaModel = useCallback((model: string) => {
    localStorage.setItem(STORAGE_KEYS.ollamaModel, model)
    setOllamaModelState(model)
  }, [])

  const setDebugMode = useCallback((on: boolean) => {
    localStorage.setItem(STORAGE_KEYS.debugMode, on ? '1' : '0')
    setDebugModeState(on)
  }, [])

  const setMaxRetries = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(5, Math.round(n)))
    localStorage.setItem(STORAGE_KEYS.maxRetries, String(clamped))
    setMaxRetriesState(clamped)
  }, [])

  const probeWebllmModel = useCallback(async () => {
    setProbing(true)
    try {
      const result = await pickDefaultWebLLMModel()
      setProbeResult(result)
      localStorage.setItem(STORAGE_KEYS.webllmModel, result.modelId)
      setWebllmModelState(result.modelId)
      return result
    } finally {
      setProbing(false)
    }
  }, [])

  return {
    apiKey,
    setApiKey,
    provider,
    setProvider,
    webllmModel,
    setWebllmModel,
    ollamaUrl,
    setOllamaUrl,
    ollamaModel,
    setOllamaModel,
    probeWebllmModel,
    probing,
    probeResult,
    debugMode,
    setDebugMode,
    maxRetries,
    setMaxRetries,
  }
}
