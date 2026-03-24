import { useState, useCallback } from 'react'
import type { ProviderType } from '../types/llm'

const STORAGE_KEYS = {
  apiKey: 'mma-claude-api-key',
  provider: 'mma-provider',
} as const

export function useSettings() {
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.apiKey) ?? '')
  const [provider, setProviderState] = useState<ProviderType>(
    () => (localStorage.getItem(STORAGE_KEYS.provider) as ProviderType) ?? 'webllm',
  )

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    setApiKeyState(key)
  }, [])

  const setProvider = useCallback((p: ProviderType) => {
    localStorage.setItem(STORAGE_KEYS.provider, p)
    setProviderState(p)
  }, [])

  return { apiKey, setApiKey, provider, setProvider }
}
