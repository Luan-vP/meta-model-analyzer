import type { LlmProvider, CompletionRequest } from '@core'

export const AVAILABLE_WEBLLM_MODELS = [
  { id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Default (Qwen3 0.6B)', size: '~0.4GB' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B', size: '~1.1GB' },
  { id: 'Qwen3-4B-q4f16_1-MLC', label: 'Qwen3 4B', size: '~2.5GB' },
  { id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', label: 'Large (Llama 3.1 8B)', size: '~5GB' },
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

    // /no_think disables Qwen3's reasoning block so it streams JSON directly.
    // It's a Qwen-only control token, so only append it for Qwen3 models —
    // other models (e.g. Llama 3.1) would treat it as literal prompt text.
    const isQwen3 = this.modelId.startsWith('Qwen3-')
    const userContent = isQwen3 ? `${request.user} /no_think` : request.user

    console.log(
      `[webllm] generating with ${this.modelId}: system=${request.system.length} chars, user=${userContent.length} chars`,
    )

    try {
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: userContent },
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
        throw new Error('No response from WebLLM (empty completion)')
      }
      console.log(`[webllm] generation OK: ${content.length} chars returned`)
      return content
    } catch (e) {
      // Re-throw with the model id attached so the surfaced message names the
      // model that failed. The raw error is also logged for the debug console.
      console.error(`[webllm] generation failed on ${this.modelId}:`, e)
      const detail = e instanceof Error ? e.message : String(e)
      throw new Error(`WebLLM generation failed (${this.modelId}): ${detail}`)
    }
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    this.engine = null
    this.ready = false
  }
}
