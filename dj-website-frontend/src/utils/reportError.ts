import { getBreadcrumbs, getLastFetchError } from './breadcrumbs'
import { classifyError, detectBot } from './errorClassifier'
import { getToken } from './adminAuth'
import { getVisitorId } from './visitorId'

// ── stable error ID ───────────────────────────────────────────────────────────
// Hash of (errorName + errorMessage + normalized stack).
// Normalization strips line/column numbers and chunk fingerprint hashes so the
// same logical bug produces the same ID across deployments.
function normalizeStack(stack: string): string {
  return stack
    .split('\n')
    .map(line =>
      line
        // remove column numbers: :1234:567 → :line (keep function structure)
        .replace(/:\d+:\d+/g, '')
        // strip content-hash fingerprints from chunk names: Name-AbCd1234.js → Name.js
        .replace(/-[A-Za-z0-9]{8,}\.(js|ts)/g, '.js')
        .trim()
    )
    .filter(Boolean)
    .join('\n')
}

async function computeErrorId(name: string, message: string, stack: string): Promise<string> {
  try {
    const normalized = `${name}\n${message}\n${normalizeStack(stack)}`
    const encoded = new TextEncoder().encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    // Return first 8 hex bytes (16 chars) — short enough for Telegram, collision-resistant enough for a pet project
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // SubtleCrypto unavailable (non-HTTPS dev context) — fall back to a cheap djb2 hash
    const input = `${name}${message}${stack}`.slice(0, 500)
    let h = 5381
    for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i)
    return (h >>> 0).toString(16).padStart(8, '0')
  }
}

// ── deduplication ─────────────────────────────────────────────────────────────
const DEDUP_WINDOW_MS = 5 * 60 * 1000
const recentKeys = new Map<string, number>()

function isDuplicate(key: string): boolean {
  const last = recentKeys.get(key)
  const now = Date.now()
  if (last && now - last < DEDUP_WINDOW_MS) return true
  recentKeys.set(key, now)
  for (const [k, ts] of recentKeys) {
    if (now - ts > DEDUP_WINDOW_MS) recentKeys.delete(k)
  }
  return false
}

// ── ignore list ───────────────────────────────────────────────────────────────
const IGNORE_PATTERNS = [
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
  /extension:\/\//i,
  /moz-extension:\/\//i,
  /chrome-extension:\/\//i,
]

function shouldIgnore(message: string): boolean {
  return IGNORE_PATTERNS.some(p => p.test(message))
}

// ── browser / device detection ────────────────────────────────────────────────
function parseBrowser(ua: string): { name: string; version: string } {
  const matchers: [RegExp, string][] = [
    [/Edg\/([0-9.]+)/, 'Edge'],
    [/OPR\/([0-9.]+)/, 'Opera'],
    [/Chrome\/([0-9.]+)/, 'Chrome'],
    [/Firefox\/([0-9.]+)/, 'Firefox'],
    [/Safari\/([0-9.]+)/, 'Safari'],
  ]
  for (const [re, name] of matchers) {
    const m = ua.match(re)
    if (m) return { name, version: m[1].split('.').slice(0, 2).join('.') }
  }
  return { name: 'Unknown', version: '' }
}

function parseOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows NT/.test(ua)) return 'Windows'
  if (/Mac OS X ([0-9_]+)/.test(ua)) return `macOS ${RegExp.$1.replace(/_/g, '.')}`
  if (/Android ([0-9.]+)/.test(ua)) return `Android ${RegExp.$1}`
  if (/iPhone OS ([0-9_]+)/.test(ua)) return `iOS ${RegExp.$1.replace(/_/g, '.')}`
  if (/iPad.*OS ([0-9_]+)/.test(ua)) return `iPadOS ${RegExp.$1.replace(/_/g, '.')}`
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown OS'
}

function deviceType(ua: string): string {
  if (/Mobi|Android|iPhone|iPad/.test(ua)) return 'Mobile'
  if (/Tablet|iPad/.test(ua)) return 'Tablet'
  return 'Desktop'
}

// ── page-load timing ──────────────────────────────────────────────────────────
function pageLoadMs(): number | null {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav && nav.loadEventEnd > 0) return Math.round(nav.loadEventEnd)
  } catch { /* ignore */ }
  return null
}

// ── minification detection ────────────────────────────────────────────────────
// A stack frame pointing to an assets/*.js file with a content-hash fingerprint
// and no human-readable path segments is almost certainly minified.
// Pattern: /assets/SomeName-AbCdEfGh.js  (hash = 8+ hex/alphanum chars after dash)
const MINIFIED_FRAME_RE = /\/assets\/[^/]+?-[A-Za-z0-9]{8,}\.(js|ts):/

export function isMinifiedStack(stack: string): boolean {
  if (!stack) return false
  const frames = stack.split('\n').filter(l => l.includes('.js:') || l.includes('.ts:'))
  if (frames.length === 0) return false
  return frames.some(f => MINIFIED_FRAME_RE.test(f))
}

