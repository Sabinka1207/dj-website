import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Event = {
  id: string
  date: string
  venue: string
  city: string
  country: string
  description: string
  posterUrl: string
  posterFocusX: number
  posterFocusY: number
}

type FormState = {
  date: string
  venue: string
  city: string
  country: string
  partyName: string
  hours: string
}

const EMPTY_FORM: FormState = { date: '', venue: '', city: '', country: 'DE', partyName: '', hours: '' }

const parseDescription = (desc: string): { partyName: string; hours: string } => {
  const idx = desc.indexOf(' · ')
  if (idx === -1) return { partyName: desc, hours: '' }
  return { partyName: desc.slice(0, idx), hours: desc.slice(idx + 3) }
}

const buildDescription = (partyName: string, hours: string): string =>
  hours.trim() ? `${partyName} · ${hours.trim()}` : partyName

// Returns crop box position/size in rendered-image pixel coordinates.
// Clicking should CENTER the crop on the clicked point.
// For portrait images (rw/rh ≤ 3/4): crop spans full width, Y controls vertical offset.
// For landscape images (rw/rh > 3/4): crop spans full height, X controls horizontal offset.
const getCropBox = (rw: number, rh: number, fx: number, fy: number) => {
  if (rw / rh <= 3 / 4) {
    const cropW = rw
    const cropH = cropW * (4 / 3)
    const extra = rh - cropH
    return { left: 0, top: (fy / 100) * extra, width: cropW, height: cropH }
  } else {
    const cropH = rh
    const cropW = cropH * (3 / 4)
    const extra = rw - cropW
    return { left: (fx / 100) * extra, top: 0, width: cropW, height: cropH }
  }
}

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPosterUrl, setEditingPosterUrl] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [removingPoster, setRemovingPoster] = useState<string | null>(null)
  const [focusX, setFocusX] = useState(50)
  const [focusY, setFocusY] = useState(50)
  const [savingFocus, setSavingFocus] = useState(false)
  const [showFocalModal, setShowFocalModal] = useState(false)
  const [tempFocusX, setTempFocusX] = useState(50)
  const [tempFocusY, setTempFocusY] = useState(50)
  const [renderedImgSize, setRenderedImgSize] = useState<{ w: number; h: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const posterInputRef = useRef<HTMLInputElement>(null)
  const focalImgRef = useRef<HTMLImageElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartClientPos = useRef({ x: 0, y: 0 })
  const dragStartFocus = useRef({ x: 50, y: 50 })

  const load = async () => {
    const res = await fetch('/api/admin/events', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) { setEvents(data); setListLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Handle cached images that fire load before React attaches onLoad
  useEffect(() => {
    if (!showFocalModal) return
    const img = focalImgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setRenderedImgSize({ w: img.offsetWidth, h: img.offsetHeight })
    }
  }, [showFocalModal])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setEditingPosterUrl('')
    setPosterFile(null)
    setPosterPreview(null)
    setFocusX(50)
    setFocusY(50)
    setShowForm(true)
  }

  const openEdit = (ev: Event) => {
    const { partyName, hours } = parseDescription(ev.description)
    setForm({ date: ev.date, venue: ev.venue, city: ev.city, country: ev.country, partyName, hours })
    setEditingId(ev.id)
    setEditingPosterUrl(ev.posterUrl)
    setPosterFile(null)
    setPosterPreview(null)
    setFocusX(ev.posterFocusX)
    setFocusY(ev.posterFocusY)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setPosterFile(null)
    setPosterPreview(null)
    if (posterInputRef.current) posterInputRef.current.value = ''
  }

  const handlePosterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPosterFile(file)
    setPosterPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        venue: form.venue,
        city: form.city,
        country: form.country,
        description: buildDescription(form.partyName, form.hours),
      }
      const url = editingId ? `/api/admin/events/${editingId}` : '/api/admin/events'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
      if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      const saved: Event = await res.json()

      if (posterFile) {
        const fd = new FormData()
        fd.append('poster', posterFile)
        const posterRes = await fetch(`/api/admin/events/${saved.id}/poster`, {
          method: 'POST',
          headers: authHeaders(false),
          body: fd,
        })
        if (posterRes.status === 401) { clearToken(); navigate('/admin/login'); return }
      }

      if (posterInputRef.current) posterInputRef.current.value = ''
      setPosterFile(null)
      setPosterPreview(null)
      setShowForm(false)
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const openFocalModal = () => {
    setTempFocusX(focusX)
    setTempFocusY(focusY)
    setRenderedImgSize(null)
    setShowFocalModal(true)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    const rw = rect.width
    const rh = rect.height
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    // On tap/click, immediately center the crop on the touch point, then track drag from there
    let initX = tempFocusX, initY = tempFocusY
    if (rw / rh <= 3 / 4) {
      const cropH = rw * (4 / 3)
      const extra = rh - cropH
      initY = extra <= 0 ? 50 : Math.round(Math.max(0, Math.min(extra, cy - cropH / 2)) / extra * 100)
      initX = Math.round((cx / rw) * 100)
    } else {
      const cropW = rh * (3 / 4)
      const extra = rw - cropW
      initX = extra <= 0 ? 50 : Math.round(Math.max(0, Math.min(extra, cx - cropW / 2)) / extra * 100)
      initY = Math.round((cy / rh) * 100)
    }

    setTempFocusX(initX)
    setTempFocusY(initY)
    setRenderedImgSize({ w: rw, h: rh })
    isDraggingRef.current = true
    dragStartClientPos.current = { x: e.clientX, y: e.clientY }
    dragStartFocus.current = { x: initX, y: initY }
    setGrabbing(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const rw = rect.width
    const rh = rect.height
    const dx = e.clientX - dragStartClientPos.current.x
    const dy = e.clientY - dragStartClientPos.current.y
    let newX: number, newY: number

    if (rw / rh <= 3 / 4) {
      const cropH = rw * (4 / 3)
      const extra = rh - cropH
      if (extra <= 0) { newX = dragStartFocus.current.x; newY = dragStartFocus.current.y }
      else {
        const startTop = (dragStartFocus.current.y / 100) * extra
        newX = dragStartFocus.current.x
        newY = Math.round(Math.max(0, Math.min(extra, startTop + dy)) / extra * 100)
      }
    } else {
      const cropW = rh * (3 / 4)
      const extra = rw - cropW
      if (extra <= 0) { newX = dragStartFocus.current.x; newY = dragStartFocus.current.y }
      else {
        const startLeft = (dragStartFocus.current.x / 100) * extra
        newX = Math.round(Math.max(0, Math.min(extra, startLeft + dx)) / extra * 100)
        newY = dragStartFocus.current.y
      }
    }

    setTempFocusX(newX)
    setTempFocusY(newY)
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
    setGrabbing(false)
  }

  const confirmFocal = async () => {
    const newX = tempFocusX
    const newY = tempFocusY
    setFocusX(newX)
    setFocusY(newY)
    setShowFocalModal(false)
    if (!editingId) return
    setSavingFocus(true)
    try {
      const res = await fetch(`/api/admin/events/${editingId}/poster-focus`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ focusX: newX, focusY: newY }),
      })
      if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      await load()
    } finally {
      setSavingFocus(false)
    }
  }

  const handleRemovePoster = async (id: string) => {
    setRemovingPoster(id)
    try {
      const res = await fetch(`/api/admin/events/${id}/poster`, { method: 'DELETE', headers: authHeaders() })
      if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      if (editingId === id) setEditingPosterUrl('')
      await load()
    } finally {
      setRemovingPoster(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    await load()
  }

  const cropBox = renderedImgSize
    ? getCropBox(renderedImgSize.w, renderedImgSize.h, tempFocusX, tempFocusY)
    : null

  return (
    <>
      <div>
        <div className={styles.panelHeader}>
          <h1 className={styles.panelTitle}>Events</h1>
          <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={openAdd} title="Add event">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {showForm && (
          <form className={styles.form} onSubmit={handleSave}>
            <h2 className={styles.formTitle}>{editingId ? 'Edit event' : 'New event'}</h2>
            <div className={styles.formGrid}>
              <label className={styles.label}>
                Date
                <input className={styles.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                Venue
                <input className={styles.input} type="text" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                City
                <input className={styles.input} type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                Country
                <input className={styles.input} type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                Party name
                <input className={styles.input} type="text" placeholder="e.g. Ukrainian party" value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                Hours <span className={styles.optional}>(optional)</span>
                <input className={styles.input} type="text" placeholder="e.g. 22:00 – 4:00" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              </label>
            </div>

            {/* Poster upload */}
            <div className={styles.label} style={{ marginTop: 20 }}>
              Poster <span className={styles.optional}>(optional)</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
              <input ref={posterInputRef} type="file" accept="image/*" hidden onChange={handlePosterChange} />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ fontSize: '0.8rem', padding: '6px 14px', flexShrink: 0 }}
                onClick={() => posterInputRef.current?.click()}
              >
                {editingPosterUrl && !posterPreview ? 'Replace poster' : 'Choose image'}
              </button>
              {posterFile && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>{posterFile.name}</span>
              )}
              {editingId && editingPosterUrl && !posterPreview && (
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  title="Remove poster"
                  disabled={removingPoster === editingId}
                  onClick={() => handleRemovePoster(editingId)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              )}
            </div>

            {/* Visible area picker trigger — only when a saved poster exists */}
            {editingId && editingPosterUrl && !posterPreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <img
                  src={editingPosterUrl}
                  alt="crop preview"
                  style={{
                    width: 36, height: 48,
                    objectFit: 'cover',
                    objectPosition: `${focusX}% ${focusY}%`,
                    borderRadius: 2, display: 'block', flexShrink: 0,
                  }}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={openFocalModal}
                >
                  Set visible area
                </button>
                {savingFocus && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Saving…</span>
                )}
              </div>
            )}

            <div className={styles.formFooter}>
              <button className={styles.btn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Date</th>
                <th>Venue</th>
                <th>City</th>
                <th>Country</th>
                <th>Party name</th>
                <th>Hours</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const { partyName, hours } = parseDescription(ev.description)
                return (
                  <tr key={ev.id}>
                    <td style={{ width: 44, padding: '4px 8px' }}>
                      {ev.posterUrl ? (
                        <img
                          src={ev.posterUrl}
                          alt="poster"
                          style={{
                            width: 36,
                            height: 48,
                            objectFit: 'cover',
                            objectPosition: `${ev.posterFocusX}% ${ev.posterFocusY}%`,
                            borderRadius: 2,
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span className={styles.muted} style={{ fontSize: '1.1rem' }}>—</span>
                      )}
                    </td>
                    <td>{ev.date}</td>
                    <td>{ev.venue}</td>
                    <td>{ev.city}</td>
                    <td>{ev.country}</td>
                    <td>{partyName}</td>
                    <td>{hours || <span className={styles.muted}>—</span>}</td>
                    <td className={styles.rowActions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(ev)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(ev.id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {events.length === 0 && (
                <tr><td colSpan={8} className={styles.empty}>{listLoading ? <span className={styles.spinner} style={{ margin: '0 auto' }} /> : 'No events yet'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-screen focal point picker */}
      {showFocalModal && editingPosterUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0, 0, 0, 0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 20, padding: 24,
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem',
            letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
          }}>
            Drag to position the visible area
          </p>

          {/* Image with crop overlay — slide the rectangle to set the visible area */}
          <div
            style={{
              position: 'relative', overflow: 'hidden', lineHeight: 0, borderRadius: 2,
              cursor: grabbing ? 'grabbing' : 'grab',
              touchAction: 'none', userSelect: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              ref={focalImgRef}
              src={editingPosterUrl}
              alt="Set crop"
              style={{ maxWidth: '80vw', maxHeight: '70vh', display: 'block', userSelect: 'none' }}
              onLoad={(e) => {
                const img = e.currentTarget
                setRenderedImgSize({ w: img.offsetWidth, h: img.offsetHeight })
              }}
              draggable={false}
            />
            {cropBox && (
              <div style={{
                position: 'absolute',
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.width,
                height: cropBox.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.62)',
                border: '2px solid rgba(255, 255, 255, 0.7)',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className={styles.btn} onClick={confirmFocal} disabled={savingFocus}>
              {savingFocus ? 'Saving…' : 'Confirm'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowFocalModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
