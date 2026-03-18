import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Mixes from './components/Mixes'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import Impressum from './pages/Impressum'
import Privacy from './pages/Privacy'

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
  return (
    <>
      <main>
        <Hero />
        <About />
        <Mixes cookiesAccepted={consent === 'accepted'} />
        <Gallery />
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

  return (
    <div>
      <Navbar />
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
      </Routes>
    </div>
  )
}

export default App
