import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Review {
  id: string
  user_id: string
  lut_id: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminReviews() {
  const { profile } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_id, lut_id, rating, comment, status, created_at')
      .order('created_at', { ascending: false })
    if (error) setMessage(error.message)
    else setReviews(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!profile?.is_admin) return

    let mounted = true
    async function loadInitialReviews() {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, user_id, lut_id, rating, comment, status, created_at')
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) setMessage(error.message)
      else setReviews(data ?? [])
      setLoading(false)
    }

    void loadInitialReviews()
    return () => {
      mounted = false
    }
  }, [profile?.is_admin])

  if (!profile?.is_admin) {
    return <p className="text-center py-20 text-[#8a8580]">Admin access required.</p>
  }

  const setStatus = async (id: string, status: Review['status']) => {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
    if (error) setMessage(error.message)
    else {
      setMessage(`Review ${status}.`)
      await loadReviews()
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <div>
        <span className="marketplace-kicker">BOLD UNITY / ADMIN</span>
        <h1 className="text-4xl font-serif theme-primary">Review moderation</h1>
        <p className="text-sm text-[#8a8580] mt-2">Approve verified reviews before they affect public ratings.</p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[#222] pb-3" aria-label="Admin sections">
        <Link to="/admin/luts" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">LUT Library</Link>
        <Link to="/admin/plans" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">Subscription Plans</Link>
        <Link to="/admin/reviews" className="bg-[#c8102e] text-white px-4 py-2 text-xs uppercase tracking-widest">Reviews</Link>
      </nav>

      {message && <p className="text-xs text-[#c8102e]">{message}</p>}
      {loading ? <p className="text-[#8a8580]">Loading reviews...</p> : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="border border-[#222] bg-[#111] p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="text-[#f5f2ed]">{'★'.repeat(review.rating)}<span className="text-[#444]">{'★'.repeat(5 - review.rating)}</span></div>
                <span className="text-xs uppercase tracking-widest text-[#8a8580]">{review.status}</span>
              </div>
              <p className="text-sm text-[#e8e4dd]">{review.comment || 'No written comment.'}</p>
              <p className="text-[10px] text-[#8a8580] font-mono">LUT: {review.lut_id} · User: {review.user_id}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStatus(review.id, 'approved')} className="bg-emerald-700 text-white px-3 py-2 text-xs uppercase tracking-widest">Approve</button>
                <button onClick={() => setStatus(review.id, 'rejected')} className="border border-[#5b1825] text-[#ff6b7d] px-3 py-2 text-xs uppercase tracking-widest">Reject</button>
                {review.status !== 'pending' && <button onClick={() => setStatus(review.id, 'pending')} className="border border-[#333] theme-primary px-3 py-2 text-xs uppercase tracking-widest">Reset</button>}
              </div>
            </article>
          ))}
          {reviews.length === 0 && <p className="border border-dashed border-[#333] p-8 text-center text-sm text-[#8a8580]">No reviews submitted.</p>}
        </div>
      )}
    </div>
  )
}
