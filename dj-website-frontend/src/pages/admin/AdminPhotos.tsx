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

function SortablePhoto({
  photo,
  onDelete,
  onPreview,
}: {
  photo: Photo
  onDelete: (id: number) => void
  onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={styles.photoCard}
    >
      <div
        className={styles.photoThumb}
        {...listeners}
        {...attributes}
        onClick={onPreview}
        style={{ cursor: 'pointer' }}
      >
        <img src={photo.url} alt="" loading="lazy" />
      </div>
      <button
        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
        onClick={() => onDelete(photo.id)}
        title="Delete"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  )
}

export default function AdminPhotos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Require 8px movement before drag activates — allows normal clicks on photos
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const load = async () => {
    const res = await fetch('/api/admin/photos', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos(await res.json())
    setListLoading(false)
  }

  useEffect(() => { load() }, [])

  // Keyboard navigation in preview
  useEffect(() => {
    if (previewIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewIndex(null)
      if (e.key === 'ArrowRight') setPreviewIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null)
      if (e.key === 'ArrowLeft')  setPreviewIndex(i => i !== null ? Math.max(i - 1, 0) : null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [previewIndex, photos.length])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadProgress({ done: 0, total: files.length })

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('file', files[i])
      const res = await fetch('/api/admin/photos/upload', {
        method: 'POST',
        headers: authHeaders(false),
        body: fd,
      })
      if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      if (res.ok) {
        const newPhoto: Photo = await res.json()
        setPhotos(prev => [...prev, newPhoto])
      }
      setUploadProgress({ done: i + 1, total: files.length })
    }

    setUploadProgress(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this photo?')) return
    const res = await fetch(`/api/admin/photos/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos(p => p.filter(ph => ph.id !== id))
    if (previewIndex !== null && previewIndex >= photos.length - 1) {
      setPreviewIndex(prev => (prev !== null && prev > 0 ? prev - 1 : null))
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${photos.length} photos? This cannot be undone.`)) return
    const res = await fetch('/api/admin/photos', { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setPhotos([])
    setPreviewIndex(null)
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

  const uploading = uploadProgress !== null

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          Photos
          {photos.length > 0 && (
            <span style={{ marginLeft: 10, fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
              ({photos.length})
            </span>
          )}
        </h1>
        <div className={styles.panelActions}>
          {uploading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
              {uploadProgress.done} / {uploadProgress.total}
            </span>
          )}
          <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={() => fileRef.current?.click()} disabled={uploading} title={uploading ? 'Uploading…' : 'Upload photos'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <button className={styles.iconBtn} onClick={handleSync} title="Sync from Cloudinary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          {photos.length > 0 && (
            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={handleDeleteAll} title="Delete all photos">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
        </div>
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--color-accent)',
            borderRadius: 2,
            width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {photos.length === 0 && !uploading && listLoading && (
        <div className={styles.loadingRow}><span className={styles.spinner} /></div>
      )}
      {photos.length === 0 && !uploading && !listLoading && (
        <p className={styles.empty}>No photos yet. Upload some!</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className={styles.photoGrid}>
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onPreview={() => setPreviewIndex(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Preview lightbox */}
      {previewIndex !== null && photos[previewIndex] && (
        <div
          className={styles.modalBackdrop}
          onClick={e => { if (e.target === e.currentTarget) setPreviewIndex(null) }}
          style={{ padding: 16 }}
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 900,
            gap: 12,
          }}>
            {/* Prev */}
            <button
              onClick={() => setPreviewIndex(i => i !== null ? Math.max(i - 1, 0) : null)}
              disabled={previewIndex === 0}
              style={{
                background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff',
                borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                opacity: previewIndex === 0 ? 0.2 : 1,
              }}
            >‹</button>

            {/* Image */}
            <div style={{ position: 'relative', flex: 1, maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => setPreviewIndex(null)}
                style={{
                  position: 'absolute', top: -12, right: -12, zIndex: 10,
                  background: '#111', border: '1px solid #333', color: '#ccc',
                  borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}
              >×</button>
              <img
                src={photos[previewIndex].url}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 4, display: 'block' }}
              />
              <p style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {previewIndex + 1} / {photos.length}
              </p>
            </div>

            {/* Next */}
            <button
              onClick={() => setPreviewIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : null)}
              disabled={previewIndex === photos.length - 1}
              style={{
                background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#fff',
                borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                opacity: previewIndex === photos.length - 1 ? 0.2 : 1,
              }}
            >›</button>
          </div>
        </div>
      )}
    </div>
  )
}
