import type { LlmProvider, CompletionRequest } from '@core'

export const AVAILABLE_WEBLLM_MODELS = [
  { id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Default (Qwen3 0.6B)', size: '~0.4GB' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B', size: '~1.1GB' },
  { id: 'Qwen3-4B-q4f16_1-MLC', label: 'Qwen3 4B', size: '~2.5GB' },
  { id: 'Qwen3-8B-q4f16_1-MLC', label: 'Large (Qwen3 8B)', size: '~5GB' },
]

export const DEFAULT_WEBLLM_MODEL_ID = AVAILABLE_WEBLLM_MODELS[0].id

/**
 * Driven adapter: in-browser inference via WebLLM (WebGPU). Desktop-only —
 * needs a secure context and a web worker, so it is not shared with the
 * extension/Obsidian adapters.
 */
export class WebLLMService implements LlmProvider {
  readonly providerName = 'WebLLM (Local)'
  private engine: import('@mlc-ai/web-llm').MLCEngineInterface | null = null
  private worker: Worker | null = null
  private ready = false
  private modelId: string

  constructor(modelId?: string) {
    this.modelId = modelId ?? DEFAULT_WEBLLM_MODEL_ID
  }

  isReady(): boolean {
    return this.ready
  }

  async initialize(onProgress?: (progress: number, status: string) => void): Promise<void> {
    const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')

    const worker = new Worker(new URL('./webllm-worker.ts', import.meta.url), {
      type: 'module',
    })
    this.worker = worker

    this.engine = await CreateWebWorkerMLCEngine(worker, this.modelId, {
      initProgressCallback: (report) => {
        onProgress?.(report.progress, report.text)
      },
    })

    this.ready = true
  }

  async complete(request: CompletionRequest): Promise<string> {
    if (!this.engine) {
      throw new Error('WebLLM engine not initialized. Call initialize() first.')
    }

    const response = await this.engine.chat.completions.create({
      messages: [
        { role: 'system', content: request.system },
        // /no_think disables Qwen3's reasoning block so it streams JSON directly.
        { role: 'user', content: `${request.user} /no_think` },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: {
        type: 'json_object',
        schema: JSON.stringify(request.schema),
      } as { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from WebLLM')
    }
    return content
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    this.engine = null
    this.ready = false
  }
}
