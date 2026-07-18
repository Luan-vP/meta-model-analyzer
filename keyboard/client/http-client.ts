import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
} from '../protocol/openai'
import { parseSSEStream } from '../protocol/openai'

/**
 * Configuration for the OpenAI-compatible HTTP client.
 */
export interface HttpClientConfig {
  /** Base URL of the server (e.g. `http://localhost:11434/v1`). */
  baseUrl: string
  /** API key header value. Optional for local servers. */
  apiKey?: string
  /** Request timeout in milliseconds. Defaults to 120_000 (2 min). */
  timeout?: number
  /** Custom fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch
}

const DEFAULT_TIMEOUT_MS = 120_000

/**
 * Generic HTTP client for any OpenAI-compatible chat completion endpoint.
 *
 * Works with Ollama (`/v1/chat/completions`), LM Studio, LiteLLM, vLLM,
 * localai, and any server implementing the OpenAI API spec.
 */
export class OpenAiHttpClient {
  private readonly baseUrl: string
  private readonly apiKey: string | undefined
  private readonly timeout: number
  private readonly fetchFn: typeof fetch

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.apiKey = config.apiKey
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS
    this.fetchFn = config.fetch ?? globalThis.fetch
  }

  /**
   * Perform a synchronous (non-streaming) chat completion request.
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.request({ ...request, stream: false })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new OpenAiHttpClientError(
        `HTTP ${response.status}: ${body || 'No error body'}`,
        response.status,
      )
    }

    return (await response.json()) as ChatCompletionResponse
  }

  /**
   * Perform a streaming chat completion request. Yields each chunk as it arrives.
   */
  async *chatCompletionStream(
    request: ChatCompletionRequest,
  ): AsyncIterableIterator<ChatCompletionChunk> {
    const response = await this.request({ ...request, stream: true })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new OpenAiHttpClientError(
        `HTTP ${response.status}: ${body || 'No error body'}`,
        response.status,
      )
    }

    if (!response.body) {
      throw new OpenAiHttpClientError('Response body is null — streaming not supported', 500)
    }

    yield* parseSSEStream(response.body)
  }

  /**
   * Check server connectivity with a minimal request.
   * Returns true if the server responds with a valid HTTP status (any 2xx or informative error).
   * Returns false on network-level failures (DNS, connection refused, timeout).
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.request({
        model: '',
        messages: [{ role: 'user', content: '' }],
        max_tokens: 1,
        stream: false,
      })
      // Any HTTP response (even 4xx/5xx) means the server is reachable
      return response.status < 500 || response.status === 404 || response.status === 400
    } catch {
      return false
    }
  }

  private async request(request: ChatCompletionRequest): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      return await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Error thrown by {@link OpenAiHttpClient} for HTTP-level failures.
 */
export class OpenAiHttpClientError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'OpenAiHttpClientError'
  }
}
