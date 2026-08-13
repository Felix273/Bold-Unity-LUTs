import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLuts, type Lut } from '../lib/luts'

export default function LutGrid() {
  const [luts, setLuts] = useState<Lut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLuts()
      .then(setLuts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-neutral-500 text-center py-12">Loading LUTs...</p>
  }

  if (error) {
    return <p className="text-red-500 text-center py-12">Failed to load LUTs: {error}</p>
  }

  if (luts.length === 0) {
    return <p className="text-neutral-500 text-center py-12">No LUTs found.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {luts.map((lut) => (
        <Link
          to={`/lut/${lut.id}`}
          key={lut.id}
          className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-600 transition-colors block"
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
              {lut.featured && (
                <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                  Featured
                </span>
              )}
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
  )
}
