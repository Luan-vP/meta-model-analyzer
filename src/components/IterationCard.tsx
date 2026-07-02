import { motion } from 'framer-motion'
import type { Iteration } from '../hooks/useIterations'
import { AnnotatedText } from './AnnotatedText'

const EXAMPLE_TEXT = `Sometimes coincidences are just so on the nose. We decided to just do it and paint the van organically yesterday, and yeah, today I got the future me letter that says I should plan it. The whole way that letter speaks to me is incredible. It's like every step of the way I was reading something that was like right exactly what I needed. I think love is the only metaphysical force we need to worry about. Maybe telepathy is possible, maybe panpsychism truly is saying we connect to a greater consciousness, but all I was doing in that letter, was to try to be as loving and kind to myself as I could, and to be vulnerable in every moment where I felt self-censorship pull me back. What came out was the perfect letter for me to receive today. And I know there's no way I could have planned my way into that. Incidentally, in the letter I ask myself to reflect on planning, and how my process has gone for me. I knew that bit was coming, because it's the bit that I've remembered. And my daily habits “planning” task is the one I never do because it was just so nebulous and scary. I guess I never knew what to do about it. Like, was I meant to sit and just figure out what the next few weeks or months would look like? With infinite wisdom? I work best in increments, and so the key, which seeing I received the the letter brought me to, is that it needs to be as straight forward as my other habits, like “yoga”. Now I have to do 3 small things relating to the future, like opening my calendar and looking at my week coming up, or remembering a thing to do, and making a not about it, or planning an event. These all count, 3 of those a day earns a tick. And if I do all my habits, I earn a coffee!`

interface IterationCardProps {
  iteration: Iteration
  onTextChange: (n: number, text: string) => void
  onAnalyze: (n: number) => void
  providerReady: boolean
  onSwitchToWebLLM?: () => void
}

export function IterationCard({ iteration, onTextChange, onAnalyze, providerReady, onSwitchToWebLLM }: IterationCardProps) {
  const { n, text, annotations, status, error, errorKind, retryAttempt, retryMax } = iteration
  const isAnalyzed = status === 'analyzed'
  const isAnalyzing = status === 'analyzing'

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      // Firmer but small drop shadow: tight offset/blur, higher opacity than
      // the soft page shadow, so cards sit just above the page.
      style={{ boxShadow: '0 2px 8px -1px rgba(60, 43, 20, 0.22)' }}
      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-5 paper-surface"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Iteration {n}
        </span>
        {!isAnalyzed && n === 1 && (
          <button
            type="button"
            onClick={() => onTextChange(n, EXAMPLE_TEXT)}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            Load example
          </button>
        )}
      </div>

      {isAnalyzed ? (
        <AnnotatedText result={{ originalText: text, annotations }} />
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => onTextChange(n, e.target.value)}
            placeholder={
              n === 1
                ? 'Paste or type text here...'
                : 'Write further thoughts and reflections here...'
            }
            rows={6}
            disabled={isAnalyzing}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-zinc-100 notebook-lined px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-zinc-50"
          />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>{error}</p>
              {(errorKind === 'network' || errorKind === 'server-error' || errorKind === 'rate-limit') && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onAnalyze(n)}
                    disabled={!providerReady}
                    className="rounded border border-red-400 bg-zinc-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                  {onSwitchToWebLLM && (
                    <button
                      type="button"
                      onClick={onSwitchToWebLLM}
                      className="rounded border border-zinc-400 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Switch to WebLLM
                    </button>
                  )}
                </div>
              )}
              {errorKind === 'spend-cap' && onSwitchToWebLLM && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onSwitchToWebLLM}
                    className="rounded border border-zinc-400 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Switch to WebLLM
                  </button>
                </div>
              )}
            </div>
          )}
          {isAnalyzing && retryAttempt > 0 && (
            <p className="text-sm font-medium text-amber-600">
              No violations detected, retrying ({retryAttempt}/{retryMax})
            </p>
          )}
          <button
            type="button"
            onClick={() => onAnalyze(n)}
            disabled={!providerReady || !text.trim() || isAnalyzing}
            className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isAnalyzing ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze'
            )}
          </button>
        </>
      )}
    </motion.section>
  )
}
