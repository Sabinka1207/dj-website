import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type UnavailableDate = {
  id: number
  date: string
  endDate: string | null
  note: string | null
}

const formatRange = (d: UnavailableDate): string =>
  d.endDate && d.endDate !== d.date ? `${d.date} – ${d.endDate}` : d.date

export default function AdminAvailability() {
  const navigate = useNavigate()
  const [dates, setDates] = useState<UnavailableDate[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/unavailable-dates', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setDates(await res.json())
    setListLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate) return
    setSaving(true)
    const res = await fetch('/api/admin/unavailable-dates', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ date: newDate, endDate: newEndDate || null, note: newNote || null }),
    })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    const saved: UnavailableDate = await res.json()
    setDates((prev) => [...prev, saved].sort((a, b) => a.date.localeCompare(b.date)))
    setNewDate('')
    setNewEndDate('')
    setNewNote('')
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/admin/unavailable-dates/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setDates((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Unavailable Dates</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: 24, fontSize: '0.85rem' }}>
        Block single dates or periods (e.g. vacation). They appear greyed-out on the calendar and cannot be booked.
      </p>

      <form className={styles.availabilityForm} onSubmit={handleAdd}>
        <div className={styles.availabilityDates}>
          <input
            className={styles.input}
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            placeholder="From"
            required
          />
          <span className={styles.dateSep}>–</span>
          <input
            className={styles.input}
            type="date"
            value={newEndDate}
            min={newDate || undefined}
            onChange={(e) => setNewEndDate(e.target.value)}
            placeholder="To (optional)"
          />
        </div>
        <input
          className={styles.input}
          type="text"
          placeholder="Note (optional, e.g. Vacation)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button
          className={styles.btn}
          type="submit"
          disabled={saving || !newDate}
        >
          {saving ? '…' : 'Block'}
        </button>
      </form>

      {dates.length === 0 ? (
        listLoading
          ? <div className={styles.loadingRow}><span className={styles.spinner} /></div>
          : <p className={styles.empty}>No unavailable dates set.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dates.map((d) => (
                <tr key={d.id}>
                  <td className={styles.nowrap}>{formatRange(d)}</td>
                  <td>{d.note ?? '—'}</td>
                  <td>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(d.id)}
                      title="Remove"
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
    </>
  )
}
