import type { Annotation } from '../../domain/annotation'

// Outbound (driven) port: the contract any LLM provider adapter must satisfy
// for the application to run a Meta-Model analysis. Implemented by driven
// adapters (Claude, WebLLM, Ollama, ...) outside the hexagon.
//
// NOTE: Phase 1 keeps the original `analyze(text) -> Annotation[]` contract so
// behaviour is unchanged. A later phase will narrow this to a raw-completion
// port and move parsing/offset-resolution into an AnalyzeText use case.
export interface LLMService {
  readonly providerName: string
  isReady(): boolean
  initialize(onProgress?: (progress: number, status: string) => void): Promise<void>
  analyze(text: string): Promise<Annotation[]>
  dispose(): void
}
