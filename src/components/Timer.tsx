import { useState, useRef, useEffect, useCallback } from 'react'

const TOTAL_SECONDS = 20 * 60
const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * A silent 20-minute visual focus timer for the side deck. Countdown is driven
 * off a wall-clock end time (not tick-counting) so it stays accurate even if the
 * tab is throttled. Deliberately no sound — the depleting ring is the only cue.
 */
export function TimerContent() {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS)
  const [running, setRunning] = useState(false)
  const endTimeRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) setRunning(false)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [running])

  const handlePrimary = useCallback(() => {
    if (running) {
      setRunning(false)
      return
    }
    // Restart from a finished timer, otherwise start/resume from `remaining`.
    const seconds = remaining <= 0 ? TOTAL_SECONDS : remaining
    setRemaining(seconds)
    endTimeRef.current = Date.now() + seconds * 1000
    setRunning(true)
  }, [running, remaining])

  const handleReset = useCallback(() => {
    setRunning(false)
    setRemaining(TOTAL_SECONDS)
  }, [])

  const done = remaining <= 0
  const atStart = remaining === TOTAL_SECONDS && !running
  const fraction = remaining / TOTAL_SECONDS
  const primaryLabel = running ? 'Pause' : done ? 'Restart' : atStart ? 'Start' : 'Resume'
  const status = done ? "Time's up" : running ? 'Focus' : atStart ? '20 minutes' : 'Paused'

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="self-start text-sm font-semibold text-zinc-800">Timer</h2>

      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="8" stroke="currentColor" className="text-zinc-200" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke="currentColor"
            className={done ? 'text-emerald-500' : 'text-indigo-500'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-zinc-800">{format(remaining)}</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">{status}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrimary}
        className="w-full rounded-md border border-zinc-200 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={handleReset}
        disabled={atStart}
        className="text-xs font-medium uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-40 disabled:hover:text-zinc-400"
      >
        Reset
      </button>
    </div>
  )
}
