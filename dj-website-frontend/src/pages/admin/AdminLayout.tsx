import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '../../utils/adminAuth'
import styles from './Admin.module.css'

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    clearToken()
    navigate('/admin/login')
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <nav className={styles.sidebarNav}>
          <NavLink
            to="/admin/events"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            Events
          </NavLink>
          <NavLink
            to="/admin/photos"
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            Photos
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
