import { useSyncExternalStore, useState } from 'react'
import {
  subscribeLogs,
  getLogEntries,
  clearLogEntries,
  type LogEntry,
  type LogLevel,
} from '../services/debug-log'

interface DebugConsoleProps {
  onClose: () => void
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  log: 'text-zinc-300',
  info: 'text-sky-300',
  debug: 'text-zinc-400',
  warn: 'text-amber-300',
  error: 'text-red-300',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Floating, log capture panel pinned to the bottom of the screen. Shown only
 * when Debug mode is enabled in Settings. Subscribes to the shared log buffer
 * so it works without a desktop DevTools console (the point of it on mobile).
 */
export function DebugConsole({ onClose }: DebugConsoleProps) {
  const entries = useSyncExternalStore<LogEntry[]>(subscribeLogs, getLogEntries)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-700 bg-zinc-900/95 text-xs shadow-[0_-4px_16px_rgba(0,0,0,0.4)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-1.5">
        <span className="font-mono font-medium text-zinc-300">
          Debug console{' '}
          <span className="text-zinc-500">({entries.length})</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded px-2 py-0.5 font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            type="button"
            onClick={clearLogEntries}
            className="rounded px-2 py-0.5 font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Close
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-48 overflow-y-auto px-3 py-2 font-mono leading-relaxed">
          {entries.length === 0 ? (
            <p className="text-zinc-500">No logs yet. Trigger an analysis to capture output.</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex gap-2 whitespace-pre-wrap break-words">
                <span className="shrink-0 text-zinc-600">{formatTime(e.ts)}</span>
                <span className={`shrink-0 uppercase ${LEVEL_COLOR[e.level]}`}>{e.level}</span>
                <span className={`min-w-0 flex-1 ${LEVEL_COLOR[e.level]}`}>{e.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
