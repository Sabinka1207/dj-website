import { useRef, useState, useEffect } from 'react'
import styles from './MixPlayer.module.css'

interface Mix {
  id: number
  url: string
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

      <div className={styles.info}>
        <div className={styles.meta}>
          <span className={styles.title}>{mix.title}</span>
          <div className={styles.tags}>
            {mix.style && <span className={styles.tag}>{mix.style}</span>}
            {location && <span className={styles.tag}>{location}</span>}
            {mix.year > 0 && <span className={styles.year}>{mix.year}</span>}
          </div>
        </div>

        <div className={styles.controls}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div className={styles.progressWrap} onClick={handleSeek}>
            <div className={styles.progressBg} />
            <div className={styles.progressBuffered} style={{ width: `${bufferedPct}%` }} />
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
