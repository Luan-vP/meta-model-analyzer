// The provider port + request type live in the shared hexagon (`@core`).
// ProviderType stays desktop-local: it enumerates the adapters this app offers.
export type { LlmProvider, CompletionRequest } from '@core'

export type ProviderType = 'claude' | 'webllm' | 'ollama'
