import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLuts, type Lut, type LutFilters } from '../lib/luts'
import { fetchCategories, type Category } from '../lib/categories'
import { fetchFavoriteIds } from '../lib/favorites'
import { useAuth } from '../contexts/AuthContext'
import FavoriteButton from './FavoriteButton'

export default function LutGrid() {
  const { user } = useAuth()
  const [luts, setLuts] = useState<Lut[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priceType, setPriceType] = useState<LutFilters['priceType']>('all')

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      fetchFavoriteIds(user.id).then(setFavoriteIds).catch(() => {})
    } else {
      setFavoriteIds(new Set())
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    fetchLuts({ search, categoryId: categoryId || undefined, priceType })
      .then(setLuts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [search, categoryId, priceType])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search LUTs..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white placeholder-neutral-500"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value as LutFilters['priceType'])}
          className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white"
        >
          <option value="all">All prices</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {loading && <p className="text-neutral-500 text-center py-12">Loading LUTs...</p>}
      {error && <p className="text-red-500 text-center py-12">Failed to load LUTs: {error}</p>}
      {!loading && !error && luts.length === 0 && (
        <p className="text-neutral-500 text-center py-12">No LUTs match your filters.</p>
      )}

      {!loading && !error && luts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {luts.map((lut) => (
            <Link
              to={`/lut/${lut.id}`}
              key={lut.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-600 transition-colors block relative"
            >
              <div className="aspect-video bg-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
                {lut.cover_image ? (
                  <img src={lut.cover_image} alt={lut.title} className="w-full h-full object-cover" />
                ) : (
                  'No preview'
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg text-white">{lut.title}</h3>
                  <div className="flex items-center gap-2">
                    {lut.featured && (
                      <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                        Featured
                      </span>
                    )}
                    <FavoriteButton lutId={lut.id} isFavorited={favoriteIds.has(lut.id)} />
                  </div>
                </div>
                <p className="text-neutral-400 text-sm mt-1 line-clamp-2">{lut.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-white font-medium">
                    {lut.price === 0 ? 'Free' : `KES ${lut.price.toLocaleString()}`}
                  </span>
                  <span className="text-neutral-500 text-sm">★ {lut.rating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
