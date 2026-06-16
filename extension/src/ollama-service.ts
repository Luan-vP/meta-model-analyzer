// Explicit `.js` extension required for in-browser ES module resolution
// (this file is imported by the module service worker). See background.ts.
import { SYSTEM_PROMPT, buildUserMessage, resolveOffsets } from './prompt.js'
import type { Annotation } from './types'

export class OllamaService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  async analyze(text: string, modelName: string): Promise<Annotation[]> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(text) },
        ],
        // `temperature` must live under `options` — Ollama ignores it at the top
        // level. `think: false` keeps reasoning-capable models from spending the
        // whole response in a (discarded) thinking phase and returning empty
        // content. Both are no-ops for models that don't support them.
        think: false,
        stream: false,
        format: 'json',
        // Cap the context window. Ollama otherwise loads the model at its full
        // native context (e.g. 131K for llama3.1:8b → ~21GB of KV cache), which
        // OOMs the GPU mid-decode and wedges the backend so every later request
        // returns empty. We only ever analyze a short passage, so 8K is ample
        // and keeps the model footprint small (~5.7GB for llama3.1:8b).
        options: { temperature: 0.1, num_ctx: 8192 },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      // 403 = Ollama rejected the request origin. The extension's requests carry
      // an `Origin: chrome-extension://…` header, which Ollama's default origin
      // allowlist blocks. Surface the actionable fix instead of a generic error.
      if (response.status === 403) {
        throw new Error(
          'Ollama refused the request origin (403). Start Ollama with ' +
            'OLLAMA_ORIGINS="chrome-extension://*" (or "*") so the extension can connect.',
        )
      }
      throw new Error(`Ollama API error (${response.status}): ${errorBody || 'Check that Ollama is running.'}`)
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      // A 200 with empty content means Ollama accepted the request but the model
      // produced nothing. The usual cause is the runner failing mid-generation —
      // e.g. an out-of-memory crash from too large a model/context, which also
      // wedges the backend so every later request returns empty until Ollama is
      // restarted. Point at that rather than a dead-end "no response".
      throw new Error(
        'Ollama returned an empty response. The model likely failed to generate — ' +
          'try a smaller model (e.g. llama3.1:8b) or reduce its context size, and ' +
          'restart Ollama if every request keeps coming back empty.',
      )
    }

    // Extract JSON — Ollama may wrap it in markdown
    let jsonText = content.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonText)
    const rawAnnotations = parsed.annotations ?? parsed

    const validated = (Array.isArray(rawAnnotations) ? rawAnnotations : []).filter(
      (a: Record<string, unknown>) =>
        typeof a.text === 'string' &&
        typeof a.violationType === 'string' &&
        typeof a.category === 'string' &&
        typeof a.challengeQuestion === 'string',
    )

    return resolveOffsets(text, validated)
  }
}
