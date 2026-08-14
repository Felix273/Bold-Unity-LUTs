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
    <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
      <h2 className="font-serif text-2xl mb-6 text-neutral-900">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-2.5 font-medium disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
        className="w-full text-center text-sm text-neutral-500 mt-4 hover:text-neutral-900 transition-colors"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
