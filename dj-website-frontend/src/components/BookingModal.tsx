import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './BookingModal.module.css'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface Props {
  date: string
  onClose: () => void
}

const getLocale = (lang: string) =>
  lang === 'ua' ? 'uk-UA' : lang === 'de' ? 'de-DE' : 'en-GB'

export default function BookingModal({ date, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', event: '', date, message: '', source: 'calendar', language: i18n.language })
  const firstInputRef = useRef<HTMLInputElement>(null)

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
    getLocale(i18n.language),
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  )

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    firstInputRef.current?.focus()
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t('modal.close')}>
          ✕
        </button>

        <h2 className={styles.title}>{t('modal.title')}</h2>
        <p className={styles.dateLabel}>{formattedDate}</p>

        {status === 'success' ? (
          <p className={styles.successMsg}>{t('contact.success')}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.name')}</label>
                <input
                  ref={firstInputRef}
                  className={styles.input}
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.email')}</label>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.event')}</label>
              <input
                className={styles.input}
                type="text"
                name="event"
                value={form.event}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.message')}</label>
              <textarea
                className={styles.textarea}
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t('contact.messagePlaceholder')}
                rows={4}
                required
              />
            </div>

            {status === 'error' && (
              <p className={styles.errorMsg}>{t('contact.error')}</p>
            )}

            <button
              className={styles.submit}
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '...' : t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
