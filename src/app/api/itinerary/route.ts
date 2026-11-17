import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/itinerary?trip_id=xxx → toàn bộ lịch trình (trời đẹp + trời mưa)
export async function GET(req: Request) {
  const trip_id = new URL(req.url).searchParams.get('trip_id')
  if (!trip_id) return NextResponse.json({ error: 'trip_id required' }, { status: 400 })

  const sb = createServerClient()
  const { data, error } = await sb
    .from('itinerary')
    .select('*')
    .eq('trip_id', trip_id)
    .order('plan')
    .order('day')
    .order('order_num')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
