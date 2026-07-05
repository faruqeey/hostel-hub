'use client'

import { useState } from 'react'

interface PayWithPaystackButtonProps {
  bookingId: string
  amountNaira: number
}

export function PayWithPaystackButton({
  bookingId,
  amountNaira,
}: PayWithPaystackButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Could not start payment')
      }

      // Full-page redirect to Paystack's hosted checkout (card, bank
      // transfer, USSD are all offered there automatically).
      window.location.href = data.authorization_url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Redirecting to Paystack…' : `Pay ₦${amountNaira.toLocaleString()} with Paystack`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
