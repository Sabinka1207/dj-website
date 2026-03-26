import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LegalPage.module.css'

export default function Privacy() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.back} onClick={() => navigate('/', { state: { scrollToContact: true } })}>{t('privacy.back')}</button>
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
      </div>
    </div>
  )
}
