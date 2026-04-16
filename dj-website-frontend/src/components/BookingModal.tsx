import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './BookingModal.module.css'

type Status = 'idle' | 'loading' | 'success' | 'error' | 'tooMany'
type Errors = { name?: string; email?: string; event?: string; message?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getLocale = (lang: string) =>
  lang === 'ua' ? 'uk-UA' : lang === 'de' ? 'de-DE' : 'en-GB'

interface Props {
  date: string
  onClose: () => void
}

export default function BookingModal({ date, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', event: '', date, message: '', source: 'calendar', language: i18n.language })
  const [errors, setErrors] = useState<Errors>({})
  const firstInputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
    getLocale(i18n.language),
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  )

  useEffect(() => {
    firstInputRef.current?.focus()
    const backdrop = backdropRef.current
    const modal = modalRef.current
    if (!backdrop || !modal) return
    const prevent = (e: TouchEvent) => {
      if (!modal.contains(e.target as Node)) e.preventDefault()
    }
    backdrop.addEventListener('touchmove', prevent, { passive: false })
    return () => backdrop.removeEventListener('touchmove', prevent)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const validate = (): Errors => {
    const e: Errors = {}
    if (form.name.trim().length < 2) e.name = t('contact.errorName')
    if (!EMAIL_RE.test(form.email.trim())) e.email = t('contact.errorEmail')
    if (form.event.trim().length < 1) e.event = t('contact.errorEvent')
    if (form.message.trim().length < 10) e.message = t('contact.errorMessage')
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name as keyof Errors]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) setStatus('success')
      else if (res.status === 429) setStatus('tooMany')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div ref={backdropRef} className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div ref={modalRef} className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t('modal.close')}>✕</button>

        <h2 className={styles.title}>{t('modal.title')}</h2>
        <p className={styles.dateLabel}>{formattedDate}</p>

        {status === 'success' ? (
          <p className={styles.successMsg}>{t('contact.success')}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.name')} *</label>
                <input
                  ref={firstInputRef}
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.email')} *</label>
                <input
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.event')} *</label>
              <input
                className={`${styles.input} ${errors.event ? styles.inputError : ''}`}
                type="text"
                name="event"
                value={form.event}
                onChange={handleChange}
              />
              {errors.event && <span className={styles.fieldError}>{errors.event}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.message')} *</label>
              <textarea
                className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder={t('contact.messagePlaceholder')}
                rows={4}
              />
              {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
            </div>

            {status === 'error' && <p className={styles.errorMsg}>{t('contact.error')}</p>}
            {status === 'tooMany' && <p className={styles.errorMsg}>{t('contact.errorTooMany')}</p>}

            <button className={styles.submit} type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? '...' : t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
