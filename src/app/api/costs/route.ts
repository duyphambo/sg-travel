import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const CATS = ['Cố định', 'Vé tham quan', 'Ăn uống', 'Đi lại', 'Phát sinh']

// GET /api/costs?trip_id=xxx
export async function GET(req: Request) {
  const trip_id = new URL(req.url).searchParams.get('trip_id')
  if (!trip_id) return NextResponse.json({ error: 'trip_id required' }, { status: 400 })

  const sb = createServerClient()
  const { data, error } = await sb.from('costs').select('*').eq('trip_id', trip_id).order('order_num')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/costs — thêm khoản mới (id tự sinh: c56, c57…)
export async function POST(req: Request) {
  const b = await req.json()
  if (!b?.trip_id || !b?.label?.trim()) {
    return NextResponse.json({ error: 'Cần trip_id và tên khoản chi' }, { status: 400 })
  }
  const sb = createServerClient()
  const { data: existing } = await sb.from('costs').select('id').eq('trip_id', b.trip_id)
  const maxNum = Math.max(0, ...(existing ?? []).map(r => parseInt(String(r.id).replace(/\D/g, '') || '0')))
  const row = {
    id: 'c' + String(maxNum + 1).padStart(2, '0'),
    trip_id: String(b.trip_id),
    cat: CATS.includes(b.cat) ? b.cat : 'Phát sinh',
    label: String(b.label).trim().slice(0, 200),
    planned: Math.max(0, Math.round(Number(b.planned) || 0)),
    actual: 0,
    status: 'chua',
    note: '',
    order_num: 99,
  }
  const { data, error } = await sb.from('costs').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
