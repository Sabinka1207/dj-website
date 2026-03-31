import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Booking = {
  id: number
  name: string
  email: string
  event: string
  date: string
  message: string
  source: string
  language: string
  status: string  // "new" | "read" | "answered"
  reply: string | null
  submittedAt: string
}

const replyTemplate = (name: string, lang: string) => {
  switch (lang) {
    case 'de': return `Hallo ${name},\n\nVielen Dank für deine Anfrage! \n\nMit freundlichen Grüßen,\nDJ Sabi / Sabina Abdulaliieva`
    case 'ua': return `Привіт ${name},\n\nДякую за твій запит! \n\nЗ повагою,\nDJ Sabi / Сабіна Абдулалієва`
    default:   return `Hi ${name},\n\nThank you for your inquiry! \n\nBest regards,\nDJ Sabi / Sabina Abdulaliieva`
  }
}

export default function AdminBookings() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<Booking | null>(null)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const res = await fetch('/api/admin/bookings', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setBookings(await res.json())
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const handleOpen = async (b: Booking) => {
    setSelected(b)
    if (b.status === 'new') {
      await fetch(`/api/admin/bookings/${b.id}/read`, { method: 'PATCH', headers: authHeaders() })
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'read' } : x))
      window.dispatchEvent(new Event('booking-marked-read'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this booking request?')) return
    const wasUnread = bookings.find(b => b.id === id)?.status === 'new'
    const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setBookings(prev => prev.filter(b => b.id !== id))
    if (selected?.id === id) setSelected(null)
    if (wasUnread) window.dispatchEvent(new Event('booking-marked-read'))
  }

  const handleMarkAnswered = async (id: number) => {
    await fetch(`/api/admin/bookings/${id}/answered`, { method: 'PATCH', headers: authHeaders() })
    setBookings(prev => prev.map(x => x.id === id ? { ...x, status: 'answered' } : x))
    setSelected(prev => prev ? { ...prev, status: 'answered' } : prev)
  }

  const handleUnmarkAnswered = async (id: number) => {
    await fetch(`/api/admin/bookings/${id}/read`, { method: 'PATCH', headers: authHeaders() })
    setBookings(prev => prev.map(x => x.id === id ? { ...x, status: 'read' } : x))
    setSelected(prev => prev ? { ...prev, status: 'read' } : prev)
  }

  const handleMarkNew = async (id: number) => {
    await fetch(`/api/admin/bookings/${id}/unread`, { method: 'PATCH', headers: authHeaders() })
    setBookings(prev => prev.map(x => x.id === id ? { ...x, status: 'new' } : x))
    window.dispatchEvent(new Event('booking-marked-unread'))
    setSelected(null)
  }

  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Booking Requests</h1>
        <button
          className={styles.iconBtn}
          onClick={() => load(true)}
          disabled={refreshing}
          title="Refresh"
          style={{ opacity: refreshing ? 0.4 : undefined }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : bookings.length === 0 ? (
        <p className={styles.empty}>No booking requests yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Name</th>
                <th>Email</th>
                <th>Event / Venue</th>
                <th>Requested Date</th>
                <th style={{ width: '40%' }}>Message</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className={b.status === 'new' ? styles.unreadRow : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpen(b)}
                >
                  <td className={`${styles.nowrap} ${styles.tdReceived}`}>
                    <div className={styles.dateRow}>
                      {b.status === 'new' && <span className={styles.unreadDot} />}
                      {b.submittedAt}
                    </div>
                    <div className={styles.badgeStack}>
                      {b.source && (
                        <span className={b.source === 'calendar' ? styles.badgeCalendar : styles.badgeContact}>
                          {b.source}
                        </span>
                      )}
                      {b.status === 'answered' && (
                        <span className={styles.badgeAnswered}>answered</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.tdName}>
                    <div className={styles.mobileName}>{b.name}</div>
                    <div className={styles.mobileEmail}>{b.email}</div>
                    {b.date && <div className={styles.mobileDate}>{b.date}</div>}
                  </td>
                  <td className={styles.tdEmail}>
                    <a
                      href={`mailto:${b.email}`}
                      className={styles.emailLink}
                      onClick={e => e.stopPropagation()}
                    >
                      {b.email}
                    </a>
                  </td>
                  <td className={styles.tdEvent}>{b.event}</td>
                  <td className={`${styles.nowrap} ${styles.tdDate}`}>{b.date}</td>
                  <td className={`${styles.msgCellWide} ${styles.tdMessage}`}>{b.message}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(b.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onMarkNew={handleMarkNew}
          onMarkAnswered={handleMarkAnswered}
          onUnmarkAnswered={handleUnmarkAnswered}
          onAnswered={(id, replyText) => {
            setBookings(prev => prev.map(x => x.id === id ? { ...x, status: 'answered', reply: replyText } : x))
            setSelected(prev => prev ? { ...prev, status: 'answered', reply: replyText } : prev)
          }}
        />
      )}
    </>
  )
}

function BookingModal({
  booking,
  onClose,
  onDelete,
  onMarkNew,
  onMarkAnswered,
  onUnmarkAnswered,
  onAnswered,
}: {
  booking: Booking
  onClose: () => void
  onDelete: (id: number) => void
  onMarkNew: (id: number) => void
  onMarkAnswered: (id: number) => void
  onUnmarkAnswered: (id: number) => void
  onAnswered: (id: number, reply: string) => void
}) {
  const [templateLang, setTemplateLang] = useState(booking.language || 'en')
  const [reply, setReply] = useState(() => replyTemplate(booking.name, booking.language))
  const [replyStatus, setReplyStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const switchLang = (lang: string) => {
    setTemplateLang(lang)
    setReply(replyTemplate(booking.name, lang))
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSend = async () => {
    if (!reply.trim()) return
    setReplyStatus('sending')
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/reply`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: reply }),
      })
      if (res.ok) { setReplyStatus('sent'); onAnswered(booking.id, reply) }
      else setReplyStatus('error')
    } catch {
      setReplyStatus('error')
    }
  }

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdrop}>
      <div className={styles.modalBox}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>

        <p className={styles.modalMeta}>
          {booking.submittedAt} · {booking.source || 'direct'}
          {booking.language && <> · lang: {booking.language.toUpperCase()}</>}
          {booking.status === 'answered' && (
            <span className={styles.badgeAnsweredWrap} style={{ marginLeft: 10 }}>
              <span className={styles.badgeAnswered}>answered</span>
              <button className={styles.badgeRemoveBtn} onClick={() => onUnmarkAnswered(booking.id)} title="Remove answered">✕</button>
            </span>
          )}
        </p>
        <h2 className={styles.modalName}>{booking.name}</h2>
        <p className={styles.modalEmail}>
          <a href={`mailto:${booking.email}`} className={styles.emailLink}>{booking.email}</a>
        </p>

        <div className={styles.modalFields}>
          {booking.event && (
            <div className={styles.modalField}>
              <span className={styles.modalFieldLabel}>Event</span>
              <span>{booking.event}</span>
            </div>
          )}
          {booking.date && (
            <div className={styles.modalField}>
              <span className={styles.modalFieldLabel}>Date</span>
              <span>{booking.date}</span>
            </div>
          )}
        </div>

        {booking.message && (
          <p className={styles.modalMessage}>{booking.message}</p>
        )}

        {booking.reply && (
          <div className={styles.modalSentReply}>
            <p className={styles.modalFieldLabel}>Your reply</p>
            <p className={styles.modalMessage} style={{ borderTop: 'none', paddingTop: 0, marginBottom: 0 }}>{booking.reply}</p>
          </div>
        )}

        <div className={styles.modalReply}>
          <div className={styles.replyLabelRow}>
            <label className={styles.label}>Reply to {booking.name}</label>
            <div className={styles.langSwitcher}>
              {(['en', 'de', 'ua'] as const).map(lang => (
                <button
                  key={lang}
                  className={`${styles.langBtn} ${templateLang === lang ? styles.langBtnActive : ''}`}
                  onClick={() => switchLang(lang)}
                  type="button"
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {replyStatus === 'sent' ? (
            <p className={styles.modalSent}>Reply sent!</p>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                className={`${styles.input} ${styles.modalReplyTextarea}`}
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={5}
                placeholder={`Hi ${booking.name},\n\nThank you for your inquiry...`}
                disabled={replyStatus === 'sending'}
              />
              {replyStatus === 'error' && (
                <p className={styles.error}>Failed to send. Check email settings.</p>
              )}
              <div className={styles.modalActions}>
                <button
                  className={styles.btn}
                  onClick={handleSend}
                  disabled={!reply.trim() || replyStatus === 'sending'}
                >
                  {replyStatus === 'sending' ? 'Sending…' : 'Send reply'}
                </button>
                {booking.status !== 'answered' && (
                  <button
                    className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                    onClick={() => onMarkAnswered(booking.id)}
                  >
                    Mark as answered
                  </button>
                )}
                <button
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                  onClick={() => onMarkNew(booking.id)}
                >
                  Mark as new
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnDanger} ${styles.modalDeleteBtn}`}
                  onClick={() => onDelete(booking.id)}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
