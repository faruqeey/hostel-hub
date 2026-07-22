'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PayWithPaystackButton } from '@/components/PayWithPaystackButton'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { ReviewSubmit } from './ReviewSubmit' // we can reuse, but we'll implement directly

interface BookingPageClientProps {
  bookingId: string
  initialStatus: string
  amount: number
  hostelName: string
  roomNumber: string
  hostelId: string
}

export default function BookingPageClient({
  bookingId,
  initialStatus,
  amount,
  hostelName,
  roomNumber,
  hostelId,
}: BookingPageClientProps) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState(initialStatus)
  const [isProcessing, setIsProcessing] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loadingReview, setLoadingReview] = useState(true)

  // Check if we are returning from Paystack (query param)
  const isReturningFromPaystack = searchParams.has('payment') || searchParams.has('trxref')

  // Start processing only if we are returning from Paystack and status is PENDING
  useEffect(() => {
    if (isReturningFromPaystack && status === 'PENDING') {
      setIsProcessing(true)
    }
  }, [isReturningFromPaystack, status])

  // Poll status if processing
  useEffect(() => {
    if (!isProcessing) return

    let attempts = 0
    const maxAttempts = 15
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`)
        const data = await res.json()
        if (data.status && data.status !== 'PENDING') {
          setStatus(data.status)
          setIsProcessing(false)
          setTimeoutReached(false)
          clearInterval(interval)
        } else if (attempts >= maxAttempts) {
          setIsProcessing(false)
          setTimeoutReached(true)
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Status check error:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [bookingId, isProcessing])

  // Fetch existing review when status is CONFIRMED
  useEffect(() => {
    if (status !== 'CONFIRMED') {
      setLoadingReview(false)
      return
    }

    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/hostels/${hostelId}/reviews`)
        const data = await res.json()
        const myReview = data.data?.find((r: any) => r.booking_id === bookingId)
        if (myReview) {
          setExistingReview(myReview)
          setRating(myReview.rating)
          setComment(myReview.comment)
        }
      } catch (err) {
        console.error('Failed to fetch review:', err)
      } finally {
        setLoadingReview(false)
      }
    }
    fetchReview()
  }, [bookingId, hostelId, status])

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      toast.success('Review submitted!')
      // Reload to reflect the new review (or we can update state)
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <h2 className="text-xl font-semibold text-slate-200">Processing your payment...</h2>
          <p className="text-sm text-slate-400">Your booking is being confirmed. This may take a few seconds.</p>
        </div>
      </div>
    )
  }

  // Confirmed state
  if (status === 'CONFIRMED') {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold text-slate-100">Confirm your booking</h1>
        <p className="mt-1 text-sm text-slate-400">
          {hostelName} — {roomNumber}
        </p>
        <p className="mt-4 text-2xl font-bold text-emerald-400">₦{amount.toLocaleString()}</p>
        <p className="mt-6 rounded-lg bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
          ✅ This booking is already confirmed.
        </p>

        {/* Review section */}
        {!loadingReview && (
          <div className="mt-6">
            {existingReview ? (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300">Your Review</h3>
                <div className="mt-2">
                  <StarRating value={existingReview.rating} readonly size="md" />
                </div>
                <p className="mt-2 text-sm text-slate-400">{existingReview.comment}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
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
                  loading={submittingReview}
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || !comment.trim()}
                >
                  Submit Review
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // If timeout reached or pending, show payment options
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold text-slate-100">Confirm your booking</h1>
      <p className="mt-1 text-sm text-slate-400">
        {hostelName} — {roomNumber}
      </p>
      <p className="mt-4 text-2xl font-bold">₦{amount.toLocaleString()}</p>

      {timeoutReached && (
        <p className="mt-2 text-sm text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
          ⏳ Payment confirmation is taking longer than expected. You can try again or check your booking status later.
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <PayWithPaystackButton bookingId={bookingId} amountNaira={amount} />
          <Button variant="outline" className="w-full">
            Pay Manually
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Choose your preferred payment method
        </p>
      </div>
    </div>
  )
}