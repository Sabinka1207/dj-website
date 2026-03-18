import { useTranslation } from 'react-i18next'
import photo from '../assets/images/71527494-5000-4BB8-A9D6-D6992295B6E2_1_201_a_compressed.webp'
import styles from './About.module.css'

export default function About() {
  const { t } = useTranslation()

  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.photo}>
          <img src={photo} alt="DJ Sabi" className={styles.photoImg} draggable={false} />
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
