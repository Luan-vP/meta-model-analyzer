import type { LLMService } from '../types/llm'
import type { Annotation } from '../types/analysis'
import {
  SYSTEM_PROMPT,
  ANNOTATION_JSON_SCHEMA,
  resolveOffsets,
  buildUserMessage,
  parseAnnotationsJSON,
} from './prompt'

// TODO(gcp): set VITE_PROXY_URL in Cloud Build / Cloud Run env to the deployed proxy URL (issue #24)
const PROXY_URL = (import.meta.env.VITE_PROXY_URL as string | undefined) ?? 'http://localhost:8080'
const DEFAULT_MODEL = 'claude-sonnet-4-5'

export class RateLimitError extends Error {
  readonly type = 'rate_limit' as const
  constructor(retryAfterSeconds?: number) {
    super(
      retryAfterSeconds
        ? `Rate limit reached — try again in ${retryAfterSeconds}s.`
        : 'Rate limit reached. Please wait a moment and try again.',
    )
  }
}

export class SpendCapError extends Error {
  readonly type = 'spend_cap' as const
  constructor() {
    super('Daily usage limit reached. Please try again tomorrow.')
  }
}

export class ClaudeService implements LLMService {
  readonly providerName = 'Claude'

  isReady(): boolean {
    return true
  }

  async initialize(): Promise<void> {}

  async analyze(text: string): Promise<Annotation[]> {
    const body = {
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            buildUserMessage(text) +
            '\n\nRespond with ONLY a JSON object matching this schema: ' +
            JSON.stringify(ANNOTATION_JSON_SCHEMA),
        },
      ],
    }

    const res = await fetch(`${PROXY_URL}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number }
      throw new RateLimitError(data.retryAfterSeconds)
    }
    if (res.status === 402) {
      throw new SpendCapError()
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? `Proxy error ${res.status}`)
    }

    const response = (await res.json()) as { content: Array<{ type: string; text: string }> }
    const content = response.content[0]
    if (content?.type !== 'text') {
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
        (
          ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.violationType
            .enum as readonly string[]
        ).includes(a.violationType as string) &&
        (
          ANNOTATION_JSON_SCHEMA.properties.annotations.items.properties.category
            .enum as readonly string[]
        ).includes(a.category as string),
    )

    return resolveOffsets(text, validated)
  }

  dispose(): void {}
}
