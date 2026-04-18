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
  const [items, setItems] = useState<FeaturedItem[]>(FALLBACK_MIXES)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [serverDown, setServerDown] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showReload, setShowReload] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    warmupTimerRef.current = setTimeout(() => setShowWarmup(true), 8000)
    reloadTimerRef.current = setTimeout(() => setShowReload(true), 70000)

    const fetchMixes = () => {
      const tryFetch = (url: string) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        return fetch(url, { signal: controller.signal })
          .then(r => r.json())
          .catch(() => null)
          .finally(() => clearTimeout(timeout))
      }

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

        // Server is alive — clear warmup state
        setIsLoading(false)
        setServerDown(false)
        setShowWarmup(false)
        setShowReload(false)
        if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)

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
        ].sort((a, b) => {
          const ao = a.homeDisplayOrder > 0 ? a.homeDisplayOrder : Infinity
          const bo = b.homeDisplayOrder > 0 ? b.homeDisplayOrder : Infinity
          return ao - bo
        })
        setItems(all)
        setTotalCount(allExt.length + allHost.length)
      })
    }

    fetchMixes()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
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

        {(isLoading || serverDown) && (
          <div className={styles.warmupRow}>
            <span className={styles.spinner} />
            {showWarmup && <span className={styles.warmupHint}>{t('common.warmup')}</span>}
            {showReload && (
              <button className={styles.reloadBtn} onClick={() => window.location.reload()}>
                Reload
              </button>
            )}
          </div>
        )}

        {!isLoading && !serverDown && (
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
