export type ErrorKind =
  | 'ChunkLoadError'
  | 'ExternalScriptError'
  | 'AnalyticsScriptError'
  | 'VercelAnalyticsError'
  | 'WebKitBridgeError'
  | 'NetworkError'
  | 'TypeError'
  | 'ReferenceError'
  | 'SyntaxError'
  | 'ReactError'
  | 'UnhandledRejection'
  | 'UnknownError'

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export type RecommendedAction =
  | 'Ignore'
  | 'Monitor only'
  | 'Refresh the page'
  | 'Investigate frontend code'
  | 'Investigate backend API'
  | 'Check deployment'
  | 'Check network connectivity'

export interface ErrorClassification {
  kind: ErrorKind
  severity: Severity
  cause: string
  action: RecommendedAction
  // One-line verdict shown at the top of every Telegram message
  summary: string
}

// ── external script detection ─────────────────────────────────────────────────

// Domains whose script failures are always third-party, never app bugs
const ANALYTICS_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'googlesyndication.com',
  'gstatic.com',
  'doubleclick.net',
]

const SOCIAL_DOMAINS = [
  'connect.facebook.net',
  'facebook.com',
  'fbcdn.net',
  'platform.twitter.com',
  'instagram.com',
  'tiktok.com',
]

const VERCEL_DOMAINS = [
  '/_vercel/',         // path prefix, not a hostname
  'vercel.com',
  'vercel-insights',
]

function matchesDomain(url: string, domains: string[]): boolean {
  return domains.some(d => url.includes(d))
}

function classifyExternalScript(url: string): ErrorClassification | null {
  const u = url.toLowerCase()

  if (matchesDomain(u, VERCEL_DOMAINS)) {
    return {
      kind: 'VercelAnalyticsError',
      severity: 'Low',
      action: 'Monitor only',
      summary: '⚠️ Analytics / observability script blocked — not an application bug.',
      cause:
        'Vercel Speed Insights or Analytics failed to load. This is almost always caused by a browser extension (uBlock Origin, Privacy Badger), a tracking-protection feature in Firefox/Brave/Safari, or a corporate proxy. It has no impact on application functionality.',
    }
  }

  if (matchesDomain(u, ANALYTICS_DOMAINS)) {
    return {
      kind: 'AnalyticsScriptError',
      severity: 'Low',
      action: 'Monitor only',
      summary: '⚠️ Google Analytics / GTM script blocked — not an application bug.',
      cause:
        'A Google Analytics, Tag Manager, or gstatic script failed to load. Common causes: ad blocker, browser privacy settings (e.g. Firefox Enhanced Tracking Protection, Brave Shields), corporate firewall, or a temporary Google CDN issue. Application functionality is completely unaffected.',
    }
  }

  if (matchesDomain(u, SOCIAL_DOMAINS)) {
    const isFacebook = u.includes('facebook') || u.includes('fbcdn') || u.includes('connect.facebook')
    return {
      kind: 'ExternalScriptError',
      severity: 'Low',
      action: 'Monitor only',
      summary: '⚠️ Third-party social script failed to load — not an application bug.',
      cause: isFacebook
        ? 'A Meta/Facebook script (e.g. the pixel or SDK) failed to load. Common causes: Instagram or Facebook embedded browser enforcing strict privacy rules, an ad blocker, a tracking-protection feature, or a temporary Meta CDN issue. This does not affect the application.'
        : 'A third-party social/media script failed to load (Twitter, Instagram, TikTok, etc.). This is typically caused by privacy settings, ad blockers, or CDN issues. Application functionality is unaffected.',
    }
  }

  // Any other non-local, non-/assets/ URL
  if ((u.includes('http://') || u.includes('https://')) && !u.includes('/assets/')) {
    return {
      kind: 'ExternalScriptError',
      severity: 'Low',
      action: 'Monitor only',
      summary: '⚠️ Third-party script failed to load — not an application bug.',
      cause:
        `An external script or resource failed to load (${url.slice(0, 100)}). This is a third-party dependency outside the application bundle. Likely causes: CDN outage, user's network blocking the domain, or an ad/tracking blocker. Application code is unaffected.`,
    }
  }

  return null
}

