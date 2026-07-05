'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/features/FileUpload'
import { Booking } from '@/types'
import toast from 'react-hot-toast'

interface ManualPaymentModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    booking_id: string
    image_url?: string
    whatsapp_proof?: string
    note?: string
    amount: number
  }) => void
  isSubmitting: boolean
}

export function ManualPaymentModal({
  booking,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ManualPaymentModalProps) {
  const [proofUrl, setProofUrl] = useState('')
  const [whatsappProof, setWhatsappProof] = useState('')
  const [proofNote, setProofNote] = useState('')
  const [amount, setAmount] = useState(String(booking.room?.price ?? ''))

  const handleSubmit = () => {
    if (!proofUrl && !whatsappProof) {
      toast.error('Please upload a receipt or enter WhatsApp proof')
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    onSubmit({
      booking_id: booking.id,
      image_url: proofUrl || undefined,
      whatsapp_proof: whatsappProof || undefined,
      note: proofNote || undefined,
      amount: Number(amount),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Payment Proof"
      description={`For booking at ${booking.hostel?.name}`}
      size="md"
    >
      <div className="flex flex-col gap-5">
        {booking.hostel && (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm">
            <p className="text-slate-400 mb-2">Transfer to:</p>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-500">Bank</span>
              <span className="text-slate-200 font-medium">{booking.hostel.bank_name}</span>
              <span className="text-slate-500">Account No.</span>
              <span className="text-slate-200 font-mono">{booking.hostel.account_number}</span>
              <span className="text-slate-500">Account Name</span>
              <span className="text-slate-200">{booking.hostel.account_name}</span>
            </div>
          </div>
        )}

        <FileUpload
          label="Upload Receipt (image)"
          hint="JPG, PNG, WEBP up to 5MB"
          value={proofUrl}
          onUpload={setProofUrl}
          onRemove={() => setProofUrl('')}
          bucket="payment-proofs"
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <Input
          label="WhatsApp Proof Link / Reference"
          placeholder="WhatsApp screenshot link or transfer reference..."
          value={whatsappProof}
          onChange={(e) => setWhatsappProof(e.target.value)}
        />

        <Input
          label="Amount Transferred (₦)"
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Input
          label="Note (optional)"
          placeholder="Any additional notes for the landlord..."
          value={proofNote}
          onChange={(e) => setProofNote(e.target.value)}
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            Submit Proof
          </Button>
        </div>
      </div>
    </Modal>
  )
}