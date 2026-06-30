import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ContactModal from '../components/ContactModal'
import styles from './ForOrganisers.module.css'

const LANGUAGES = [{ code: 'de', label: 'DE' }, { code: 'en', label: 'EN' }, { code: 'ua', label: 'UA' }]

type OrgDoc = { id: number; docType: string; language: string; url: string }
type DriveLinks = Record<string, string>

function DriveLink({ href, label }: { href: string; label: string }) {
  return (
    <a className={styles.downloadBtn} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}

function DocButtons({ docs, docType, soonLabel, langs = ['de', 'en', 'ua'], loading = false }: { docs: OrgDoc[]; docType: string; soonLabel: string; langs?: string[]; loading?: boolean }) {
  return (
    <div className={styles.downloadGroup}>
      {langs.map(lang => {
        const doc = docs.find(d => d.docType === docType && d.language === lang)
        if (doc) return <a key={lang} className={styles.downloadBtn} href={doc.url} target="_blank" rel="noopener noreferrer">↗ {lang.toUpperCase()}</a>
        if (loading) return <span key={lang} className={styles.downloadBtnLoading}>{lang.toUpperCase()}</span>
        return <span key={lang} className={styles.downloadBtnDisabled}>{lang.toUpperCase()} — {soonLabel}</span>
      })}
    </div>
  )
}

export default function ForOrganisers() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [contactOpen, setContactOpen] = useState(false)
  const [docs, setDocs] = useState<OrgDoc[]>([])
  const [driveLinks, setDriveLinks] = useState<DriveLinks>({})
  const [loading, setLoading] = useState(true)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showReload, setShowReload] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    fetch('/api/drive-links').then(r => r.ok ? r.json() : {}).then(setDriveLinks).catch(() => {})
  }, [])

  useEffect(() => {
    warmupTimerRef.current = setTimeout(() => setShowWarmup(true), 3000)
    reloadTimerRef.current = setTimeout(() => setShowReload(true), 70000)

    const fetchDocs = () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      fetch('/api/org-docs', { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          clearTimeout(timeout)
          if (!data) { retryRef.current = setTimeout(fetchDocs, 5000); return }
          setDocs(data)
          setLoading(false)
          setShowWarmup(false)
          setShowReload(false)
          if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
        })
        .catch(() => {
          clearTimeout(timeout)
          retryRef.current = setTimeout(fetchDocs, 5000)
        })
    }

    fetchDocs()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
    }
  }, [])

  const changeLanguage = (code: string) => {
    localStorage.setItem('lang', code)
    i18n.changeLanguage(code)
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate('/')}>← DJ Sabi</button>
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

        <h1 className={styles.title}>{t('organisers.title')}</h1>
        <p className={styles.subtitle}>{t('organisers.subtitle')}</p>

        <div className={styles.allFilesBox}>
          <p className={styles.allFilesText}>{t('organisers.allFilesText')}</p>
          <a className={styles.allFilesLink} href={driveLinks['all'] ?? '#'} target="_blank" rel="noopener noreferrer">
            {t('organisers.allFiles')}
          </a>
        </div>

        {(showWarmup || showReload) && (
          <div className={styles.loadingRow}>
            <span className={styles.spinner} />
            {showWarmup && <span className={styles.warmupHint}>{t('common.warmup')}</span>}
            {showReload && (
              <button className={styles.reloadBtn} onClick={() => window.location.reload()}>Reload</button>
            )}
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.pressKit')}</p>
            <p className={styles.cardDesc}>{t('organisers.pressKitDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="press-kit" soonLabel={t('organisers.langSoon')} />
          </div>


          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.logo')}</p>
            <p className={styles.cardDesc}>{t('organisers.logoDesc')}</p>
            <div className={styles.downloadGroup}>
              <DriveLink href={driveLinks['logo-jpg'] ?? '#'} label={t('organisers.logoJpg')} />
              <DriveLink href={driveLinks['logo-png'] ?? '#'} label={t('organisers.logoPng')} />
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.liveVideos')}</p>
            <p className={styles.cardDesc}>{t('organisers.liveVideosDesc')}</p>
            <div className={styles.downloadGroup}>
              <DriveLink href={driveLinks['videos'] ?? '#'} label={t('organisers.openLink')} />
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.hospitalityRider')}</p>
            <p className={styles.cardDesc}>{t('organisers.hospitalityRiderDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="hospitality-rider" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.rider')}</p>
            <p className={styles.cardDesc}>{t('organisers.riderDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="tech-rider" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.contract')}</p>
            <p className={styles.cardDesc}>{t('organisers.contractDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="booking-agreement" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.basicContract')}</p>
            <p className={styles.cardDesc}>{t('organisers.basicContractDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="basic-booking-agreement" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.invoice')}</p>
            <p className={styles.cardDesc}>{t('organisers.invoiceDesc')}</p>
            <DocButtons docs={docs} loading={loading} docType="invoice-template" soonLabel={t('organisers.langSoon')} langs={['de']} />
          </div>

        </div>

        <div className={styles.contactSection}>
          <p className={styles.contactTitle}>{t('organisers.contactTitle')}</p>
          <p className={styles.contactText}>{t('organisers.contactText')}</p>
          <button className={styles.contactLink} onClick={() => setContactOpen(true)}>
            {t('organisers.contactLink')}
          </button>
        </div>

        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      </div>
    </div>
  )
}
