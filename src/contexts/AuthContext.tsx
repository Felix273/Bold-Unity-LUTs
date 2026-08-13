import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import supabase from '../lib/supabase'

type Profile = {
  user_id: string
  email: string
  plan: string
  status: string
  billing_cycle: string
  downloads_used: number
  downloads_limit: number
}

type AuthCtx = {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  signUp: async () => ({ error: 'not ready' }),
  signIn: async () => ({ error: 'not ready' }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const fetchOrCreateProfile = async (uid: string, email: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', uid)
      .single()

    if (data) {
      setProfile(data)
      return
    }

    if (error && error.code === 'PGRST116') {
      const { data: created, error: insertError } = await supabase
        .from('user_profiles')
        .insert({ user_id: uid, email, plan: 'free', billing_cycle: 'monthly', status: 'active' })
        .select()
        .single()
      if (!insertError) setProfile(created)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchOrCreateProfile(user.id, user.email!)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) fetchOrCreateProfile(session.user.id, session.user.email!)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) fetchOrCreateProfile(session.user.id, session.user.email!)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, refreshProfile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
