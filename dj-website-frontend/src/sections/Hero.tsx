import { useTranslation } from 'react-i18next'
import styles from './Hero.module.css'
import bgVideo from '../assets/video/DJ Sabi backround compressed.mp4'
import logo from '../assets/Sabi logo white s png.png'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section id="hero" className={styles.hero}>
      <video
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        src={bgVideo}
      />
      <div className={styles.overlay} />
      <div className={styles.glow} />
      <div className={styles.content}>
        <h1 className={styles.name}>DJ SABI</h1>
        <p className={styles.tagline}>{t('hero.tagline')}</p>
        <img src={logo} alt="DJ Sabi" className={styles.heroLogo} />
      </div>
    </section>
  )
}
