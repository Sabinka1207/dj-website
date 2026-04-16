import { Component, ErrorInfo, ReactNode } from 'react'
import { reportError } from '../utils/reportError'

interface Props { children: ReactNode }
interface State { crashed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const stack = [error.stack, info.componentStack].filter(Boolean).join('\n\n')
    reportError(error.message || String(error), stack)
  }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0a', color: '#ccc', fontFamily: 'sans-serif', textAlign: 'center', padding: 24,
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 16 }}>Something went wrong.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none', border: '1px solid #444', color: '#ccc',
              padding: '8px 20px', cursor: 'pointer', borderRadius: 3, fontSize: '0.9rem',
            }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
