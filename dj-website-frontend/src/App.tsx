import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { HelmetProvider } from 'react-helmet-async'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Navbar from './components/Navbar'
import Hero from './sections/Hero'
import About from './sections/About'
import Mixes from './sections/Mixes'
import Gallery from './sections/Gallery'
import Contact from './sections/Contact'
import Events from './sections/Events'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import ScrollToTop from './components/ScrollToTop'
import SEO from './components/SEO'
import Impressum from './pages/Impressum'
import Privacy from './pages/Privacy'
import ForOrganisers from './pages/ForOrganisers'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminEvents from './pages/admin/AdminEvents'
import AdminPhotos from './pages/admin/AdminPhotos'
import AdminBookings from './pages/admin/AdminBookings'
import AdminAvailability from './pages/admin/AdminAvailability'
import AdminTools from './pages/admin/AdminTools'
import AdminMixes from './pages/admin/AdminMixes'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminOrgDocs from './pages/admin/AdminOrgDocs'
import MixesPage from './pages/MixesPage'
import ProtectedRoute from './components/ProtectedRoute'
import { PlayerProvider } from './contexts/PlayerContext'
import GlobalPlayer from './components/GlobalPlayer'

type Consent = 'accepted' | 'declined' | null

function getStoredConsent(): Consent {
  const v = localStorage.getItem('cookieConsent')
  if (v === 'accepted' || v === 'declined') return v
  return null
}

function Home({ consent, onAccept, onDecline }: {
  consent: Consent
  onAccept: () => void
  onDecline: () => void
}) {
  const location = useLocation()

  useEffect(() => {
    if (location.state?.scrollToFooter) {
      window.history.replaceState({}, '')
      const scroll = () => document.getElementById('footer')?.scrollIntoView()
      const onAlive = () => { clearTimeout(fallback); setTimeout(scroll, 50) }
      const fallback = setTimeout(scroll, 3000)
      window.addEventListener('backend-alive', onAlive, { once: true })
    }
    if (location.state?.scrollToMixes) {
      window.history.replaceState({}, '')
      setTimeout(() => document.getElementById('mixes')?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [])

  return (
    <>
      <SEO />
      <main>
        <Hero />
        <About />
        <Mixes cookiesAccepted={consent === 'accepted'} />
        <Gallery />
        <Events />
        <Contact />
      </main>
      <Footer />
      {consent === null && <CookieBanner onAccept={onAccept} onDecline={onDecline} />}
      <ScrollToTop />
    </>
  )
}

function App() {
  const [consent, setConsent] = useState<Consent>(getStoredConsent)


  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setConsent('accepted')
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    setConsent('declined')
  }

  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (!isAdmin && typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track()
    }
  }, [location.pathname, isAdmin])
  const isLegal = location.pathname === '/impressum' || location.pathname === '/privacy' || location.pathname === '/for-organisers' || location.pathname === '/mixes'

  return (
    <HelmetProvider>
      <PlayerProvider>
      {!isAdmin && !isLegal && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              consent={consent}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          }
        />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/for-organisers" element={<ForOrganisers />} />
        <Route path="/mixes" element={<MixesPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/events" replace />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="availability" element={<AdminAvailability />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="org-docs" element={<AdminOrgDocs />} />
          <Route path="mixes" element={<AdminMixes />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
      {!isAdmin && <GlobalPlayer />}
      <Analytics />
      <SpeedInsights />
      </PlayerProvider>
    </HelmetProvider>
  )
}

export default App
