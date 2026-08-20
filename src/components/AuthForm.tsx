import { useState, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

type AuthFormProps = {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
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

    onSuccess?.()
  }

  return (
    <div className="w-full max-w-sm bg-[#111] border border-[#333] p-8 shadow-2xl">
      <h2 className="font-serif text-2xl mb-6 text-[#f5f2ed]">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#8a8580] mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-[#f5f2ed] focus:outline-none focus:border-[#c8102e]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[#8a8580] mb-2">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-[#f5f2ed] focus:outline-none focus:border-[#c8102e]"
          />
        </div>

        {error && <p className="text-[#ff6b7d] text-xs">{error}</p>}
        {message && <p className="text-emerald-400 text-xs">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#c8102e] hover:bg-[#a00b23] text-white py-3 font-semibold uppercase tracking-widest text-xs disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
        className="w-full text-center text-xs text-[#8a8580] mt-4 hover:text-[#f5f2ed] transition-colors"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
