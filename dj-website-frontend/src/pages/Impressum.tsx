import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LegalPage.module.css'

const LANGUAGES = [{ code: 'de', label: 'DE' }, { code: 'en', label: 'EN' }, { code: 'ua', label: 'UA' }]

export default function Impressum() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button className={styles.back} onClick={() => navigate('/', { state: { scrollToFooter: true } })}>{t('impressum.back')}</button>
          <div className={styles.langSwitcher}>
            {LANGUAGES.map(({ code, label }) => (
              <button key={code} className={`${styles.langBtn} ${i18n.language === code ? styles.langBtnActive : ''}`} onClick={() => i18n.changeLanguage(code)}>{label}</button>
            ))}
          </div>
        </div>
        <h1 className={styles.title}>{t('impressum.title')}</h1>

        <section className={styles.section}>
          <h2>{t('impressum.legalInfoTitle')}</h2>
          <p>
            Sabina Abdulaliieva<br />
            Karoline-Veith-Strasse 37<br />
            60486 Frankfurt am Main<br />
            Deutschland
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('impressum.contactTitle')}</h2>
          <p>
            E-Mail: <a href="mailto:djsabi.ua@gmail.com" className={styles.emailLink}>djsabi.ua@gmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('impressum.professionTitle')}</h2>
          <p>{t('impressum.professionText')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('impressum.disputeTitle')}</h2>
          <p>{t('impressum.disputeText1')}</p>
          <p>{t('impressum.disputeText2')}</p>
        </section>
      </div>
    </div>
  )
}
