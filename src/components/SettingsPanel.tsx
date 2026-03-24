import type { ProviderType } from '../types/llm'

interface SettingsPanelProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  provider: ProviderType
  onProviderChange: (provider: ProviderType) => void
  providerReady: boolean
  providerLoading: boolean
  providerProgress: { value: number; status: string }
  providerError: string | null
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
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-700">Provider</label>
        <div className="flex gap-1 rounded-md bg-zinc-200 p-0.5">
          <button
            onClick={() => onProviderChange('webllm')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              provider === 'webllm' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Local (WebLLM)
          </button>
          <button
            onClick={() => onProviderChange('claude')}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              provider === 'claude' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
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
            className="flex-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <span className="text-xs text-zinc-400">Stored locally only</span>
        </div>
      )}

      {provider === 'webllm' && providerLoading && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-300"
              style={{ width: `${Math.round(providerProgress.value * 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">{providerProgress.status}</p>
        </div>
      )}

      {providerError && <p className="text-sm text-red-600">{providerError}</p>}
    </div>
  )
}
