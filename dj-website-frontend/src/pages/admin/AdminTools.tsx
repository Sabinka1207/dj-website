import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

type Tool = {
  name: string
  description: string
  url: string
  category: string
}

const TOOLS: Tool[] = [
  // Hosting & infra
  { name: 'Vercel', description: 'Frontend hosting & deployments', url: 'https://vercel.com/dashboard', category: 'Hosting' },
  { name: 'Render', description: 'Backend hosting & deployments', url: 'https://dashboard.render.com', category: 'Hosting' },
  { name: 'Supabase', description: 'PostgreSQL database', url: 'https://supabase.com/dashboard', category: 'Hosting' },
  // Media & Docs
  { name: 'Cloudinary', description: 'Cover images storage', url: 'https://console.cloudinary.com', category: 'Media & Docs' },
  { name: 'Cloudflare R2', description: 'Mix audio files (zero egress)', url: 'https://dash.cloudflare.com/?to=/:account/r2', category: 'Media & Docs' },
  // Notifications & email
  { name: 'Resend', description: 'Transactional email (booking notifications)', url: 'https://resend.com/emails', category: 'Email & Notifications' },
  { name: 'Telegram Bot', description: 'Bot for booking alerts', url: 'https://t.me/BotFather', category: 'Email & Notifications' },
  // Auth
  { name: 'Google Cloud Console', description: 'Google OAuth client (admin login)', url: 'https://console.cloud.google.com', category: 'Auth' },
  { name: 'DocuSign', description: 'Electronic contract signing', url: 'https://app.docusign.com', category: 'Media & Docs' },
  { name: 'Canva', description: 'Flyers, promo graphics, social posts', url: 'https://www.canva.com', category: 'Media & Docs' },
  // Monitoring
  { name: 'UptimeRobot', description: 'Uptime monitoring for backend', url: 'https://uptimerobot.com/dashboard', category: 'Monitoring' },
]

const CATEGORIES = [...new Set(TOOLS.map(t => t.category))]

type CloudinaryUsage = {
  storageBytesUsed: number
  storageBytesLimit: number
  storagePercent: number
  objectCount: number
  bandwidthBytesUsed: number
  bandwidthBytesLimit: number
  plan: string
}

// Cloudinary Free plan limits (API does not return them reliably)
const FREE_STORAGE_BYTES = 25 * 1024 * 1024 * 1024   // 25 GB
const FREE_BANDWIDTH_BYTES = 25 * 1024 * 1024 * 1024  // 25 GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`
}

function UsageBar({ percent }: { percent: number }) {
  const color = percent > 80 ? '#e55' : percent > 50 ? 'var(--color-accent)' : '#4a9'
  return (
    <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function AdminTools() {
  const navigate = useNavigate()
  const [usage, setUsage] = useState<CloudinaryUsage | null>(null)
  const [usageError, setUsageError] = useState(false)

  useEffect(() => {
    fetch('/api/admin/cloudinary-usage', { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) { clearToken(); navigate('/admin/login'); return null }
        if (!res.ok) { setUsageError(true); return null }
        return res.json()
      })
      .then(data => { if (data) setUsage(data) })
      .catch(() => setUsageError(true))
  }, [])

  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Tools & Services</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: 32, fontSize: '0.85rem' }}>
        Quick access to all services used by this website.
      </p>

      {/* Cloudinary storage usage */}
      <div style={{ marginBottom: 40 }}>
        <p className={styles.sectionLabel}>Cloudinary Storage</p>
        {usageError ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Could not load usage data.</p>
        ) : !usage ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div className={styles.toolCard} style={{ cursor: 'default' }}>
              <span className={styles.toolName}>Storage</span>
              <span className={styles.toolDesc}>
                {formatBytes(usage.storageBytesUsed)} / {formatBytes(FREE_STORAGE_BYTES)}
              </span>
              <UsageBar percent={(usage.storageBytesUsed / FREE_STORAGE_BYTES) * 100} />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {((usage.storageBytesUsed / FREE_STORAGE_BYTES) * 100).toFixed(1)}% used
              </span>
            </div>
            <div className={styles.toolCard} style={{ cursor: 'default' }}>
              <span className={styles.toolName}>Objects</span>
              <span className={styles.toolDesc}>{usage.objectCount.toLocaleString()} files</span>
            </div>
            <div className={styles.toolCard} style={{ cursor: 'default' }}>
              <span className={styles.toolName}>Bandwidth</span>
              <span className={styles.toolDesc}>
                {formatBytes(usage.bandwidthBytesUsed)} / {formatBytes(FREE_BANDWIDTH_BYTES)}
              </span>
              <UsageBar percent={(usage.bandwidthBytesUsed / FREE_BANDWIDTH_BYTES) * 100} />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {((usage.bandwidthBytesUsed / FREE_BANDWIDTH_BYTES) * 100).toFixed(1)}% used
              </span>
            </div>
            {usage.plan && (
              <div className={styles.toolCard} style={{ cursor: 'default' }}>
                <span className={styles.toolName}>Plan</span>
                <span className={styles.toolDesc}>{usage.plan}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {CATEGORIES.map(category => (
        <div key={category} style={{ marginBottom: 36 }}>
          <p className={styles.sectionLabel}>{category}</p>
          <div className={styles.toolsGrid}>
            {TOOLS.filter(t => t.category === category).map(tool => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.toolCard}
              >
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolDesc}>{tool.description}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
