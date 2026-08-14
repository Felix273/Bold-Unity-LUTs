import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchLutById, downloadFreeLut, type Lut } from '../lib/luts'
import { fetchFavoriteIds } from '../lib/favorites'
import { useAuth } from '../contexts/AuthContext'
import FavoriteButton from './FavoriteButton'

export default function LutDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [lut, setLut] = useState<Lut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchLutById(id)
      .then(setLut)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user && id) {
      fetchFavoriteIds(user.id).then((ids) => setIsFavorited(ids.has(id))).catch(() => {})
    } else {
      setIsFavorited(false)
    }
  }, [user, id])

  const handleDownload = async () => {
    if (!lut) return
    setDownloadError(null)
    setDownloading(true)
    try {
      await downloadFreeLut(lut.id)
      setDownloaded(true)
      setLut({ ...lut, downloads: lut.downloads + 1 })
    } catch (err: any) {
      setDownloadError(err.message ?? 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <p className="text-neutral-400 text-center py-16">Loading...</p>
  }

  if (error) {
    return <p className="text-red-600 text-center py-16">Failed to load LUT: {error}</p>
  }

  if (!lut) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 mb-4">LUT not found.</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 underline">
          Back to catalog
        </Link>
      </div>
    )
  }

  const isFree = lut.price === 0

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-neutral-400 hover:text-neutral-900 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        &larr; Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-video bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300 border border-neutral-200 overflow-hidden">
          {lut.cover_image ? (
            <img src={lut.cover_image} alt={lut.title} className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif">No preview</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-serif text-3xl text-neutral-900">{lut.title}</h1>
            <div className="flex items-center gap-3">
              {lut.featured && (
                <span className="text-xs font-semibold bg-indigo-600 text-white px-2 py-1 rounded">
                  Featured
                </span>
              )}
              <FavoriteButton lutId={lut.id} isFavorited={isFavorited} size="lg" />
            </div>
          </div>

          <p className="text-neutral-500 text-sm mt-1">by {lut.author ?? 'Bold Unity'}</p>

          <p className="text-neutral-700 mt-4">{lut.description}</p>

          <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
            <span>★ {lut.rating.toFixed(1)}</span>
            <span>{lut.downloads} downloads</span>
          </div>

          {lut.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {lut.tags.map((tag) => (
                <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
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

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-neutral-900">
                {isFree ? 'Free' : `KES ${lut.price.toLocaleString()}`}
              </span>

              {isFree ? (
                !user ? (
                  <span className="text-neutral-400 text-sm">Sign in to download</span>
                ) : downloaded ? (
                  <span className="text-green-600 text-sm font-medium">Downloaded ✓</span>
                ) : (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-medium disabled:opacity-50 transition-colors"
                  >
                    {downloading ? 'Downloading...' : 'Download'}
                  </button>
                )
              ) : (
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-medium transition-colors">
                  Buy Now
                </button>
              )}
            </div>

            {downloadError && (
              <p className="text-red-600 text-sm mt-2">{downloadError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
