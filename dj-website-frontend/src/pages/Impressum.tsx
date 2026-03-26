import { useTranslation } from 'react-i18next'
import styles from './LegalPage.module.css'

export default function Impressum() {
  const { t } = useTranslation()

  return (
    <>
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
          E-Mail: <a href="mailto:djsabi_ua@icloud.com" className={styles.emailLink}>djsabi_ua@icloud.com</a>
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
    </>
  )
}
