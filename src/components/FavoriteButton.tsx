import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { addFavorite, removeFavorite } from '../lib/favorites'

type Props = {
  lutId: string
  isFavorited: boolean
  onChange?: (favorited: boolean) => void
  size?: 'sm' | 'lg'
}

export default function FavoriteButton({ lutId, isFavorited, onChange, size = 'sm' }: Props) {
  const { user } = useAuth()
  const [favorited, setFavorited] = useState(isFavorited)
  const [busy, setBusy] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || busy) return

    setBusy(true)
    const next = !favorited
    setFavorited(next) // optimistic
    try {
      if (next) {
        await addFavorite(user.id, lutId)
      } else {
        await removeFavorite(user.id, lutId)
      }
      onChange?.(next)
    } catch {
      setFavorited(!next) // revert on failure
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  const sizeClasses = size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`${sizeClasses} leading-none disabled:opacity-50 transition-colors ${
        favorited ? 'text-red-600' : 'text-neutral-500 hover:text-red-500'
      }`}
    >
      {favorited ? '♥' : '♡'}
    </button>
  )
}
