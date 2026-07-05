'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayWithPaystackButton } from '@/components/PayWithPaystackButton'
import { ManualPaymentModal } from '@/components/features/ManualPaymentModal'
import { Button } from '@/components/ui/Button'
import { useSubmitPaymentProof } from '@/hooks/useBookings'
import toast from 'react-hot-toast'

export default function BookingConfirmClient({ booking }: { booking: any }) {
  const router = useRouter()
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const submitProof = useSubmitPaymentProof()
  const amount = booking.rooms?.price ?? 0

  const handleManualSubmit = (data: any) => {
    submitProof.mutate(data, {
      onSuccess: () => {
        toast.success('Payment proof submitted!')
        setIsManualModalOpen(false)
        router.refresh()
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Confirm your booking</h1>
      <p className="mt-1 text-sm text-gray-600">
        {booking.hostels?.name} — {booking.rooms?.room_number}
      </p>
      <p className="mt-4 text-2xl font-bold">₦{Number(amount).toLocaleString()}</p>

      {booking.status === 'PENDING' ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <PayWithPaystackButton bookingId={booking.id} amountNaira={Number(amount)} />
            <Button variant="outline" className="w-full" onClick={() => setIsManualModalOpen(true)}>
              Pay Manually
            </Button>
          </div>
          <p className="text-center text-xs text-slate-500">
            Choose your preferred payment method
          </p>

          <ManualPaymentModal
            booking={booking}
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            onSubmit={handleManualSubmit}
            isSubmitting={submitProof.isPending}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-emerald-700">
          This booking is already {booking.status.toLowerCase()}.
        </p>
      )}
    </div>
  )
}