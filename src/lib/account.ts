import supabase from './supabase'

export type UserPurchase = {
  id: string
  user_id: string
  lut_id: string
  title: string | null
  amount: number
  payment_method: string | null
  created_at: string
  payment_reference: string | null
  currency: string
  status: string
}

export type UserDownload = {
  id: string
  user_id: string
  lut_id: string
  title: string | null
  created_at: string
}

export async function fetchUserPurchases(userId: string): Promise<UserPurchase[]> {
  const { data, error } = await supabase
    .from('user_purchases')
    .select('id, user_id, lut_id, title, amount, payment_method, created_at, payment_reference, currency, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchUserDownloads(userId: string): Promise<UserDownload[]> {
  const { data, error } = await supabase
    .from('user_downloads')
    .select('id, user_id, lut_id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function cancelSubscription() {
  const { error } = await supabase.rpc('cancel_subscription')
  if (error) throw error
}
