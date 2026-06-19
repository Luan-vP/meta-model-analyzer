// `crypto.randomUUID()` is only defined in a secure context (HTTPS or
// localhost). Over plain HTTP — e.g. visiting the GitHub Pages site before
// HTTPS redirect — it is `undefined`, and the WebLLM engine's worker-message
// protocol calls it on every message, throwing
// "crypto.randomUUID is not a function".
//
// `crypto.getRandomValues()` is available in insecure contexts and in workers,
// so we synthesize an RFC 4122 v4 UUID from it when `randomUUID` is missing.
// Import this module for its side effect before any code that uses WebLLM —
// it runs in both the main thread (main.tsx) and the worker (webllm-worker.ts).

function installRandomUUIDPolyfill(): void {
  const c = (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined) as
    | Crypto
    | undefined

  if (!c || typeof c.randomUUID === 'function' || typeof c.getRandomValues !== 'function') {
    return
  }

  const hex: string[] = []
  for (let i = 0; i < 256; i++) hex.push((i + 0x100).toString(16).slice(1))

  ;(c as unknown as { randomUUID: () => string }).randomUUID = function randomUUID(): string {
    const b = c.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40 // version 4
    b[8] = (b[8] & 0x3f) | 0x80 // variant 10xx
    return (
      hex[b[0]] + hex[b[1]] + hex[b[2]] + hex[b[3]] + '-' +
      hex[b[4]] + hex[b[5]] + '-' +
      hex[b[6]] + hex[b[7]] + '-' +
      hex[b[8]] + hex[b[9]] + '-' +
      hex[b[10]] + hex[b[11]] + hex[b[12]] + hex[b[13]] + hex[b[14]] + hex[b[15]]
    )
  }
}

installRandomUUIDPolyfill()
