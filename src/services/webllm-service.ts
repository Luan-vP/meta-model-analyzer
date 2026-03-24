import type { LLMService } from '../types/llm'
import type { Annotation } from '../types/analysis'
import { SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, resolveOffsets, buildUserMessage } from './prompt'

const MODEL_ID = 'Qwen3-4B-q4f16_1-MLC'

export class WebLLMService implements LLMService {
  readonly providerName = 'WebLLM (Local)'
  private engine: import('@mlc-ai/web-llm').MLCEngineInterface | null = null
  private ready = false

  isReady(): boolean {
    return this.ready
  }

  async initialize(onProgress?: (progress: number, status: string) => void): Promise<void> {
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')

    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), {
      type: 'module',
    })

    this.engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress?.(report.progress, report.text)
      },
    })

    this.ready = true
  }

  async analyze(text: string): Promise<Annotation[]> {
    if (!this.engine) {
      throw new Error('WebLLM engine not initialized. Call initialize() first.')
    }

    const response = await this.engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(text) },
      ],
      temperature: 0.1,
      response_format: {
        type: 'json_object',
        schema: JSON.stringify(ANNOTATION_JSON_SCHEMA),
      } as { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from WebLLM')
    }

    const parsed = JSON.parse(content)
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

  dispose(): void {
    this.engine = null
    this.ready = false
  }
}
