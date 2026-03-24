import { useState, useCallback } from 'react'
import { BENCHMARK_DATASET, type BenchmarkEntry, type ExpectedViolation } from '../data/benchmark-dataset'
import { SYSTEM_PROMPT, ANNOTATION_JSON_SCHEMA, resolveOffsets, buildUserMessage } from '../services/prompt'
import type { Annotation } from '../types/analysis'

// Available Qwen3 models in WebLLM registry
const AVAILABLE_MODELS = [
  { id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Qwen3 0.6B (q4f16)', size: '~0.4GB' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B (q4f16)', size: '~1.1GB' },
  { id: 'Qwen3-4B-q4f16_1-MLC', label: 'Qwen3 4B (q4f16)', size: '~2.5GB' },
  { id: 'Qwen3-8B-q4f16_1-MLC', label: 'Qwen3 8B (q4f16)', size: '~5GB' },
]

interface EntryResult {
  id: string
  description: string
  input: string
  expected: ExpectedViolation[]
  detected: Annotation[]
  typeMatches: number
  categoryMatches: number
  typeExpected: number
  falsePositives: number
  falseNegatives: number
  latencyMs: number
  status: 'PASS' | 'PARTIAL' | 'FAIL'
}

interface BenchmarkSummary {
  model: string
  totalEntries: number
  typeAccuracy: number
  categoryAccuracy: number
  falsePositives: number
  falseNegatives: number
  cleanTextAccuracy: number
  perfectEntryRate: number
  avgLatencyMs: number
  results: EntryResult[]
}

function scoreEntry(entry: BenchmarkEntry, detected: Annotation[]) {
  let typeMatches = 0
  let categoryMatches = 0
  const matchedDetected = new Set<number>()

  for (const exp of entry.expectedViolations) {
    const matchIdx = detected.findIndex((d, i) => {
      if (matchedDetected.has(i)) return false
      return (
        d.text.toLowerCase().includes(exp.textMatch.toLowerCase()) ||
        exp.textMatch.toLowerCase().includes(d.text.toLowerCase())
      )
    })

    if (matchIdx !== -1) {
      matchedDetected.add(matchIdx)
      const d = detected[matchIdx]
      if (d.category === exp.category) categoryMatches++
      if (d.violationType === exp.violationType) typeMatches++
    }
  }

  const falsePositives = detected.length - matchedDetected.size
  const falseNegatives = entry.expectedViolations.length - matchedDetected.size
  const status: 'PASS' | 'PARTIAL' | 'FAIL' =
    falsePositives === 0 && falseNegatives === 0 && typeMatches === entry.expectedViolations.length
      ? 'PASS'
      : typeMatches > 0 || (entry.expectedViolations.length === 0 && falsePositives === 0)
        ? 'PARTIAL'
        : 'FAIL'

  return { typeMatches, categoryMatches, typeExpected: entry.expectedViolations.length, falsePositives, falseNegatives, status }
}

