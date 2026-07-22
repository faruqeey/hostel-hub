import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const hostelId = params.id

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, student:users(id, name)')
    .eq('hostel_id', hostelId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  // Calculate average rating
  const total = reviews.reduce((sum, r) => sum + r.rating, 0)
  const average = reviews.length > 0 ? total / reviews.length : 0

  return NextResponse.json({
    data: reviews,
    average: Math.round(average * 10) / 10, // one decimal place
    count: reviews.length,
  })
}