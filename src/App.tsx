import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from './hooks/useSettings'
import { useLLMProvider } from './hooks/useLLMProvider'
import { useIterations } from './hooks/useIterations'
import { SettingsPanel } from './components/SettingsPanel'
import { IterationCard } from './components/IterationCard'
import { ResearchQuestions } from './components/ResearchQuestions'
import { AVAILABLE_WEBLLM_MODELS } from './services/webllm-service'

const VISIBLE_COUNT = 2

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
  const { iterations, analyze, setText } = useIterations(service)

  const visible = iterations.slice(-VISIBLE_COUNT)

  return (
    <div className="relative mx-auto min-h-screen max-w-3xl px-4 py-8">
      <ResearchQuestions />
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

        <motion.div layout className="flex flex-col gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((it) => (
              <IterationCard
                key={it.n}
                iteration={it}
                onTextChange={setText}
                onAnalyze={analyze}
                providerReady={ready}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
