import { useState, useCallback, useEffect, useRef } from 'react'
import type { ProviderType } from '../types/llm'
import { DEFAULT_WEBLLM_MODEL_ID } from '../services/webllm-service'
import { pickDefaultWebLLMModel } from '../services/device-probe'

const STORAGE_KEYS = {
  apiKey: 'mma-claude-api-key',
  provider: 'mma-provider',
  webllmModel: 'mma-webllm-model',
  // Cached result of the auto-probe so we don't re-run it on every load.
  // This is *not* an explicit user choice — if the user picks a model via
  // setWebllmModel, we persist it under `webllmModel` and it always wins.
  webllmModelAuto: 'mma-webllm-model-auto',
} as const

export function useSettings() {
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.apiKey) ?? '')
  const [provider, setProviderState] = useState<ProviderType>(
    () => (localStorage.getItem(STORAGE_KEYS.provider) as ProviderType) ?? 'webllm',
  )
  const [webllmModel, setWebllmModelState] = useState<string>(() => {
    const explicit = localStorage.getItem(STORAGE_KEYS.webllmModel)
    if (explicit) return explicit
    const cachedAuto = localStorage.getItem(STORAGE_KEYS.webllmModelAuto)
    if (cachedAuto) return cachedAuto
    return DEFAULT_WEBLLM_MODEL_ID
  })

  // Tracks whether the user has explicitly picked a model in this session.
  // Combined with the localStorage check this guarantees the probe never
  // overrides an explicit choice.
  const userPickedRef = useRef<boolean>(Boolean(localStorage.getItem(STORAGE_KEYS.webllmModel)))

  // Run the device probe once on first load if the user has never made an
  // explicit choice. We still render immediately with the synchronous
  // fallback above; the probe just updates state asynchronously if it
  // recommends a different default.
  useEffect(() => {
    if (userPickedRef.current) return
    if (localStorage.getItem(STORAGE_KEYS.webllmModel)) return

    let cancelled = false
    pickDefaultWebLLMModel()
      .then((result) => {
        if (cancelled) return
        // Re-check at resolution time: the user may have picked a model
        // while the probe was running.
        if (userPickedRef.current) return
        if (localStorage.getItem(STORAGE_KEYS.webllmModel)) return

        localStorage.setItem(STORAGE_KEYS.webllmModelAuto, result.modelId)
        setWebllmModelState((current) => (current === result.modelId ? current : result.modelId))
      })
      .catch((err) => {
        console.warn('[webllm] device probe failed; keeping existing default', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEYS.apiKey, key)
    setApiKeyState(key)
  }, [])

  const setProvider = useCallback((p: ProviderType) => {
    localStorage.setItem(STORAGE_KEYS.provider, p)
    setProviderState(p)
  }, [])

  const setWebllmModel = useCallback((id: string) => {
    userPickedRef.current = true
    localStorage.setItem(STORAGE_KEYS.webllmModel, id)
    setWebllmModelState(id)
  }, [])

  return { apiKey, setApiKey, provider, setProvider, webllmModel, setWebllmModel }
}
