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
  { name: 'Cloudinary', description: 'Photos & media storage', url: 'https://console.cloudinary.com', category: 'Media & Docs' },
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

export default function AdminTools() {
  return (
    <>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>Tools & Services</h1>
      </div>
      <p className={styles.muted} style={{ marginBottom: 32, fontSize: '0.85rem' }}>
        Quick access to all services used by this website.
      </p>

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
