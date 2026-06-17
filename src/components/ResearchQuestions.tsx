const QUESTIONS = [
  'Does iterating through rounds of LLM prompts guided by the Bandler & Grinder Meta-Model provide therapeutic benefit?',
  'Does the Bandler & Grinder Meta-Model framework allow smaller LLMs to provide comparable therapeutic benefit to frontier models?',
  'Does a UX that gives no advice but only asks questions train the user over time to spot some of these prompting questions themselves?',
  'Does providing LLM guidance as questions avoid some sycophancy risk of direct LLM therapy?',
]

export function ResearchQuestionsContent() {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">Open research questions</h2>
      <ol className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-600">
        {QUESTIONS.map((q, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="shrink-0 font-medium text-zinc-400">{i + 1}.</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