export function BenchmarkRunner() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[2].id)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null)
  const [allSummaries, setAllSummaries] = useState<BenchmarkSummary[]>([])

  const runBenchmark = useCallback(async () => {
    setRunning(true)
    setSummary(null)
    setProgress({ current: 0, total: BENCHMARK_DATASET.length, status: 'Loading model...' })

    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
      const worker = new Worker(new URL('../services/webllm-worker.ts', import.meta.url), { type: 'module' })
      const engine = await CreateWebWorkerMLCEngine(worker, selectedModel, {
        initProgressCallback: (report) => {
          setProgress((p) => ({ ...p, status: report.text }))
        },
      })

      const results: EntryResult[] = []

      for (let i = 0; i < BENCHMARK_DATASET.length; i++) {
        const entry = BENCHMARK_DATASET[i]
        setProgress({ current: i + 1, total: BENCHMARK_DATASET.length, status: `[${entry.id}] ${entry.description}` })

        const start = performance.now()

        try {
          const response = await engine.chat.completions.create({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserMessage(entry.input) },
            ],
            temperature: 0.1,
            response_format: {
              type: 'json_object',
              schema: JSON.stringify(ANNOTATION_JSON_SCHEMA),
            } as { type: 'json_object' },
          })

          const latencyMs = performance.now() - start
          const content = response.choices[0]?.message?.content ?? '{}'
          const parsed = JSON.parse(content)
          const rawAnnotations = parsed.annotations ?? parsed
          const validated = (Array.isArray(rawAnnotations) ? rawAnnotations : []).filter(
            (a: Record<string, unknown>) =>
              typeof a.text === 'string' &&
              typeof a.violationType === 'string' &&
              typeof a.category === 'string' &&
              typeof a.challengeQuestion === 'string',
          )
          const annotations = resolveOffsets(entry.input, validated)
          const scored = scoreEntry(entry, annotations)

          results.push({
            id: entry.id,
            description: entry.description,
            input: entry.input,
            expected: entry.expectedViolations,
            detected: annotations,
            ...scored,
            latencyMs,
          })
        } catch (e) {
          const latencyMs = performance.now() - start
          results.push({
            id: entry.id,
            description: entry.description,
            input: entry.input,
            expected: entry.expectedViolations,
            detected: [],
            typeMatches: 0,
            categoryMatches: 0,
            typeExpected: entry.expectedViolations.length,
            falsePositives: 0,
            falseNegatives: entry.expectedViolations.length,
            latencyMs,
            status: 'FAIL',
          })
        }
      }

      const totalExpected = results.reduce((s, r) => s + r.typeExpected, 0)
      const totalTypeMatches = results.reduce((s, r) => s + r.typeMatches, 0)
      const totalCatMatches = results.reduce((s, r) => s + r.categoryMatches, 0)
      const totalFP = results.reduce((s, r) => s + r.falsePositives, 0)
      const totalFN = results.reduce((s, r) => s + r.falseNegatives, 0)
      const cleanEntries = results.filter((r) => r.typeExpected === 0)
      const cleanCorrect = cleanEntries.filter((r) => r.detected.length === 0).length
      const violationEntries = results.filter((r) => r.typeExpected > 0)
      const perfectEntries = violationEntries.filter((r) => r.typeMatches === r.typeExpected && r.falsePositives === 0).length

      const s: BenchmarkSummary = {
        model: selectedModel,
        totalEntries: BENCHMARK_DATASET.length,
        typeAccuracy: totalExpected > 0 ? totalTypeMatches / totalExpected : 1,
        categoryAccuracy: totalExpected > 0 ? totalCatMatches / totalExpected : 1,
        falsePositives: totalFP,
        falseNegatives: totalFN,
        cleanTextAccuracy: cleanEntries.length > 0 ? cleanCorrect / cleanEntries.length : 1,
        perfectEntryRate: violationEntries.length > 0 ? perfectEntries / violationEntries.length : 1,
        avgLatencyMs: results.reduce((s, r) => s + r.latencyMs, 0) / results.length,
        results,
      }

      setSummary(s)
      setAllSummaries((prev) => [...prev.filter((p) => p.model !== selectedModel), s])
      engine.unload()
    } catch (e) {
      setProgress((p) => ({ ...p, status: `Error: ${e instanceof Error ? e.message : e}` }))
    } finally {
      setRunning(false)
    }
  }, [selectedModel])

  const downloadResults = useCallback(() => {
    if (!summary) return
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark-${summary.model}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [summary])

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Benchmark Runner</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Test Meta-Model violation detection accuracy across different Qwen3 models.
          Dataset: {BENCHMARK_DATASET.length} entries ({BENCHMARK_DATASET.filter((e) => e.expectedViolations.length === 0).length} clean,{' '}
          {BENCHMARK_DATASET.filter((e) => e.expectedViolations.length > 0).length} with violations).
        </p>
      </header>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-zinc-700">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={running}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.size})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={runBenchmark}
          disabled={running}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          {running ? 'Running...' : 'Run Benchmark'}
        </button>
        {summary && (
          <button onClick={downloadResults} className="text-sm text-indigo-600 hover:text-indigo-800">
            Download JSON
          </button>
        )}
      </div>

      {/* Progress */}
      {running && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-2 flex justify-between text-sm text-zinc-600">
            <span>
              {progress.current}/{progress.total}
            </span>
            <span>{progress.status}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Comparison table */}
      {allSummaries.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-700">Model</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">Type Acc.</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">Cat. Acc.</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">Clean Acc.</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">Perfect</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">FP</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">FN</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {allSummaries
                .sort((a, b) => b.typeAccuracy - a.typeAccuracy)
                .map((s) => (
                  <tr key={s.model} className={s.model === summary?.model ? 'bg-indigo-50' : 'bg-white'}>
                    <td className="px-4 py-2 font-mono text-xs">{s.model}</td>
                    <td className="px-4 py-2 text-right font-semibold">{pct(s.typeAccuracy)}</td>
                    <td className="px-4 py-2 text-right">{pct(s.categoryAccuracy)}</td>
                    <td className="px-4 py-2 text-right">{pct(s.cleanTextAccuracy)}</td>
                    <td className="px-4 py-2 text-right">{pct(s.perfectEntryRate)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{s.falsePositives}</td>
                    <td className="px-4 py-2 text-right text-amber-600">{s.falseNegatives}</td>
                    <td className="px-4 py-2 text-right">{Math.round(s.avgLatencyMs)}ms</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed results */}
      {summary && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-800">
            Detailed Results — {summary.model}
          </h2>
          {summary.results.map((r) => (
            <details
              key={r.id}
              className={`rounded-lg border p-3 ${
                r.status === 'PASS'
                  ? 'border-emerald-200 bg-emerald-50'
                  : r.status === 'PARTIAL'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${
                      r.status === 'PASS'
                        ? 'bg-emerald-200 text-emerald-800'
                        : r.status === 'PARTIAL'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">{r.id}</span>
                  <span className="text-zinc-700">{r.description}</span>
                </span>
                <span className="text-xs text-zinc-500">
                  type: {r.typeMatches}/{r.typeExpected} | FP: {r.falsePositives} | FN: {r.falseNegatives} |{' '}
                  {Math.round(r.latencyMs)}ms
                </span>
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <span className="font-medium text-zinc-600">Input:</span>{' '}
                  <span className="text-zinc-800">"{r.input}"</span>
                </div>
                {r.expected.length > 0 && (
                  <div>
                    <span className="font-medium text-zinc-600">Expected:</span>
                    <ul className="ml-4 list-disc">
                      {r.expected.map((e, i) => (
                        <li key={i}>
                          "{e.textMatch}" → <span className="font-mono">{e.violationType}</span> ({e.category})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <span className="font-medium text-zinc-600">Detected ({r.detected.length}):</span>
                  {r.detected.length === 0 ? (
                    <span className="ml-1 italic text-zinc-400">none</span>
                  ) : (
                    <ul className="ml-4 list-disc">
                      {r.detected.map((d, i) => (
                        <li key={i}>
                          "{d.text}" → <span className="font-mono">{d.violationType}</span> ({d.category})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
