type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

export function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}
