import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const QUESTIONS = [
  'Does iterating through rounds of LLM prompts guided by the Bandler & Grinder Meta-Model provide therapeutic benefit?',
  'Does the Bandler & Grinder Meta-Model framework allow smaller LLMs to provide comparable therapeutic benefit to frontier models?',
  'Does a UX that gives no advice but only asks questions train the user over time to spot some of these prompting questions themselves?',
  'Does providing LLM guidance as questions avoid some sycophancy risk of direct LLM therapy?',
]

export function ResearchQuestions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-0 top-24 z-20 flex items-stretch">
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-y border-l border-zinc-200 bg-white shadow-md"
            id="research-questions-panel"
          >
            <div className="w-80 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-800">Open research questions</h2>
              <ol className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-600">
                {QUESTIONS.map((q, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="font-medium text-zinc-400">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="research-questions-panel"
        className="rounded-l-lg border border-r-0 border-zinc-200 bg-white px-2 py-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
        style={{ writingMode: 'vertical-rl' }}
      >
        Research Questions
      </button>
    </div>
  )
}
