import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchApprovedReviews, submitReview, type Review } from '../lib/reviews'

type Props = { lutId: string }

export default function ReviewPanel({ lutId }: Props) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchApprovedReviews(lutId)
      .then((items) => { if (mounted) setReviews(items) })
      .catch(() => { if (mounted) setReviews([]) })
    return () => { mounted = false }
  }, [lutId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await submitReview(lutId, rating, comment)
      setComment('')
      setMessage('Review submitted for moderation.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-12 border-t border-[#222] pt-10 space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#f5f2ed]">Reviews</h2>
        <p className="text-xs text-[#8a8580] mt-1">Verified purchaser reviews are moderated before publication.</p>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="border border-[#222] bg-[#111] p-4">
              <div className="text-[#f5f2ed]">{'★'.repeat(review.rating)}<span className="text-[#333]">{'★'.repeat(5 - review.rating)}</span></div>
              {review.comment && <p className="text-sm text-[#e8e4dd] mt-2">{review.comment}</p>}
              <p className="text-[10px] text-[#8a8580] uppercase tracking-widest mt-3">Verified purchaser</p>
            </article>
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="border border-[#222] bg-[#111] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#f5f2ed]">Leave a review</h3>
          <label className="block text-xs uppercase tracking-widest text-[#8a8580]">
            Rating
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="block mt-2 bg-[#0a0a0a] border border-[#333] text-[#f5f2ed] px-3 py-2">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
            </select>
          </label>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={1000} placeholder="Share your experience" className="w-full min-h-24 bg-[#0a0a0a] border border-[#333] text-[#f5f2ed] p-3 text-sm" />
          <button disabled={saving} className="bg-[#c8102e] text-white px-5 py-3 text-xs uppercase tracking-widest disabled:opacity-50">{saving ? 'Submitting...' : 'Submit review'}</button>
          {message && <p className="text-xs text-[#8a8580]">{message}</p>}
        </form>
      )}
    </section>
  )
}
