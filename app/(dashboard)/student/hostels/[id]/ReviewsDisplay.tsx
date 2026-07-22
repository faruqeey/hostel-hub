'use client'

import { useEffect, useState } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { Skeleton } from '@/components/ui/Skeleton'

export function ReviewsDisplay({ hostelId }: { hostelId: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      const res = await fetch(`/api/hostels/${hostelId}/reviews`)
      const data = await res.json()
      setReviews(data.data || [])
      setAverage(data.average || 0)
      setCount(data.count || 0)
      setLoading(false)
    }
    fetchReviews()
  }, [hostelId])

  if (loading) {
    return <Skeleton className="h-32 rounded-xl" />
  }

  if (count === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        No reviews yet. Be the first to review this hostel.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-slate-200">{average.toFixed(1)}</span>
        <StarRating value={Math.round(average)} readonly size="md" />
        <span className="text-sm text-slate-500">({count} {count === 1 ? 'review' : 'reviews'})</span>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating value={review.rating} readonly size="sm" />
                <span className="text-sm font-medium text-slate-300">{review.student?.name || 'Anonymous'}</span>
              </div>
              <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}