import './lib/randomUUIDPolyfill'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { installConsoleCapture } from './services/debug-log'

// Mirror console output into the in-app debug buffer so logs are visible on
// devices without a reachable DevTools console (mobile). Cheap; the buffer is
// only surfaced when Debug mode is enabled in Settings.
installConsoleCapture()

const BenchmarkRunner = lazy(() =>
  import('./benchmark/BenchmarkRunner').then((m) => ({ default: m.BenchmarkRunner })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/benchmark"
          element={
            <Suspense fallback={<div className="p-8 text-zinc-500">Loading benchmark...</div>}>
              <BenchmarkRunner />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
    <PwaUpdatePrompt />
  </StrictMode>,
)
