/**
 * Tiny in-memory log buffer + console capture, used to surface logs on devices
 * where a real DevTools console isn't reachable (mobile in particular).
 *
 * `installConsoleCapture()` monkeypatches the console methods so every log also
 * lands in a ring buffer; the floating <DebugConsole> subscribes and renders
 * them. Capture is installed unconditionally at startup (cheap), but the buffer
 * is only *shown* when the user enables Debug mode in Settings.
 */

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: number
  ts: number
  level: LogLevel
  text: string
}

const MAX_ENTRIES = 300

let entries: LogEntry[] = []
let nextId = 1
const listeners = new Set<() => void>()
let installed = false

function emit(): void {
  for (const l of listeners) l()
}

/** Best-effort stringify of a single console argument. */
function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`
  }
  // ErrorEvent (thrown by failing web workers) has useful fields that don't
  // survive JSON.stringify.
  if (typeof ErrorEvent !== 'undefined' && arg instanceof ErrorEvent) {
    return `ErrorEvent: ${arg.message} @ ${arg.filename}:${arg.lineno}`
  }
  try {
    return JSON.stringify(arg, replacer, 2)
  } catch {
    return String(arg)
  }
}

// JSON.stringify drops Error properties by default; pull them out explicitly.
function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  return value
}

export function pushLog(level: LogLevel, args: unknown[]): void {
  const text = args.map(formatArg).join(' ')
  entries.push({ id: nextId++, ts: Date.now(), level, text })
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES)
  emit()
}

export function getLogEntries(): LogEntry[] {
  return entries
}

export function clearLogEntries(): void {
  entries = []
  emit()
}

export function subscribeLogs(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Patch console so logs are mirrored into the buffer. Idempotent. */
export function installConsoleCapture(): void {
  if (installed) return
  installed = true
  const levels: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug']
  for (const level of levels) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      try {
        pushLog(level, args)
      } catch {
        // never let logging break the app
      }
      original(...args)
    }
  }
}
