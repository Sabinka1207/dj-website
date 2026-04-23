import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Contact.module.css'

type Status = 'idle' | 'loading' | 'success' | 'error' | 'tooMany'
type Errors = { name?: string; email?: string; message?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', event: '', date: '', message: '', source: 'contact', language: i18n.language })
  const [errors, setErrors] = useState<Errors>({})

  const validate = (): Errors => {
    const e: Errors = {}
    if (form.name.trim().length < 2) e.name = t('contact.errorName')
    if (!EMAIL_RE.test(form.email.trim())) e.email = t('contact.errorEmail')
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
        body: JSON.stringify({ ...form, language: i18n.language }),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', event: '', date: '', message: '', source: 'contact', language: i18n.language })
        setTimeout(() => setStatus('idle'), 4000)
        if (typeof window !== 'undefined' && (window as any).umami) {
          (window as any).umami.track('booking_submitted')
        }
      } else if (res.status === 429) {
        setStatus('tooMany')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('contact.title')}</h2>

        {status === 'success' ? (
          <p className={styles.successMsg}>{t('contact.success')}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.name')} <span className={styles.required}>*</span></label>
                <input
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
                <label className={styles.label}>{t('contact.email')} <span className={styles.required}>*</span></label>
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

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.event')}</label>
                <input
                  className={styles.input}
                  type="text"
                  name="event"
                  value={form.event}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.date')}</label>
                <div className={styles.dateWrap}>
                  <input
                    className={styles.input}
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                  {form.date && (
                    <button
                      type="button"
                      className={styles.dateClear}
                      onClick={() => setForm(f => ({ ...f, date: '' }))}
                      aria-label="Clear date"
                    >✕</button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.message')} <span className={styles.required}>*</span></label>
              <textarea
                className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
              />
              {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
            </div>
            <p className={styles.requiredNote}><span className={styles.required}>*</span> {t('contact.required')}</p>

            {status === 'error' && <p className={styles.errorMsg}>{t('contact.error')}</p>}
            {status === 'tooMany' && <p className={styles.errorMsg}>{t('contact.errorTooMany')}</p>}

            <button className={styles.submit} type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? '...' : t('contact.send')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
