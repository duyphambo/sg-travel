import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// PATCH /api/itinerary/:id — chỉ cho đổi "đã đi" và số tiền SGD đã tiêu
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const itemId = Number(id)
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: 'id không hợp lệ' }, { status: 400 })

  const b = await req.json()
  const patch: Record<string, unknown> = {}
  if (typeof b.done === 'boolean') patch.done = b.done
  if (b.spent_sgd === null || b.spent_sgd === '') patch.spent_sgd = null
  else if (b.spent_sgd !== undefined) {
    const n = Number(b.spent_sgd)
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      return NextResponse.json({ error: 'Số tiền SGD không hợp lệ' }, { status: 400 })
    }
    patch.spent_sgd = Math.round(n * 100) / 100
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Không có gì để cập nhật' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb.from('itinerary').update(patch).eq('id', itemId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
