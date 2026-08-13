import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLutById, type Lut } from '../lib/luts'

export default function LutDetail() {
  const { id } = useParams<{ id: string }>()
  const [lut, setLut] = useState<Lut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchLutById(id)
      .then(setLut)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <p className="text-neutral-500 text-center py-12">Loading...</p>
  }

  if (error) {
    return <p className="text-red-500 text-center py-12">Failed to load LUT: {error}</p>
  }

  if (!lut) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400 mb-4">LUT not found.</p>
        <Link to="/" className="text-red-500 hover:text-red-400 underline">
          Back to catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-neutral-500 hover:text-white text-sm mb-6 inline-block">
        &larr; Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600">
          {lut.cover_image ? (
            <img src={lut.cover_image} alt={lut.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            'No preview'
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-serif text-3xl text-white">{lut.title}</h1>
            {lut.featured && (
              <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                Featured
              </span>
            )}
          </div>

          <p className="text-neutral-400 text-sm mt-1">by {lut.author ?? 'Bold Unity'}</p>

          <p className="text-neutral-300 mt-4">{lut.description}</p>

          <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400">
            <span>★ {lut.rating.toFixed(1)}</span>
            <span>{lut.downloads} downloads</span>
          </div>

          {lut.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {lut.tags.map((tag) => (
                <span key={tag} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {lut.compatibility?.length > 0 && (
            <p className="text-neutral-500 text-sm mt-4">
              Compatible with: {lut.compatibility.join(', ')}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-neutral-800 pt-6">
            <span className="text-2xl font-medium text-white">
              {lut.price === 0 ? 'Free' : `KES ${lut.price.toLocaleString()}`}
            </span>
            <button className="bg-red-700 hover:bg-red-600 text-white rounded px-6 py-3 font-medium">
              {lut.price === 0 ? 'Download' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
