import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LutGrid from './components/LutGrid'
const LutDetail = lazy(() => import('./components/LutDetail'))
const UserAccount = lazy(() => import('./components/UserAccount'))
const PricingModal = lazy(() => import('./components/PricingModal'))
const AuthModal = lazy(() => import('./components/AuthModal'))
const AdminLuts = lazy(() => import('./components/AdminLuts'))
const AdminPlans = lazy(() => import('./components/AdminPlans'))
const AdminReviews = lazy(() => import('./components/AdminReviews'))

function RouteLoading() {
  return <p className="text-[#8a8580] text-center py-20 uppercase tracking-widest text-xs">Loading...</p>
}

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
  theme,
  onToggleTheme,
}: {
  onOpenPricing: () => void
  onOpenAuth: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}) {
  const { user, profile, loading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

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

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="marketplace-navigation"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="marketplace-navigation" className={`marketplace-nav ${mobileMenuOpen ? 'marketplace-nav-open' : ''}`}>
          <Link
            to="/"
            className={location.pathname === '/' ? 'marketplace-nav-active' : ''}
            onClick={closeMobileMenu}
          >
            LUT Catalog
          </Link>

          <Link
            to="/favorites"
            className={location.pathname === '/favorites' ? 'marketplace-nav-active' : ''}
            onClick={closeMobileMenu}
          >
            Favorites
          </Link>

          <button
            onClick={onOpenPricing}
            className="hover:text-white transition-colors text-xs text-[#8a8580] bg-transparent border-0 cursor-pointer uppercase tracking-widest"
          >
            Pricing & Membership
          </button>

          {profile?.is_admin && (
            <Link
              to="/admin/luts"
              className={location.pathname.startsWith('/admin') ? 'marketplace-nav-active' : ''}
              onClick={closeMobileMenu}
            >
              Admin
            </Link>
          )}

        </nav>

        <div className="marketplace-account">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
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
                  onClick={() => { navigate('/account'); closeMobileMenu() }}
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = window.localStorage.getItem('bold-unity-theme')
    return savedTheme === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('bold-unity-theme', theme)
  }, [theme])

  return (
    <div className="app">
      <Header
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      />

      <main className="marketplace-main">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route
              path="/"
              element={<CatalogPage onOpenPricing={() => setIsPricingOpen(true)} />}
            />

          <Route
            path="/lut/:id"
            element={
              <LutDetail
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            }
          />

          <Route
            path="/favorites"
            element={<UserAccount onOpenPricing={() => setIsPricingOpen(true)} />}
          />

          <Route
            path="/account"
            element={<UserAccount onOpenPricing={() => setIsPricingOpen(true)} />}
          />

            <Route path="/admin/luts" element={<AdminLuts />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
          </Routes>
        </Suspense>
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

      <Suspense fallback={null}>
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </Suspense>
    </div>
  )
}

export default App
