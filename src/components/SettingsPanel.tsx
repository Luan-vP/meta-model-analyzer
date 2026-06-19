import type { ProviderType } from '../types/llm'
import type { ProbeResult } from '../services/device-probe'

interface WebLLMModelOption {
  id: string
  label: string
  size: string
}

interface SettingsPanelProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  provider: ProviderType
  onProviderChange: (provider: ProviderType) => void
  providerReady: boolean
  providerLoading: boolean
  providerProgress: { value: number; status: string }
  providerError: string | null
  webllmModel: string
  onWebllmModelChange: (id: string) => void
  webllmModels: WebLLMModelOption[]
  ollamaUrl: string
  onOllamaUrlChange: (url: string) => void
  ollamaModel: string
  onOllamaModelChange: (model: string) => void
  onProbeHardware: () => void
  probing: boolean
  probeResult: ProbeResult | null
  onCancelLoading: () => void
}

export function SettingsPanel({
  apiKey,
  onApiKeyChange,
  provider,
  onProviderChange,
  providerReady,
  providerLoading,
  providerProgress,
  providerError,
  webllmModel,
  onWebllmModelChange,
  webllmModels,
  ollamaUrl,
  onOllamaUrlChange,
  ollamaModel,
  onOllamaModelChange,
  onProbeHardware,
  probing,
  probeResult,
  onCancelLoading,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-700">Provider</label>
        <div className="flex gap-1 rounded-md bg-zinc-200 p-0.5">
          <button
            onClick={() => onProviderChange('webllm')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              provider === 'webllm' ? 'bg-zinc-50 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Local (WebLLM)
          </button>
          <button
            onClick={() => onProviderChange('ollama')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              provider === 'ollama' ? 'bg-zinc-50 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Local (Ollama)
          </button>
          <button
            onClick={() => onProviderChange('claude')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              provider === 'claude' ? 'bg-zinc-50 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Claude
          </button>
        </div>
        {providerReady && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready
          </span>
        )}
      </div>

      {provider === 'claude' && (
        <div className="flex items-center gap-2">
          <label htmlFor="api-key" className="text-sm text-zinc-600">
            API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <span className="text-xs text-zinc-400">Stored locally only</span>
        </div>
      )}

      {provider === 'ollama' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="ollama-url" className="w-12 text-sm text-zinc-600">
              URL
            </label>
            <input
              id="ollama-url"
              type="text"
              value={ollamaUrl}
              onChange={(e) => onOllamaUrlChange(e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="ollama-model" className="w-12 text-sm text-zinc-600">
              Model
            </label>
            <input
              id="ollama-model"
              type="text"
              value={ollamaModel}
              onChange={(e) => onOllamaModelChange(e.target.value)}
              placeholder="llama3.1:8b"
              className="flex-1 rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <p className="text-xs text-zinc-500">
            Requires a local Ollama server. Browsers block requests from this site unless Ollama
            allows its origin: start Ollama with{' '}
            <code>OLLAMA_ORIGINS="{typeof window !== 'undefined' ? window.location.origin : ''}"</code>{' '}
            (or <code>"*"</code>) and restart it.
          </p>
        </div>
      )}

      {provider === 'webllm' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="webllm-model" className="text-sm text-zinc-600">
              Model
            </label>
            <select
              id="webllm-model"
              value={webllmModel}
              onChange={(e) => onWebllmModelChange(e.target.value)}
              disabled={providerLoading || probing}
              className="rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a model…</option>
              {webllmModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.size})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onProbeHardware}
              disabled={probing || providerLoading}
              className="rounded border border-indigo-300 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {probing ? 'Probing…' : 'Choose best model for my hardware'}
            </button>
          </div>

          {probeResult && <p className="text-xs text-zinc-500">Auto-picked: {probeResult.reason}</p>}

          {!webllmModel && !providerLoading && !probing && (
            <p className="text-xs text-zinc-500">Pick a model to load it, or let the probe choose one.</p>
          )}

          {providerLoading && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${Math.round(providerProgress.value * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={onCancelLoading}
                  className="rounded border border-red-300 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-zinc-500">{providerProgress.status}</p>
            </div>
          )}
        </>
      )}

      {providerError && <p className="text-sm text-red-600">{providerError}</p>}
    </div>
  )
}
