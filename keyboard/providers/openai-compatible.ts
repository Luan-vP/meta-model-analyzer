import type { LlmProvider, CompletionRequest } from '@core'
import type { HttpClientConfig } from '../client/http-client'
import { OpenAiHttpClient } from '../client/http-client'

/**
 * Driven adapter: bridges the {@link LlmProvider} port to any OpenAI-compatible
 * chat completion server via {@link OpenAiHttpClient}.
 *
 * Compatible with Ollama (`/v1`), LM Studio, LiteLLM, vLLM, localai, etc.
 *
 * @example
 * ```ts
 * // Ollama (via /v1 compat endpoint)
 * const provider = new OpenAiCompatibleProvider({
 *   baseUrl: 'http://localhost:11434/v1',
 *   model: 'llama3.1:8b',
 * })
 *
 * // LM Studio
 * const provider = new OpenAiCompatibleProvider({
 *   baseUrl: 'http://127.0.0.1:1234/v1',
 *   model: 'local-model',
 * })
 * ```
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly providerName: string
  private readonly client: OpenAiHttpClient
  private readonly model: string
  private readonly defaultTemperature: number
  private readonly defaultMaxTokens: number | undefined
  private readonly useJsonSchema: boolean

  constructor(
    config: HttpClientConfig & {
      /** The model name to use for completions. */
      model: string
      /** Temperature. Defaults to 0.1 (deterministic). */
      temperature?: number
      /** Max tokens for the response. Undefined = server default. */
      maxTokens?: number
      /**
       * Use the OpenAI `response_format` JSON schema for structured output
       * when a schema is provided. Falls back to `format: "json"` if the
       * server doesn't support json_schema.
       * @default true
       */
      useJsonSchema?: boolean
    },
  ) {
    this.client = new OpenAiHttpClient(config)
    this.model = config.model
    this.defaultTemperature = config.temperature ?? 0.1
    this.defaultMaxTokens = config.maxTokens
    this.useJsonSchema = config.useJsonSchema ?? true
    this.providerName = `OpenAI-compatible (${config.baseUrl})`
  }

  isReady(): boolean {
    return this.client !== undefined && this.model.length > 0
  }

  /** Nothing to preload — connectivity is verified lazily on first call. */
  async initialize(): Promise<void> {}

  async complete(request: CompletionRequest): Promise<string> {
    const messages = [
      { role: 'system' as const, content: request.system },
      { role: 'user' as const, content: request.user },
    ]

    let responseFormat:
      | { type: 'json_schema'; json_schema: { name: string; schema: Record<string, unknown> } }
      | undefined

    if (request.schema && this.useJsonSchema) {
      responseFormat = {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          schema: request.schema as Record<string, unknown>,
        },
      }
    }

    const baseRequest: {
      model: string
      messages: Array<{ role: 'system' | 'user'; content: string }>
      temperature: number
      max_tokens?: number
      stream: boolean
      response_format?: { type: 'json_schema'; json_schema: { name: string; schema: Record<string, unknown> } }
      format?: 'json'
    } = {
      model: this.model,
      messages,
      temperature: this.defaultTemperature,
      max_tokens: this.defaultMaxTokens,
      stream: false,
    }

    if (responseFormat) {
      baseRequest.response_format = responseFormat
    } else {
      baseRequest.format = 'json'
    }

    const chatRequest = baseRequest

    const response = await this.client.chatCompletion(chatRequest)

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error(
        'Server returned an empty completion — the model may have hit a token limit or the request was rejected.',
      )
    }

    return content
  }

  dispose(): void {
    // Nothing to clean up
  }
}
