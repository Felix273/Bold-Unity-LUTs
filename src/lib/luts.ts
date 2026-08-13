import supabase from './supabase'

export type Lut = {
  id: string
  title: string
  description: string | null
  author: string | null
  category_id: string | null
  style: string | null
  price: number
  rating: number
  downloads: number
  featured: boolean
  tags: string[]
  compatibility: string[]
  file_url: string | null
  cover_image: string | null
  created_at: string
}

export type LutFilters = {
  search?: string
  categoryId?: string
  priceType?: 'all' | 'free' | 'premium'
}

export async function fetchLuts(filters: LutFilters = {}): Promise<Lut[]> {
  let query = supabase
    .from('luts')
    .select('*')
    .order('featured', { ascending: false })
    .order('downloads', { ascending: false })

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.priceType === 'free') {
    query = query.eq('price', 0)
  } else if (filters.priceType === 'premium') {
    query = query.gt('price', 0)
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(`title.ilike.${term},description.ilike.${term},author.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchLutById(id: string): Promise<Lut | null> {
  const { data, error } = await supabase
    .from('luts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function downloadFreeLut(lutId: string) {
  const { data, error } = await supabase.rpc('record_free_download', { p_lut_id: lutId })
  if (error) throw error
  return data
}
