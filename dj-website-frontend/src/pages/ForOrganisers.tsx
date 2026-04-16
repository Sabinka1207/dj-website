import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ContactModal from '../components/ContactModal'
import styles from './ForOrganisers.module.css'

const LANGUAGES = [{ code: 'de', label: 'DE' }, { code: 'en', label: 'EN' }, { code: 'ua', label: 'UA' }]

const DRIVE_ALL = 'https://drive.google.com/drive/folders/1RYumv92KptJof1S8VxUxFACzLMepBJC9?usp=drive_link'
const DRIVE_VIDEOS = 'https://drive.google.com/drive/folders/1-C07PmLCBMsC0qDdPN0il7ztRTyrPpYL?usp=drive_link'
const DRIVE_LOGO_JPG = 'https://drive.google.com/file/d/1p7F_5byvk_9hpbhPeR83wvIOj_pV1l8S/view?usp=drive_link'
const DRIVE_LOGO_PNG = 'https://drive.google.com/file/d/1T6hysXCj5ZKqeRa4T18XXBzoMDJy6NgD/view?usp=drive_link'

type OrgDoc = { id: number; docType: string; language: string; url: string }

function DriveLink({ href, label }: { href: string; label: string }) {
  return (
    <a className={styles.downloadBtn} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}

function DocButtons({ docs, docType, soonLabel, langs = ['de', 'en', 'ua'] }: { docs: OrgDoc[]; docType: string; soonLabel: string; langs?: string[] }) {
  return (
    <div className={styles.downloadGroup}>
      {langs.map(lang => {
        const doc = docs.find(d => d.docType === docType && d.language === lang)
        return doc
          ? <a key={lang} className={styles.downloadBtn} href={doc.url} target="_blank" rel="noopener noreferrer">↗ {lang.toUpperCase()}</a>
          : <span key={lang} className={styles.downloadBtnDisabled}>{lang.toUpperCase()} — {soonLabel}</span>
      })}
    </div>
  )
}

export default function ForOrganisers() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [contactOpen, setContactOpen] = useState(false)
  const [docs, setDocs] = useState<OrgDoc[]>([])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    fetch('/api/org-docs').then(r => r.ok ? r.json() : []).then(setDocs).catch(() => {})
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
          <a className={styles.allFilesLink} href={DRIVE_ALL} target="_blank" rel="noopener noreferrer">
            {t('organisers.allFiles')}
          </a>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.pressKit')}</p>
            <p className={styles.cardDesc}>{t('organisers.pressKitDesc')}</p>
            <DocButtons docs={docs} docType="press-kit" soonLabel={t('organisers.langSoon')} />
          </div>


          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.logo')}</p>
            <p className={styles.cardDesc}>{t('organisers.logoDesc')}</p>
            <div className={styles.downloadGroup}>
              <DriveLink href={DRIVE_LOGO_JPG} label={t('organisers.logoJpg')} />
              <DriveLink href={DRIVE_LOGO_PNG} label={t('organisers.logoPng')} />
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.liveVideos')}</p>
            <p className={styles.cardDesc}>{t('organisers.liveVideosDesc')}</p>
            <div className={styles.downloadGroup}>
              <DriveLink href={DRIVE_VIDEOS} label={t('organisers.openLink')} />
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.hospitalityRider')}</p>
            <p className={styles.cardDesc}>{t('organisers.hospitalityRiderDesc')}</p>
            <DocButtons docs={docs} docType="hospitality-rider" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.rider')}</p>
            <p className={styles.cardDesc}>{t('organisers.riderDesc')}</p>
            <DocButtons docs={docs} docType="tech-rider" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.contract')}</p>
            <p className={styles.cardDesc}>{t('organisers.contractDesc')}</p>
            <DocButtons docs={docs} docType="booking-agreement" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.basicContract')}</p>
            <p className={styles.cardDesc}>{t('organisers.basicContractDesc')}</p>
            <DocButtons docs={docs} docType="basic-booking-agreement" soonLabel={t('organisers.langSoon')} />
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>{t('organisers.invoice')}</p>
            <p className={styles.cardDesc}>{t('organisers.invoiceDesc')}</p>
            <DocButtons docs={docs} docType="invoice-template" soonLabel={t('organisers.langSoon')} langs={['de']} />
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
