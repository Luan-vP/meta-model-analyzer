import type { LlmProvider, CompletionRequest } from '@core'

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b'

// The system prompt is ~1.4k tokens; input text and the JSON result share the
// rest of this window. At 4096 a longer document would exhaust the budget mid
// output, and because annotations are emitted in order of appearance only the
// start of the text got covered. 8192 leaves comfortable room for the tail.
// The KV cache is larger, but the OOM risk that motivated a smaller window was
// specific to much bigger models sharing the GPU with a browser; the small
// models used here run fine at this size.
export const DEFAULT_OLLAMA_NUM_CTX = 8192

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
          options: { temperature: 0.1, num_ctx: DEFAULT_OLLAMA_NUM_CTX },
        }),
      })
    } catch (e) {
      // A CORS-blocked preflight and a dead server both reject fetch() with a
      // TypeError, so we can't tell them apart here. From a hosted origin the
      // common cause is Ollama's CORS allow-list, so point at OLLAMA_ORIGINS.
      const origin = (globalThis as { location?: { origin?: string } }).location?.origin
      const originHint = origin ? `"${origin}"` : "this app's origin"
      throw new Error(
        `Couldn't reach Ollama at ${this.baseUrl}. Either it isn't running, or it's blocking ` +
          `this origin (CORS). If it's running, start Ollama with OLLAMA_ORIGINS=${originHint} ` +
          `(or "*") and restart it. (${e instanceof Error ? e.message : String(e)})`,
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
