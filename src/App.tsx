import './App.css'
import { useAuth } from './contexts/AuthContext'
import AuthForm from './components/AuthForm'

function App() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-neutral-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-5xl mb-8">BOLD UNITY</h1>

      {!user ? (
        <AuthForm />
      ) : (
        <div className="text-center space-y-3">
          <p className="text-neutral-300">Signed in as {user.email}</p>
          {profile && (
            <p className="text-neutral-500 text-sm">
              Plan: {profile.plan} · Downloads: {profile.downloads_used}/{profile.downloads_limit}
            </p>
          )}
          <button
            onClick={signOut}
            className="text-sm text-red-500 hover:text-red-400 underline"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default App
