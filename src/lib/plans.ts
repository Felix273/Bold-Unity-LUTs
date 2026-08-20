import supabase from './supabase'

export type SubscriptionPlan = {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  download_limit: number
  created_at: string
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, price_monthly, price_yearly, download_limit, created_at')
    .order('price_monthly', { ascending: true })

  if (error) throw error
  return data ?? []
}
