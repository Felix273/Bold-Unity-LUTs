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

export async function fetchLuts(): Promise<Lut[]> {
  const { data, error } = await supabase
    .from('luts')
    .select('*')
    .order('featured', { ascending: false })
    .order('downloads', { ascending: false })

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
