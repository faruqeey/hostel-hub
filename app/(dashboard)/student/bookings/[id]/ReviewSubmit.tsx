'use client'

import { useState, useEffect } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface ReviewSubmitProps {
  bookingId: string
  hostelId: string
  initialStatus: string
}

export function ReviewSubmit({ bookingId, hostelId, initialStatus }: ReviewSubmitProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(true)

  // Poll status and check for existing review
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    const fetchData = async () => {
      try {
        // 1. Get current status
        const statusRes = await fetch(`/api/bookings/${bookingId}/status`)
        const statusData = await statusRes.json()
        if (statusData.status) {
          setStatus(statusData.status)
        }

        // 2. If confirmed, fetch review
        if (statusData.status === 'CONFIRMED') {
          const reviewRes = await fetch(`/api/hostels/${hostelId}/reviews`)
          const reviewData = await reviewRes.json()
          const myReview = reviewData.data?.find((r: any) => r.booking_id === bookingId)
          if (myReview) {
            setExistingReview(myReview)
            setRating(myReview.rating)
            setComment(myReview.comment)
          }
          setLoading(false)
          return
        }

        // 3. If still pending, keep polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(fetchData, 2000)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setLoading(false)
      }
    }

    fetchData()
  }, [bookingId, hostelId])

  // Show nothing while loading
  if (loading) return null

  // Only show for confirmed bookings
  if (status !== 'CONFIRMED') return null

  // Show existing review
  if (existingReview) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300">Your Review</h3>
        <div className="mt-2">
          <StarRating value={existingReview.rating} readonly size="md" />
        </div>
        <p className="mt-2 text-sm text-slate-400">{existingReview.comment}</p>
        <p className="mt-1 text-xs text-slate-500">
          Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
        </p>
      </div>
    )
  }

  // Show form
  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      
      toast.success('Review submitted!')
      
      // ✅ Update the UI immediately with the new review
      setExistingReview({
        rating,
        comment,
        created_at: new Date().toISOString(),
      })
      
      // ✅ Reset form (optional)
      setRating(0)
      setComment('')
      
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300">Rate Your Stay</h3>
      <p className="text-xs text-slate-500 mt-1">Help other students by sharing your experience.</p>
      <div className="mt-3">
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <Textarea
        placeholder="Write your review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-3"
        rows={3}
      />
      <Button
        variant="primary"
        className="mt-3"
        loading={submitting}
        onClick={handleSubmit}
        disabled={rating === 0 || !comment.trim()}
      >
        Submit Review
      </Button>
    </div>
  )
}