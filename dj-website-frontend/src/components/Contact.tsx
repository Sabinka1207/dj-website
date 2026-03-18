import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Contact.module.css'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function Contact() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', event: '', date: '', message: '' })

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

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('contact.title')}</h2>

        {status === 'success' ? (
          <p className={styles.successMsg}>{t('contact.success')}</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.name')}</label>
                <input
                  className={styles.input}
                  type="text"
                  name="name"
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
                  value={form.email}
                  onChange={handleChange}
                  required
                />
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
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('contact.date')}</label>
                <input
                  className={styles.input}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('contact.message')}</label>
              <textarea
                className={styles.textarea}
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
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
    </section>
  )
}
