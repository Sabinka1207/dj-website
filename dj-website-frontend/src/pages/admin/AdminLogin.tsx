import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { setToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGoogleLogin = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (response) => {
      setError(false)
      const res = await fetch('/api/admin/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: response.access_token }),
      })
      if (!res.ok) { setError(true); return }
      const { token } = await res.json()
      setToken(token)
      navigate('/admin')
    },
    onError: () => setError(true),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setShowWarmup(false)
    warmupTimerRef.current = setTimeout(() => setShowWarmup(true), 8000)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) { setError(true); return }
      const { token } = await res.json()
      setToken(token)
      navigate('/admin')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setShowWarmup(false)
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
    }
  }

  useEffect(() => () => { if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current) }, [])

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h1 className={styles.loginTitle}>Admin</h1>
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className={styles.error}>Wrong password</p>}
        {showWarmup && <p className={styles.warmupHint}>Server warming up…</p>}
        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? '...' : 'Login'}
        </button>
        <div className={styles.divider}>or</div>
        <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnGoogle}`} type="button" onClick={() => handleGoogleLogin()}>
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>
      </form>
    </div>
  )
}
