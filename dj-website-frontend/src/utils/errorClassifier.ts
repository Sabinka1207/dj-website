export type ErrorKind =
  | 'ChunkLoadError'
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
}

export function classifyError(
  name: string,
  message: string,
  stack: string,
): ErrorClassification {
  const m = message.toLowerCase()
  const s = (stack || '').toLowerCase()

  if (
    name === 'ChunkLoadError' ||
    m.includes('loading chunk') ||
    m.includes('failed to fetch dynamically imported') ||
    m.includes('error loading dynamically imported module')
  ) {
    return {
      kind: 'ChunkLoadError',
      severity: 'Medium',
      action: 'Check deployment',
      cause:
        'The browser tried to load a JS chunk that no longer exists on the server — most likely after a new deployment. The user probably has a stale bundle cached. A hard refresh (Ctrl+Shift+R) should fix it. No code bug involved.',
    }
  }

  if (
    m.includes('window.webkit') ||
    m.includes('messagehandlers') ||
    s.includes('sendDataToNative') ||
    s.includes('wkwebview')
  ) {
    return {
      kind: 'WebKitBridgeError',
      severity: 'Low',
      action: 'Ignore',
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
      cause:
        'A property is being accessed on undefined or null, or a non-function is being called. The object is likely not initialised yet, an API returned an unexpected shape, or an async operation resolved with null. Check the stack trace for the exact location.',
    }
  }

  if (name === 'ReferenceError') {
    return {
      kind: 'ReferenceError',
      severity: 'High',
      action: 'Investigate frontend code',
      cause:
        'A variable or identifier is being used before it is defined. This often happens with minification, tree-shaking removing a module, or a missing import.',
    }
  }

  if (name === 'SyntaxError' || m.includes('unexpected token') || m.includes('invalid json')) {
    return {
      kind: 'SyntaxError',
      severity: 'Medium',
      action: 'Investigate backend API',
      cause:
        'A JSON parse error or JS syntax problem. An API may have returned unexpected HTML (e.g. a login redirect or error page) where JSON was expected. Check the fetch breadcrumbs for 401/5xx responses.',
    }
  }

  if (s.includes('react') || m.includes('minified react error') || m.includes('componentdidcatch')) {
    return {
      kind: 'ReactError',
      severity: 'Critical',
      action: 'Investigate frontend code',
      cause:
        'A React rendering error. A component threw during render, in a lifecycle method, or in an event handler. The Error Boundary caught it, so the rest of the page survived. The React component stack is included in the stack trace.',
    }
  }

  if (name === 'UnhandledRejection' || m.includes('unhandled promise')) {
    return {
      kind: 'UnhandledRejection',
      severity: 'High',
      action: 'Investigate frontend code',
      cause:
        'A Promise was rejected but no .catch() handler was attached. Look for async functions called without await, or promise chains missing a rejection handler.',
    }
  }

  return {
    kind: 'UnknownError',
    severity: 'Medium',
    action: 'Monitor only',
    cause:
      'The error type could not be automatically classified. Review the stack trace and error message for clues.',
  }
}