// ── bot / headless browser detection ─────────────────────────────────────────

export interface BotSignal {
  isLikelyBot: boolean
  confidence: 'Low' | 'Medium' | 'High'
  signals: string[]
}

export function detectBot(opts: {
  browserName: string
  os: string
  viewportSize: string      // e.g. "800×600"
  timeSinceOpenMs: number
  breadcrumbKinds: string[] // list of kind values from breadcrumbs
  userAgent: string
}): BotSignal {
  const signals: string[] = []
  const ua = opts.userAgent.toLowerCase()

  // Known bot UA strings
  if (/googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|semrush|ahrefs|mj12bot|crawler|spider|headless/i.test(opts.userAgent)) {
    signals.push('Bot/crawler user agent string')
  }
  if (opts.browserName === 'Unknown') signals.push('Browser unrecognised')
  if (opts.os === 'Unknown OS') signals.push('OS unrecognised')
  if (ua.includes('phantomjs') || ua.includes('selenium') || ua.includes('webdriver') || ua.includes('puppeteer')) {
    signals.push('Automation framework detected in UA')
  }
  if (opts.viewportSize === '800×600' || opts.viewportSize === '1024×768' || opts.viewportSize === '0×0') {
    signals.push(`Suspicious viewport (${opts.viewportSize})`)
  }
  if (opts.timeSinceOpenMs < 500) {
    signals.push('Page lifetime < 0.5s (immediate error)')
  }
  const hasClicks = opts.breadcrumbKinds.includes('click')
  if (!hasClicks) signals.push('No user interactions recorded')

  const count = signals.length
  return {
    isLikelyBot: count >= 2,
    confidence: count >= 4 ? 'High' : count >= 2 ? 'Medium' : 'Low',
    signals,
  }
}

// ── main classifier ───────────────────────────────────────────────────────────

