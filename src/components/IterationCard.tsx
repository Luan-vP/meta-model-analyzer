import { motion } from 'framer-motion'
import type { Iteration } from '../hooks/useIterations'
import { AnnotatedText } from './AnnotatedText'

const EXAMPLE_TEXT = `Everyone knows I'm a failure. I can't do anything right. My boss didn't say hello this morning, which means he's angry at me. I should always put others first. Things are just getting worse and worse. People don't care about me. It's wrong to think about yourself. She makes me so angry. Nobody ever listens to me. I have to be perfect at everything I do.`

interface IterationCardProps {
  iteration: Iteration
  onTextChange: (n: number, text: string) => void
  onAnalyze: (n: number) => void
  providerReady: boolean
}

export function IterationCard({ iteration, onTextChange, onAnalyze, providerReady }: IterationCardProps) {
  const { n, text, annotations, status, error } = iteration
  const isAnalyzed = status === 'analyzed'
  const isAnalyzing = status === 'analyzing'

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
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
                ? 'Paste or type text here to analyze for Meta-Model violations...'
                : 'Rewrite this version to address the comments above...'
            }
            rows={6}
            disabled={isAnalyzing}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-zinc-50"
          />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
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
