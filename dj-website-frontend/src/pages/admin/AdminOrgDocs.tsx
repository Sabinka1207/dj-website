import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type OrgDoc = {
  id: number
  docType: string
  language: string
  url: string
  createdAt: string
}

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'press-kit', label: 'Press Kit' },
  { value: 'tech-rider', label: 'Tech Rider' },
  { value: 'hospitality-rider', label: 'Hospitality Rider' },
  { value: 'booking-agreement', label: 'Booking Agreement' },
  { value: 'basic-booking-agreement', label: 'Basic Booking Agreement' },
  { value: 'invoice-template', label: 'Invoice Template' },
]

const LANGUAGES = ['de', 'en', 'ua']
const DOC_TYPE_LANGS: Record<string, string[]> = {
  'invoice-template': ['de'],
}
const availableLangs = (dt: string) => DOC_TYPE_LANGS[dt] ?? LANGUAGES

const DOC_LABEL: Record<string, string> = Object.fromEntries(DOC_TYPES.map(d => [d.value, d.label]))
const DOC_TYPE_ORDER: Record<string, number> = Object.fromEntries(DOC_TYPES.map((d, i) => [d.value, i]))

type SortKey = 'docType' | 'language' | 'createdAt'
type SortDir = 'asc' | 'desc'

export default function AdminOrgDocs() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<OrgDoc[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('docType')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Add form
  const [addDocType, setAddDocType] = useState(DOC_TYPES[0].value)
  const [addLanguage, setAddLanguage] = useState('en')
  const [addUrl, setAddUrl] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Edit modal
  const [editDoc, setEditDoc] = useState<OrgDoc | null>(null)
  const [editDocType, setEditDocType] = useState(DOC_TYPES[0].value)
  const [editLanguage, setEditLanguage] = useState('en')
  const [editUrl, setEditUrl] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/org-docs', { headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setDocs(await res.json())
  }

  useEffect(() => { load() }, [])

  // ── Add ──────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUrl.trim()) return
    setAddSaving(true)
    setAddError(null)
    const res = await fetch('/api/admin/org-docs', {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ docType: addDocType, language: addLanguage, url: addUrl.trim() }),
    })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (res.status === 409) {
      setAddError(`${DOC_LABEL[addDocType] ?? addDocType} (${addLanguage.toUpperCase()}) already exists.`)
      setAddSaving(false)
      return
    }
    const saved: OrgDoc = await res.json()
    setDocs(prev => [...prev, saved])
    setAddDocType(DOC_TYPES[0].value)
    setAddLanguage('en')
    setAddUrl('')
    setAddSaving(false)
  }

  // ── Edit modal ────────────────────────────────────────────
  const openEdit = (doc: OrgDoc) => {
    setEditDoc(doc)
    setEditDocType(doc.docType)
    setEditLanguage(doc.language)
    setEditUrl(doc.url)
    setEditError(null)
  }

  const closeEdit = () => {
    setEditDoc(null)
    setEditError(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDoc || !editUrl.trim()) return
    setEditSaving(true)
    setEditError(null)
    const res = await fetch(`/api/admin/org-docs/${editDoc.id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify({ docType: editDocType, language: editLanguage, url: editUrl.trim() }),
    })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    if (res.status === 409) {
      setEditError(`${DOC_LABEL[editDocType] ?? editDocType} (${editLanguage.toUpperCase()}) already exists.`)
      setEditSaving(false)
      return
    }
    const saved: OrgDoc = await res.json()
    setDocs(prev => prev.map(d => d.id === editDoc.id ? saved : d))
    setEditSaving(false)
    closeEdit()
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this document link?')) return
    const res = await fetch(`/api/admin/org-docs/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.status === 401) { clearToken(); navigate('/admin/login'); return }
    setDocs(prev => prev.filter(d => d.id !== id))
    if (editDoc?.id === id) closeEdit()
  }

  // ── Sort ──────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortedDocs = [...docs].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'docType') {
      cmp = (DOC_TYPE_ORDER[a.docType] ?? 99) - (DOC_TYPE_ORDER[b.docType] ?? 99)
      if (cmp === 0) cmp = a.language.localeCompare(b.language)
    } else if (sortKey === 'language') {
      cmp = a.language.localeCompare(b.language)
      if (cmp === 0) cmp = (DOC_TYPE_ORDER[a.docType] ?? 99) - (DOC_TYPE_ORDER[b.docType] ?? 99)
    } else {
      cmp = a.createdAt.localeCompare(b.createdAt)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Org Docs</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: 24, fontSize: '0.85rem' }}>
        Manage Google Drive links for organiser documents. Each entry is a doc type + language + URL.
      </p>

      {/* ── Add form ── */}
      <form className={styles.form} onSubmit={handleAdd} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <label className={styles.label}>Document type</label>
            <select className={styles.input} value={addDocType} onChange={e => {
              const dt = e.target.value
              setAddDocType(dt)
              if (!availableLangs(dt).includes(addLanguage)) setAddLanguage(availableLangs(dt)[0])
            }}>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 80px' }}>
            <label className={styles.label}>Language</label>
            <select className={styles.input} value={addLanguage} onChange={e => setAddLanguage(e.target.value)}>
              {availableLangs(addDocType).map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <label className={styles.label} style={{ marginTop: 16 }}>Google Drive URL</label>
        <input
          className={styles.input}
          type="url"
          placeholder="https://drive.google.com/..."
          value={addUrl}
          onChange={e => setAddUrl(e.target.value)}
          required
        />
        <div style={{ marginTop: 16 }}>
          <button className={styles.btn} type="submit" disabled={addSaving || !addUrl.trim()}>
            {addSaving ? '…' : 'Add'}
          </button>
        </div>
        {addError && <p className={styles.error} style={{ marginTop: 8 }}>{addError}</p>}
      </form>

      {/* ── Table ── */}
      {docs.length === 0 ? (
        <p className={styles.empty}>No document links yet.</p>
      ) : (
        <div className={styles.tableWrap} style={{ marginTop: 32, overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => toggleSort('docType')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  Type {sortKey === 'docType' ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                </th>
                <th onClick={() => toggleSort('language')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  Lang {sortKey === 'language' ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                </th>
                <th onClick={() => toggleSort('createdAt')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  Added {sortKey === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedDocs.map(doc => (
                <tr key={doc.id}>
                  <td className={styles.nowrap}>{DOC_LABEL[doc.docType] ?? doc.docType}</td>
                  <td className={styles.nowrap}>{doc.language.toUpperCase()}</td>
                  <td className={styles.nowrap} style={{ fontSize: '0.8rem', opacity: 0.7 }}>{fmtDate(doc.createdAt)}</td>
                  <td className={styles.nowrap}>
                    <a
                      className={styles.iconBtn}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                    <button
                      className={styles.iconBtn}
                      onClick={() => openEdit(doc)}
                      title="Edit"
                      style={{ marginLeft: 4 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                      style={{ marginLeft: 4 }}
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

      {/* ── Edit modal ── */}
      {editDoc && (
        <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className={styles.modalBox} style={{ maxWidth: 480, padding: 40 }}>
            <button className={styles.modalClose} onClick={closeEdit} type="button">×</button>
            <p className={styles.modalMeta}>Edit document link</p>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <label className={styles.label}>Document type</label>
                  <select className={styles.input} value={editDocType} onChange={e => {
                    const dt = e.target.value
                    setEditDocType(dt)
                    if (!availableLangs(dt).includes(editLanguage)) setEditLanguage(availableLangs(dt)[0])
                  }}>
                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '0 0 80px' }}>
                  <label className={styles.label}>Language</label>
                  <select className={styles.input} value={editLanguage} onChange={e => setEditLanguage(e.target.value)}>
                    {availableLangs(editDocType).map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <label className={styles.label} style={{ marginTop: 16 }}>Google Drive URL</label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://drive.google.com/..."
                value={editUrl}
                onChange={e => setEditUrl(e.target.value)}
                required
                autoFocus
              />
              {editError && <p className={styles.error} style={{ marginTop: 8 }}>{editError}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                <button className={styles.btn} type="submit" disabled={editSaving || !editUrl.trim()}>
                  {editSaving ? '…' : 'Save'}
                </button>
                <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
