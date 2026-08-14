import supabase from './supabase'

export type Lut = {
  id: string
  title: string
  description: string | null
  author: string | null

  category_id: string | null
  style: string | null
  mood: string | null

  price: number
  rating: number
  downloads: number
  featured: boolean

  tags: string[]
  compatibility: string[]

  input_color_space: string | null
  output_color_space: string | null
  intensity: string | null

  file_url: string | null
  cover_image: string | null
  preview_image: string | null
  preview_video: string | null

  created_at: string
}

export type LutFilters = {
  search?: string
  categoryId?: string
  priceType?: 'all' | 'free' | 'premium'
  featured?: boolean
  sort?: 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high'
  page?: number
  pageSize?: number
}

export async function fetchLuts(filters: LutFilters = {}): Promise<Lut[]> {
  let query = supabase
    .from('luts')
    .select('*')

  const page = Math.max(filters.page ?? 1, 1)
  const pageSize = Math.min(
    Math.max(filters.pageSize ?? 24, 1),
    100
  )

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.priceType === 'free') {
    query = query.eq('price', 0)
  }

  if (filters.priceType === 'premium') {
    query = query.gt('price', 0)
  }

  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured)
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`

    query = query.or(
      `title.ilike.${term},description.ilike.${term},author.ilike.${term}`
    )
  }

  switch (filters.sort) {
    case 'newest':
      query = query.order('created_at', {
        ascending: false,
      })
      break

    case 'rating':
      query = query.order('rating', {
        ascending: false,
      })
      break

    case 'price-low':
      query = query.order('price', {
        ascending: true,
      })
      break

    case 'price-high':
      query = query.order('price', {
        ascending: false,
      })
      break

    case 'popular':
    default:
      query = query
        .order('featured', {
          ascending: false,
        })
        .order('downloads', {
          ascending: false,
        })
      break
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchFeaturedLuts(): Promise<Lut[]> {
  return fetchLuts({
    featured: true,
    sort: 'popular',
    page: 1,
    pageSize: 12,
  })
}

export async function fetchFreeLuts(): Promise<Lut[]> {
  return fetchLuts({
    priceType: 'free',
    sort: 'popular',
    page: 1,
    pageSize: 24,
  })
}

export async function fetchLutById(
  id: string
): Promise<Lut | null> {
  const { data, error } = await supabase
    .from('luts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }

    throw error
  }

  return data
}

export async function downloadFreeLut(
  lutId: string
) {
  const { data, error } = await supabase.rpc(
    'record_free_download',
    {
      p_lut_id: lutId,
    }
  )

  if (error) {
    throw error
  }

  return data
}