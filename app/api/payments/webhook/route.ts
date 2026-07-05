import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/supabase/paystack'
import { sendBookingConfirmationEmail } from '@/lib/supabase/email'

export const dynamic = 'force-dynamic'

function isValidSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Missing PAYSTACK_SECRET_KEY env var')
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  const a = Buffer.from(hash)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!isValidSignature(rawBody, signature)) {
    console.warn('Paystack webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const reference: string | undefined = event.data?.reference
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    const verified = await verifyTransaction(reference)

    if (verified.data.status !== 'success') {
      console.warn(`Webhook/verify mismatch for ${reference}: ${verified.data.status}`)
      return NextResponse.json({ received: true })
    }

    // Get existing transaction
    const { data: existingTx, error: fetchTxError } = await admin
      .from('paystack_transactions')
      .select('id, status, booking_id')
      .eq('reference', reference)
      .single()

    if (fetchTxError || !existingTx) {
      console.error('No matching transaction row for reference:', reference)
      return NextResponse.json({ error: 'Unknown transaction' }, { status: 404 })
    }

    if (existingTx.status === 'success') {
      return NextResponse.json({ received: true })
    }

    // Update transaction
    const { error: updateTxError } = await admin
      .from('paystack_transactions')
      .update({
        status: 'success',
        channel: verified.data.channel,
        paystack_response: verified.data,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference)

    if (updateTxError) throw updateTxError

    // Update booking status
    const { data: booking, error: updateBookingError } = await admin
      .from('bookings')
      .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
      .eq('id', existingTx.booking_id)
      .eq('status', 'PENDING')
      .select('id, student_id, hostel_id, hostels(name), rooms(room_number)')
      .single()

    if (updateBookingError) throw updateBookingError

    // ✅ CREATE PAYMENT PROOF FOR PAYSTACK PAYMENTS
    // This ensures landlord sees "Verified" instead of "No payment proof"
    const amountPaid = Number(verified.data.amount) / 100
    const { error: proofError } = await admin
      .from('payment_proofs')
      .insert({
        booking_id: existingTx.booking_id,
        image_url: `https://paystack.com/receipt/${reference}`,
        amount: amountPaid,
        status: 'VERIFIED',
        note: `Paid via Paystack. Reference: ${reference}`,
        uploaded_at: new Date().toISOString(),
      })

    if (proofError) {
      console.error('Failed to create payment proof:', proofError)
      // Don't fail the webhook — booking is already confirmed
    }

    // Send confirmation email
    if (booking) {
      const { data: student } = await admin
        .from('users')
        .select('name, email')
        .eq('id', booking.student_id)
        .single()

      if (student?.email) {
        try {
          await sendBookingConfirmationEmail({
            to: student.email,
            studentName: student.name || 'there',
            hostelName: (booking as any).hostels?.name ?? 'your hostel',
            roomLabel: (booking as any).rooms?.room_number ?? '',
            amountNaira: amountPaid,
            reference,
          })
        } catch (emailErr) {
          console.error('Confirmation email failed:', emailErr)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}