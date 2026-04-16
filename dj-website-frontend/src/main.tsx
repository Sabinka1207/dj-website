import { StrictMode } from 'react'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './i18n'
import './styles/globals.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { reportError } from './utils/reportError.ts'

window.onerror = (_msg, _src, _line, _col, error) => {
  reportError(error?.message ?? String(_msg), error?.stack)
}

window.onunhandledrejection = (event) => {
  const reason = event.reason
  const message = reason instanceof Error ? reason.message : String(reason ?? 'Unhandled promise rejection')
  const stack = reason instanceof Error ? reason.stack : undefined
  reportError(message, stack)
}

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
