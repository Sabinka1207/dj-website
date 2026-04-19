import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type ExternalMix = {
  id: number
  embedUrl: string
  embedType: string
  title: string
  year: number
  style: string
  event: string
  city: string
}

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

const TYPE_LABEL: Record<string, string> = {
  youtube: 'YT',
  soundcloud: 'SC',
  mixcloud: 'MC',
  other: '?',
}

function detectType(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('soundcloud.com')) return 'soundcloud'
  if (url.includes('mixcloud.com')) return 'mixcloud'
  return url ? 'other' : ''
}

function toEmbedUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return url

  try {
    // YouTube watch URL → embed
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v')
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    // YouTube short URL → embed
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    // Mixcloud direct URL → widget
    if (url.includes('mixcloud.com') && !url.includes('player-widget') && !url.includes('widget/iframe')) {
      const path = new URL(url).pathname
      return `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}`
    }
    // SoundCloud direct URL → widget
    if (url.includes('soundcloud.com') && !url.includes('w.soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
    }
  } catch {
    // invalid URL — return as-is
  }

  return url
}

export default function AdminExternalMixes() {
  const navigate = useNavigate()
  const [mixes, setMixes] = useState<ExternalMix[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/external-mixes', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setMixes(await res.json())
    setListLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleUrlBlur = () =>
    setForm(f => ({ ...f, embedUrl: toEmbedUrl(f.embedUrl) }))

  const handleEdit = (mix: ExternalMix) => {
    setEditingId(mix.id)
    setForm({ embedUrl: mix.embedUrl, title: mix.title, year: mix.year.toString(), style: mix.style, event: mix.event, city: mix.city })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const handleSave = async () => {
    if (!form.embedUrl.trim()) { setError('Embed URL is required'); return }
    if (!form.title.trim()) { setError('Title is required'); return }
    setError('')
    setSaving(true)

    const body = {
      embedUrl: toEmbedUrl(form.embedUrl),
      title: form.title.trim(),
      year: parseInt(form.year) || 0,
      style: form.style.trim(),
      event: form.event.trim(),
      city: form.city.trim(),
    }

    const url = editingId ? `/api/admin/external-mixes/${editingId}` : '/api/admin/external-mixes'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })

    setSaving(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) { setError('Failed to save'); return }

    setEditingId(null)
    setForm(EMPTY_FORM)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mix?')) return
    const res = await fetch(`/api/admin/external-mixes/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (editingId === id) handleCancel()
    load()
  }

  const detectedType = detectType(form.embedUrl)

  return (
    <div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>External Mixes</h2>
      </div>

      <div className={styles.form}>
        <h3 className={styles.formTitle}>{editingId ? 'Edit Mix' : 'Add External Mix'}</h3>
        <div className={styles.formGrid}>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            URL *
            {detectedType && (
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                {detectedType.toUpperCase()}
              </span>
            )}
            <input
              className={styles.input}
              value={form.embedUrl}
              onChange={handleChange('embedUrl')}
              onBlur={handleUrlBlur}
              placeholder="https://www.youtube.com/watch?v=... or mixcloud.com/... or soundcloud.com/..."
            />
          </label>
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
          <button className={styles.btn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editingId ? '✓ Update' : '+ Add Mix'}
          </button>
          {editingId && (
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {mixes.length === 0 ? (
        listLoading
          ? <div className={styles.loadingRow}><span className={styles.spinner} /></div>
          : <p className={styles.empty}>No external mixes yet.</p>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mixes.map(mix => (
                <tr key={mix.id} style={{ opacity: editingId === mix.id ? 0.6 : 1 }}>
                  <td>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                      {TYPE_LABEL[mix.embedType] ?? '?'}
                    </span>
                  </td>
                  <td>{mix.title}</td>
                  <td>{mix.year || '—'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mix.style || '—'}</td>
                  <td>{mix.event || '—'}</td>
                  <td>{mix.city || '—'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={`${styles.iconBtn}`}
                        onClick={() => handleEdit(mix)}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => handleDelete(mix.id)}
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
