import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Event = {
  id: string
  date: string
  venue: string
  city: string
  country: string
  description: string
}

type FormState = {
  date: string
  venue: string
  city: string
  country: string
  partyName: string
  hours: string
}

const EMPTY_FORM: FormState = { date: '', venue: '', city: '', country: 'DE', partyName: '', hours: '' }

const parseDescription = (desc: string): { partyName: string; hours: string } => {
  const idx = desc.indexOf(' · ')
  if (idx === -1) return { partyName: desc, hours: '' }
  return { partyName: desc.slice(0, idx), hours: desc.slice(idx + 3) }
}

const buildDescription = (partyName: string, hours: string): string =>
  hours.trim() ? `${partyName} · ${hours.trim()}` : partyName

export default function AdminEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/events', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setEvents(await res.json())
    setListLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }

  const openEdit = (ev: Event) => {
    const { partyName, hours } = parseDescription(ev.description)
    setForm({ date: ev.date, venue: ev.venue, city: ev.city, country: ev.country, partyName, hours })
    setEditingId(ev.id)
    setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditingId(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        date: form.date,
        venue: form.venue,
        city: form.city,
        country: form.country,
        description: buildDescription(form.partyName, form.hours),
      }
      const url = editingId ? `/api/admin/events/${editingId}` : '/api/admin/events'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
      if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
      setShowForm(false)
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    await load()
  }

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Events</h1>
        <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={openAdd} title="Add event">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSave}>
          <h2 className={styles.formTitle}>{editingId ? 'Edit event' : 'New event'}</h2>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              Date
              <input className={styles.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </label>
            <label className={styles.label}>
              Venue
              <input className={styles.input} type="text" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} required />
            </label>
            <label className={styles.label}>
              City
              <input className={styles.input} type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
            </label>
            <label className={styles.label}>
              Country
              <input className={styles.input} type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required />
            </label>
            <label className={styles.label}>
              Party name
              <input className={styles.input} type="text" placeholder="e.g. Ukrainian party" value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} required />
            </label>
            <label className={styles.label}>
              Hours <span className={styles.optional}>(optional)</span>
              <input className={styles.input} type="text" placeholder="e.g. 22:00 – 4:00" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </label>
          </div>
          <div className={styles.formFooter}>
            <button className={styles.btn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Venue</th>
            <th>City</th>
            <th>Country</th>
            <th>Party name</th>
            <th>Hours</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map(ev => {
            const { partyName, hours } = parseDescription(ev.description)
            return (
              <tr key={ev.id}>
                <td>{ev.date}</td>
                <td>{ev.venue}</td>
                <td>{ev.city}</td>
                <td>{ev.country}</td>
                <td>{partyName}</td>
                <td>{hours || <span className={styles.muted}>—</span>}</td>
                <td className={styles.rowActions}>
                  <button className={styles.iconBtn} onClick={() => openEdit(ev)} title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleDelete(ev.id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </td>
              </tr>
            )
          })}
          {events.length === 0 && (
            <tr><td colSpan={7} className={styles.empty}>{listLoading ? <span className={styles.spinner} style={{ margin: '0 auto' }} /> : 'No events yet'}</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}
