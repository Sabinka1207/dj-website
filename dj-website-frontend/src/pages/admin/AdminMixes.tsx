import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

// ── Types ────────────────────────────────────────────────
type HostedMix = {
  kind: 'hosted'
  id: number
  publicId: string
  url: string
  title: string
  year: number
  style: string
  event: string
  city: string
  durationSeconds: number
  displayOrder: number
}

type ExternalMix = {
  kind: 'external'
  id: number
  embedUrl: string
  embedType: string
  title: string
  year: number
  style: string
  event: string
  city: string
}

type AnyMix = HostedMix | ExternalMix

type FormState = {
  embedUrl: string
  title: string
  year: string
  style: string
  event: string
  city: string
}

const EMPTY_FORM: FormState = {
  embedUrl: '',
  title: '',
  year: new Date().getFullYear().toString(),
  style: '',
  event: '',
  city: '',
}

// ── Helpers ──────────────────────────────────────────────
function formatTime(seconds: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function detectType(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('soundcloud.com')) return 'soundcloud'
  if (url.includes('mixcloud.com')) return 'mixcloud'
  return 'other'
}

const TYPE_LABEL: Record<string, string> = {
  hosted: 'MP3',
  youtube: 'YT',
  soundcloud: 'SC',
  mixcloud: 'MC',
  other: '?',
}

