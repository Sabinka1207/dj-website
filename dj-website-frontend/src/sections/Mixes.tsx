import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import MixPlayer from '../components/MixPlayer'
import styles from './Mixes.module.css'

type FeaturedItem =
  | { kind: 'hosted'; id: number; url: string; coverUrl?: string; title: string; year: number; style: string; event: string; city: string; durationSeconds: number; homeDisplayOrder: number }
  | { kind: 'external'; id: number; embedUrl: string; embedType: string; title: string; year: number; style: string; event: string; city: string; homeDisplayOrder: number }

const FALLBACK_MIXES: FeaturedItem[] = [
  { kind: 'external', id: -1, embedUrl: 'https://www.youtube.com/embed/9n_fHWdrJWA', embedType: 'youtube', title: 'DJ Sabi Mix', year: 0, style: '', event: '', city: '', homeDisplayOrder: 1 },
  { kind: 'external', id: -2, embedUrl: 'https://www.youtube.com/embed/wJcBwdB2aZM?start=842', embedType: 'youtube', title: 'DJ Sabi Mix', year: 0, style: '', event: '', city: '', homeDisplayOrder: 2 },
]

interface Props {
  cookiesAccepted: boolean
}

export default function Mixes({ cookiesAccepted }: Props) {
  const { t } = useTranslation()
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [serverDown, setServerDown] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    warmupTimerRef.current = setTimeout(() => setShowWarmup(true), 8000)

    const fetchMixes = () => {
      const tryFetch = (url: string) => fetch(url).then(r => r.json()).catch(() => null)
      Promise.all([
        tryFetch('/api/external-mixes/featured'),
        tryFetch('/api/mixes/featured'),
        tryFetch('/api/external-mixes'),
        tryFetch('/api/mixes'),
      ]).then(([external, hosted, allExternal, allHosted]) => {
        if (external === null && hosted === null && allExternal === null && allHosted === null) {
          setServerDown(true)
          setItems(FALLBACK_MIXES)
          retryRef.current = setTimeout(fetchMixes, 5000)
          return
        }

        // Server responded — clear warmup state
        setServerDown(false)
        setShowWarmup(false)
        if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)

        const ext = external ?? []
        const host = hosted ?? []
        const allExt = allExternal ?? []
        const allHost = allHosted ?? []

        let featuredExternal = ext
        let featuredHosted = host

        // Fallback: if nothing is explicitly featured, show 2 latest external mixes
        if (featuredExternal.length === 0 && featuredHosted.length === 0) {
          featuredExternal = [...allExt]
            .filter((m: any) => m.embedType === 'youtube')
            .sort((a: any, b: any) => (b.year || 0) - (a.year || 0))
            .slice(0, 2)
        }

        const all: FeaturedItem[] = [
          ...featuredExternal.map((m: any) => ({ kind: 'external' as const, ...m })),
          ...featuredHosted.map((m: any) => ({ kind: 'hosted' as const, ...m })),
        ].sort((a, b) => (a.homeDisplayOrder || 0) - (b.homeDisplayOrder || 0))
        setItems(all)
        setTotalCount(allExt.length + allHost.length)
      })
    }

    fetchMixes()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
    }
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

        {serverDown && (
          <div className={styles.warmupRow}>
            <span className={styles.spinner} />
            {showWarmup && <span className={styles.warmupHint}>{t('common.warmup')}</span>}
          </div>
        )}

        {!serverDown && (
          <div className={styles.viewAll}>
            <Link to="/mixes" className={styles.viewAllBtn}>
              {t('mixes.viewAll')}{totalCount > 0 ? ` (${totalCount})` : ''}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
