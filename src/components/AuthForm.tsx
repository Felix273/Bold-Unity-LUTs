import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'signup') {
      setMessage('Account created. Check your email to confirm, then sign in.')
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-neutral-900 border border-neutral-800 rounded-lg p-8">
      <h2 className="font-serif text-2xl mb-6 text-white">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-700 hover:bg-red-600 text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
        className="w-full text-center text-sm text-neutral-400 mt-4 hover:text-white"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
