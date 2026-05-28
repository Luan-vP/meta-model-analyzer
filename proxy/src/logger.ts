import { createHash, randomUUID } from 'node:crypto'

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

function statusSeverity(status: number): Severity {
  if (status >= 500) return 'ERROR'
  if (status >= 400) return 'WARNING'
  return 'INFO'
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export interface RequestLog {
  request_id: string
  ip_hash: string
  model: string | null
  tokens_in: number | null
  tokens_out: number | null
  latency_ms: number
  status: number
}

export function logRequest(fields: RequestLog): void {
  console.log(
    JSON.stringify({
      severity: statusSeverity(fields.status),
      timestamp: new Date().toISOString(),
      ...fields,
    }),
  )
}

export { randomUUID as generateRequestId }
