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
        temperature: 0.1,
        stream: false,
        format: 'json',
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
      throw new Error('No response from Ollama')
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
