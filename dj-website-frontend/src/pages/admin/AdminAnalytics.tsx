import { useEffect, useState } from 'react'
import { authHeaders } from '../../utils/adminAuth'
import styles from './Admin.module.css'

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

function StatCard({ label, value, prev, format }: { label: string; value: number; prev: number; format?: (v: number) => string }) {
  const change = pct(value, prev)
  const display = format ? format(value) : (value ?? 0).toLocaleString()
  return (
    <div className={styles.analyticsCard}>
      <div className={styles.analyticsCardLabel}>{label}</div>
      <div className={styles.analyticsCardValue}>{display}</div>
      {change !== null && (
        <div className={`${styles.analyticsCardChange} ${change >= 0 ? styles.positive : styles.negative}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
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

function PageviewsChart({ data }: { data: PageviewPoint[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.y), 1)
  return (
    <div className={styles.analyticsTable} style={{ gridColumn: '1 / -1' }}>
      <div className={styles.analyticsTableTitle}>Page Views Over Time</div>
      <div className={styles.analyticsChart}>
        {data.map(point => (
          <div key={point.x} className={styles.analyticsChartCol}>
            <div className={styles.analyticsChartBar} style={{ height: `${Math.max((point.y / max) * 100, 2)}%` }} title={`${point.x}: ${point.y}`} />
            <div className={styles.analyticsChartLabel}>{point.x.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const { startAt, endAt } = rangeMs(RANGES[rangeIdx].days)
    const qs = `startAt=${startAt}&endAt=${endAt}`
    const unit = RANGES[rangeIdx].unit
    const headers = authHeaders()

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
  const prevBounceRate = stats ? Math.round(((stats.comparison?.bounces ?? 0) / Math.max(stats.comparison?.visits ?? 1, 1)) * 100) : 0
  const avgSession = stats ? Math.round(stats.totaltime / Math.max(stats.visits, 1)) : 0
  const prevAvgSession = stats ? Math.round((stats.comparison?.totaltime ?? 0) / Math.max(stats.comparison?.visits ?? 1, 1)) : 0

  return (
    <div>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Analytics</h1>
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
      </div>

      {loading && <div className={styles.analyticsEmpty}>Loading...</div>}
      {error && <div className={styles.analyticsEmpty}>{error}</div>}

      {!loading && !error && stats && (
        <>
          <div className={styles.analyticsStats}>
            <StatCard label="Visitors" value={stats.visitors} prev={stats.comparison?.visitors ?? 0} />
            <StatCard label="Page Views" value={stats.pageviews} prev={stats.comparison?.pageviews ?? 0} />
            <StatCard label="Visits" value={stats.visits} prev={stats.comparison?.visits ?? 0} />
            <StatCard label="Bounce Rate" value={bounceRate} prev={prevBounceRate} format={v => `${v}%`} />
            <StatCard label="Avg Session" value={avgSession} prev={prevAvgSession} format={fmtTime} />
          </div>

          <div className={styles.analyticsGrid}>
            <PageviewsChart data={pageviews} />
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
    </div>
  )
}
