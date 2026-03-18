import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.css'

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <nav className={styles.links}>
          <Link to="/impressum" className={styles.link}>{t('footer.impressum')}</Link>
          <Link to="/privacy" className={styles.link}>{t('footer.privacy')}</Link>
        </nav>

        <p className={styles.copy}>© {year} DJ Sabi</p>
      </div>
    </footer>
  )
}
