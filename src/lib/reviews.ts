import supabase from './supabase'

export type Review = {
  id: string
  user_id: string
  lut_id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
}

export async function fetchApprovedReviews(lutId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, lut_id, rating, comment, status, created_at')
    .eq('lut_id', lutId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function submitReview(lutId: string, rating: number, comment: string) {
  const { error } = await supabase.rpc('submit_review', {
    p_lut_id: lutId,
    p_rating: rating,
    p_comment: comment,
  })
  if (error) throw error
}

export function averageReviewRating(reviews: Review[], fallback: number) {
  if (reviews.length === 0) return fallback
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
}
