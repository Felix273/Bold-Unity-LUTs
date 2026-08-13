import supabase from './supabase'

export type Category = {
  id: string
  name: string
  slug: string
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  if (error) throw error
  return data ?? []
}
