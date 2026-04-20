import { useState, useCallback } from 'react'
import type { ProviderType } from '../types/llm'
import { DEFAULT_WEBLLM_MODEL_ID } from '../services/webllm-service'

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
    () => localStorage.getItem(STORAGE_KEYS.webllmModel) ?? DEFAULT_WEBLLM_MODEL_ID,
  )

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    setApiKeyState(key)
  }, [])

  const setProvider = useCallback((p: ProviderType) => {
    localStorage.setItem(STORAGE_KEYS.provider, p)
    setProviderState(p)
  }, [])

  const setWebllmModel = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEYS.webllmModel, id)
    setWebllmModelState(id)
  }, [])

  return { apiKey, setApiKey, provider, setProvider, webllmModel, setWebllmModel }
}
