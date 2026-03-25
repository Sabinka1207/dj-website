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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Photo = { id: number; publicId: string; url: string; displayOrder: number }

function SortablePhoto({ photo, onDelete }: { photo: Photo; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={styles.photoCard}
    >
      <div className={styles.photoThumb} {...listeners} {...attributes}>
        <img src={photo.url} alt="" loading="lazy" />
      </div>
      <button
        className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
        onClick={() => onDelete(photo.id)}
      >
        Delete
      </button>
    </div>
  )
}

export default function AdminPhotos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const load = async () => {
    const res = await fetch('/api/admin/photos', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/photos/upload', {
          method: 'POST',
          headers: authHeaders(false),
          body: fd,
        })
        if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      }
      await load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this photo?')) return
    const res = await fetch(`/api/admin/photos/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos(p => p.filter(ph => ph.id !== id))
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${photos.length} photos? This cannot be undone.`)) return
    const res = await fetch('/api/admin/photos', { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos([])
  }

  const handleSync = async () => {
    const res = await fetch('/api/admin/photos/sync', { method: 'POST', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos(await res.json())
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({ ...p, displayOrder: i }))
    setPhotos(reordered)
    await fetch('/api/admin/photos/reorder', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(reordered.map(p => ({ id: p.id, displayOrder: p.displayOrder }))),
    })
  }

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Photos</h1>
        <div className={styles.panelActions}>
          <button className={styles.btn} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '+ Upload photos'}
          </button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleSync}>
            Sync from Cloudinary
          </button>
          {photos.length > 0 && (
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleDeleteAll}>
              Delete all
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
        </div>
      </div>

      {photos.length === 0 && !uploading && (
        <p className={styles.empty}>No photos yet. Upload some!</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className={styles.photoGrid}>
            {photos.map(photo => (
              <SortablePhoto key={photo.id} photo={photo} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