export function classifyError(
  name: string,
  message: string,
  stack: string,
  sourceFile?: string,
): ErrorClassification {
  const m = message.toLowerCase()
  const s = (stack || '').toLowerCase()
  const src = (sourceFile ?? '').toLowerCase()

  // ── resource load failures: check origin before assuming ChunkLoadError ──
  const isResourceFailure =
    name === 'ChunkLoadError' ||
    m.includes('loading chunk') ||
    m.includes('failed to fetch dynamically imported') ||
    m.includes('error loading dynamically imported module') ||
    m.startsWith('failed to load resource:')

  if (isResourceFailure) {
    // Extract the URL from the message (set by main.tsx resource-error handler)
    const urlMatch = message.match(/Failed to load resource:\s*(.+)/i)
    const resourceUrl = urlMatch?.[1] ?? src

    // Check if it's own app chunk: must be under /assets/ on the same origin
    const isOwnChunk =
      /\/assets\/[^/]+\.(js|css)/.test(resourceUrl) &&
      !resourceUrl.startsWith('http') // relative or same-origin

    if (!isOwnChunk && resourceUrl) {
      const external = classifyExternalScript(resourceUrl)
      if (external) return external
    }

    return {
      kind: 'ChunkLoadError',
      severity: 'Medium',
      action: 'Check deployment',
      summary: '⚠️ Application chunk failed to load — likely a stale cache after deployment.',
      cause:
        'The browser tried to load a JS chunk that no longer exists on the server — most likely after a new deployment. The user probably has a stale bundle cached. A hard refresh (Ctrl+Shift+R) should fix it. No code bug involved.',
    }
  }

  // ── external script failing without a resource-load event ────────────────
  // e.g. Google Identity or Facebook SDK throwing in JS
  if (src && !src.startsWith('/') && (src.includes('http://') || src.includes('https://'))) {
    const external = classifyExternalScript(src)
    if (external) return external
  }
  // Also check stack frames for external origin
  const stackLines = (stack || '').split('\n')
  for (const line of stackLines.slice(0, 5)) {
    const urlInFrame = line.match(/https?:\/\/[^\s)]+/)?.[0]
    if (urlInFrame && !urlInFrame.includes(window?.location?.hostname ?? '')) {
      const external = classifyExternalScript(urlInFrame)
      if (external) return external
    }
  }

  if (
    m.includes('window.webkit') ||
    m.includes('messagehandlers') ||
    s.includes('senddatanative') ||
    s.includes('wkwebview')
  ) {
    return {
      kind: 'WebKitBridgeError',
      severity: 'Low',
      action: 'Ignore',
      summary: '✅ Most likely NOT an application bug — iOS WKWebView bridge called outside a native app.',
      cause:
        'Code is calling into the iOS WKWebView native bridge (window.webkit.messageHandlers) but the page is running in a regular browser, not inside a native iOS app. This does NOT affect regular users — it only appears when an iOS app visits the page without the bridge guard. Fix: wrap the call with `if (window.webkit?.messageHandlers)`.',
    }
  }

  if (
    m.includes('networkerror') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('network request failed') ||
    name === 'NetworkError'
  ) {
    return {
      kind: 'NetworkError',
      severity: 'Medium',
      action: 'Check network connectivity',
      summary: '⚠️ Network request failed — may be user connectivity or server issue.',
      cause:
        'A network request failed. Possible reasons: user is offline, the server is down, a CORS error, or a request blocked by an ad blocker / firewall. Check the breadcrumbs for which endpoint was called.',
    }
  }

  if (
    name === 'TypeError' ||
    m.includes('cannot read propert') ||
    m.includes('is not a function') ||
    m.includes('cannot set propert') ||
    m.includes('null is not an object') ||
    m.includes('undefined is not an object')
  ) {
    return {
      kind: 'TypeError',
      severity: 'High',
      action: 'Investigate frontend code',
      summary: '❌ Application bug — TypeError in frontend code.',
      cause:
        'A property is being accessed on undefined or null, or a non-function is being called. The object is likely not initialised yet, an API returned an unexpected shape, or an async operation resolved with null. Check the stack trace for the exact location.',
    }
  }

  if (name === 'ReferenceError') {
    return {
      kind: 'ReferenceError',
      severity: 'High',
      action: 'Investigate frontend code',
      summary: '❌ Application bug — ReferenceError in frontend code.',
      cause:
        'A variable or identifier is being used before it is defined. This often happens with minification, tree-shaking removing a module, or a missing import.',
    }
  }

  if (name === 'SyntaxError' || m.includes('unexpected token') || m.includes('invalid json')) {
    return {
      kind: 'SyntaxError',
      severity: 'Medium',
      action: 'Investigate backend API',
      summary: '⚠️ JSON parse error — backend likely returned unexpected content.',
      cause:
        'A JSON parse error or JS syntax problem. An API may have returned unexpected HTML (e.g. a login redirect or error page) where JSON was expected. Check the fetch breadcrumbs for 401/5xx responses.',
    }
  }

  if (s.includes('react') || m.includes('minified react error') || m.includes('componentdidcatch')) {
    return {
      kind: 'ReactError',
      severity: 'Critical',
      action: 'Investigate frontend code',
      summary: '❌ Application bug — React rendering error, Error Boundary triggered.',
      cause:
        'A React rendering error. A component threw during render, in a lifecycle method, or in an event handler. The Error Boundary caught it, so the rest of the page survived. The React component stack is included in the stack trace.',
    }
  }

  if (name === 'UnhandledRejection' || m.includes('unhandled promise')) {
    return {
      kind: 'UnhandledRejection',
      severity: 'High',
      action: 'Investigate frontend code',
      summary: '❌ Application bug — unhandled Promise rejection.',
      cause:
        'A Promise was rejected but no .catch() handler was attached. Look for async functions called without await, or promise chains missing a rejection handler.',
    }
  }

  return {
    kind: 'UnknownError',
    severity: 'Medium',
    action: 'Monitor only',
    summary: '⚠️ Unclassified error — review stack trace for context.',
    cause:
      'The error type could not be automatically classified. Review the stack trace and error message for clues.',
  }
}
