import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Mix = {
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

type FormState = {
  title: string
  year: string
  style: string
  event: string
  city: string
}

const EMPTY_FORM: FormState = { title: '', year: new Date().getFullYear().toString(), style: '', event: '', city: '' }

function formatTime(seconds: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SortableMix({ mix, onDelete }: { mix: Mix; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mix.id })
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <td>
        <span className={styles.dragHandle} {...listeners} {...attributes} title="Drag to reorder">⠿</span>
      </td>
      <td>{mix.title}</td>
      <td>{mix.year || '—'}</td>
      <td>{mix.style || '—'}</td>
      <td>{mix.event || '—'}</td>
      <td>{mix.city || '—'}</td>
      <td>{formatTime(mix.durationSeconds)}</td>
      <td>
        <div className={styles.rowActions}>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => onDelete(mix.id)}
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
  )
}

export default function AdminMixes() {
  const navigate = useNavigate()
  const [mixes, setMixes] = useState<Mix[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const sensors = useSensors(useSensor(PointerSensor))

  const load = async () => {
    const res = await fetch('/api/admin/mixes', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setMixes(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!form.title.trim()) { setError('Title is required'); return }
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title.trim())
    fd.append('year', form.year || '0')
    fd.append('style', form.style.trim())
    fd.append('event', form.event.trim())
    fd.append('city', form.city.trim())
    const res = await fetch('/api/admin/mixes/upload', {
      method: 'POST',
      headers: authHeaders(false),
      body: fd,
    })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    setForm(EMPTY_FORM)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mix?')) return
    const res = await fetch(`/api/admin/mixes/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    load()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = mixes.findIndex(m => m.id === active.id)
    const newIdx = mixes.findIndex(m => m.id === over.id)
    const reordered = arrayMove(mixes, oldIdx, newIdx).map((m, i) => ({ ...m, displayOrder: i }))
    setMixes(reordered)
    await fetch('/api/admin/mixes/reorder', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(reordered.map(m => ({ id: m.id, displayOrder: m.displayOrder }))),
    })
  }

  return (
    <div>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Mixes</h2>
      </div>

      <div className={styles.form}>
        <h3 className={styles.formTitle}>Upload New Mix</h3>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Title *
            <input className={styles.input} value={form.title} onChange={handleChange('title')} placeholder="DJ Sabi — Summer Set" />
          </label>
          <label className={styles.label}>
            Year
            <input className={styles.input} type="number" value={form.year} onChange={handleChange('year')} placeholder="2024" />
          </label>
          <label className={styles.label}>
            Style / Genre
            <input className={styles.input} value={form.style} onChange={handleChange('style')} placeholder="Commercial / House / RnB…" />
          </label>
          <label className={styles.label}>
            Event
            <input className={styles.input} value={form.event} onChange={handleChange('event')} placeholder="Ukrainian Night / Festival…" />
          </label>
          <label className={styles.label}>
            City
            <input className={styles.input} value={form.city} onChange={handleChange('city')} placeholder="Frankfurt" />
          </label>
        </div>
        {error && <p className={styles.errorMsg}>{error}</p>}
        <div className={styles.formFooter}>
          <input ref={fileRef} type="file" accept=".mp3,audio/*" hidden onChange={handleUpload} />
          <button
            className={styles.btn}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '↑ Choose MP3 & Upload'}
          </button>
        </div>
      </div>

      {mixes.length === 0 ? (
        <p className={styles.empty}>No mixes uploaded yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={mixes.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th></th>
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
                  {mixes.map(mix => (
                    <SortableMix key={mix.id} mix={mix} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
