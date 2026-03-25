import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Gallery.module.css'

const PAGE_SIZE = 9

type Photo = { id: number; url: string }

const staticModules = import.meta.glob('../assets/images/Gallery/*.webp', { eager: true })
const staticPhotos: Photo[] = Object.entries(staticModules).map(([, mod], id) => ({
  id,
  url: (mod as { default: string }).default,
}))

const blockEvent = (e: React.SyntheticEvent) => e.preventDefault()

const isCloudinary = (url: string) => url.includes('cloudinary.com')

const cloudinaryTransform = (url: string, transforms: string) =>
  url.replace('/upload/', `/upload/${transforms}/`)

const thumbUrl = (url: string) =>
  isCloudinary(url) ? cloudinaryTransform(url, 'w_600,q_auto,f_auto') : url

const lightboxUrl = (url: string) =>
  isCloudinary(url) ? cloudinaryTransform(url, 'w_1920,q_auto,f_auto') : url

const downloadUrl = (url: string) =>
  isCloudinary(url) ? cloudinaryTransform(url, 'fl_attachment') : url

export default function Gallery() {
  const { t } = useTranslation()
  const [photos, setPhotos] = useState<Photo[]>(staticPhotos)
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const el = document.getElementById('gallery')
    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' })
  }, [page])

  const goToPage = (p: number) => setPage(p)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.length) setPhotos(data) })
      .catch(() => {})
  }, [])

  const totalPages = Math.ceil(photos.length / PAGE_SIZE)
  const pagePhotos = photos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const close = useCallback(() => setLightbox(null), [])
  const prev = useCallback(() =>
    setLightbox(i => i !== null ? (i - 1 + photos.length) % photos.length : null), [photos.length])
  const next = useCallback(() =>
    setLightbox(i => i !== null ? (i + 1) % photos.length : null), [photos.length])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, close, prev, next])

  const current = lightbox !== null ? photos[lightbox] : null

  return (
    <section id="gallery" className={styles.gallery}>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{t('gallery.title')}</h2>
        </div>

        <div className={styles.grid}>
          {pagePhotos.map((photo, index) => (
            <button
              key={photo.id}
              className={styles.card}
              onClick={() => setLightbox((page - 1) * PAGE_SIZE + index)}
            >
              <img
                src={thumbUrl(photo.url)}
                alt=""
                loading="lazy"
                draggable={false}
                onContextMenu={blockEvent}
              />
              <div className={styles.overlay} />
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              &#8592;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              &#8594;
            </button>
          </div>
        )}
      </div>

      {current && (
        <div className={styles.lightboxBackdrop} onClick={close}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <div className={styles.lbTopBar}>
              <a
                href={downloadUrl(current.url)}
                download
                className={styles.lbDownload}
                onClick={e => e.stopPropagation()}
                title="Download original"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
              <button className={styles.lbClose} onClick={close}>✕</button>
            </div>
            <button className={styles.lbPrev} onClick={prev}>&#8592;</button>
            <div className={styles.lbImageWrapper}>
              <img
                src={lightboxUrl(current.url)}
                alt=""
                className={styles.lbImage}
                draggable={false}
                onContextMenu={blockEvent}
              />
              <div className={styles.lbImageOverlay} />
            </div>
            <button className={styles.lbNext} onClick={next}>&#8594;</button>
          </div>
        </div>
      )}
    </section>
  )
}
