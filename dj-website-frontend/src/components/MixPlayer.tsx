import { useRef, useState, useEffect } from 'react'
import logo from '../assets/Sabi logo white s png.png'
import styles from './MixPlayer.module.css'

interface Mix {
  id: number
  url: string
  coverUrl?: string
  title: string
  year: number
  style: string
  event: string
  city: string
  durationSeconds: number
}

interface Props {
  mix: Mix
  isPlaying: boolean
  onPlay: () => void
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MixPlayer({ mix, isPlaying, onPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(mix.durationSeconds)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setCurrentTime(0)
  }, [mix.url])

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    if (audio.buffered.length > 0) {
      setBuffered(audio.buffered.end(audio.buffered.length - 1))
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    setCurrentTime(0)
    onPlay() // toggles off
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    setMuted(v === 0)
    if (audioRef.current) audioRef.current.volume = v
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    audio.muted = next
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration ? (buffered / duration) * 100 : 0

  const location = [mix.event, mix.city].filter(Boolean).join(' · ')

  return (
    <div className={`${styles.player} ${isPlaying ? styles.active : ''}`}>
      <audio
        ref={audioRef}
        src={mix.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className={styles.header}>
        <div className={styles.cover}>
          <img src={mix.coverUrl || logo} alt={mix.title} />
        </div>

        <div className={styles.right}>
          <div className={styles.topSection}>
            <div className={styles.playStack}>
              <button className={styles.playBtn} onClick={onPlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <a
                className={styles.downloadBtn}
                href={mix.url}
                download
                target="_blank"
                rel="noreferrer"
                aria-label="Download mix"
                title="Download"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
                </svg>
              </a>
            </div>

            <div className={styles.meta}>
              <span className={styles.title}>{mix.title}</span>
              {(location || mix.year > 0) && (
                <span className={styles.location}>
                  {[location, mix.year > 0 ? mix.year : ''].filter(Boolean).join(' · ')}
                </span>
              )}
              {mix.style && (
                <div className={styles.tags}>
                  {mix.style.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className={styles.tag}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.progressRow}>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <div className={styles.progressWrap} onClick={handleSeek}>
          <div className={styles.progressBg} />
          <div className={styles.progressBuffered} style={{ width: `${bufferedPct}%` }} />
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
        </div>
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>

      <div className={styles.volumeRow}>
        <button className={styles.muteBtn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted || volume === 0 ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10l2.45 2.45c.03-.15.05-.3.05-.45zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.98 6.98 0 0 1 14 18.98v2.06A8.99 8.99 0 0 0 17.28 19l2.45 2.45L21 20.18 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : volume < 0.5 ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        <input
          className={styles.volumeSlider}
          type="range" min={0} max={1} step={0.02}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
