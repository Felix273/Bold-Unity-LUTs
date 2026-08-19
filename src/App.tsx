import { useState } from 'react'
import './App.css'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LutGrid from './components/LutGrid'
import LutDetail from './components/LutDetail'
import UserAccount from './components/UserAccount'
import PricingModal from './components/PricingModal'
import AuthModal from './components/AuthModal'

function CatalogPage({ onOpenPricing }: { onOpenPricing: () => void }) {
  return (
    <div className="marketplace-page">
      <div className="marketplace-heading flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="marketplace-kicker">
            BOLD UNITY / CINEMATIC LOOKS
          </div>

          <h1>Color grading LUTs</h1>

          <p>
            Cinematic color presets for Premiere Pro, DaVinci Resolve, Final Cut Pro & Lightroom.
          </p>
        </div>

        <div>
          <button
            onClick={onOpenPricing}
            className="bg-[#c8102e] hover:bg-[#a00b23] text-white font-semibold text-xs px-6 py-3.5 transition-all shadow-lg shadow-red-900/20 uppercase tracking-widest"
          >
            Get Unlimited Access
          </button>
        </div>
      </div>

      <LutGrid />
    </div>
  )
}

function Header({
  onOpenPricing,
  onOpenAuth,
}: {
  onOpenPricing: () => void
  onOpenAuth: () => void
}) {
  const { user, profile, loading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <header className="marketplace-header">
      <div className="marketplace-header-inner">
        <Link to="/" className="marketplace-brand">
          <span className="marketplace-brand-symbol">
            BU
          </span>

          <span className="marketplace-brand-name">
            BOLD UNITY
          </span>
        </Link>

        <nav className="marketplace-nav">
          <Link
            to="/"
            className={location.pathname === '/' ? 'marketplace-nav-active' : ''}
          >
            LUT Catalog
          </Link>

          <Link
            to="/favorites"
            className={location.pathname === '/favorites' ? 'marketplace-nav-active' : ''}
          >
            Favorites
          </Link>

          <button
            onClick={onOpenPricing}
            className="hover:text-white transition-colors text-xs text-[#8a8580] bg-transparent border-0 cursor-pointer uppercase tracking-widest"
          >
            Pricing & Membership
          </button>
        </nav>

        <div className="marketplace-account">
          {!loading &&
            (user ? (
              <div className="marketplace-user">
                <Link
                  to="/account"
                  className="text-xs font-mono uppercase bg-[#181818] hover:bg-[#222] border border-[#333] text-[#f5f2ed] px-3 py-1.5 transition-colors"
                >
                  {profile?.plan ?? 'Free Plan'}
                </Link>

                <button
                  onClick={() => navigate('/account')}
                  className="text-xs text-[#8a8580] hover:text-white"
                >
                  Account
                </button>

                <button onClick={signOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="marketplace-signin"
              >
                Sign In
              </button>
            ))}
        </div>
      </div>
    </header>
  )
}

function App() {
  const [isPricingOpen, setIsPricingOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  return (
    <div className="app">
      <Header
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="marketplace-main">
        <Routes>
          <Route
            path="/"
            element={<CatalogPage onOpenPricing={() => setIsPricingOpen(true)} />}
          />

          <Route
            path="/lut/:id"
            element={<LutDetail />}
          />

          <Route
            path="/favorites"
            element={<UserAccount onOpenPricing={() => setIsPricingOpen(true)} />}
          />

          <Route
            path="/account"
            element={<UserAccount onOpenPricing={() => setIsPricingOpen(true)} />}
          />
        </Routes>
      </main>

      <footer className="marketplace-footer">
        <div>
          <strong>BOLD UNITY CREATIVE</strong>
          <span>
            Cinematic storytelling tools & color grading presets for modern creators.
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} Bold Unity Creative
        </span>
      </footer>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  )
}

export default App
