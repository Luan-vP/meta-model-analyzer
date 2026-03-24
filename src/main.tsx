import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'

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
  </StrictMode>,
)
