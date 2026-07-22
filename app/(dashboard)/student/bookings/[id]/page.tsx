import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingStatusChecker from './BookingStatusChecker'
import { ReviewSubmit } from './ReviewSubmit'

export default async function BookingConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { id } = await params
  const { payment } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, status, student_id, hostel_id, hostels(name), rooms(room_number, price)')
    .eq('id', id)
    .single()

  if (!booking) redirect('/student/bookings')

  const amount = (booking as any)?.rooms?.price ?? 0
  const hostelName = (booking as any)?.hostels?.name ?? 'Hostel'
  const roomNumber = (booking as any)?.rooms?.room_number ?? 'Room'

  // ✅ Check if payment was initiated (redirected from Paystack)
  const paymentInitiated = payment === 'processing' || payment === 'success'

  return (
    <div className="flex flex-col gap-6">
      <BookingStatusChecker
        bookingId={booking.id}
        initialStatus={booking.status}
        amount={amount}
        hostelName={hostelName}
        roomNumber={roomNumber}
        paymentInitiated={paymentInitiated}
      />
      <ReviewSubmit
        bookingId={booking.id}
        hostelId={booking.hostel_id}
        initialStatus={booking.status}
      />
    </div>
  )
}