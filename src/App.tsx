import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LutGrid from './components/LutGrid'
import LutDetail from './components/LutDetail'

function CatalogPage() {
  return (
    <div className="marketplace-page">
      <div className="marketplace-heading">
        <div>
          <div className="marketplace-kicker">
            BOLD UNITY / LUT LIBRARY
          </div>

          <h1>Color grading LUTs</h1>

          <p>
            Cinematic looks for filmmakers, photographers and
            creators.
          </p>
        </div>
      </div>

      <LutGrid />
    </div>
  )
}

function Header() {
  const { user, profile, loading, signOut } = useAuth()

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
            className="marketplace-nav-active"
          >
            LUTs
          </Link>

          <a href="#categories">
            Categories
          </a>

          <a href="#free">
            Free LUTs
          </a>

          <a href="#about">
            About
          </a>
        </nav>

        <div className="marketplace-account">
          {!loading &&
            (user ? (
              <div className="marketplace-user">
                <span>
                  {profile?.plan ?? 'Free'}
                </span>

                <button onClick={signOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/"
                className="marketplace-signin"
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="app">
      <Header />

      <main className="marketplace-main">
        <Routes>
          <Route
            path="/"
            element={<CatalogPage />}
          />

          <Route
            path="/lut/:id"
            element={<LutDetail />}
          />
        </Routes>
      </main>

      <footer className="marketplace-footer">
        <div>
          <strong>BOLD UNITY</strong>
          <span>
            Cinematic color tools for modern creators.
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} Bold Unity
        </span>
      </footer>
    </div>
  )
}

export default App