// ── public types ──────────────────────────────────────────────────────────────
export interface ErrorReport {
  // error
  errorId: string
  errorName: string
  errorMessage: string
  errorKind: string
  severity: string
  action: string
  summary: string
  possibleCause: string
  stack: string
  stackIsMinified: boolean
  sourceFile: string
  line: number | null
  column: number | null
  // API error context
  lastFetchErrorBody: string
  // environment
  url: string
  previousUrl: string
  referrer: string
  timestampIso: string
  timestampLocal: string
  appEnv: string
  appVersion: string
  gitCommit: string
  // browser
  userAgent: string
  browserName: string
  browserVersion: string
  os: string
  deviceType: string
  screenResolution: string
  viewportSize: string
  language: string
  timezone: string
  online: boolean
  // session
  sessionId: string
  authState: 'Authenticated' | 'Anonymous'
  pageLoadMs: number | null
  timeSinceOpenMs: number
  // bot detection
  isLikelyBot: boolean
  botConfidence: string
  botSignals: string[]
  // breadcrumbs
  breadcrumbs: ReturnType<typeof getBreadcrumbs>
}

const pageOpenedAt = Date.now()
let previousUrl = ''

window.addEventListener('popstate', () => { previousUrl = window.location.href }, { passive: true })

export async function buildErrorReport(opts: {
  errorName: string
  errorMessage: string
  stack: string
  sourceFile?: string
  line?: number | null
  column?: number | null
}): Promise<ErrorReport> {
  const ua = navigator.userAgent
  const browser = parseBrowser(ua)
  const os = parseOS(ua)
  const device = deviceType(ua)
  const viewportSize = `${window.innerWidth}×${window.innerHeight}`
  const timeSinceOpen = Date.now() - pageOpenedAt
  const crumbs = getBreadcrumbs()
  const crumbKinds = crumbs.map(c => c.kind)

  const { kind, severity, cause, action, summary } = classifyError(
    opts.errorName,
    opts.errorMessage,
    opts.stack,
    opts.sourceFile,
  )
  const now = new Date()
  const lastFetchError = getLastFetchError()
  const errorId = await computeErrorId(opts.errorName, opts.errorMessage, opts.stack)

  const bot = detectBot({
    browserName: browser.name,
    os,
    viewportSize,
    timeSinceOpenMs: timeSinceOpen,
    breadcrumbKinds: crumbKinds,
    userAgent: ua,
  })

  return {
    errorId,
    errorName: opts.errorName,
    errorMessage: opts.errorMessage,
    errorKind: kind,
    severity,
    action,
    summary: bot.isLikelyBot && bot.confidence !== 'Low'
      ? `🤖 Likely bot traffic — ${summary}`
      : summary,
    possibleCause: cause,
    stack: opts.stack,
    stackIsMinified: isMinifiedStack(opts.stack),
    sourceFile: opts.sourceFile ?? '',
    line: opts.line ?? null,
    column: opts.column ?? null,

    lastFetchErrorBody: lastFetchError?.body ?? '',

    url: window.location.href,
    previousUrl,
    referrer: document.referrer,
    timestampIso: now.toISOString(),
    timestampLocal: now.toLocaleString(),
    appEnv: import.meta.env.MODE,
    appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
    gitCommit: typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown',

    userAgent: ua,
    browserName: browser.name,
    browserVersion: browser.version,
    os,
    deviceType: device,
    screenResolution: `${screen.width}×${screen.height}`,
    viewportSize,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,

    sessionId: getVisitorId(),
    authState: getToken() ? 'Authenticated' : 'Anonymous',
    pageLoadMs: pageLoadMs(),
    timeSinceOpenMs: timeSinceOpen,

    isLikelyBot: bot.isLikelyBot,
    botConfidence: bot.confidence,
    botSignals: bot.signals,

    breadcrumbs: crumbs,
  }
}

export function reportError(opts: {
  errorName?: string
  errorMessage: string
  stack?: string
  sourceFile?: string
  line?: number | null
  column?: number | null
}): void {
  // Synchronous guards first — fast path out before any async work
  try {
    if (!opts.errorMessage || shouldIgnore(opts.errorMessage)) return
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return

    const dedupKey = `${opts.errorName ?? ''}:${opts.errorMessage.slice(0, 120)}`
    if (isDuplicate(dedupKey)) return
  } catch { return }

  // Async: compute ID then send — fire-and-forget, never throws to caller
  buildErrorReport({
    errorName: opts.errorName ?? 'Error',
    errorMessage: opts.errorMessage,
    stack: opts.stack ?? '',
    sourceFile: opts.sourceFile,
    line: opts.line,
    column: opts.column,
  }).then(report => {
    navigator.sendBeacon('/api/client-error', new Blob([JSON.stringify(report)], { type: 'application/json' }))
  }).catch(() => { /* never crash the app */ })
}
