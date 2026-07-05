import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/supabase/paystack'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { booking_id } = await req.json()

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
  }

  // Get booking with room price
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, student_id, hostel_id, hostels(name), rooms(room_number, price)')
    .eq('id', booking_id)
    .eq('student_id', user.id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'PENDING') {
    return NextResponse.json({ error: 'Booking is already confirmed or cancelled' }, { status: 400 })
  }

  const amount = (booking as any)?.rooms?.price ?? 0

  if (amount <= 0) {
    return NextResponse.json({ error: 'Invalid room price' }, { status: 400 })
  }

  // Get student profile
  const { data: profile } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', user.id)
    .single()

  // Generate unique reference
  const reference = `HOSTEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  const admin = createAdminClient()

  try {
    const result = await initializeTransaction({
      email: profile?.email || user.email || 'student@example.com',
      amountKobo: Math.round(amount * 100),
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/student/bookings?payment=processing`,
      metadata: {
        booking_id: booking.id,
        student_id: user.id,
        hostel_id: booking.hostel_id,
      },
    })

    // Record transaction
    const { error: txError } = await admin
      .from('paystack_transactions')
      .insert({
        booking_id: booking.id,
        reference,
        amount: amount,
        status: 'pending',
        email: profile?.email || user.email,
      })

    if (txError) throw txError

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference,
    })
  } catch (error: any) {
    console.error('Paystack initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}