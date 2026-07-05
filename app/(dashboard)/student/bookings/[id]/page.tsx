import { createClient } from '@/lib/supabase/server'   // ✅ fixed typo
import { redirect } from 'next/navigation'
import BookingConfirmClient from './BookingConfirmClient'

export default async function BookingConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')  // ✅ fixed (was missing !)

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, student_id, hostel_id, hostels(name), rooms(room_number, price)')
    .eq('id', id)
    .single()

  if (!booking) redirect('/student/bookings')

  return <BookingConfirmClient booking={booking} />
}