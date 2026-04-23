import { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import { getVisitorId } from '../utils/visitorId'

export interface PlayerMix {
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

interface PlayerContextType {
  currentMix: PlayerMix | null
  isPlaying: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  toggleMix: (mix: PlayerMix) => void
  pause: () => void
  seek: (ratio: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  close: () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const playStartRef = useRef<number | null>(null)
  const [currentMix, setCurrentMix] = useState<PlayerMix | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [muted, setMuted] = useState(false)

  const reportPlay = useCallback((id: number) => {
    if (playStartRef.current === null) return
    const seconds = Math.round((Date.now() - playStartRef.current) / 1000)
    playStartRef.current = null
    if (seconds >= 5) {
      fetch(`/api/mixes/${id}/played`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId(), secondsPlayed: seconds }),
      }).catch(() => {})
    }
  }, [])

  const toggleMix = useCallback((mix: PlayerMix) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentMix?.id === mix.id) {
      if (isPlaying) {
        audio.pause()
        reportPlay(mix.id)
        setIsPlaying(false)
      } else {
        audio.play().catch(() => {})
        playStartRef.current = Date.now()
        setIsPlaying(true)
        if (typeof window !== 'undefined' && (window as any).umami) {
          (window as any).umami.track('mix_played', { title: mix.title, id: mix.id })
        }
      }
    } else {
      if (currentMix) reportPlay(currentMix.id)
      audio.pause()
      audio.src = mix.url
      audio.currentTime = 0
      setCurrentTime(0)
      setDuration(mix.durationSeconds)
      setCurrentMix(mix)
      audio.play().catch(() => {})
      playStartRef.current = Date.now()
      setIsPlaying(true)
      if (typeof window !== 'undefined' && (window as any).umami) {
        (window as any).umami.track('mix_played', { title: mix.title, id: mix.id })
      }
    }
  }, [currentMix, isPlaying, reportPlay])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentMix) return
    audio.pause()
    reportPlay(currentMix.id)
    setIsPlaying(false)
  }, [currentMix, reportPlay])

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const newTime = ratio * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = v
    setVolumeState(v)
    setMuted(v === 0)
    if (audio) audio.muted = v === 0
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    audio.muted = next
  }, [muted])

  const close = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (currentMix) reportPlay(currentMix.id)
    audio.pause()
    audio.src = ''
    setCurrentMix(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [currentMix, reportPlay])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.buffered.length > 0) setBuffered(audio.buffered.end(audio.buffered.length - 1))
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      if (currentMix) reportPlay(currentMix.id)
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentMix, reportPlay])

  return (
    <PlayerContext.Provider value={{ currentMix, isPlaying, currentTime, duration, buffered, volume, muted, toggleMix, pause, seek, setVolume, toggleMute, close }}>
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      {children}
    </PlayerContext.Provider>
  )
}
