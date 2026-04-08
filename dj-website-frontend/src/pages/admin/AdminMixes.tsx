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
  homeFeatured: boolean
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

// ── Home icon for featured toggle ────────────────────────
function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

// ── Component ────────────────────────────────────────────
export default function AdminMixes() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [hostedMixes, setHostedMixes] = useState<HostedMix[]>([])
  const [externalMixes, setExternalMixes] = useState<ExternalMix[]>([])

  const [sourceType, setSourceType] = useState<'hosted' | 'external'>('hosted')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  // ── Form helpers ──
  const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setSelectedFile(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleEdit = (mix: ExternalMix) => {
    setEditing({ id: mix.id })
    setSourceType('external')
    setForm({ embedUrl: mix.embedUrl, title: mix.title, year: mix.year.toString(), style: mix.style, event: mix.event, city: mix.city })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── File selection (no upload yet) ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setError('')
  }

  // ── Upload MP3 ──
  const handleUpload = async () => {
    if (!selectedFile) { setError('Please choose a file first'); return }
    if (!form.title.trim()) { setError('Title is required'); return }
    setError(''); setUploading(true)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('title', form.title.trim())
    fd.append('year', form.year || '0')
    fd.append('style', form.style.trim())
    fd.append('event', form.event.trim())
    fd.append('city', form.city.trim())
    const res = await fetch('/api/admin/mixes/upload', { method: 'POST', headers: authHeaders(false), body: fd })
    setUploading(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) { setError('Upload failed'); return }
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

  // ── Toggle featured on home ──
  const handleToggleFeatured = async (mix: ExternalMix) => {
    const res = await fetch(`/api/admin/external-mixes/${mix.id}/featured`, { method: 'PATCH', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
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

  const featuredVideos = externalMixes.filter(m => m.homeFeatured && m.embedType === 'youtube').length
  const featuredAudio = externalMixes.filter(m => m.homeFeatured && m.embedType !== 'youtube').length
  const detectedType = detectType(form.embedUrl)

  return (
    <div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Mixes</h2>
      </div>

      {/* ── Add / Edit form ── */}
      <div className={`${styles.form} ${editing ? styles.formEdit : ''}`}>
        <h3 className={styles.formTitle}>
          {editing ? (
            <span>Edit Mix <span style={{ color: 'var(--color-accent)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {form.title || '…'}</span></span>
          ) : 'Add Mix'}
        </h3>

        {/* Source toggle (only when not editing) */}
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

        {/* External URL */}
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

        {/* Common metadata */}
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
              {/* Step 1: choose file */}
              <input ref={fileRef} type="file" accept=".mp3,audio/*" hidden onChange={handleFileSelect} />
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => fileRef.current?.click()}>
                Choose file
              </button>
              <span style={{ fontSize: '0.85rem', color: selectedFile ? 'var(--color-text)' : 'var(--color-text-muted)', alignSelf: 'center' }}>
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
              {/* Step 2: upload */}
              <button
                className={styles.btn}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                style={{ marginLeft: 'auto' }}
              >
                {uploading ? 'Uploading…' : '↑ Upload'}
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

      {/* ── Home page featured summary ── */}
      <div style={{ marginBottom: 16, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
        Home page: <strong style={{ color: 'var(--color-accent)' }}>{featuredVideos}</strong> video{featuredVideos !== 1 ? 's' : ''} · <strong style={{ color: 'var(--color-accent)' }}>{featuredAudio}</strong> audio mix{featuredAudio !== 1 ? 'es' : ''} featured
        <span style={{ marginLeft: 8, opacity: 0.7 }}>(click <HomeIcon filled={true} /> to toggle)</span>
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
                <th title="Show on home page">Home</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allMixes.map(mix => (
                <tr key={`${mix.kind}-${mix.id}`} style={{ opacity: editing && mix.kind === 'external' && editing.id === mix.id ? 0.5 : 1 }}>
                  <td>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                      {mix.kind === 'hosted' ? 'MP3' : (TYPE_LABEL[mix.embedType] ?? '?')}
                    </span>
                  </td>
                  <td>{mix.title}</td>
                  <td>{mix.year || '—'}</td>
                  <td style={{ maxWidth: 240, wordBreak: 'break-word', lineHeight: '1.4' }}>{mix.style || '—'}</td>
                  <td>{mix.event || '—'}</td>
                  <td>{mix.city || '—'}</td>
                  <td>{mix.kind === 'hosted' ? formatTime(mix.durationSeconds) : '—'}</td>
                  <td>
                    {mix.kind === 'external' ? (
                      <button
                        className={styles.iconBtn}
                        style={{ color: mix.homeFeatured ? 'var(--color-accent)' : undefined }}
                        onClick={() => handleToggleFeatured(mix)}
                        title={mix.homeFeatured ? 'Remove from home page' : 'Show on home page'}
                      >
                        <HomeIcon filled={mix.homeFeatured} />
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {mix.kind === 'external' && (
                        <button className={styles.iconBtn} onClick={() => handleEdit(mix)} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(mix)} title="Delete">
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
