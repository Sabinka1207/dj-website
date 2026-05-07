import { useEffect, useState } from 'react'
import { authHeaders } from '../../utils/adminAuth'
import styles from './Admin.module.css'

// ── Mix Stats ────────────────────────────────────────────
type MixStat = {
  mixId: number
  title: string
  year: number
  plays: number
  uniqueListeners: number
  totalSecondsPlayed: number
  downloads: number
  uniqueDownloaders: number
}

type MixStatSortKey = 'title' | 'year' | 'plays' | 'uniqueListeners' | 'totalSecondsPlayed' | 'downloads' | 'uniqueDownloaders'

function formatDuration(totalSeconds: number): string {
  const sec = totalSeconds || 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function MixStatsTable({ stats }: { stats: MixStat[] }) {
  const [sortKey, setSortKey] = useState<MixStatSortKey>('plays')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: MixStatSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...stats].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const arrow = (key: MixStatSortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'
  const th = (key: MixStatSortKey, label: string) => (
    <th style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} onClick={() => handleSort(key)}>
      {label}<span style={{ opacity: sortKey === key ? 1 : 0.35, fontSize: '0.75em' }}>{arrow(key)}</span>
    </th>
  )

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {th('title', 'Mix')}
            {th('year', 'Year')}
            {th('plays', 'Plays')}
            {th('uniqueListeners', 'Listeners')}
            {th('totalSecondsPlayed', 'Played')}
            {th('downloads', 'Downloads')}
            {th('uniqueDownloaders', 'Downloaders')}
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.mixId}>
              <td>{s.title}</td>
              <td>{s.year || '—'}</td>
              <td>{s.plays}</td>
              <td>{s.uniqueListeners}</td>
              <td>{formatDuration(s.totalSecondsPlayed)}</td>
              <td>{s.downloads}</td>
              <td>{s.uniqueDownloaders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const RANGES = [
  { label: '7 days', days: 7, unit: 'day' },
  { label: '30 days', days: 30, unit: 'day' },
  { label: '90 days', days: 90, unit: 'day' },
]

function rangeMs(days: number) {
  const endAt = Date.now()
  const startAt = endAt - days * 24 * 60 * 60 * 1000
  return { startAt, endAt }
}

interface Stats {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
  comparison: { pageviews: number; visitors: number; visits: number; bounces: number; totaltime: number }
}
interface Metric { x: string; y: number }
interface PageviewPoint { x: string; y: number }

function pct(val: number, prev: number) {
  if (prev === 0) return null
  return ((val - prev) / prev) * 100
}

function fmtTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function StatCard({ label, value, prev, format, noPrev }: { label: string; value: number; prev: number; format?: (v: number) => string; noPrev?: boolean }) {
  const change = pct(value, prev)
  const display = format ? format(value) : (value ?? 0).toLocaleString()
  return (
    <div className={styles.analyticsCard}>
      <div className={styles.analyticsCardLabel}>{label}</div>
      <div className={styles.analyticsCardValue}>{display}</div>
      {change !== null ? (
        <div className={`${styles.analyticsCardChange} ${change >= 0 ? styles.positive : styles.negative}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </div>
      ) : noPrev ? (
        <div className={styles.analyticsCardChange} style={{ opacity: 0.3 }}>— no prev data</div>
      ) : null}
    </div>
  )
}

function MetricTable({ title, data }: { title: string; data: Metric[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.y), 1)
  return (
    <div className={styles.analyticsTable}>
      <div className={styles.analyticsTableTitle}>{title}</div>
      {data.map(row => (
        <div key={row.x} className={styles.analyticsTableRow}>
          <div className={styles.analyticsTableLabel}>{row.x || '(unknown)'}</div>
          <div className={styles.analyticsTableBar}>
            <div className={styles.analyticsTableBarFill} style={{ width: `${(row.y / max) * 100}%` }} />
          </div>
          <div className={styles.analyticsTableCount}>{row.y}</div>
        </div>
      ))}
    </div>
  )
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtChartDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function getMonday(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function aggregateToWeeks(daily: Array<{ x: string; y: number }>): Array<{ x: string; y: number }> {
  const weekMap = new Map<string, number>()
  for (const point of daily) {
    const [y, m, d] = point.x.split('-').map(Number)
    const monday = getMonday(new Date(y, m - 1, d))
    const key = toDateKey(monday)
    weekMap.set(key, (weekMap.get(key) ?? 0) + point.y)
  }
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y }))
}

function fillMissingDates(data: PageviewPoint[], days: number): Array<{ x: string; y: number }> {
  const existing = new Map<string, number>()
  data.forEach(p => existing.set(toDateKey(new Date(p.x)), p.y))

  const result: Array<{ x: string; y: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toDateKey(d)
    result.push({ x: key, y: existing.get(key) ?? 0 })
  }
  return result
}


function PageviewsChart({ data, days }: { data: PageviewPoint[]; days: number }) {
  const daily = fillMissingDates(data, days)
  const filled = days >= 90 ? aggregateToWeeks(daily) : daily
  if (!filled.length) return null
  const max = Math.max(...filled.map(d => d.y), 1)
  const gap = days === 7 ? '16px' : days >= 90 ? '8px' : '3px'
  return (
    <div className={styles.analyticsTable} style={{ gridColumn: '1 / -1' }}>
      <div className={styles.analyticsTableTitle}>Page Views Over Time</div>
      <div className={styles.analyticsChart} style={{ gap }}>
          {filled.map(point => (
            <div key={point.x} className={styles.analyticsChartCol}>
              <div className={styles.analyticsChartCount}>{point.y}</div>
              <div
                className={styles.analyticsChartBarContainer}
                style={{ height: `${point.y === 0 ? 0 : Math.max((point.y / max) * 100, 2)}%` }}
              >
                {point.y > 0 && <div className={styles.analyticsChartBar} />}
              </div>
              <div className={styles.analyticsChartLabel}>{fmtChartDate(point.x)}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<'website' | 'mixes'>('website')
  const [rangeIdx, setRangeIdx] = useState(1)
  const [stats, setStats] = useState<Stats | null>(null)
  const [countries, setCountries] = useState<Metric[]>([])
  const [devices, setDevices] = useState<Metric[]>([])
  const [os, setOs] = useState<Metric[]>([])
  const [browsers, setBrowsers] = useState<Metric[]>([])
  const [pages, setPages] = useState<Metric[]>([])
  const [referrers, setReferrers] = useState<Metric[]>([])
  const [languages, setLanguages] = useState<Metric[]>([])
  const [pageviews, setPageviews] = useState<PageviewPoint[]>([])
  const [prevStats, setPrevStats] = useState<Stats | null>(null)
  const [mixStats, setMixStats] = useState<MixStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const { startAt, endAt } = rangeMs(RANGES[rangeIdx].days)
    const qs = `startAt=${startAt}&endAt=${endAt}`
    const prevQs = `startAt=${startAt - RANGES[rangeIdx].days * 86400000}&endAt=${startAt}`
    const unit = RANGES[rangeIdx].unit
    const headers = authHeaders()

    fetch('/api/admin/mix-stats', { headers }).then(r => r.ok ? r.json() : []).then(d => setMixStats(Array.isArray(d) ? d : []))
    fetch(`/api/admin/analytics/stats?${prevQs}`, { headers }).then(r => r.ok ? r.json() : null).then(d => setPrevStats(d)).catch(() => {})

    Promise.all([
      fetch(`/api/admin/analytics/stats?${qs}`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/pageviews?${qs}&unit=${unit}&timezone=Europe%2FBerlin`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=country`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=device`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=os`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=browser`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=url`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=referrer`, { headers }).then(r => r.json()),
      fetch(`/api/admin/analytics/metrics?${qs}&type=language`, { headers }).then(r => r.json()),
    ])
      .then(([s, pv, c, d, o, b, p, ref, lang]) => {
        setStats(s)
        setPageviews(Array.isArray(pv?.pageviews) ? pv.pageviews : [])
        setCountries(Array.isArray(c) ? c : [])
        setDevices(Array.isArray(d) ? d : [])
        setOs(Array.isArray(o) ? o : [])
        setBrowsers(Array.isArray(b) ? b : [])
        setPages(Array.isArray(p) ? p : [])
        setReferrers(Array.isArray(ref) ? ref : [])
        setLanguages(Array.isArray(lang) ? lang : [])
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [rangeIdx])

  const bounceRate = stats ? Math.round((stats.bounces / Math.max(stats.visits, 1)) * 100) : 0
  const prevBounceRate = prevStats ? Math.round((prevStats.bounces / Math.max(prevStats.visits, 1)) * 100) : 0
  const avgSession = stats ? Math.round(stats.totaltime / Math.max(stats.visits, 1)) : 0
  const prevAvgSession = prevStats ? Math.round(prevStats.totaltime / Math.max(prevStats.visits, 1)) : 0
  const noPrev = !prevStats || (prevStats.visitors === 0 && prevStats.pageviews === 0 && prevStats.visits === 0)

  const tabStyle = (key: 'website' | 'mixes') => ({
    background: 'none', border: 'none',
    borderBottom: activeTab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
    color: activeTab === key ? 'var(--color-text)' : 'var(--color-text-muted)',
    cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '0.82rem', fontWeight: activeTab === key ? 600 : 400,
    letterSpacing: '0.05em', marginBottom: -1,
    padding: '8px 16px', transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Analytics</h1>
        {activeTab === 'website' && (
          <div className={styles.analyticsRangePicker}>
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                className={`${styles.btn} ${styles.btnSm} ${i === rangeIdx ? styles.btnActive : styles.btnGhost}`}
                onClick={() => setRangeIdx(i)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', marginBottom: 28 }}>
        <button style={tabStyle('website')} onClick={() => setActiveTab('website')}>Website Stats</button>
        <button style={tabStyle('mixes')} onClick={() => setActiveTab('mixes')}>Mix Play &amp; Download Stats</button>
      </div>

      {activeTab === 'website' && (
        <>
          {loading && <div className={styles.loadingRow}><span className={styles.spinner} /></div>}
          {error && <div className={styles.analyticsEmpty}>{error}</div>}
          {!loading && !error && stats && (
            <>
              <div className={styles.analyticsStats}>
                <StatCard label="Visitors" value={stats.visitors} prev={prevStats?.visitors ?? 0} noPrev={noPrev} />
                <StatCard label="Page Views" value={stats.pageviews} prev={prevStats?.pageviews ?? 0} noPrev={noPrev} />
                <StatCard label="Visits" value={stats.visits} prev={prevStats?.visits ?? 0} noPrev={noPrev} />
                <StatCard label="Bounce Rate" value={bounceRate} prev={prevBounceRate} format={v => `${v}%`} noPrev={noPrev} />
                <StatCard label="Avg Session" value={avgSession} prev={prevAvgSession} format={fmtTime} noPrev={noPrev} />
              </div>
              <div className={styles.analyticsGrid}>
                <PageviewsChart data={pageviews} days={RANGES[rangeIdx].days} />
                <MetricTable title="Countries" data={countries} />
                <MetricTable title="Devices" data={devices} />
                <MetricTable title="Operating Systems" data={os} />
                <MetricTable title="Browsers" data={browsers} />
                <MetricTable title="Top Pages" data={pages} />
                <MetricTable title="Referrers" data={referrers} />
                <MetricTable title="Languages" data={languages} />
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'mixes' && (
        mixStats.length === 0
          ? <div className={styles.analyticsEmpty}>No stats yet.</div>
          : <MixStatsTable stats={mixStats} />
      )}
    </div>
  )
}
