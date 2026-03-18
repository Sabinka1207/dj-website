import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Gallery.module.css'

const PAGE_SIZE = 9

const thumbModules = import.meta.glob('../assets/images/Gallery/*.webp', { eager: true })

const allPhotos = Object.entries(thumbModules).map(([path, mod]) => {
  const filename = path.split('/').pop()!
  const alt = filename.replace('_compressed.webp', '').replace('.webp', '').replace(/[_-]/g, ' ')
  return {
    thumb: (mod as { default: string }).default,
    alt,
  }
})

const blockEvent = (e: React.SyntheticEvent) => e.preventDefault()

export default function Gallery() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const totalPages = Math.ceil(allPhotos.length / PAGE_SIZE)
  const pagePhotos = allPhotos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const close = useCallback(() => setLightbox(null), [])

  const prev = useCallback(() =>
    setLightbox((i) => (i !== null ? (i - 1 + allPhotos.length) % allPhotos.length : null)), [])

  const next = useCallback(() =>
    setLightbox((i) => (i !== null ? (i + 1) % allPhotos.length : null)), [])

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

  const current = lightbox !== null ? allPhotos[lightbox] : null

  return (
    <section id="gallery" className={styles.gallery}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('gallery.title')}</h2>

        <div className={styles.grid}>
          {pagePhotos.map((photo, index) => (
            <button
              key={photo.thumb}
              className={styles.card}
              onClick={() => setLightbox((page - 1) * PAGE_SIZE + index)}
            >
              <img
                src={photo.thumb}
                alt={photo.alt}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              &#8592;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              &#8594;
            </button>
          </div>
        )}
      </div>

      {current && (
        <div className={styles.lightboxBackdrop} onClick={close}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lbClose} onClick={close}>✕</button>
            <button className={styles.lbPrev} onClick={prev}>&#8592;</button>
            <div className={styles.lbImageWrapper}>
              <img
                src={current.thumb}
                alt={current.alt}
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
