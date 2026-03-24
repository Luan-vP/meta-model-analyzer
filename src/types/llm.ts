import type { Annotation } from './analysis'

export type ProviderType = 'claude' | 'webllm'

export interface LLMService {
  readonly providerName: string
  isReady(): boolean
  initialize(onProgress?: (progress: number, status: string) => void): Promise<void>
  analyze(text: string): Promise<Annotation[]>
  dispose(): void
}
