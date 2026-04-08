import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MixPlayer from '../components/MixPlayer'
import styles from './MixesPage.module.css'

interface Mix {
  id: number
  url: string
  title: string
  year: number
  style: string
  event: string
  city: string
  durationSeconds: number
  displayOrder: number
}

const youtubeVideos = [
  'https://www.youtube.com/embed/3pKeGlxPikk',
  'https://www.youtube.com/embed/slIsj_NFgG0',
]

const soundcloudTracks = [
  'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/dj_sabi/proudtobeukrainian&color=%230066ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false',
  'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/dj_sabi/ahmix&color=%230066ff&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false',
]

const mixcloudMixes = [
  'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fsabiabdulalieva%2Fsabi-live-playtv-29042015%2F',
  'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fsabiabdulalieva%2Ffav-songz-mistery-edition%2F',
]

export default function MixesPage() {
  const { t } = useTranslation()
  const [mixes, setMixes] = useState<Mix[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const cookiesAccepted = localStorage.getItem('cookieConsent') === 'accepted'

  useEffect(() => {
    fetch('/api/mixes')
      .then(r => r.json())
      .then(data => setMixes(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlay = (id: number) => {
    setPlayingId(prev => (prev === id ? null : id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('mixesPage.title')}</h1>

        {/* Self-hosted mixes */}
        {loading && <p className={styles.empty}>...</p>}

        {!loading && mixes.length > 0 && (
          <div className={styles.list}>
            {mixes.map(mix => (
              <MixPlayer
                key={mix.id}
                mix={mix}
                isPlaying={playingId === mix.id}
                onPlay={() => handlePlay(mix.id)}
              />
            ))}
          </div>
        )}

        {/* Embedded mixes (YouTube + SoundCloud + Mixcloud) */}
        {cookiesAccepted ? (
          <>
            <div className={styles.videoGrid}>
              {youtubeVideos.map((src) => (
                <div key={src} className={styles.videoWrapper}>
                  <iframe
                    src={src}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>

            <div className={styles.audioGrid}>
              {soundcloudTracks.map((src) => (
                <iframe
                  key={src}
                  className={styles.scPlayer}
                  src={src}
                  title="SoundCloud track"
                  allow="autoplay"
                />
              ))}
              {mixcloudMixes.map((src) => (
                <iframe
                  key={src}
                  className={styles.mcPlayer}
                  src={src}
                  title="Mixcloud mix"
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.cookieNotice}>
            <p>{t('cookies.message')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
