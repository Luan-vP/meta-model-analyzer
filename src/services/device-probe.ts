import { AVAILABLE_WEBLLM_MODELS, DEFAULT_WEBLLM_MODEL_ID } from './webllm-service'

/**
 * Device-aware probe for picking a safe default WebLLM model.
 *
 * Rationale: the current default (`Qwen3-4B-q4f16_1-MLC`) needs ~2.5 GB of
 * weights plus runtime working set, so a low-VRAM device will hit a load
 * failure deep inside MLC. We try to pre-empt that by inspecting whatever
 * budget signal the browser exposes *before* the model loads, and downgrade
 * to the small 0.6B model if the signal looks tight.
 *
 * The probe is intentionally conservative: when a signal is ambiguous or
 * missing we prefer the existing 4B default rather than silently shrinking
 * on capable hardware.
 */

const SMALL_MODEL_ID = 'Qwen3-0.6B-q4f16_1-MLC'
const LARGE_DEFAULT_MODEL_ID = DEFAULT_WEBLLM_MODEL_ID

/**
 * `adapter.limits.maxBufferSize` is NOT total VRAM — it's the per-buffer
 * cap. WebGPU's spec default is 256 MB, and browsers typically scale the
 * reported limit with the underlying hardware: discrete GPUs advertise
 * multi-GB caps; integrated / phone GPUs report values in the hundreds of
 * MB. MLC splits weights across buffers so a 4B model can still run with a
 * modest cap, but adapters reporting under 1 GB are almost always paired
 * with little overall VRAM. We downgrade in that range.
 */
const MIN_MAX_BUFFER_FOR_4B = 1 * 1024 * 1024 * 1024 // 1 GB

/**
 * `performance.memory.jsHeapSizeLimit` is Chromium-only. On mobile Chrome it
 * typically caps around 512 MB; on desktop Chromium it sits at 2–4 GB. A
 * 1 GB cutoff separates mobile-tier heaps from desktop-tier ones without
 * false-flagging legitimate desktop devices. Weaker than the WebGPU signal.
 */
const MIN_JS_HEAP_FOR_4B = 1 * 1024 * 1024 * 1024 // 1 GB

/**
 * Regex for user-agent strings we treat as "probably memory-constrained"
 * when no programmatic signal is available.
 */
const MOBILE_UA_REGEX = /\b(Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini)\b/i

export interface ProbeResult {
  modelId: string
  reason: string
}

// Minimal structural types for the parts of the WebGPU API we touch.
// The project's TypeScript libs don't include @webgpu/types, so we avoid
// pulling it in just for a one-off probe and use these narrow shapes.
interface ProbeGPUAdapterInfo {
  vendor?: string
  architecture?: string
}

interface ProbeGPUAdapterLimits {
  maxBufferSize?: number
}

interface ProbeGPUAdapter {
  limits?: ProbeGPUAdapterLimits
  info?: ProbeGPUAdapterInfo
}

interface ProbeGPU {
  requestAdapter(): Promise<ProbeGPUAdapter | null>
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    jsHeapSizeLimit?: number
  }
}

function ensureKnownModelId(id: string): string {
  return AVAILABLE_WEBLLM_MODELS.some((m) => m.id === id) ? id : LARGE_DEFAULT_MODEL_ID
}

/**
 * Async probe. Returns the model id we would pick by default *if* the user
 * hasn't set one yet. Callers MUST still respect an explicit user selection
 * stored in localStorage.
 */
export async function pickDefaultWebLLMModel(): Promise<ProbeResult> {
  // 1. Preferred signal: WebGPU adapter limits.
  try {
    const gpu = (navigator as Navigator & { gpu?: ProbeGPU }).gpu
    if (gpu && typeof gpu.requestAdapter === 'function') {
      const adapter = await gpu.requestAdapter()
      if (adapter) {
        const maxBufferSize = adapter.limits?.maxBufferSize
        const info = adapter.info
        const vendor = info?.vendor ?? 'unknown'
        const architecture = info?.architecture ?? 'unknown'

        if (typeof maxBufferSize === 'number' && maxBufferSize > 0) {
          if (maxBufferSize < MIN_MAX_BUFFER_FOR_4B) {
            const result: ProbeResult = {
              modelId: SMALL_MODEL_ID,
              reason: `low VRAM: maxBufferSize=${maxBufferSize} bytes (<${MIN_MAX_BUFFER_FOR_4B}); vendor=${vendor} arch=${architecture}`,
            }
            logPick(result)
            return result
          }

          const result: ProbeResult = {
            modelId: LARGE_DEFAULT_MODEL_ID,
            reason: `WebGPU OK: maxBufferSize=${maxBufferSize} bytes; vendor=${vendor} arch=${architecture}`,
          }
          logPick(result)
          return result
        }
      }
    }
  } catch (err) {
    // Never let a probe failure block startup.
    console.warn('[webllm] WebGPU probe failed; falling back to heuristics', err)
  }

  // 2. Fallback: JS heap size limit (Chromium-only, weak but non-zero signal).
  const perf = performance as PerformanceWithMemory
  const jsHeapLimit = perf.memory?.jsHeapSizeLimit
  if (typeof jsHeapLimit === 'number' && jsHeapLimit > 0) {
    if (jsHeapLimit < MIN_JS_HEAP_FOR_4B) {
      const result: ProbeResult = {
        modelId: SMALL_MODEL_ID,
        reason: `no WebGPU signal; low JS heap: jsHeapSizeLimit=${jsHeapLimit} bytes (<${MIN_JS_HEAP_FOR_4B})`,
      }
      logPick(result)
      return result
    }
    const result: ProbeResult = {
      modelId: LARGE_DEFAULT_MODEL_ID,
      reason: `no WebGPU signal; JS heap OK: jsHeapSizeLimit=${jsHeapLimit} bytes`,
    }
    logPick(result)
    return result
  }

  // 3. Last-resort: user-agent sniff for known-constrained platforms.
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent ?? '') : ''
  if (ua && MOBILE_UA_REGEX.test(ua)) {
    const result: ProbeResult = {
      modelId: SMALL_MODEL_ID,
      reason: `no memory signal; mobile UA matched: ${ua}`,
    }
    logPick(result)
    return result
  }

  // No signal at all -> stick with the configured default.
  const result: ProbeResult = {
    modelId: ensureKnownModelId(LARGE_DEFAULT_MODEL_ID),
    reason: 'no memory signal; defaulting to configured default',
  }
  logPick(result)
  return result
}

function logPick(result: ProbeResult): void {
  console.log(`[webllm] picked ${result.modelId} (${result.reason})`)
}
