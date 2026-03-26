import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { HelmetProvider } from 'react-helmet-async'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Mixes from './components/Mixes'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import SEO from './components/SEO'
import Events from './components/Events'
import Impressum from './pages/Impressum'
import Privacy from './pages/Privacy'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminEvents from './pages/admin/AdminEvents'
import AdminPhotos from './pages/admin/AdminPhotos'
import ProtectedRoute from './components/ProtectedRoute'

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
      setTimeout(() => {
        document.getElementById('footer')?.scrollIntoView()
      }, 100)
    } else if (!window.location.hash) {
      window.scrollTo(0, 0)
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
  const isLegal = location.pathname === '/impressum' || location.pathname === '/privacy'

  return (
    <HelmetProvider>
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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/events" replace />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="photos" element={<AdminPhotos />} />
        </Route>
      </Routes>
      <Analytics />
      <SpeedInsights />
    </HelmetProvider>
  )
}

export default App
