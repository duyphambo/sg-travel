import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const STATUSES = ['chua', 'dat', 'tra']

// PATCH /api/costs/:id?trip_id=xxx — chỉ cho sửa thực chi, trạng thái, ghi chú
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip_id = new URL(req.url).searchParams.get('trip_id')
  if (!trip_id) return NextResponse.json({ error: 'trip_id required' }, { status: 400 })

  const b = await req.json()
  const patch: Record<string, unknown> = {}
  if (b.actual !== undefined) patch.actual = Math.max(0, Math.round(Number(b.actual) || 0))
  if (b.status !== undefined && STATUSES.includes(b.status)) patch.status = b.status
  if (b.note !== undefined) patch.note = String(b.note).slice(0, 500)
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Không có gì để cập nhật' }, { status: 400 })
  }

  const sb = createServerClient()
  const { data, error } = await sb.from('costs').update(patch).eq('id', id).eq('trip_id', trip_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/costs/:id?trip_id=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip_id = new URL(req.url).searchParams.get('trip_id')
  if (!trip_id) return NextResponse.json({ error: 'trip_id required' }, { status: 400 })

  const sb = createServerClient()
  const { error } = await sb.from('costs').delete().eq('id', id).eq('trip_id', trip_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
