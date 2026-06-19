// Outbound (driven) port: the contract any LLM provider adapter must satisfy.
// Narrowed to a raw-completion port — the adapter only runs the model and
// returns its raw text. Parsing, validation, and offset-resolution live in the
// AnalyzeText use case (application/analyze-text.ts), so every adapter shares
// identical post-processing.

export interface CompletionRequest {
  /** System prompt. */
  system: string
  /** User message (already built by the use case via buildUserMessage). */
  user: string
  /**
   * JSON schema for the expected output. Adapters may use it for native
   * structured-output modes (WebLLM `response_format`) or as a prompt hint
   * (Claude). Providers without structured output can ignore it.
   */
  schema?: unknown
}

export interface LlmProvider {
  readonly providerName: string
  isReady(): boolean
  initialize(onProgress?: (progress: number, status: string) => void): Promise<void>
  /** Run the model and return its raw text response (expected to contain the annotations JSON). */
  complete(request: CompletionRequest): Promise<string>
  dispose(): void
}
