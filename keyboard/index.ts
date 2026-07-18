/**
 * @packageDocumentation
 *
 * Shared abstractions for the Meta-Model keyboard extension.
 *
 * This package provides:
 *
 * 1. **OpenAI-compatible chat protocol** ({@link protocol/openai}) — types for
 *    chat completion requests/responses, streaming support via SSE parsing.
 *
 * 2. **HTTP client** ({@link client/http-client}) — generic fetch-based client
 *    for any OpenAI-compatible server (Ollama `/v1`, LM Studio, LiteLLM, vLLM).
 *
 * 3. **LlmProvider adapter** ({@link providers/openai-compatible}) — bridges the
 *    {@link OpenAiHttpClient} to the existing {@link LlmProvider} port so the
 *    shared `analyzeText` use case from `@core` works out of the box.
 *
 * ## Architecture
 *
 * ```
 * keyboard/
 *   protocol/
 *     openai.ts                      # OpenAI chat API types + SSE parser
 *   client/
 *     http-client.ts                 # Generic fetch client for /v1/chat/completions
 *   providers/
 *     openai-compatible.ts           # LlmProvider adapter (bridges to @core)
 *   index.ts                         # Barrel (this file)
 * ```
 *
 * The keyboard platform layers (iOS InputKit, Android InputMethodService)
 * import from here and call `analyzeText(new OpenAiCompatibleProvider(...), text)`
 * to get annotations, then render them as spelling-suggestion underlines.
 */

// OpenAI-compatible protocol types
export type {
  ChatRole,
  ChatMessage,
  ToolCall,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChoice,
  CompletionUsage,
  ChatCompletionChunk,
  ChatCompletionChunkChoice,
} from './protocol/openai'
export { parseSSEStream } from './protocol/openai'

// HTTP client
export { OpenAiHttpClient, OpenAiHttpClientError } from './client/http-client'
export type { HttpClientConfig } from './client/http-client'

// LlmProvider adapter
export { OpenAiCompatibleProvider } from './providers/openai-compatible'
