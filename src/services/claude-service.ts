import Anthropic from '@anthropic-ai/sdk'
import type { LLMService } from '../types/llm'
import type { Annotation } from '../types/analysis'
import { SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, resolveOffsets, buildUserMessage } from './prompt'

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5'

export class ClaudeService implements LLMService {
  readonly providerName = 'Claude'
  private client: Anthropic | null = null
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isReady(): boolean {
    return this.apiKey.length > 0
  }

  async initialize(): Promise<void> {
    this.client = new Anthropic({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    })
  }

  async analyze(text: string): Promise<Annotation[]> {
    if (!this.client) {
      await this.initialize()
    }

    const response = await this.client!.messages.create(
      {
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserMessage(text) + '\n\nRespond with ONLY a JSON object matching this schema: ' + JSON.stringify(ANNOTATION_JSON_SCHEMA),
          },
        ],
      },
      {
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      },
    )

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from the response - it may be wrapped in markdown code blocks
    let jsonText = content.text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonText)
    const rawAnnotations = parsed.annotations ?? parsed

    // Validate against schema
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
    this.client = null
  }
}
