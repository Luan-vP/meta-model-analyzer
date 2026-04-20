import { useState, useCallback } from 'react'
import type { ProviderType } from '../types/llm'
import { pickDefaultWebLLMModel, type ProbeResult } from '../services/device-probe'

const STORAGE_KEYS = {
  apiKey: 'mma-claude-api-key',
  provider: 'mma-provider',
  webllmModel: 'mma-webllm-model',
} as const

export function useSettings() {
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.apiKey) ?? '')
  const [provider, setProviderState] = useState<ProviderType>(
    () => (localStorage.getItem(STORAGE_KEYS.provider) as ProviderType) ?? 'webllm',
  )
  const [webllmModel, setWebllmModelState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.webllmModel) ?? '',
  )
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null)

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
    probeWebllmModel,
    probing,
    probeResult,
  }
}
