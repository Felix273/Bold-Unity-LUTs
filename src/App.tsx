import './App.css'
import { useAuth } from './contexts/AuthContext'
import AuthForm from './components/AuthForm'
import LutGrid from './components/LutGrid'

function App() {
  const { user, profile, loading, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl">BOLD UNITY</h1>

        {!loading && (
          user ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-400">
                {user.email} · {profile?.plan ?? '...'} ({profile?.downloads_used ?? 0}/{profile?.downloads_limit ?? 0})
              </span>
              <button onClick={signOut} className="text-red-500 hover:text-red-400 underline">
                Sign out
              </button>
            </div>
          ) : (
            <span className="text-neutral-500 text-sm">Not signed in</span>
          )
        )}
      </header>

      <main className="px-6 py-10 max-w-6xl mx-auto">
        {!loading && !user && (
          <div className="mb-12">
            <AuthForm />
          </div>
        )}

        <h2 className="font-serif text-3xl mb-6">Cinematic LUTs</h2>
        <LutGrid />
      </main>
    </div>
  )
}

export default App
