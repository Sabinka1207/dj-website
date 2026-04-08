import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styles from './Mixes.module.css'

interface FeaturedMix {
  id: number
  embedUrl: string
  embedType: string
  title: string
  year: number
  style: string
  event: string
  city: string
}

interface Props {
  cookiesAccepted: boolean
}

export default function Mixes({ cookiesAccepted }: Props) {
  const { t } = useTranslation()
  const [featured, setFeatured] = useState<FeaturedMix[]>([])

  useEffect(() => {
    fetch('/api/external-mixes/featured')
      .then(r => r.json())
      .then(data => setFeatured(data))
      .catch(() => {})
  }, [])

  const videos = featured.filter(m => m.embedType === 'youtube')
  const audios = featured.filter(m => m.embedType !== 'youtube')

  return (
    <section id="mixes" className={styles.mixes}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('mixes.title')}</h2>

        {cookiesAccepted ? (
          <>
            {videos.length > 0 && (
              <div className={styles.videoGrid}>
                {videos.map(m => (
                  <div key={m.id} className={styles.videoWrapper}>
                    <iframe
                      src={m.embedUrl}
                      title={m.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            )}

            {audios.length > 0 && (
              <div className={styles.audioGrid}>
                {audios.map(m => (
                  <iframe
                    key={m.id}
                    className={m.embedType === 'soundcloud' ? styles.scPlayer : styles.mcPlayer}
                    src={m.embedUrl}
                    title={m.title}
                    allow="autoplay"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.cookieNotice}>
            <p>{t('cookies.message')}</p>
          </div>
        )}

        <div className={styles.viewAll}>
          <Link to="/mixes" className={styles.viewAllBtn}>{t('mixes.viewAll')}</Link>
        </div>
      </div>
    </section>
  )
}
