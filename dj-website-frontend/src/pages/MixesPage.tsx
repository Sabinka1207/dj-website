import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import MixPlayer from '../components/MixPlayer'
import styles from './MixesPage.module.css'

const LANGUAGES = [{ code: 'de', label: 'DE' }, { code: 'en', label: 'EN' }, { code: 'ua', label: 'UA' }]

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
  embedType: 'youtube' | 'soundcloud' | 'mixcloud' | string
  title: string
  year: number
  style: string
  event: string
  city: string
}

type UnifiedMix =
  | { kind: 'hosted'; data: HostedMix }
  | { kind: 'embed'; data: ExternalMix }

// Platform icon inside the expand button
function PlatformIcon({ type }: { type: string }) {
  if (type === 'youtube') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.1 2.8 12 2.8 12 2.8s-4.1 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2.1C.7 15.5 1 17.5 1 17.5s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.7 21.7 12 21.7 12 21.7s4.1 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8l6.6 3.8-6.6 3.7z"/>
    </svg>
  )
  if (type === 'soundcloud') return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M1.175 12.225c-.015.108.079.2.19.2h.59c.096 0 .18-.067.19-.16l.395-3.555-.395-3.63c-.01-.093-.094-.16-.19-.16h-.59c-.111 0-.205.092-.19.2l-.35 3.59.35 3.515zM3.5 13.1c-.015.11.085.2.2.2h.59c.1 0 .185-.07.195-.165l.43-3.91-.43-3.67c-.01-.095-.095-.165-.195-.165h-.59c-.115 0-.215.09-.2.2l-.385 3.635.385 3.875zM5.845 13.525c-.01.115.085.21.2.21h.59c.1 0 .185-.07.195-.17l.455-4.34-.455-3.68c-.01-.095-.095-.165-.195-.165h-.59c-.115 0-.21.095-.2.21l-.41 3.635.41 4.3zM8.19 13.74c-.01.115.085.21.2.21h.595c.1 0 .185-.075.195-.17l.47-4.555-.47-3.955c-.01-.095-.095-.165-.195-.165h-.595c-.115 0-.21.095-.2.21l-.425 3.91.425 4.515zM10.535 13.85c-.01.115.085.21.2.21h.595c.1 0 .185-.075.195-.17l.48-4.665-.48-4.12c-.01-.095-.095-.165-.195-.165h-.595c-.115 0-.21.095-.2.21l-.435 4.075.435 4.625zM12.875 14.005c-.01.115.085.21.2.21h.595c.1 0 .185-.075.195-.17l.485-4.82-.485-4.215c-.01-.095-.095-.165-.195-.165h-.595c-.115 0-.21.095-.2.21l-.44 4.17.44 4.78zM15.22 14.21c-.01.115.085.21.2.21h.595c.1 0 .185-.075.195-.175l.49-5.025-.49-4.43c-.01-.095-.095-.165-.195-.165h-.595c-.115 0-.21.095-.2.215l-.445 4.38.445 4.99zM17.565 9.415l-.455 4.64c-.01.12.09.215.21.215h.595c.1 0 .185-.075.195-.175l.5-4.68-.5-4.61c-.01-.095-.095-.165-.195-.165h-.595c-.12 0-.22.1-.21.22l.455 4.555zM22.02 9.025c-.27-2.87-2.65-5.1-5.58-5.1-.71 0-1.4.14-2.03.395V14.2c0 .115.095.21.21.21H22c1.1 0 2-.895 2-2 0-1.73-1.395-3.14-3.125-3.14-.285 0-.56.04-.815.11l-.04-.155z"/>
    </svg>
  )
  // Mixcloud — use a simple music note
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
    </svg>
  )
}

function EmbedCard({ mix, cookiesAccepted }: { mix: ExternalMix; cookiesAccepted: boolean }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const location = [mix.event, mix.city].filter(Boolean).join(' · ')
  const isVideo = mix.embedType === 'youtube'

  return (
    <div className={`${styles.embedRow} ${expanded ? styles.embedRowOpen : ''}`}>
      {/* Top row — same height as MixPlayer */}
      <div className={styles.embedTop}>
        <button
          className={styles.expandBtn}
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}
            viewBox="0 0 24 24" fill="currentColor" width="20" height="20"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>

        <div className={styles.embedInfo}>
          <div className={styles.embedMeta}>
            <span className={styles.embedTitle}>{mix.title}</span>
            {(location || mix.year > 0) && (
              <span className={styles.location}>
                {[location, mix.year > 0 ? mix.year : ''].filter(Boolean).join(' · ')}
              </span>
            )}
            {mix.style && (
              <div className={styles.embedTags}>
                {mix.style.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} className={styles.tag}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.typeBadge}>
          <PlatformIcon type={mix.embedType} />
          <span>{isVideo ? 'Video' : 'Audio'}</span>
        </div>
      </div>

      {/* Expandable embed */}
      {expanded && (
        <div className={styles.embedBody}>
          {cookiesAccepted ? (
            mix.embedType === 'youtube' ? (
              <div className={styles.videoWrapper}>
                <iframe src={mix.embedUrl} title={mix.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            ) : mix.embedType === 'soundcloud' ? (
              <iframe className={styles.scPlayer} src={mix.embedUrl} title={mix.title} allow="autoplay" />
            ) : (
              <iframe className={styles.mcPlayer} src={mix.embedUrl} title={mix.title} />
            )
          ) : (
            <p className={styles.cookieNotice}>{t('cookies.message')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MixesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [hostedMixes, setHostedMixes] = useState<HostedMix[]>([])
  const [externalMixes, setExternalMixes] = useState<ExternalMix[]>([])
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const cookiesAccepted = localStorage.getItem('cookieConsent') === 'accepted'

  const changeLanguage = (code: string) => {
    localStorage.setItem('lang', code)
    i18n.changeLanguage(code)
  }

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
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate('/', { state: { scrollToMixes: true } })}>← DJ Sabi</button>
          <div className={styles.langSwitcher}>
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                className={`${styles.langBtn} ${i18n.language === code ? styles.langBtnActive : ''}`}
                onClick={() => changeLanguage(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <h1 className={styles.title}>{t('mixesPage.title')}</h1>

        {loading && <p className={styles.empty}>...</p>}
        {!loading && allMixes.length === 0 && <p className={styles.empty}>{t('mixesPage.empty')}</p>}

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
