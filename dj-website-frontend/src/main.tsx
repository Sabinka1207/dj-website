import { StrictMode } from 'react'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Breadcrumb tracking must start before anything else
import './utils/breadcrumbs'
import { reportError } from './utils/reportError'

// ── window.onerror ─────────────────────────────────────────────────────────
window.onerror = (_msg, src, line, col, error) => {
  reportError({
    errorName: error?.name ?? 'Error',
    errorMessage: error?.message ?? String(_msg),
    stack: error?.stack ?? '',
    sourceFile: src,
    line: line ?? null,
    column: col ?? null,
  })
}

// ── unhandledrejection ─────────────────────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const isError = reason instanceof Error

  let name = 'UnhandledRejection'
  let message: string
  let stack: string | undefined

  if (isError) {
    name = reason.name || name
    message = reason.message
    stack = reason.stack
  } else if (typeof reason === 'object' && reason !== null) {
    message = JSON.stringify(reason, null, 2)
  } else {
    message = String(reason ?? 'Unhandled promise rejection')
  }

  reportError({ errorName: name, errorMessage: message, stack })
})

// ── dynamic import / chunk load errors ────────────────────────────────────
window.addEventListener('error', (event) => {
  const target = event.target
  // Script/link tag load failures (e.g. chunk 404 after deploy)
  if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement) {
    reportError({
      errorName: 'ChunkLoadError',
      errorMessage: `Failed to load resource: ${(target as HTMLScriptElement).src || (target as HTMLLinkElement).href}`,
      sourceFile: (target as HTMLScriptElement).src || (target as HTMLLinkElement).href,
    })
  }
}, { capture: true })

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './i18n'
import './styles/globals.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
