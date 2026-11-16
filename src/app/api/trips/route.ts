import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/trips            → danh sách chuyến đi
// GET /api/trips?slug=xxx   → 1 chuyến đi theo slug
export async function GET(req: Request) {
  const sb = createServerClient()
  const slug = new URL(req.url).searchParams.get('slug')
  if (slug) {
    const { data, error } = await sb.from('trips').select('*').eq('slug', slug).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Không tìm thấy chuyến đi' }, { status: 404 })
    return NextResponse.json(data)
  }
  const { data, error } = await sb.from('trips').select('*').order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/trips — tạo chuyến đi mới
export async function POST(req: Request) {
  const b = await req.json()
  if (!b?.slug || !b?.name) return NextResponse.json({ error: 'Cần slug và name' }, { status: 400 })
  const row = {
    slug: String(b.slug),
    name: String(b.name),
    start_date: b.start_date ?? null,
    end_date: b.end_date ?? null,
    members: Number(b.members ?? 1),
    budget_vnd: Number(b.budget_vnd ?? 0),
    rate: Number(b.rate ?? 21000),
    cash_sgd: Number(b.cash_sgd ?? 0),
  }
  const sb = createServerClient()
  const { data, error } = await sb.from('trips').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
