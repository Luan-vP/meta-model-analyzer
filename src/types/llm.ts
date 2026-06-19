// The LLMService provider port now lives in the shared hexagon (`@core`).
// ProviderType stays desktop-local: it enumerates the adapters this app offers.
export type { LLMService } from '@core'

export type ProviderType = 'claude' | 'webllm'
