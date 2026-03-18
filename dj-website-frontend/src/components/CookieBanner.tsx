import { useTranslation } from 'react-i18next'
import styles from './CookieBanner.module.css'

interface Props {
  onAccept: () => void
  onDecline: () => void
}

export default function CookieBanner({ onAccept, onDecline }: Props) {
  const { t } = useTranslation()

  return (
    <div className={styles.banner}>
      <p className={styles.message}>{t('cookies.message')}</p>
      <div className={styles.actions}>
        <button className={styles.accept} onClick={onAccept}>{t('cookies.accept')}</button>
        <button className={styles.decline} onClick={onDecline}>{t('cookies.decline')}</button>
      </div>
    </div>
  )
}
