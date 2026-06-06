import type { LLMService } from '../types/llm'
import type { Annotation } from '../types/analysis'
import { SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, resolveOffsets, buildUserMessage, parseAnnotationsJSON } from './prompt'
import { ProxyFetchError } from './proxy-error'

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5'
const PROXY_URL = (import.meta.env.VITE_PROXY_URL as string | undefined) ?? 'http://localhost:8081'

export class ClaudeService implements LLMService {
  readonly providerName = 'Claude'

  isReady(): boolean {
    return true
  }

  async initialize(): Promise<void> {
    // No-op: proxy requires no client-side credentials
  }

  async analyze(text: string): Promise<Annotation[]> {
    let response: Response
    try {
      response = await fetch(`${PROXY_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: DEFAULT_CLAUDE_MODEL,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: buildUserMessage(text) + '\n\nRespond with ONLY a JSON object matching this schema: ' + JSON.stringify(ANNOTATION_JSON_SCHEMA),
            },
          ],
        }),
      })
    } catch (e) {
      throw new ProxyFetchError('network', 0, e instanceof Error ? e.message : 'Network error')
    }

    if (response.status === 429) {
      throw new ProxyFetchError('rate-limit', 429, 'Rate limit exceeded')
    }
    if (response.status === 402) {
      throw new ProxyFetchError('spend-cap', 402, 'Daily spend cap reached')
    }
    if (response.status === 401 || response.status === 403) {
      throw new ProxyFetchError('auth', response.status, 'Authentication failed')
    }
    if (!response.ok) {
      throw new ProxyFetchError('server-error', response.status, `Proxy returned ${response.status}`)
    }

    const json = await response.json() as { content?: Array<{ type: string; text?: string }> }
    const content = json.content?.[0]
    if (!content || content.type !== 'text' || !content.text) {
      throw new Error('Unexpected response type from Claude')
    }

    const parsed = parseAnnotationsJSON(content.text) as { annotations?: unknown }
    const rawAnnotations = parsed.annotations ?? parsed

    const validated = (Array.isArray(rawAnnotations) ? rawAnnotations : []).filter(
      (a: Record<string, unknown>) =>
        typeof a.text === 'string' &&
        typeof a.violationType === 'string' &&
        typeof a.category === 'string' &&
        typeof a.challengeQuestion === 'string' &&
        (ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.violationType.enum as readonly string[]).includes(a.violationType as string) &&
        (ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.category.enum as readonly string[]).includes(a.category as string),
    )

    return resolveOffsets(text, validated)
  }

  dispose(): void {
    // No-op
  }
}
