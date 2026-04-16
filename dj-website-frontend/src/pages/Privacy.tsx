import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LegalPage.module.css'

const LANGUAGES = [{ code: 'de', label: 'DE' }, { code: 'en', label: 'EN' }, { code: 'ua', label: 'UA' }]

export default function Privacy() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate('/', { state: { scrollToFooter: true } })}>{t('privacy.back')}</button>
          <div className={styles.langSwitcher}>
            {LANGUAGES.map(({ code, label }) => (
              <button key={code} className={`${styles.langBtn} ${i18n.language === code ? styles.langBtnActive : ''}`} onClick={() => i18n.changeLanguage(code)}>{label}</button>
            ))}
          </div>
        </div>
        <h1 className={styles.title}>{t('privacy.title')}</h1>

        <section className={styles.section}>
          <h2>{t('privacy.s1Title')}</h2>
          <p>
            Sabina Abdulaliieva<br />
            Karoline-Veith-Strasse 37<br />
            60486 Frankfurt am Main<br />
            E-Mail: <a href="mailto:djsabi_ua@icloud.com" className={styles.emailLink}>djsabi_ua@icloud.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.s2Title')}</h2>
          <p>{t('privacy.s2p1')}</p>
          <p>{t('privacy.s2p2')}</p>
          <p>{t('privacy.s2p3')}</p>
          <p>{t('privacy.s2p4')}</p>
          <p>{t('privacy.s2p5')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.s3Title')}</h2>
          <p>{t('privacy.s3p1')}</p>
          <p>{t('privacy.s3p2')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.s4Title')}</h2>
          <p>{t('privacy.s4p1')}</p>
          <p>{t('privacy.s4p2')}</p>
          <p>{t('privacy.s4p3')}</p>
          <p>{t('privacy.s4p4')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.s5Title')}</h2>
          <p>{t('privacy.s5p1')}</p>
          <p>
            <a href="mailto:djsabi_ua@icloud.com" className={styles.emailLink}>djsabi_ua@icloud.com</a>
          </p>
          <p>{t('privacy.s5p3')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.s6Title')}</h2>
          <p>{t('privacy.s6p1')}</p>
          <p>{t('privacy.s6p2')}</p>
          <p>
            {t('privacy.s6p3').split('https://')[0]}
            <a href="https://www.docusign.com/company/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.emailLink}>
              https://www.docusign.com/company/privacy-policy
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
