const reported = new Set<string>()

const IGNORE_PATTERNS = [
  /^Script error\.?$/i,           // cross-origin, no info
  /ResizeObserver loop/i,         // benign browser warning
  /Non-Error promise rejection/i, // Sentry artifact
  /extension:\/\//i,              // browser extension
  /moz-extension:\/\//i,
  /chrome-extension:\/\//i,
]

function shouldIgnore(message: string): boolean {
  return IGNORE_PATTERNS.some(p => p.test(message))
}

export function reportError(message: string, stack?: string): void {
  if (!message || shouldIgnore(message)) return
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return

  const key = message.slice(0, 120)
  if (reported.has(key)) return
  reported.add(key)

  const payload = JSON.stringify({
    message,
    stack: stack ?? '',
    url: window.location.href,
    userAgent: navigator.userAgent,
  })
  navigator.sendBeacon('/api/client-error', new Blob([payload], { type: 'application/json' }))
}
