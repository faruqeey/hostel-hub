import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ReviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(500),
})

export async function GET() {
  return NextResponse.json({ message: 'Reviews API is working' })
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 POST /api/reviews received")

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log("🔍 Request body:", body)

    const parsed = ReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    const { booking_id, rating, comment } = parsed.data

    // Verify booking belongs to student and is CONFIRMED
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, student_id, hostel_id, status')
      .eq('id', booking_id)
      .eq('student_id', user.id)
      .single()

    if (bookingError || !booking) {
      console.error("Booking error:", bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only confirmed bookings can be reviewed' }, { status: 403 })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json({ error: 'You already reviewed this booking' }, { status: 409 })
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        student_id: user.id,
        hostel_id: booking.hostel_id,
        rating,
        comment,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    console.log("✅ Review submitted:", review)
    return NextResponse.json({ data: review }, { status: 201 })

  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}