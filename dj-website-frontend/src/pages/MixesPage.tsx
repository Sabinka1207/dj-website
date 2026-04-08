import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MixPlayer from '../components/MixPlayer'
import styles from './MixesPage.module.css'

interface HostedMix {
  id: number
  url: string
  title: string
  year: number
  style: string
  event: string
  city: string
  durationSeconds: number
}

interface ExternalMix {
  id: number
  embedUrl: string
  embedType: string
  title: string
  year: number
  style: string
  event: string
  city: string
}

type UnifiedMix =
  | { kind: 'hosted'; data: HostedMix }
  | { kind: 'embed'; data: ExternalMix }

function EmbedCard({ mix, cookiesAccepted }: { mix: ExternalMix; cookiesAccepted: boolean }) {
  const { t } = useTranslation()
  const location = [mix.event, mix.city].filter(Boolean).join(' · ')

  return (
    <div className={styles.embedCard}>
      <div className={styles.embedMeta}>
        <span className={styles.embedTitle}>{mix.title}</span>
        <div className={styles.embedTags}>
          {mix.style && <span className={styles.tag}>{mix.style}</span>}
          {location && <span className={styles.tag}>{location}</span>}
          {mix.year > 0 && <span className={styles.year}>{mix.year}</span>}
        </div>
      </div>

      {cookiesAccepted ? (
        mix.embedType === 'youtube' ? (
          <div className={styles.videoWrapper}>
            <iframe
              src={mix.embedUrl}
              title={mix.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : mix.embedType === 'soundcloud' ? (
          <iframe
            className={styles.scPlayer}
            src={mix.embedUrl}
            title={mix.title}
            allow="autoplay"
          />
        ) : (
          <iframe
            className={styles.mcPlayer}
            src={mix.embedUrl}
            title={mix.title}
          />
        )
      ) : (
        <div className={styles.cookieNotice}>
          <p>{t('cookies.message')}</p>
        </div>
      )}
    </div>
  )
}

export default function MixesPage() {
  const { t } = useTranslation()
  const [hostedMixes, setHostedMixes] = useState<HostedMix[]>([])
  const [externalMixes, setExternalMixes] = useState<ExternalMix[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const cookiesAccepted = localStorage.getItem('cookieConsent') === 'accepted'

  useEffect(() => {
    Promise.all([
      fetch('/api/mixes').then(r => r.json()).catch(() => []),
      fetch('/api/external-mixes').then(r => r.json()).catch(() => []),
    ]).then(([hosted, external]) => {
      setHostedMixes(hosted)
      setExternalMixes(external)
    }).finally(() => setLoading(false))
  }, [])

  const allMixes: UnifiedMix[] = [
    ...hostedMixes.map(m => ({ kind: 'hosted' as const, data: m })),
    ...externalMixes.map(m => ({ kind: 'embed' as const, data: m })),
  ].sort((a, b) => (b.data.year || 0) - (a.data.year || 0))

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>{t('mixesPage.title')}</h1>

        {loading && <p className={styles.empty}>...</p>}

        {!loading && allMixes.length === 0 && (
          <p className={styles.empty}>{t('mixesPage.empty')}</p>
        )}

        {!loading && allMixes.length > 0 && (
          <div className={styles.list}>
            {allMixes.map(item =>
              item.kind === 'hosted' ? (
                <MixPlayer
                  key={`hosted-${item.data.id}`}
                  mix={item.data}
                  isPlaying={playingId === item.data.id}
                  onPlay={() => setPlayingId(prev => prev === item.data.id ? null : item.data.id)}
                />
              ) : (
                <EmbedCard
                  key={`embed-${item.data.id}`}
                  mix={item.data}
                  cookiesAccepted={cookiesAccepted}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
