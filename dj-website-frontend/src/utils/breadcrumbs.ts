export type BreadcrumbKind =
  | 'navigation'
  | 'click'
  | 'fetch'
  | 'fetch_error'
  | 'visibility'
  | 'route'
  | 'console_warn'
  | 'console_error'

export interface Breadcrumb {
  ts: number
  kind: BreadcrumbKind
  message: string
}

const MAX = 30
const crumbs: Breadcrumb[] = []

function push(kind: BreadcrumbKind, message: string) {
  crumbs.push({ ts: Date.now(), kind, message })
  if (crumbs.length > MAX) crumbs.shift()
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...crumbs]
}

// ── console patches ───────────────────────────────────────────────────────────
// Keep last 20 console.warn / console.error messages in the breadcrumb ring.
// Patching happens before any app code runs (this module is imported first in main.tsx).

function patchConsole(level: 'warn' | 'error', kind: BreadcrumbKind) {
  const orig = console[level].bind(console)
  console[level] = (...args: unknown[]) => {
    try {
      const text = args
        .map(a => {
          if (typeof a === 'string') return a
          if (a instanceof Error) return `${a.name}: ${a.message}`
          try { return JSON.stringify(a) } catch { return String(a) }
        })
        .join(' ')
        .slice(0, 120)
      push(kind, text)
    } catch { /* never interfere with console */ }
    orig(...args)
  }
}

patchConsole('warn', 'console_warn')
patchConsole('error', 'console_error')

// ── clicks ────────────────────────────────────────────────────────────────────
function describeTarget(el: EventTarget | null): string {
  if (!(el instanceof Element)) return 'unknown'
  const tag = el.tagName.toLowerCase()
  const text = (el.textContent ?? '').trim().slice(0, 40)
  const id = el.id ? `#${el.id}` : ''
  const cls =
    el.className && typeof el.className === 'string'
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : ''
  return [tag, id, cls, text ? `"${text}"` : ''].filter(Boolean).join(' ')
}

document.addEventListener('click', (e) => {
  push('click', describeTarget(e.target))
}, { capture: true, passive: true })

// ── fetch with response body capture ─────────────────────────────────────────
// When a response is non-2xx we try to read the body text and expose it via
// the breadcrumb so the Telegram message can show what the API actually returned.

const RESPONSE_BODY_MAX = 500

export interface FetchErrorDetail {
  method: string
  url: string
  status: number
  body: string // truncated response body or empty
}

// Shared store: reportError reads from this to attach the body to the error payload.
// Key: `METHOD URL` (same string used in the breadcrumb message)
const fetchErrorDetails = new Map<string, FetchErrorDetail>()

export function getLastFetchError(): FetchErrorDetail | undefined {
  // Return the most recently stored fetch error (last entry in insertion order)
  let last: FetchErrorDetail | undefined
  for (const v of fetchErrorDetails.values()) last = v
  return last
}

export function getFetchErrorDetails(): Map<string, FetchErrorDetail> {
  return fetchErrorDetails
}

const _fetch = window.fetch.bind(window)
window.fetch = async function (...args) {
  const rawUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
  const short = rawUrl.replace(window.location.origin, '').slice(0, 80)
  const method = ((args[1] as RequestInit | undefined)?.method ?? 'GET').toUpperCase()
  const startedAt = Date.now()

  try {
    const res = await _fetch(...args)
    const durationMs = Date.now() - startedAt

    if (!res.ok) {
      // Clone so the caller can still consume the original body
      let body = ''
      try {
        const clone = res.clone()
        body = (await clone.text()).slice(0, RESPONSE_BODY_MAX)
      } catch { /* ignore — body may be unreadable */ }

      const detail: FetchErrorDetail = { method, url: short, status: res.status, body }
      fetchErrorDetails.set(`${method} ${short}`, detail)
      // Keep at most 10 entries
      if (fetchErrorDetails.size > 10) {
        fetchErrorDetails.delete(fetchErrorDetails.keys().next().value!)
      }

      push('fetch_error', `${method} ${short} → ${res.status} (${durationMs}ms)${body ? ` | ${body.slice(0, 60)}` : ''}`)
    } else {
      push('fetch', `${method} ${short} → ${res.status} (${durationMs}ms)`)
    }

    return res
  } catch (err) {
    const durationMs = Date.now() - startedAt
    push('fetch_error', `${method} ${short} → ${err instanceof Error ? err.message : String(err)} (${durationMs}ms)`)
    throw err
  }
}

// ── page visibility ───────────────────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  push('visibility', document.visibilityState)
}, { passive: true })

// ── navigation (popstate) ─────────────────────────────────────────────────────
window.addEventListener('popstate', () => {
  push('navigation', window.location.pathname + window.location.search)
}, { passive: true })

// ── SPA route changes via History API ────────────────────────────────────────
const patchHistory = (method: 'pushState' | 'replaceState') => {
  const orig = history[method].bind(history)
  history[method] = function (...args: Parameters<typeof history.pushState>) {
    orig(...args)
    push('route', String(args[2] ?? window.location.pathname))
  }
}
patchHistory('pushState')
patchHistory('replaceState')

// First entry: starting URL
push('navigation', window.location.pathname + window.location.search)
