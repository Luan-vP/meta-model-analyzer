import { useState } from 'react'

interface TextInputProps {
  onAnalyze: (text: string) => void
  disabled: boolean
  analyzing: boolean
}

const EXAMPLE_TEXT = `Everyone knows I'm a failure. I can't do anything right. My boss didn't say hello this morning, which means he's angry at me. I should always put others first. Things are just getting worse and worse. People don't care about me. It's wrong to think about yourself. She makes me so angry. Nobody ever listens to me. I have to be perfect at everything I do.`

export function TextInput({ onAnalyze, disabled, analyzing }: TextInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) {
      onAnalyze(trimmed)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <label htmlFor="input-text" className="text-sm font-medium text-zinc-700">
          Text to analyze
        </label>
        <button
          onClick={() => setText(EXAMPLE_TEXT)}
          className="text-xs text-indigo-500 hover:text-indigo-700"
          type="button"
        >
          Load example
        </button>
      </div>
      <textarea
        id="input-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type text here to analyze for Meta-Model violations..."
        rows={8}
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim() || analyzing}
        className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
      >
        {analyzing ? (
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
    </div>
  )
}
