import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import MixPlayer from '../components/MixPlayer'
import styles from './Mixes.module.css'

type FeaturedItem =
  | { kind: 'hosted'; id: number; url: string; coverUrl?: string; title: string; year: number; style: string; event: string; city: string; durationSeconds: number; homeDisplayOrder: number }
  | { kind: 'external'; id: number; embedUrl: string; embedType: string; title: string; year: number; style: string; event: string; city: string; homeDisplayOrder: number }

interface Props {
  cookiesAccepted: boolean
}

export default function Mixes({ cookiesAccepted }: Props) {
  const { t } = useTranslation()
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/external-mixes/featured').then(r => r.json()).catch(() => []),
      fetch('/api/mixes/featured').then(r => r.json()).catch(() => []),
      fetch('/api/external-mixes').then(r => r.json()).catch(() => []),
      fetch('/api/mixes').then(r => r.json()).catch(() => []),
    ]).then(([external, hosted, allExternal, allHosted]) => {
      let featuredExternal = external
      let featuredHosted = hosted

      // Fallback: if nothing is explicitly featured, show 2 latest external mixes
      if (featuredExternal.length === 0 && featuredHosted.length === 0) {
        featuredExternal = [...allExternal]
          .filter((m: any) => m.embedType === 'youtube')
          .sort((a: any, b: any) => (b.year || 0) - (a.year || 0))
          .slice(0, 2)
      }

      const all: FeaturedItem[] = [
        ...featuredExternal.map((m: any) => ({ kind: 'external' as const, ...m })),
        ...featuredHosted.map((m: any) => ({ kind: 'hosted' as const, ...m })),
      ].sort((a, b) => (a.homeDisplayOrder || 0) - (b.homeDisplayOrder || 0))
      setItems(all)
      setTotalCount(allExternal.length + allHosted.length)
    })
  }, [])

  const hasEmbeds = items.some(m => m.kind === 'external')

  return (
    <section id="mixes" className={styles.mixes}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('mixes.title')}</h2>

        {!cookiesAccepted && hasEmbeds && (
          <div className={styles.cookieNotice}>
            <p>{t('cookies.message')}</p>
          </div>
        )}

        <div className={styles.featuredGrid}>
          {items.map(item => {
            if (item.kind === 'hosted') {
              return (
                <MixPlayer
                  key={`hosted-${item.id}`}
                  mix={item}
                  isPlaying={playingId === item.id}
                  onPlay={() => setPlayingId(prev => prev === item.id ? null : item.id)}
                />
              )
            }
            if (!cookiesAccepted) return null
            if (item.embedType === 'youtube') {
              return (
                <div key={`ext-${item.id}`} className={styles.videoWrapper}>
                  <iframe src={item.embedUrl} title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                </div>
              )
            }
            return (
              <iframe
                key={`ext-${item.id}`}
                className={item.embedType === 'soundcloud' ? styles.scPlayer : styles.mcPlayer}
                src={item.embedUrl} title={item.title} allow="autoplay"
              />
            )
          })}
        </div>

        <div className={styles.viewAll}>
          <Link to="/mixes" className={styles.viewAllBtn}>
            {t('mixes.viewAll')}{totalCount > 0 ? ` (${totalCount})` : ''}
          </Link>
        </div>
      </div>
    </section>
  )
}
