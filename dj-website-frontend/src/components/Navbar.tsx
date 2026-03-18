import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Navbar.module.css'
import logo from '../assets/Sabi logo white s png.png'

const NAV_LINKS = ['about', 'mixes', 'gallery', 'contact'] as const

const LANGUAGES = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'ua', label: 'UA' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleNavClick = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <a className={styles.logo} onClick={() => handleNavClick('hero')}>
        <img src={logo} alt="DJ Sabi" className={styles.logoImg} />
      </a>

      <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false) }}>
        {NAV_LINKS.map((id) => (
          <button key={id} className={styles.navLink} onClick={() => handleNavClick(id)}>
            {t(`nav.${id}`)}
          </button>
        ))}

        <div className={styles.langSwitcher}>
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              className={`${styles.langBtn} ${i18n.language === code ? styles.activeLang : ''}`}
              onClick={() => i18n.changeLanguage(code)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <button
        className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  )
}
