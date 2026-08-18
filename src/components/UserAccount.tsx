import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchFavoriteIds } from '../lib/favorites'
import { fetchLutById, type Lut } from '../lib/luts'
import FavoriteButton from './FavoriteButton'

interface UserAccountProps {
  onOpenPricing?: () => void
}

export default function UserAccount({ onOpenPricing }: UserAccountProps) {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'favorites' | 'downloads' | 'settings'>('favorites')
  const [favoriteLuts, setFavoriteLuts] = useState<Lut[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function loadFavorites() {
      setLoadingFavorites(true)
      try {
        const favoriteIdsSet = await fetchFavoriteIds(userId)
        const idsArray = Array.from(favoriteIdsSet)
        const luts = await Promise.all(
          idsArray.map((id) => fetchLutById(id).catch(() => null))
        )
        setFavoriteLuts(luts.filter((item): item is Lut => item !== null))
      } catch (err) {
        console.error('Error loading favorites:', err)
      } finally {
        setLoadingFavorites(false)
      }
    }

    loadFavorites()
  }, [user])

  if (authLoading) {
    return <p className="text-center py-20 text-neutral-400">Loading profile...</p>
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif text-white">Account Access Required</h2>
        <p className="text-sm text-neutral-400">Please sign in to view your account, saved favorites, and downloads.</p>
        <Link
          to="/"
          className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          Return to Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* USER HERO HEADER */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif text-white">{user.email}</h1>
            <span className="text-xs font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md">
              {profile?.plan || 'Free Member'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono">
            Member ID: {user.id.slice(0, 16)}...
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              Upgrade Plan
            </button>
          )}
          <button
            onClick={signOut}
            className="border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-medium text-xs px-4 py-2.5 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-neutral-800 text-sm font-medium gap-8">
        <button
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'favorites'
              ? 'border-amber-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          My Saved Favorites ({favoriteLuts.length})
        </button>
        <button
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'downloads'
              ? 'border-amber-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('downloads')}
        >
          Downloads & Orders
        </button>
        <button
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-amber-500 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Plan Details
        </button>
      </div>

      {/* TAB CONTENT: FAVORITES */}
      {activeTab === 'favorites' && (
        <div>
          {loadingFavorites ? (
            <p className="text-neutral-400 text-sm text-center py-12">Loading saved items...</p>
          ) : favoriteLuts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl space-y-3">
              <span className="text-3xl text-neutral-600 block">♡</span>
              <h3 className="text-lg font-serif text-white">No Saved Favorites Yet</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Explore the library and click the heart icon on any LUT to save it to your personal workspace collection.
              </p>
              <Link
                to="/"
                className="inline-block text-amber-400 hover:underline text-xs font-medium pt-2"
              >
                Browse Color LUT Catalog →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteLuts.map((lut) => (
                <div
                  key={lut.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div className="aspect-video relative overflow-hidden bg-neutral-950">
                    {lut.cover_image && (
                      <img
                        src={lut.cover_image}
                        alt={lut.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                      {lut.price === 0 ? 'FREE' : 'PREMIUM'}
                    </span>
                    <div className="absolute top-2 right-2">
                      <FavoriteButton lutId={lut.id} isFavorited={true} />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <Link
                      to={`/lut/${lut.id}`}
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors block"
                    >
                      {lut.title}
                    </Link>
                    <p className="text-xs text-neutral-400">by {lut.author || 'Bold Unity'}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                      <span>★ {lut.rating?.toFixed(1) ?? '4.9'}</span>
                      <Link
                        to={`/lut/${lut.id}`}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        View & Download →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOWNLOADS */}
      {activeTab === 'downloads' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-sm text-neutral-300 space-y-4">
          <h3 className="font-serif text-lg text-white">Your Asset Download History</h3>
          <p className="text-xs text-neutral-400">
            All free sample downloads and purchased .CUBE LUT packages associated with {user.email}.
          </p>
          <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-950 text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Free Cinematic LUT Collection</p>
              <p className="text-neutral-500 font-mono text-[10px] mt-0.5">Format: .CUBE (Universal 3D LUT)</p>
            </div>
            <span className="text-emerald-400 font-mono">Active License</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SETTINGS / PLAN */}
      {activeTab === 'settings' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-sm text-neutral-300 space-y-4">
          <h3 className="font-serif text-lg text-white">Subscription & Plan Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-500 font-mono uppercase">Current Tier</span>
              <p className="text-lg font-bold text-white capitalize">{profile?.plan || 'Free Member'}</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-500 font-mono uppercase">Download Usage</span>
              <p className="text-lg font-bold text-white">Unlimited Free Downloads</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-500 font-mono uppercase">Commercial Usage</span>
              <p className="text-lg font-bold text-emerald-400">Licensed for YouTube & Commercial</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
