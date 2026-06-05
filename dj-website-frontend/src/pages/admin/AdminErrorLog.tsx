import { useEffect, useState } from 'react'
import { authHeaders } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type ErrorLogEntry = {
  id: number
  occurredAt: string
  errorType: string
  message: string | null
  method: string | null
  uri: string | null
  ip: string | null
  userAgent: string | null
  stackTrace: string | null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' }).replace('T', ' ')
}

export default function AdminErrorLog() {
  const [entries, setEntries] = useState<ErrorLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/error-log', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setEntries(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: number) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Error Log</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Last 200 errors · most recent first
        </span>
      </div>

      {loading && <div className={styles.loadingRow}><span className={styles.spinner} /></div>}

      {!loading && entries.length === 0 && (
        <div className={styles.analyticsEmpty}>No errors recorded.</div>
      )}

      {!loading && entries.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Time</th>
                <th>Type</th>
                <th>Endpoint</th>
                <th>IP</th>
                <th>User-Agent</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <>
                  <tr
                    key={e.id}
                    style={{ cursor: e.stackTrace ? 'pointer' : 'default' }}
                    onClick={() => e.stackTrace && toggle(e.id)}
                  >
                    <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(e.occurredAt)}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>
                        {e.errorType}
                      </code>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {e.method && e.uri ? (
                        <span>
                          <strong>{e.method}</strong>{' '}
                          <span style={{ opacity: 0.75 }}>{e.uri}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {e.ip ?? '—'}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span title={e.userAgent ?? ''}>{e.userAgent ?? '—'}</span>
                    </td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span title={e.message ?? ''}>{e.message ?? '—'}</span>
                    </td>
                  </tr>
                  {expandedId === e.id && e.stackTrace && (
                    <tr key={`${e.id}-trace`}>
                      <td colSpan={6} style={{ padding: '12px 16px', background: 'var(--color-surface, #111)' }}>
                        {e.userAgent && (
                          <div style={{ marginBottom: 8, fontSize: '0.78rem', opacity: 0.7 }}>
                            <strong>User-Agent:</strong> {e.userAgent}
                          </div>
                        )}
                        <pre style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          fontSize: '0.72rem',
                          lineHeight: 1.5,
                          color: 'var(--color-text-muted)',
                          maxHeight: 320,
                          overflowY: 'auto',
                        }}>
                          {e.stackTrace}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
