import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function D20Icon({ value }: { value: number | null }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Icosahedron face outline */}
      <polygon
        points="50,4 96,28 96,72 50,96 4,72 4,28"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        className="text-zinc-400"
      />
      {/* Inner triangle lines */}
      <line x1="50" y1="4"  x2="4"  y2="72" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      <line x1="50" y1="4"  x2="96" y2="72" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      <line x1="4"  y1="28" x2="96" y2="28" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      <line x1="4"  y1="72" x2="96" y2="72" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      <line x1="4"  y1="28" x2="50" y2="96" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      <line x1="96" y1="28" x2="50" y2="96" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300" />
      {/* Value */}
      {value !== null && (
        <text
          x="50"
          y="57"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={value >= 10 ? '28' : '32'}
          fontWeight="700"
          fontFamily="Manrope, sans-serif"
          className="text-zinc-800"
          fill="currentColor"
        >
          {value}
        </text>
      )}
    </svg>
  )
}

export function D20Content() {
  const [roll, setRoll] = useState<number | null>(null)
  const [rollKey, setRollKey] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState<number[]>([])

  function doRoll() {
    if (rolling) return
    setRolling(true)

    // Quick flicker before landing
    let ticks = 0
    const interval = setInterval(() => {
      setRoll(Math.ceil(Math.random() * 20))
      ticks++
      if (ticks >= 8) {
        clearInterval(interval)
        const final = Math.ceil(Math.random() * 20)
        setRoll(final)
        setRollKey(k => k + 1)
        setHistory(h => [final, ...h].slice(0, 5))
        setRolling(false)
      }
    }, 60)
  }

  const isCrit = roll === 20
  const isFail = roll === 1

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="self-start text-sm font-semibold text-zinc-800">D20</h2>

      <button
        type="button"
        onClick={doRoll}
        disabled={rolling}
        aria-label="Roll D20"
        className={`relative w-36 h-36 transition-transform active:scale-95 disabled:opacity-70 ${
          isCrit ? 'text-indigo-600' : isFail ? 'text-red-500' : 'text-zinc-700'
        } hover:scale-105`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={rollKey}
            initial={{ rotate: -15, opacity: 0, scale: 0.85 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <D20Icon value={roll} />
          </motion.div>
        </AnimatePresence>
      </button>

      <AnimatePresence mode="wait">
        {roll !== null && (
          <motion.p
            key={`label-${rollKey}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-xs font-semibold uppercase tracking-widest ${
              isCrit ? 'text-indigo-600' : isFail ? 'text-red-500' : 'text-zinc-400'
            }`}
          >
            {isCrit ? 'Natural 20!' : isFail ? 'Critical fail' : `You rolled ${roll}`}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={doRoll}
        disabled={rolling}
        className="w-full rounded-md border border-zinc-200 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {rolling ? 'Rolling…' : roll === null ? 'Roll' : 'Roll again'}
      </button>

      {history.length > 0 && (
        <div className="w-full">
          <p className="mb-1.5 text-[10px] uppercase tracking-widest text-zinc-400">Recent</p>
          <div className="flex gap-1.5">
            {history.map((r, i) => (
              <span
                key={i}
                className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold ${
                  r === 20 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' :
                  r === 1  ? 'border-red-300 bg-red-50 text-red-600' :
                             'border-zinc-200 bg-zinc-50 text-zinc-700'
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
