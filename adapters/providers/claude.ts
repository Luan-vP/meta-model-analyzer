import Anthropic from '@anthropic-ai/sdk'
import type { LlmProvider, CompletionRequest } from '@core'

// Smallest Claude model by default (see project preference).
export const DEFAULT_CLAUDE_MODEL = 'claude-haiku-4-5'

/**
 * Driven adapter: Claude via the Anthropic SDK (browser-capable).
 * Portable across desktop, extension, and Obsidian.
 */
export class ClaudeProvider implements LlmProvider {
  readonly providerName = 'Claude'
  private client: Anthropic | null = null
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = DEFAULT_CLAUDE_MODEL) {
    this.apiKey = apiKey
    this.model = model
  }

  isReady(): boolean {
    return this.apiKey.length > 0
  }

  async initialize(): Promise<void> {
    this.client = new Anthropic({ apiKey: this.apiKey, dangerouslyAllowBrowser: true })
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.client) await this.initialize()

    const userContent = request.schema
      ? `${request.user}\n\nRespond with ONLY a JSON object matching this schema: ${JSON.stringify(request.schema)}`
      : request.user

    const response = await this.client!.messages.create(
      {
        model: this.model,
        max_tokens: 4096,
        system: request.system,
        messages: [{ role: 'user', content: userContent }],
      },
      { headers: { 'anthropic-dangerous-direct-browser-access': 'true' } },
    )

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }
    return content.text
  }

  dispose(): void {
    this.client = null
  }
}
