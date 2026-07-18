/**
 * OpenAI-compatible chat completion protocol types.
 *
 * Minimal subset of the OpenAI Chat Completions API spec, covering what's
 * needed for both synchronous and streaming completions. Compatible with
 * Ollama (`/v1/chat/completions`), LM Studio, LiteLLM, vLLM, and any
 * server implementing the OpenAI-compatible endpoint.
 */

// ── Roles ──────────────────────────────────────────────────────────────────

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

// ── Messages ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: ChatRole
  content: string | null
  /** Populated when role === 'tool'. Identifies which tool call produced this result. */
  tool_call_id?: string
  /** Populated when role === 'assistant' and the model invoked tools. */
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON-encoded
  }
}

// ── Request ────────────────────────────────────────────────────────────────

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
  /** JSON schema for structured output (provider-dependent support). */
  response_format?: {
    type: 'json_schema'
    json_schema: {
      name: string
      schema: Record<string, unknown>
    }
  }
  /** Ollama-specific: raw JSON mode (shorthand for response_format). */
  format?: 'json'
  /** Ollama-specific: disable thinking/reasoning tokens. */
  think?: boolean
  /** Arbitrary provider-specific options (e.g. Ollama `options` bag). */
  options?: Record<string, unknown>
}

// ── Response (non-streaming) ──────────────────────────────────────────────

export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage?: CompletionUsage
}

export interface ChatCompletionChoice {
  index: number
  message: ChatMessage
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
}

export interface CompletionUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

// ── Response (streaming) ──────────────────────────────────────────────────

export interface ChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: ChatCompletionChunkChoice[]
}

export interface ChatCompletionChunkChoice {
  index: number
  delta: {
    role?: ChatRole
    content?: string
    tool_calls?: ToolCall[]
  }
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse a Server-Sent Events (SSE) stream into individual JSON chunks.
 * Handles the `data: ...` framing used by OpenAI-compatible servers.
 */
export async function* parseSSEStream(
  readable: ReadableStream<Uint8Array>,
): AsyncIterableIterator<ChatCompletionChunk> {
  const decoder = new TextDecoder()
  let buffer = ''

  const reader = readable.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete lines from the buffer
      const lines = buffer.split('\n')
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data === '[DONE]') return // Stream complete

          try {
            yield JSON.parse(data) as ChatCompletionChunk
          } catch {
            // Skip malformed SSE frames
          }
        }
      }
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6)
        if (data !== '[DONE]') {
          try {
            yield JSON.parse(data) as ChatCompletionChunk
          } catch {
            // Skip malformed final frame
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
