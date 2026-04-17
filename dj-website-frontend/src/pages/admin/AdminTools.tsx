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
  // Notifications & email
  { name: 'Resend', description: 'Transactional email (booking notifications)', url: 'https://resend.com/emails', category: 'Email & Notifications' },
  { name: 'Telegram Bot', description: 'Bot for booking alerts', url: 'https://t.me/BotFather', category: 'Email & Notifications' },
  // Auth
  { name: 'Google Cloud Console', description: 'Google OAuth client (admin login)', url: 'https://console.cloud.google.com', category: 'Auth' },
  // Docs & design
  { name: 'DocuSign', description: 'Electronic contract signing', url: 'https://app.docusign.com', category: 'Docs & Design' },
  { name: 'Canva', description: 'Flyers, promo graphics, social posts', url: 'https://www.canva.com', category: 'Docs & Design' },
  // Monitoring
  { name: 'UptimeRobot', description: 'Uptime monitoring for backend', url: 'https://uptimerobot.com/dashboard', category: 'Monitoring' },
]

const CATEGORIES = [...new Set(TOOLS.map(t => t.category))]

type CloudinaryUsage = {
  storageBytesUsed: number
  objectCount: number
  bandwidthBytesUsed: number
  plan: string
}

type R2Usage = {
  storageBytesUsed: number
  objectCount: number
}

// Free plan limits (hardcoded — APIs do not return them reliably)
const FREE_CLOUDINARY_STORAGE_BYTES = 25 * 1024 * 1024 * 1024   // 25 GB
const FREE_CLOUDINARY_BANDWIDTH_BYTES = 25 * 1024 * 1024 * 1024  // 25 GB
const FREE_R2_STORAGE_BYTES = 10 * 1024 * 1024 * 1024            // 10 GB

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
  const [cloudinaryUsage, setCloudinaryUsage] = useState<CloudinaryUsage | null>(null)
  const [cloudinaryError, setCloudinaryError] = useState(false)
  const [r2Usage, setR2Usage] = useState<R2Usage | null>(null)
  const [r2Error, setR2Error] = useState(false)

  useEffect(() => {
    fetch('/api/admin/cloudinary-usage', { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) { clearToken(); navigate('/admin/login'); return null }
        if (!res.ok) { setCloudinaryError(true); return null }
        return res.json()
      })
      .then(data => { if (data) setCloudinaryUsage(data) })
      .catch(() => setCloudinaryError(true))

    fetch('/api/admin/r2-usage', { headers: authHeaders() })
      .then(res => {
        if (res.status === 401) { clearToken(); navigate('/admin/login'); return null }
        if (!res.ok) { setR2Error(true); return null }
        return res.json()
      })
      .then(data => { if (data) setR2Usage(data) })
      .catch(() => setR2Error(true))
  }, [])

  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Tools & Services</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: 32, fontSize: '0.85rem' }}>
        Quick access to all services used by this website.
      </p>

      {/* Media Storage */}
      <div style={{ marginBottom: 40 }}>
        <p className={styles.sectionLabel}>Media Storage</p>

        {/* Cloudinary row */}
        <div className={styles.mediaRow}>
          <a
            href="https://console.cloudinary.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLinkCard}
          >
            <span className={styles.toolName}>Cloudinary</span>
            <span className={styles.toolDesc}>Cover images storage</span>
          </a>
          {cloudinaryError ? (
            <div className={styles.statCard}>
              <span className={styles.toolName}>Stats</span>
              <span className={styles.toolDesc}>Could not load usage data.</span>
            </div>
          ) : !cloudinaryUsage ? (
            <div className={styles.statCard}>
              <span className={styles.toolDesc}>Loading…</span>
            </div>
          ) : (
            <>
              <div className={styles.statCard}>
                <span className={styles.toolName}>Storage</span>
                <span className={styles.toolDesc}>
                  {formatBytes(cloudinaryUsage.storageBytesUsed)} / {formatBytes(FREE_CLOUDINARY_STORAGE_BYTES)}
                </span>
                <UsageBar percent={(cloudinaryUsage.storageBytesUsed / FREE_CLOUDINARY_STORAGE_BYTES) * 100} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {((cloudinaryUsage.storageBytesUsed / FREE_CLOUDINARY_STORAGE_BYTES) * 100).toFixed(1)}% used
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.toolName}>Bandwidth</span>
                <span className={styles.toolDesc}>
                  {formatBytes(cloudinaryUsage.bandwidthBytesUsed)} / {formatBytes(FREE_CLOUDINARY_BANDWIDTH_BYTES)}
                </span>
                <UsageBar percent={(cloudinaryUsage.bandwidthBytesUsed / FREE_CLOUDINARY_BANDWIDTH_BYTES) * 100} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {((cloudinaryUsage.bandwidthBytesUsed / FREE_CLOUDINARY_BANDWIDTH_BYTES) * 100).toFixed(1)}% used
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.toolName}>Objects</span>
                <span className={styles.toolDesc}>{cloudinaryUsage.objectCount.toLocaleString()} files</span>
                {cloudinaryUsage.plan && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {cloudinaryUsage.plan} plan
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cloudflare R2 row */}
        <div className={styles.mediaRow}>
          <a
            href="https://dash.cloudflare.com/?to=/:account/r2"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLinkCard}
          >
            <span className={styles.toolName}>Cloudflare R2</span>
            <span className={styles.toolDesc}>Mix audio files · zero egress</span>
          </a>
          {r2Error ? (
            <div className={styles.statCard}>
              <span className={styles.toolName}>Stats</span>
              <span className={styles.toolDesc}>Could not load usage data.</span>
            </div>
          ) : !r2Usage ? (
            <div className={styles.statCard}>
              <span className={styles.toolDesc}>Loading…</span>
            </div>
          ) : (
            <>
              <div className={styles.statCard}>
                <span className={styles.toolName}>Storage</span>
                <span className={styles.toolDesc}>
                  {formatBytes(r2Usage.storageBytesUsed)} / {formatBytes(FREE_R2_STORAGE_BYTES)}
                </span>
                <UsageBar percent={(r2Usage.storageBytesUsed / FREE_R2_STORAGE_BYTES) * 100} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {((r2Usage.storageBytesUsed / FREE_R2_STORAGE_BYTES) * 100).toFixed(1)}% used
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.toolName}>Objects</span>
                <span className={styles.toolDesc}>{r2Usage.objectCount.toLocaleString()} files</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  10M Class B · 1M Class A ops/mo free
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tool categories */}
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
