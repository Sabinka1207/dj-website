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

export default function MixesPage() {
  const { t } = useTranslation()
  const [mixes, setMixes] = useState<Mix[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

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

        {loading && <p className={styles.empty}>...</p>}

        {!loading && mixes.length === 0 && (
          <p className={styles.empty}>{t('mixesPage.empty')}</p>
        )}

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
      </div>
    </div>
  )
}
