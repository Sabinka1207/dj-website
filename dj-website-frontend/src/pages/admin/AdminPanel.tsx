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

// Split stored "Party name · 22:00 – 4:00" back into parts
const parseDescription = (desc: string): { partyName: string; hours: string } => {
  const idx = desc.indexOf(' · ')
  if (idx === -1) return { partyName: desc, hours: '' }
  return { partyName: desc.slice(0, idx), hours: desc.slice(idx + 3) }
}

// Combine into stored format
const buildDescription = (partyName: string, hours: string): string =>
  hours.trim() ? `${partyName} · ${hours.trim()}` : partyName

export default function AdminPanel() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/events', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setEvents(await res.json())
  }

  useEffect(() => { load() }, [])

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    clearToken()
    navigate('/admin/login')
  }

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
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Events</h1>
        <div className={styles.panelActions}>
          <button className={styles.btn} onClick={openAdd}>+ Add event</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleLogout}>Logout</button>
        </div>
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
                  <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => openEdit(ev)}>Edit</button>
                  <button className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`} onClick={() => handleDelete(ev.id)}>Delete</button>
                </td>
              </tr>
            )
          })}
          {events.length === 0 && (
            <tr><td colSpan={7} className={styles.empty}>No events yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
