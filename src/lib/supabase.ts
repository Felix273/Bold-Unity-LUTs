import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://demo-bold-unity.supabase.co'
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'demo-anon-key'

export const supabase = createClient(url, anonKey)
export default supabase
