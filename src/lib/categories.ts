import supabase, { isSupabaseConfigured } from './supabase'

export type Category = {
  id: string
  name: string
  slug: string
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  if (error) throw error
  return data ?? []
}
