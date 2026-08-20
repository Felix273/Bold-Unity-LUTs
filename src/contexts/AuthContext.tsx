import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import supabase from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/supabase'

type Profile = {
  user_id: string
  email: string
  plan: string
  status: string
  billing_cycle: string
  downloads_used: number
  downloads_limit: number
  is_admin: boolean
}

type AuthCtx = {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  signUp: async () => ({
    error: 'not ready',
  }),
  signIn: async () => ({
    error: 'not ready',
  }),
  signOut: async () => {},
})

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()

    if (error) {
      console.error('Failed to load user profile:', error)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    await fetchProfile(user.id)
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      }

      if (mounted) {
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (
    email: string,
    password: string
  ) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
      }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    return {
      error: error?.message ?? null,
    }
  }

  const signIn = async (
    email: string,
    password: string
  ) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
      }
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    return {
      error: error?.message ?? null,
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return

    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        refreshProfile,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)