import { useSettings } from './hooks/useSettings'
import { useLLMProvider } from './hooks/useLLMProvider'
import { useAnalysis } from './hooks/useAnalysis'
import { SettingsPanel } from './components/SettingsPanel'
import { TextInput } from './components/TextInput'
import { AnnotatedText } from './components/AnnotatedText'
import { AVAILABLE_WEBLLM_MODELS } from './services/webllm-service'

export default function App() {
  const {
    apiKey,
    setApiKey,
    provider,
    setProvider,
    webllmModel,
    setWebllmModel,
    probeWebllmModel,
    probing,
    probeResult,
  } = useSettings()
  const { service, ready, loading, progress, error: providerError } = useLLMProvider(provider, apiKey, webllmModel)
  const { result, analyzing, error: analysisError, analyze } = useAnalysis(service)

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Meta-Model Analyzer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Detect linguistic patterns from Bandler & Grinder's Meta-Model. Hover underlined text for challenge questions.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <SettingsPanel
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          provider={provider}
          onProviderChange={setProvider}
          providerReady={ready}
          providerLoading={loading}
          providerProgress={progress}
          providerError={providerError}
          webllmModel={webllmModel}
          onWebllmModelChange={setWebllmModel}
          webllmModels={AVAILABLE_WEBLLM_MODELS}
          onProbeHardware={probeWebllmModel}
          probing={probing}
          probeResult={probeResult}
        />

        <TextInput onAnalyze={analyze} disabled={!ready} analyzing={analyzing} />

        {analysisError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{analysisError}</div>
        )}

        {result && <AnnotatedText result={result} />}
      </div>
    </div>
  )
}