// ── Component ────────────────────────────────────────────
export default function AdminMixes() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [hostedMixes, setHostedMixes] = useState<HostedMix[]>([])
  const [externalMixes, setExternalMixes] = useState<ExternalMix[]>([])

  const [sourceType, setSourceType] = useState<'hosted' | 'external'>('hosted')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editing, setEditing] = useState<{ id: number } | null>(null)

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Load ──
  const load = async () => {
    const [r1, r2] = await Promise.all([
      fetch('/api/admin/mixes', { headers: authHeaders() }),
      fetch('/api/admin/external-mixes', { headers: authHeaders() }),
    ])
    if (r1.status === 401 || r2.status === 401) { clearToken(); navigate('/admin/login'); return }
    const hosted: Omit<HostedMix, 'kind'>[] = await r1.json()
    const external: Omit<ExternalMix, 'kind'>[] = await r2.json()
    setHostedMixes(hosted.map(m => ({ ...m, kind: 'hosted' })))
    setExternalMixes(external.map(m => ({ ...m, kind: 'external' })))
  }

  useEffect(() => { load() }, [])

  // ── Form ──
  const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); setError('') }

  const handleEdit = (mix: ExternalMix) => {
    setEditing({ id: mix.id })
    setSourceType('external')
    setForm({ embedUrl: mix.embedUrl, title: mix.title, year: mix.year.toString(), style: mix.style, event: mix.event, city: mix.city })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Upload MP3 ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!form.title.trim()) { setError('Title is required'); return }
    setError(''); setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title.trim())
    fd.append('year', form.year || '0')
    fd.append('style', form.style.trim())
    fd.append('event', form.event.trim())
    fd.append('city', form.city.trim())
    const res = await fetch('/api/admin/mixes/upload', { method: 'POST', headers: authHeaders(false), body: fd })
    setUploading(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (fileRef.current) fileRef.current.value = ''
    resetForm()
    load()
  }

  // ── Save external ──
  const handleSaveExternal = async () => {
    if (!form.embedUrl.trim()) { setError('Embed URL is required'); return }
    if (!form.title.trim()) { setError('Title is required'); return }
    setError(''); setSaving(true)
    const body = {
      embedUrl: form.embedUrl.trim(),
      title: form.title.trim(),
      year: parseInt(form.year) || 0,
      style: form.style.trim(),
      event: form.event.trim(),
      city: form.city.trim(),
    }
    const url = editing ? `/api/admin/external-mixes/${editing.id}` : '/api/admin/external-mixes'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    setSaving(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) { setError('Failed to save'); return }
    resetForm()
    load()
  }

  // ── Delete ──
  const handleDelete = async (mix: AnyMix) => {
    if (!confirm('Delete this mix?')) return
    const url = mix.kind === 'hosted'
      ? `/api/admin/mixes/${mix.id}`
      : `/api/admin/external-mixes/${mix.id}`
    const res = await fetch(url, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (editing && mix.kind === 'external' && editing.id === mix.id) resetForm()
    load()
  }

  // ── Combined list sorted by year desc ──
  const allMixes: AnyMix[] = [
    ...hostedMixes,
    ...externalMixes,
  ].sort((a, b) => (b.year || 0) - (a.year || 0))

  const typeLabel = (mix: AnyMix) =>
    mix.kind === 'hosted' ? TYPE_LABEL['hosted'] : (TYPE_LABEL[mix.embedType] ?? '?')

  const detectedType = detectType(form.embedUrl)

  return (
    <div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Mixes</h2>
      </div>

      {/* ── Add / Edit form ── */}
      <div className={styles.form}>
        <h3 className={styles.formTitle}>{editing ? 'Edit Mix' : 'Add Mix'}</h3>

        {/* Source type toggle */}
        {!editing && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              className={`${styles.btn} ${sourceType === 'hosted' ? '' : styles.btnGhost}`}
              onClick={() => { setSourceType('hosted'); setError('') }}
              style={{ fontSize: '0.85rem' }}
            >
              ↑ Upload MP3
            </button>
            <button
              className={`${styles.btn} ${sourceType === 'external' ? '' : styles.btnGhost}`}
              onClick={() => { setSourceType('external'); setError('') }}
              style={{ fontSize: '0.85rem' }}
            >
              🔗 External Link
            </button>
          </div>
        )}

        {/* External URL field */}
        {sourceType === 'external' && (
          <div style={{ marginBottom: 16 }}>
            <label className={`${styles.label} ${styles.fullWidth}`}>
              Embed URL *
              {detectedType && (
                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                  {detectedType.toUpperCase()}
                </span>
              )}
              <input
                className={styles.input}
                value={form.embedUrl}
                onChange={handleChange('embedUrl')}
                placeholder="https://www.youtube.com/embed/… or SoundCloud / Mixcloud player URL"
              />
            </label>
          </div>
        )}

        {/* Common metadata fields */}
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Title *
            <input className={styles.input} value={form.title} onChange={handleChange('title')} placeholder="Live Mix @ Club" />
          </label>
          <label className={styles.label}>
            Year
            <input className={styles.input} type="number" value={form.year} onChange={handleChange('year')} placeholder="2024" />
          </label>
          <label className={styles.label}>
            Style / Genre
            <input className={styles.input} value={form.style} onChange={handleChange('style')} placeholder="RnB, Hip-Hop, House…" />
          </label>
          <label className={styles.label}>
            Event
            <input className={styles.input} value={form.event} onChange={handleChange('event')} placeholder="Festival, Club Night…" />
          </label>
          <label className={styles.label}>
            City
            <input className={styles.input} value={form.city} onChange={handleChange('city')} placeholder="Frankfurt" />
          </label>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <div className={styles.formFooter}>
          {sourceType === 'hosted' && !editing ? (
            <>
              <input ref={fileRef} type="file" accept=".mp3,audio/*" hidden onChange={handleUpload} />
              <button className={styles.btn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '↑ Choose MP3 & Upload'}
              </button>
            </>
          ) : (
            <>
              <button className={styles.btn} onClick={handleSaveExternal} disabled={saving}>
                {saving ? 'Saving…' : editing ? '✓ Update' : '+ Add Mix'}
              </button>
              {editing && (
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={resetForm}>
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Combined list ── */}
      {allMixes.length === 0 ? (
        <p className={styles.empty}>No mixes yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Year</th>
                <th>Style</th>
                <th>Event</th>
                <th>City</th>
                <th>Duration</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allMixes.map(mix => (
                <tr key={`${mix.kind}-${mix.id}`} style={{ opacity: editing && mix.kind === 'external' && editing.id === mix.id ? 0.5 : 1 }}>
                  <td>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                      {typeLabel(mix)}
                    </span>
                  </td>
                  <td>{mix.title}</td>
                  <td>{mix.year || '—'}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mix.style || '—'}</td>
                  <td>{mix.event || '—'}</td>
                  <td>{mix.city || '—'}</td>
                  <td>{mix.kind === 'hosted' ? formatTime(mix.durationSeconds) : '—'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {mix.kind === 'external' && (
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEdit(mix)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(mix)}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
