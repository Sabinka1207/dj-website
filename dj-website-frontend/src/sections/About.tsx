import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import photo from '../assets/images/71527494-5000-4BB8-A9D6-D6992295B6E2_1_201_a_compressed.webp'
import styles from './About.module.css'

const PRESS_KIT_URLS: Record<string, string> = {
  de: '/press-kit/press-kit-de.pdf',
  en: '/press-kit/press-kit-en.pdf',
  ua: '/press-kit/press-kit-ua.pdf',
}

export default function About() {
  const { t, i18n } = useTranslation()
  const pressKitUrl = PRESS_KIT_URLS[i18n.language] ?? PRESS_KIT_URLS.en

  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.photo}>
          <img src={photo} alt="DJ Sabi" className={styles.photoImg} draggable={false} />
          <div className={styles.actions}>
            <a href={pressKitUrl} download className={styles.promoLink}>
              {t('about.downloadPressKit')}
            </a>
            <Link to="/for-organisers" className={styles.organisersLink}>
              {t('about.forOrganisers')}
            </Link>
          </div>
        </div>

        <div className={styles.text}>
          <h2 className={styles.title}>{t('about.title')}</h2>
          {t('about.bio').split('\n\n').map((para, i) => (
            <p key={i} className={styles.bio}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
