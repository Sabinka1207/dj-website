import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Events.module.css'
import BookingModal from '../components/BookingModal'

type Event = {
  id: string
  date: string
  venue: string
  city: string
  country: string
  description: string
}

const getLocale = (lang: string) =>
  lang === 'ua' ? 'uk-UA' : lang === 'de' ? 'de-DE' : 'en-GB'

const getDayNames = (locale: string): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2021, 0, 4 + i) // 2021-01-04 is Monday
    return d.toLocaleDateString(locale, { weekday: 'short' })
  })

const getMonthCells = (year: number, month: number): (number | null)[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = new Date(year, month, 1).getDay()
  startDow = (startDow + 6) % 7 // Mon=0
  const cells: (number | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

const pad = (n: number) => String(n).padStart(2, '0')
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

const TOTAL_MONTHS = 24
const MAX_OFFSET = TOTAL_MONTHS - 1

export default function Events() {
  const { t, i18n } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [offset, setOffset] = useState(0)

  const locale = getLocale(i18n.language)
  const dayNames = getDayNames(locale)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const baseYear = today.getFullYear()
  const baseMonth = today.getMonth()

  const [loading, setLoading] = useState(true)
  const [showReload, setShowReload] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchEvents = () => {
      fetch('/api/events')
        .then((r) => r.json())
        .then((data: Event[]) => {
          setEvents(data)
          setLoading(false)
          window.dispatchEvent(new Event('backend-alive'))
        })
        .catch(() => { retryRef.current = setTimeout(fetchEvents, 5000) })
    }
    fetchEvents()
    reloadTimerRef.current = setTimeout(() => setShowReload(true), 20000)
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
    }
  }, [])

  const eventsByDate = new Map(events.map((e) => [e.date, e]))

  const currentTM = baseMonth + offset
  const leftYear = baseYear + Math.floor(currentTM / 12)
  const leftMonth = ((currentTM % 12) + 12) % 12

  // Year dropdown options
  const maxTM = baseMonth + MAX_OFFSET
  const maxYear = baseYear + Math.floor(maxTM / 12)
  const yearOptions = Array.from({ length: maxYear - baseYear + 1 }, (_, i) => baseYear + i)

  // Month dropdown options (all 12, disable invalid for selected year)
  const monthOptions = Array.from({ length: 12 }, (_, m) => {
    const candidateOffset = (leftYear - baseYear) * 12 + (m - baseMonth)
    return { month: m, disabled: candidateOffset < 0 || candidateOffset > MAX_OFFSET }
  })

  const handleYearChange = (newYear: number) => {
    let newOffset = (newYear - baseYear) * 12 + (leftMonth - baseMonth)
    newOffset = Math.max(0, Math.min(MAX_OFFSET, newOffset))
    setOffset(newOffset)
  }

  const handleMonthChange = (newMonth: number) => {
    const newOffset = (leftYear - baseYear) * 12 + (newMonth - baseMonth)
    if (newOffset >= 0 && newOffset <= MAX_OFFSET) setOffset(newOffset)
  }

  const handleDayClick = (dateStr: string) => {
    const event = eventsByDate.get(dateStr)
    if (event) {
      setSelectedEvent(event)
    } else {
      const cellDate = new Date(dateStr + 'T00:00:00')
      if (cellDate >= today) setSelectedDate(dateStr)
    }
  }

  const cells = getMonthCells(leftYear, leftMonth)
  const monthLabel = new Date(leftYear, leftMonth).toLocaleDateString(locale, { month: 'long' })

  return (
    <>
      <section id="events" className={styles.events}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{t('events.title')}</h2>
          <p className={styles.subtitle}>{t('events.subtitle')}</p>

          {loading && (
            <div className={styles.loadingRow}>
              <span className={styles.spinner} />
              {showReload && (
                <button className={styles.reloadBtn} onClick={() => window.location.reload()}>
                  Reload
                </button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className={styles.nav}>
            <button
              className={styles.navBtn}
              onClick={() => setOffset((o) => o - 1)}
              disabled={offset === 0}
              aria-label="Previous month"
            >
              ←
            </button>

            <div className={styles.dropdowns}>
              <select
                className={styles.select}
                value={leftMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
              >
                {monthOptions.map(({ month, disabled }) => (
                  <option key={month} value={month} disabled={disabled}>
                    {new Date(leftYear, month).toLocaleDateString(locale, { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={leftYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              className={styles.navBtn}
              onClick={() => setOffset((o) => o + 1)}
              disabled={offset === MAX_OFFSET}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* Single month panel */}
          <div className={styles.monthCard}>
            <div className={styles.monthHeader}>
              <span className={styles.monthName}>{monthLabel}</span>
              <span className={styles.monthYear}>{leftYear}</span>
            </div>

            <div className={styles.weekDays}>
              {dayNames.map((d, i) => (
                <span key={i} className={styles.weekDay}>{d.slice(0, 2)}</span>
              ))}
            </div>

            <div className={styles.days}>
              {cells.map((day, i) => {
                if (day === null) return <span key={`e-${i}`} className={styles.empty} />

                const dateStr = toDateStr(leftYear, leftMonth, day)
                const cellDate = new Date(dateStr + 'T00:00:00')
                const isPast = cellDate < today
                const isToday = cellDate.getTime() === today.getTime()
                const event = eventsByDate.get(dateStr)
                const isBooked = !!event

                return (
                  <button
                    key={day}
                    className={[
                      styles.day,
                      isPast ? styles.past : '',
                      isToday ? styles.today : '',
                      isBooked ? styles.booked : '',
                      !isPast && !isBooked ? styles.available : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleDayClick(dateStr)}
                    disabled={isPast && !isBooked}
                    title={isBooked ? `${event!.venue} · ${event!.city}` : undefined}
                  >
                    <span className={styles.dayNum}>{day}</span>
                    {isBooked && (
                      <>
                        <span className={styles.eventLabel}>{event!.venue}</span>
                        <span className={styles.eventCity}>{event!.city}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendAvailable}`} />
              {t('events.legendAvailable')}
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendBooked}`} />
              {t('events.legendBooked')}
            </span>
          </div>
        </div>
      </section>

      {selectedDate && (
        <BookingModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}

      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} locale={locale} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  )
}

function EventDetailsModal({
  event,
  locale,
  onClose,
}: {
  event: Event
  locale: string
  onClose: () => void
}) {
  const { t } = useTranslation()

  const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const preventScroll = (e: TouchEvent) => e.preventDefault()
    document.addEventListener('touchmove', preventScroll, { passive: false })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.detailsModal}>
        <button className={styles.detailsClose} onClick={onClose} aria-label={t('modal.close')}>✕</button>
        <p className={styles.detailsDate}>{formattedDate}</p>
        <h2 className={styles.detailsVenue}>{event.venue}</h2>
        <p className={styles.detailsCity}>{event.city}, {event.country}</p>
        {event.description && (
          <p className={styles.detailsDesc}>{event.description}</p>
        )}
      </div>
    </div>
  )
}
