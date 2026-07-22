'use client'

import { useState, useEffect } from 'react'
import { PayWithPaystackButton } from '@/components/PayWithPaystackButton'
import { Button } from '@/components/ui/Button'

interface BookingStatusCheckerProps {
  bookingId: string
  initialStatus: string
  amount: number
  hostelName: string
  roomNumber: string
  paymentInitiated: boolean // ✅ NEW PROP
}

export default function BookingStatusChecker({
  bookingId,
  initialStatus,
  amount,
  hostelName,
  roomNumber,
  paymentInitiated,
}: BookingStatusCheckerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isProcessing, setIsProcessing] = useState(false)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // ✅ Only start checking if payment was initiated AND status is PENDING
    if (!paymentInitiated || status !== 'PENDING') {
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    let attempts = 0
    const maxAttempts = 15 // 30 seconds total

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
  }, [bookingId, status, paymentInitiated]) // ✅ Added paymentInitiated to deps

  // ✅ Only show spinner if processing AND payment was initiated
  if (isProcessing && paymentInitiated) {
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

  // Show confirmed booking
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
      </div>
    )
  }

  // Show payment options (pending or timeout)
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