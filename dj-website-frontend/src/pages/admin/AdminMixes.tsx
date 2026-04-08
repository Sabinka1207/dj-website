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
  homeFeatured: boolean
  homeDisplayOrder: number
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
  homeDisplayOrder: number
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
  hosted: 'MP3', youtube: 'YT', soundcloud: 'SC', mixcloud: 'MC', other: '?',
}

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

// ── Shared metadata fields ───────────────────────────────
function MetaFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.label}>
        Title *
        <input className={styles.input} value={form.title} onChange={onChange('title')} placeholder="Live Mix @ Club" />
      </label>
      <label className={styles.label}>
        Year
        <input className={styles.input} type="number" value={form.year} onChange={onChange('year')} placeholder="2024" />
      </label>
      <label className={styles.label}>
        Style / Genre
        <input className={styles.input} value={form.style} onChange={onChange('style')} placeholder="RnB, Hip-Hop, House…" />
      </label>
      <label className={styles.label}>
        Event
        <input className={styles.input} value={form.event} onChange={onChange('event')} placeholder="Festival, Club Night…" />
      </label>
      <label className={styles.label}>
        City
        <input className={styles.input} value={form.city} onChange={onChange('city')} placeholder="Frankfurt" />
      </label>
    </div>
  )
}

// ── Component ────────────────────────────────────────────
export default function AdminMixes() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const editCoverRef = useRef<HTMLInputElement>(null)

  const [hostedMixes, setHostedMixes] = useState<HostedMix[]>([])
  const [externalMixes, setExternalMixes] = useState<ExternalMix[]>([])

  // ── Add form (always visible) ──
  const [addSourceType, setAddSourceType] = useState<'hosted' | 'external'>('hosted')
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCover, setSelectedCover] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [addError, setAddError] = useState('')

  // ── Edit form (appears below table when a mix is selected) ──
  const [editingMix, setEditingMix] = useState<AnyMix | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

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
    return Promise.resolve()
  }

  useEffect(() => { load() }, [])

  // ── Add form handlers ──
  const handleAddChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddForm(f => ({ ...f, [key]: e.target.value }))

  const resetAdd = () => {
    setAddForm(EMPTY_FORM)
    setSelectedFile(null)
    setSelectedCover(null)
    setAddError('')
    setUploadProgress(null)
    if (fileRef.current) fileRef.current.value = ''
    if (coverRef.current) coverRef.current.value = ''
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null)
    setAddError('')
  }

  const handleUpload = () => {
    if (!selectedFile) { setAddError('Please choose a file first'); return }
    if (!addForm.title.trim()) { setAddError('Title is required'); return }
    setAddError(''); setUploading(true); setUploadProgress(0)

    const fd = new FormData()
    fd.append('file', selectedFile)
    if (selectedCover) fd.append('cover', selectedCover)
    fd.append('title', addForm.title.trim())
    fd.append('year', addForm.year || '0')
    fd.append('style', addForm.style.trim())
    fd.append('event', addForm.event.trim())
    fd.append('city', addForm.city.trim())

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/mixes/upload')
    const headers = authHeaders(false) as Record<string, string>
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      setUploading(false)
      if (xhr.status === 401) { clearToken(); navigate('/admin/login'); return }
      if (xhr.status < 200 || xhr.status >= 300) { setAddError('Upload failed'); setUploadProgress(null); return }
      resetAdd()
      load()
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploadProgress(null)
      setAddError('Upload failed')
    }

    xhr.send(fd)
  }

  const handleAddExternal = async () => {
    if (!addForm.embedUrl.trim()) { setAddError('Embed URL is required'); return }
    if (!addForm.title.trim()) { setAddError('Title is required'); return }
    setAddError(''); setUploading(true)
    const body = {
      embedUrl: addForm.embedUrl.trim(), title: addForm.title.trim(),
      year: parseInt(addForm.year) || 0, style: addForm.style.trim(),
      event: addForm.event.trim(), city: addForm.city.trim(),
    }
    const res = await fetch('/api/admin/external-mixes', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
    setUploading(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) { setAddError('Failed to save'); return }
    resetAdd()
    load()
  }

  // ── Edit form handlers ──
  const handleEditChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm(f => ({ ...f, [key]: e.target.value }))

  const handleEdit = (mix: AnyMix) => {
    setEditingMix(mix)
    setEditForm({
      embedUrl: mix.kind === 'external' ? mix.embedUrl : '',
      title: mix.title, year: mix.year.toString(), style: mix.style, event: mix.event, city: mix.city,
    })
    setEditError('')
  }

  const handleCancelEdit = () => {
    setEditingMix(null)
    setEditForm(EMPTY_FORM)
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (!editingMix) return
    if (!editForm.title.trim()) { setEditError('Title is required'); return }
    if (editingMix.kind === 'external' && !editForm.embedUrl.trim()) { setEditError('Embed URL is required'); return }
    setEditError(''); setSaving(true)

    let res: Response
    if (editingMix.kind === 'hosted') {
      const body = {
        title: editForm.title.trim(), year: parseInt(editForm.year) || 0,
        style: editForm.style.trim(), event: editForm.event.trim(), city: editForm.city.trim(),
      }
      res = await fetch(`/api/admin/mixes/${editingMix.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
    } else {
      const body = {
        embedUrl: editForm.embedUrl.trim(), title: editForm.title.trim(),
        year: parseInt(editForm.year) || 0, style: editForm.style.trim(),
        event: editForm.event.trim(), city: editForm.city.trim(),
      }
      res = await fetch(`/api/admin/external-mixes/${editingMix.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
    }
    setSaving(false)
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) { setEditError('Failed to save'); return }
    handleCancelEdit()
    load()
  }

  // ── Cover image (hosted mixes) ──
  const handleUpdateCover = async (mix: HostedMix, file: File) => {
    const fd = new FormData()
    fd.append('cover', file)
    const res = await fetch(`/api/admin/mixes/${mix.id}/cover`, { method: 'POST', headers: authHeaders(false), body: fd })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    load()
  }

  const handleRemoveCover = async (mix: HostedMix) => {
    if (!confirm('Remove cover image?')) return
    const res = await fetch(`/api/admin/mixes/${mix.id}/cover`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    load()
  }

  // ── Toggle featured ──
  const handleToggleFeatured = async (mix: AnyMix) => {
    const toggleUrl = mix.kind === 'hosted'
      ? `/api/admin/mixes/${mix.id}/featured`
      : `/api/admin/external-mixes/${mix.id}/featured`
    const res = await fetch(toggleUrl, { method: 'PATCH', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }

    if (!mix.homeFeatured) {
      // Enabling: assign next position using current count
      const nextPos = allFeatured.length + 1
      const orderUrl = mix.kind === 'hosted'
        ? `/api/admin/mixes/${mix.id}/home-order`
        : `/api/admin/external-mixes/${mix.id}/home-order`
      await fetch(orderUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ order: nextPos }) })
    } else {
      // Disabling: fetch fresh data, then renumber remaining featured mixes 1..N
      const [r1, r2] = await Promise.all([
        fetch('/api/admin/mixes', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin/external-mixes', { headers: authHeaders() }).then(r => r.json()),
      ])
      const remaining: AnyMix[] = [
        ...r1.map((m: any) => ({ ...m, kind: 'hosted' as const })),
        ...r2.map((m: any) => ({ ...m, kind: 'external' as const })),
      ]
        .filter((m: AnyMix) => m.homeFeatured)
        .sort((a: AnyMix, b: AnyMix) => (a.homeDisplayOrder || 0) - (b.homeDisplayOrder || 0))

      await Promise.all(remaining.map((m, i) => {
        const orderUrl = m.kind === 'hosted'
          ? `/api/admin/mixes/${m.id}/home-order`
          : `/api/admin/external-mixes/${m.id}/home-order`
        return fetch(orderUrl, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ order: i + 1 }) })
      }))
    }
    await load()
  }

  // ── Set home display order ──
  const handleSetHomeOrder = async (mix: AnyMix, order: number) => {
    const url = mix.kind === 'hosted'
      ? `/api/admin/mixes/${mix.id}/home-order`
      : `/api/admin/external-mixes/${mix.id}/home-order`
    await fetch(url, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ order }) })
    await load()
  }

  // ── Delete ──
  const handleDelete = async (mix: AnyMix) => {
    if (!confirm('Delete this mix?')) return
    const url = mix.kind === 'hosted' ? `/api/admin/mixes/${mix.id}` : `/api/admin/external-mixes/${mix.id}`
    const res = await fetch(url, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (editingMix?.id === (mix as ExternalMix).id) handleCancelEdit()
    load()
  }

  const allMixes: AnyMix[] = [...hostedMixes, ...externalMixes].sort((a, b) => (b.year || 0) - (a.year || 0))
  const allFeatured = allMixes.filter(m => m.homeFeatured)
  const usedOrders = new Set(allFeatured.map(m => m.homeDisplayOrder))
  const addDetectedType = detectType(addForm.embedUrl)
  const editDetectedType = detectType(editForm.embedUrl)

  return (
    <div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Mixes</h2>
      </div>

      {/* ══ ZONE 1: Add Mix ══════════════════════════════ */}
      <div className={styles.form}>
        <h3 className={styles.formTitle}>Add Mix</h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`${styles.btn} ${addSourceType === 'hosted' ? '' : styles.btnGhost}`}
            onClick={() => { setAddSourceType('hosted'); setAddError('') }}
            style={{ fontSize: '0.85rem' }}
          >
            ↑ Upload MP3
          </button>
          <button
            className={`${styles.btn} ${addSourceType === 'external' ? '' : styles.btnGhost}`}
            onClick={() => { setAddSourceType('external'); setAddError('') }}
            style={{ fontSize: '0.85rem' }}
          >
            🔗 External Link
          </button>
        </div>

        {addSourceType === 'external' && (
          <div style={{ marginBottom: 16 }}>
            <label className={`${styles.label} ${styles.fullWidth}`}>
              Embed URL *
              {addDetectedType && (
                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                  {addDetectedType.toUpperCase()}
                </span>
              )}
              <input
                className={styles.input}
                value={addForm.embedUrl}
                onChange={handleAddChange('embedUrl')}
                placeholder="https://www.youtube.com/embed/… or SoundCloud / Mixcloud player URL"
              />
            </label>
          </div>
        )}

        <MetaFields form={addForm} onChange={handleAddChange} />

        {addError && <p className={styles.errorMsg}>{addError}</p>}

        <div className={styles.formFooter}>
          {addSourceType === 'hosted' ? (
            <>
              <input ref={fileRef} type="file" accept=".mp3,audio/*" hidden onChange={handleFileSelect} />
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => setSelectedCover(e.target.files?.[0] ?? null)} />
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => fileRef.current?.click()}>
                Choose MP3
              </button>
              <span style={{ fontSize: '0.85rem', color: selectedFile ? 'var(--color-text)' : 'var(--color-text-muted)', alignSelf: 'center' }}>
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => coverRef.current?.click()} style={{ marginLeft: 8 }}>
                Cover image
              </button>
              <span style={{ fontSize: '0.85rem', color: selectedCover ? 'var(--color-text)' : 'var(--color-text-muted)', alignSelf: 'center' }}>
                {selectedCover ? selectedCover.name : 'Optional'}
              </span>
              {uploadProgress !== null && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 3, transition: 'width 0.2s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums', minWidth: 36 }}>
                    {uploadProgress}%
                  </span>
                </div>
              )}
              <button className={styles.btn} onClick={handleUpload} disabled={!selectedFile || uploading} style={{ marginLeft: uploadProgress !== null ? 0 : 'auto' }}>
                {uploading ? 'Uploading…' : '↑ Upload'}
              </button>
            </>
          ) : (
            <button className={styles.btn} onClick={handleAddExternal} disabled={uploading}>
              {uploading ? 'Saving…' : '+ Add Mix'}
            </button>
          )}
        </div>
      </div>

      {/* ══ ZONE 2: Mixes table ══════════════════════════ */}
      <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
        Home page: <strong style={{ color: 'var(--color-accent)' }}>{allFeatured.length}</strong> mixes featured
        <span style={{ marginLeft: 8, opacity: 0.6 }}>(click <HomeIcon filled={true} /> to toggle, then set position)</span>
      </div>

      {allMixes.length === 0 ? (
        <p className={styles.empty}>No mixes yet.</p>
      ) : (
        <div className={styles.tableWrap} style={{ marginBottom: editingMix ? 32 : 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Year</th>
                <th>Style</th>
                <th>Event</th>
                <th>City</th>
                <th title="Show on home page">Home</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allMixes.map(mix => (
                <>
                  <tr key={`${mix.kind}-${mix.id}`}>
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className={styles.iconBtn}
                          style={{ color: mix.homeFeatured ? 'var(--color-accent)' : undefined }}
                          onClick={() => handleToggleFeatured(mix)}
                          title={mix.homeFeatured ? 'Remove from home page' : 'Show on home page'}
                        >
                          <HomeIcon filled={mix.homeFeatured} />
                        </button>
                        {mix.homeFeatured && (
                          <select
                            value={mix.homeDisplayOrder || 1}
                            title="Position on home page"
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, color: 'var(--color-accent)', fontSize: '0.8rem', padding: '2px 4px' }}
                            onChange={e => handleSetHomeOrder(mix, parseInt(e.target.value))}
                          >
                            {Array.from({ length: allFeatured.length }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n} disabled={usedOrders.has(n) && mix.homeDisplayOrder !== n}>
                                #{n}{usedOrders.has(n) && mix.homeDisplayOrder !== n ? ' ✕' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {(mix.kind === 'external' || mix.kind === 'hosted') && (
                          <button
                            className={styles.iconBtn}
                            style={{ color: editingMix?.id === mix.id && editingMix?.kind === mix.kind ? 'var(--color-accent)' : undefined }}
                            onClick={() => editingMix?.id === mix.id && editingMix?.kind === mix.kind ? handleCancelEdit() : handleEdit(mix)}
                            title={editingMix?.id === mix.id && editingMix?.kind === mix.kind ? 'Close editor' : 'Edit'}
                          >
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

                  {/* Inline edit row — appears directly under the selected mix */}
                  {editingMix?.id === mix.id && editingMix?.kind === mix.kind && (
                    <tr key={`edit-${mix.id}`}>
                      <td colSpan={9} style={{ padding: 0, borderTop: '2px solid var(--color-accent)' }}>
                        <div style={{ background: '#0d0d0d', padding: '20px 24px' }}>
                          {mix.kind === 'external' && (
                          <div style={{ marginBottom: 16 }}>
                            <label className={`${styles.label} ${styles.fullWidth}`}>
                              Embed URL
                              {editDetectedType && (
                                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                                  {editDetectedType.toUpperCase()}
                                </span>
                              )}
                              <input
                                className={styles.input}
                                value={editForm.embedUrl}
                                onChange={handleEditChange('embedUrl')}
                              />
                            </label>
                          </div>
                          )}
                          <MetaFields form={editForm} onChange={handleEditChange} />

                          {mix.kind === 'hosted' && (
                            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              {mix.coverUrl && (
                                <img src={mix.coverUrl} alt="cover" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid #2a2a2a' }} />
                              )}
                              <input ref={editCoverRef} type="file" accept="image/*" hidden
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpdateCover(mix as HostedMix, f) }} />
                              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => editCoverRef.current?.click()} style={{ fontSize: '0.82rem' }}>
                                {mix.coverUrl ? 'Replace cover' : 'Add cover'}
                              </button>
                              {mix.coverUrl && (
                                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleRemoveCover(mix as HostedMix)} style={{ fontSize: '0.82rem', color: 'var(--color-danger, #e55)' }}>
                                  Remove cover
                                </button>
                              )}
                            </div>
                          )}

                          {editError && <p className={styles.errorMsg}>{editError}</p>}
                          <div className={styles.formFooter}>
                            <button className={styles.btn} onClick={handleSaveEdit} disabled={saving}>
                              {saving ? 'Saving…' : '✓ Update'}
                            </button>
                            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleCancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
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
