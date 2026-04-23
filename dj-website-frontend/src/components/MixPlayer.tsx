import logo from '../assets/Sabi logo white s png.png'
import { getVisitorId } from '../utils/visitorId'
import { usePlayer, PlayerMix } from '../contexts/PlayerContext'
import { useSeekDrag } from '../hooks/useSeekDrag'
import styles from './MixPlayer.module.css'

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  mix: PlayerMix
}

export default function MixPlayer({ mix }: Props) {
  const { currentMix, isPlaying, currentTime, duration, buffered, volume, muted, toggleMix, seek, setVolume, toggleMute } = usePlayer()

  const isActive = currentMix?.id === mix.id
  const playing = isActive && isPlaying
  const time = isActive ? currentTime : 0
  const dur = isActive ? (duration || mix.durationSeconds) : mix.durationSeconds
  const buf = isActive ? buffered : 0

  const progress = dur ? (time / dur) * 100 : 0
  const bufferedPct = dur ? (buf / dur) * 100 : 0
  const location = [mix.event, mix.city].filter(Boolean).join(' · ')

  const { onMouseDown, onTouchStart } = useSeekDrag(isActive ? seek : () => {})

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }

  return (
    <div className={`${styles.player} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <div className={styles.cover}>
          <img src={mix.coverUrl || logo} alt={mix.title} />
        </div>

        <div className={styles.right}>
          <div className={styles.topSection}>
            <div className={styles.playStack}>
              <button className={styles.playBtn} onClick={() => toggleMix(mix)} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? (
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
                href={`/api/mixes/${mix.id}/download?v=${getVisitorId()}`}
                download
                aria-label="Download mix"
                title="Download"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).umami) {
                    (window as any).umami.track('mix_downloaded', { title: mix.title, id: mix.id })
                  }
                }}
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

        <div className={styles.progressRow}>
          <span className={styles.time}>{formatTime(time)}</span>
          <div className={styles.progressWrap} onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{ cursor: isActive ? 'pointer' : 'default' }}>
            <div className={styles.progressBg} />
            <div className={styles.progressBuffered} style={{ width: `${bufferedPct}%` }} />
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
          </div>
          <span className={styles.time}>{formatTime(dur)}</span>
        </div>

        <div className={styles.volumeRow}>
          <button className={styles.muteBtn} onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted || volume === 0 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <input
            type="range" min="0" max="1" step="0.05"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
