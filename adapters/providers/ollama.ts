import type { LlmProvider, CompletionRequest } from '@core'

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'

/**
 * Driven adapter: a local Ollama server via its /api/chat endpoint.
 * Pure fetch — portable across desktop, extension, and Obsidian (Electron).
 * Mirrors the request shape the browser extension uses.
 */
export class OllamaProvider implements LlmProvider {
  readonly providerName = 'Ollama (Local)'
  private readonly baseUrl: string
  private readonly model: string

  constructor(baseUrl: string = DEFAULT_OLLAMA_URL, model: string = DEFAULT_OLLAMA_MODEL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.model = model || DEFAULT_OLLAMA_MODEL
  }

  isReady(): boolean {
    return this.baseUrl.length > 0 && this.model.length > 0
  }

  // Nothing to preload; connectivity is verified on the first complete() call.
  async initialize(): Promise<void> {}

  async complete(request: CompletionRequest): Promise<string> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
          think: false,
          stream: false,
          format: 'json',
          options: { temperature: 0.1, num_ctx: 8192 },
        }),
      })
    } catch (e) {
      throw new Error(
        `Could not reach Ollama at ${this.baseUrl}. Is it running? (${e instanceof Error ? e.message : String(e)})`,
      )
    }

    if (response.status === 403) {
      throw new Error(
        `Ollama refused the request (403). Allow this app's origin by setting OLLAMA_ORIGINS, then restart Ollama.`,
      )
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Ollama API error (${response.status}): ${body}`)
    }

    const data = (await response.json()) as { message?: { content?: string } }
    const content = data.message?.content
    if (!content) {
      throw new Error(
        `Ollama returned an empty response — the model may have run out of memory or the context is too large. Try a smaller model or restart Ollama.`,
      )
    }
    return content
  }

  dispose(): void {}
}
