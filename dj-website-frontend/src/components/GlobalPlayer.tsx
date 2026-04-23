import { useEffect } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useSeekDrag } from '../hooks/useSeekDrag'
import logo from '../assets/Sabi logo white s png.png'
import styles from './GlobalPlayer.module.css'
import { getVisitorId } from '../utils/visitorId'

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function GlobalPlayer() {
  const { currentMix, isPlaying, currentTime, duration, toggleMix, seek, close } = usePlayer()

  const { onMouseDown, onTouchStart } = useSeekDrag(seek)

  useEffect(() => {
    document.body.style.paddingBottom = currentMix ? '64px' : ''
    return () => { document.body.style.paddingBottom = '' }
  }, [currentMix])

  if (!currentMix) return null

  const progress = duration ? (currentTime / duration) * 100 : 0
  const sub = [currentMix.event, currentMix.city, currentMix.year > 0 ? currentMix.year : null].filter(Boolean).join(' · ')

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
      <img
        className={styles.cover}
        src={currentMix.coverUrl || logo}
        alt={currentMix.title}
      />

      <div className={styles.info}>
        <div className={styles.title}>{currentMix.title}</div>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>

      <div className={styles.progress} onMouseDown={onMouseDown} onTouchStart={onTouchStart} aria-label="Playback progress">
        <div className={styles.progressTrack} />
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
      </div>

      <span className={styles.time}>{formatTime(currentTime)} / {formatTime(duration || currentMix.durationSeconds)}</span>

      <div className={styles.controls}>
        <button className={styles.btn} onClick={() => toggleMix(currentMix)} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <a
          href={`/api/mixes/${currentMix.id}/download?v=${getVisitorId()}`}
          download
          className={styles.btn}
          aria-label="Download mix"
          title="Download"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).umami) {
              (window as any).umami.track('mix_downloaded', { title: currentMix.title, id: currentMix.id })
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
          </svg>
        </a>

        <button className={styles.btn} onClick={close} aria-label="Close player">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      </div>
    </div>
  )
}
