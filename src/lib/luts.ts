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
  software?: string
  priceType?: 'all' | 'free' | 'premium'
  featured?: boolean
  sort?: 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high'
  page?: number
  pageSize?: number
}

const SAMPLE_LUTS: Lut[] = [
  {
    id: 'lut-1',
    title: 'Teal & Orange Cinema',
    description: 'Classic blockbuster teal & orange look for dramatic filmmaking and music videos.',
    author: 'Bold Unity Lab',
    category_id: 'cat-1',
    style: 'Blockbuster',
    mood: 'Dramatic',
    price: 0,
    rating: 4.9,
    downloads: 1420,
    featured: true,
    tags: ['cinema', 'teal-orange', 'vlog'],
    compatibility: ['Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'Photoshop'],
    input_color_space: 'Rec.709',
    output_color_space: 'Rec.709',
    intensity: '100%',
    file_url: null,
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    preview_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    preview_video: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lut-2',
    title: 'Moody Vintage Film 35mm',
    description: 'Analog Kodak 35mm film emulation with warm grain and rich midtone contrasts.',
    author: 'Felix Cinema',
    category_id: 'cat-2',
    style: 'Vintage',
    mood: 'Nostalgic',
    price: 2500,
    rating: 5.0,
    downloads: 980,
    featured: true,
    tags: ['vintage', '35mm', 'kodak'],
    compatibility: ['Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro'],
    input_color_space: 'Rec.709',
    output_color_space: 'Rec.709',
    intensity: '85%',
    file_url: null,
    cover_image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    preview_image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    preview_video: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lut-3',
    title: 'Cyberpunk Neon Night',
    description: 'High contrast futuristic neon tones with boosted blues and deep shadows.',
    author: 'Bold Unity Lab',
    category_id: 'cat-3',
    style: 'Cyberpunk',
    mood: 'Futuristic',
    price: 0,
    rating: 4.8,
    downloads: 2100,
    featured: true,
    tags: ['neon', 'night', 'cyberpunk'],
    compatibility: ['Premiere Pro', 'DaVinci Resolve', 'Photoshop'],
    input_color_space: 'Rec.709',
    output_color_space: 'Rec.709',
    intensity: '90%',
    file_url: null,
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    preview_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    preview_video: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lut-4',
    title: 'Golden Hour Portrait',
    description: 'Warm golden hues and smooth skin tone protection for sunset and wedding footage.',
    author: 'Bold Unity Lab',
    category_id: 'cat-1',
    style: 'Golden Hour',
    mood: 'Warm',
    price: 1800,
    rating: 4.9,
    downloads: 850,
    featured: false,
    tags: ['wedding', 'portrait', 'golden-hour'],
    compatibility: ['Premiere Pro', 'Final Cut Pro'],
    input_color_space: 'Rec.709',
    output_color_space: 'Rec.709',
    intensity: '80%',
    file_url: null,
    cover_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    preview_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    preview_video: null,
    created_at: new Date().toISOString(),
  }
]

async function withTimeout<T>(promise: Promise<T>, ms = 800): Promise<T> {
  let timer: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

export async function fetchLuts(filters: LutFilters = {}): Promise<Lut[]> {
  try {
    let query = supabase.from('luts').select('*')

    const page = Math.max(filters.page ?? 1, 1)
    const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 100)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.range(from, to)

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters.software) {
      query = query.contains('compatibility', [filters.software])
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
      query = query.or(`title.ilike.${term},description.ilike.${term},author.ilike.${term}`)
    }

    switch (filters.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'popular':
      default:
        query = query.order('featured', { ascending: false }).order('downloads', { ascending: false })
        break
    }

    const res = await withTimeout(query) as any
    const data = res.data

    if (res.error || !data || data.length === 0) {
      return filterSampleLuts(filters)
    }

    return data
  } catch {
    return filterSampleLuts(filters)
  }
}

function filterSampleLuts(filters: LutFilters): Lut[] {
  let result = [...SAMPLE_LUTS]

  if (filters.priceType === 'free') {
    result = result.filter((item) => item.price === 0)
  } else if (filters.priceType === 'premium') {
    result = result.filter((item) => item.price > 0)
  }

  if (filters.software) {
    result = result.filter((item) =>
      item.compatibility.some((app) => app.toLowerCase().includes(filters.software!.toLowerCase()))
    )
  }

  if (filters.search?.trim()) {
    const s = filters.search.trim().toLowerCase()
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        item.author?.toLowerCase().includes(s)
    )
  }

  return result
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

export async function fetchLutById(id: string): Promise<Lut | null> {
  try {
    const res = await withTimeout(supabase.from('luts').select('*').eq('id', id).single()) as any
    const data = res.data

    if (res.error || !data) {
      return SAMPLE_LUTS.find((item) => item.id === id) ?? SAMPLE_LUTS[0]
    }

    return data
  } catch {
    return SAMPLE_LUTS.find((item) => item.id === id) ?? SAMPLE_LUTS[0]
  }
}

export async function downloadFreeLut(lutId: string) {
  try {
    const res = await withTimeout(supabase.rpc('record_free_download', {
      p_lut_id: lutId,
    })) as any

    if (res.error) {
      return true
    }

    return res.data
  } catch {
    return true
  }
}
