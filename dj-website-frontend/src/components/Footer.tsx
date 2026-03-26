import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.css'
import qrWhatsApp from '../assets/WhatsApp.jpeg'
import qrViber from '../assets/Viber.jpg'

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/sabinka_djsabi/',
    qr: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    href: 'https://t.me/sabinka_djsabi',
    qr: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 6.59-1.67 7.86c-.12.55-.45.68-.91.42l-2.5-1.84-1.21 1.16c-.13.13-.24.24-.5.24l.18-2.54 4.6-4.16c.2-.18-.04-.28-.31-.1L8.34 14.3l-2.45-.77c-.53-.17-.54-.53.11-.78l9.57-3.69c.44-.16.82.11.36.83z" />
      </svg>
    ),
  },
  {
    name: 'Viber',
    href: null,
    qr: qrViber,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.44 2.6C15.6 1.07 13.27.22 10.91.2 5.36.2.85 4.67.83 10.21c0 1.77.47 3.5 1.37 5.04L.75 20.5l5.43-1.42a10.17 10.17 0 0 0 4.74 1.18c5.55 0 10.06-4.48 10.08-9.99a9.9 9.9 0 0 0-3.56-7.67zM10.93 19.4c-1.5 0-2.97-.4-4.26-1.16l-.3-.18-3.13.82.84-3.04-.2-.31a8.47 8.47 0 0 1-1.32-4.54c0-4.71 3.85-8.54 8.6-8.54 2.3.01 4.45.9 6.07 2.52a8.44 8.44 0 0 1 2.51 6.03c-.02 4.71-3.87 8.4-8.61 8.4zm4.72-6.34c-.26-.13-1.52-.75-1.75-.83-.24-.09-.41-.13-.58.13-.17.26-.65.83-.8.99-.15.17-.3.19-.55.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.28-1.51-1.43-1.77-.15-.26-.02-.4.11-.53l.39-.46c.12-.14.17-.26.26-.43.08-.17.04-.32-.02-.45-.07-.13-.58-1.4-.8-1.92-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.44.06-.67.32-.23.26-.88.85-.88 2.08 0 1.22.9 2.4 1.03 2.57.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.15-1.2-.06-.11-.23-.17-.49-.3z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: null,
    qr: qrWhatsApp,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.08-1.34A9.93 9.93 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.19 14.1c-.22.62-1.27 1.18-1.75 1.22-.44.04-.86.18-2.93-.61-2.47-.95-4.05-3.48-4.17-3.64-.12-.16-.97-1.29-.97-2.46 0-1.17.61-1.74.83-1.98.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.35-.06.55.41.22.51.74 1.79.81 1.92.07.13.11.28.02.45-.09.17-.13.28-.26.43l-.39.46c-.13.13-.26.27-.11.53.15.26.66 1.08 1.41 1.75.97.86 1.79 1.13 2.05 1.26.26.13.41.11.56-.06.15-.17.63-.74.8-.99.17-.25.34-.21.57-.13.23.08 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.63-.16 1.25z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Sabinka1207',
    qr: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.58 7.19c-.23-.87-.9-1.55-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.87.22-1.54.9-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.87.9 1.55 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.87-.22 1.54-.9 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.social}>
          {SOCIAL_LINKS.map(({ name, href, qr, icon }) =>
            qr ? (
              <button
                key={name}
                className={styles.socialLink}
                aria-label={name}
              >
                {icon}
                <span className={styles.iconLabel}>{name}</span>
                <div className={styles.qrPopup}>
                  <img src={qr} alt={`${name} QR`} className={styles.qrImg} />
                </div>
              </button>
            ) : (
              <a
                key={name}
                href={href!}
                className={styles.socialLink}
                aria-label={name}
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
                <span className={styles.iconLabel}>{name}</span>
              </a>
            )
          )}
        </div>

        <nav className={styles.links}>
          <a
            href="https://drive.google.com/drive/folders/1RYumv92KptJof1S8VxUxFACzLMepBJC9?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {t('footer.promoKit')}
          </a>
          <Link to="/impressum" className={styles.link}>{t('footer.impressum')}</Link>
          <Link to="/privacy" className={styles.link}>{t('footer.privacy')}</Link>
        </nav>

        <p className={styles.copy}>© {year} DJ Sabi</p>
      </div>
    </footer>
  )
}
