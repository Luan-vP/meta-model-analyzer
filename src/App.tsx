import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from './hooks/useSettings'
import { useLLMProvider } from './hooks/useLLMProvider'
import { useIterations } from './hooks/useIterations'
import { SettingsPanel } from './components/SettingsPanel'
import { IterationCard } from './components/IterationCard'
import { ResearchQuestionsContent } from './components/ResearchQuestions'
import { TarotContent } from './components/TarotDraw'
import { D20Content } from './components/D20'
import { TimerContent } from './components/Timer'
import { DockSystem, type DockItemConfig } from './components/DockSystem'
import { DebugConsole } from './components/DebugConsole'
import { AVAILABLE_WEBLLM_MODELS } from './services/webllm-service'

const VISIBLE_COUNT = 2

export default function App() {
  const {
    apiKey, setApiKey,
    provider, setProvider,
    webllmModel, setWebllmModel,
    ollamaUrl, setOllamaUrl,
    ollamaModel, setOllamaModel,
    probeWebllmModel, probing, probeResult,
    debugMode, setDebugMode,
  } = useSettings()
  const { service, ready, loading, progress, error: providerError, cancelLoading } = useLLMProvider(provider, apiKey, webllmModel, ollamaUrl, ollamaModel)
  const { iterations, analyze, setText } = useIterations(service)

  const visible = iterations.slice(-VISIBLE_COUNT)

  // Auto-probe on first WebLLM use: if the user is on WebLLM with no model
  // chosen yet, pick a device-safe default rather than leaving them to load a
  // model that may be too large for their hardware. The ref guards against the
  // probe re-firing while it runs (and StrictMode's double-invoke).
  const autoProbeRef = useRef(false)
  useEffect(() => {
    if (provider === 'webllm' && !webllmModel && !probing && !autoProbeRef.current) {
      autoProbeRef.current = true
      probeWebllmModel()
    }
    // Reset the guard once a model is set or the user leaves WebLLM, so a later
    // first-use (e.g. after clearing the model) probes again.
    if (provider !== 'webllm' || webllmModel) {
      autoProbeRef.current = false
    }
  }, [provider, webllmModel, probing, probeWebllmModel])

  const handleCancelLoading = useCallback(() => {
    cancelLoading()
    setWebllmModel('')
  }, [cancelLoading, setWebllmModel])

  const handleSwitchToWebLLM = useCallback(() => {
    setProvider('webllm')
    if (!webllmModel) probeWebllmModel()
  }, [setProvider, webllmModel, probeWebllmModel])

  // Dock allocation: desktopDock controls which edge on ≥sm screens.
  // mobileOrder controls tab order in the bottom bar on <sm screens.
  // Changing desktopDock moves a tool without touching its component.
  const dockItems: DockItemConfig[] = [
    {
      id: 'settings',
      label: 'Settings',
      desktopDock: 'left',
      mobileOrder: 0,
      content: (
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
          ollamaUrl={ollamaUrl}
          onOllamaUrlChange={setOllamaUrl}
          ollamaModel={ollamaModel}
          onOllamaModelChange={setOllamaModel}
          onProbeHardware={probeWebllmModel}
          probing={probing}
          probeResult={probeResult}
          onCancelLoading={handleCancelLoading}
          debugMode={debugMode}
          onDebugModeChange={setDebugMode}
        />
      ),
    },
    {
      id: 'research',
      label: 'Research',
      desktopDock: 'right',
      mobileOrder: 1,
      content: <ResearchQuestionsContent />,
    },
    {
      id: 'tarot',
      label: 'Tarot',
      desktopDock: 'right',
      mobileOrder: 2,
      content: <TarotContent />,
    },
    {
      id: 'd20',
      label: 'D20',
      desktopDock: 'right',
      mobileOrder: 3,
      content: <D20Content />,
    },
    {
      id: 'timer',
      label: 'Timer',
      desktopDock: 'right',
      mobileOrder: 4,
      content: <TimerContent />,
    },
  ]

  return (
    <>
      <DockSystem items={dockItems} />

      {debugMode && <DebugConsole onClose={() => setDebugMode(false)} />}

      {/* pb-12 leaves room for the mobile bottom tab bar */}
      <div className="relative mx-auto min-h-screen max-w-3xl px-4 py-8 pb-12 sm:pb-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Iterative Journal</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Find gaps in your thinking, and iterate on your thoughts.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <motion.div layout className="flex flex-col gap-4">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map(it => (
                <IterationCard
                  key={it.n}
                  iteration={it}
                  onTextChange={setText}
                  onAnalyze={analyze}
                  providerReady={ready}
                  onSwitchToWebLLM={provider === 'claude' ? handleSwitchToWebLLM : undefined}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  )
}
