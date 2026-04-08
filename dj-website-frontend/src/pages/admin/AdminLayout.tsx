import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { authHeaders, clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = () => {
    fetch('/api/admin/bookings/unread-count', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUnreadCount(data.count) })
      .catch(() => {})
  }

  useEffect(() => { fetchUnreadCount() }, [location.pathname])

  useEffect(() => {
    const onRead = () => setUnreadCount(n => Math.max(0, n - 1))
    const onUnread = () => setUnreadCount(n => n + 1)
    window.addEventListener('booking-marked-read', onRead)
    window.addEventListener('booking-marked-unread', onUnread)
    return () => {
      window.removeEventListener('booking-marked-read', onRead)
      window.removeEventListener('booking-marked-unread', onUnread)
    }
  }, [])

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    clearToken()
    navigate('/admin/login')
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '≡'}
        </button>
        <nav className={`${styles.sidebarNav} ${menuOpen ? styles.sidebarNavOpen : ''}`}>
          <NavLink
            to="/admin/events"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Events
          </NavLink>
          <NavLink
            to="/admin/photos"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Photos
          </NavLink>
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Bookings
            {unreadCount > 0 && (
              <span className={styles.navBadge}>{unreadCount}</span>
            )}
          </NavLink>
          <NavLink
            to="/admin/availability"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Availability
          </NavLink>
          <NavLink
            to="/admin/mixes"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Mixes
          </NavLink>
          <NavLink
            to="/admin/tools"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={closeMenu}
          >
            Tools
          </NavLink>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm} ${styles.btnGoogle}`} onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      <main className={styles.adminContent}>
        <Outlet />
      </main>
    </div>
  )
}
