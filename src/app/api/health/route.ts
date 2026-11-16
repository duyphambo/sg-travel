import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Trang tự kiểm tra cấu hình: /api/health
// Không bao giờ trả về khoá, chỉ cho biết loại khoá và kết quả truy vấn.
function describeKey(key: string | undefined): { kind: string; ok: boolean } {
  if (!key) return { kind: 'CHƯA ĐẶT', ok: false }
  if (key.startsWith('sb_secret_')) return { kind: 'secret key (đúng)', ok: true }
  if (key.startsWith('sb_publishable_')) return { kind: 'publishable key (SAI: cần service_role hoặc secret)', ok: false }
  const parts = key.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      if (payload.role === 'service_role') return { kind: 'service_role (đúng)', ok: true }
      if (payload.role === 'anon') return { kind: 'anon key (SAI: cần service_role)', ok: false }
      return { kind: `JWT role=${payload.role}`, ok: false }
    } catch {
      return { kind: 'không đọc được khoá', ok: false }
    }
  }
  return { kind: 'không nhận ra định dạng khoá', ok: false }
}

export async function GET() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const keyInfo = describeKey(key)

  const result: Record<string, unknown> = {
    supabase_url: url ? url.replace(/^https?:\/\//, '') : 'CHƯA ĐẶT',
    key: keyInfo.kind,
  }

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const trips = await sb.from('trips').select('id, slug, name')
    const costs = await sb.from('costs').select('id', { count: 'exact', head: true })
    result.trips = trips.error ? `LỖI: ${trips.error.message}` : trips.data
    result.so_khoan_chi = costs.error ? `LỖI: ${costs.error.message}` : costs.count
  }

  const tripsOk = Array.isArray(result.trips) && (result.trips as unknown[]).length > 0
  result.ket_luan = !url || !key
    ? 'Thiếu biến môi trường trên Vercel.'
    : !keyInfo.ok
      ? 'Sai khoá: dán khoá service_role hoặc sb_secret vào SUPABASE_SERVICE_ROLE_KEY rồi Redeploy.'
      : typeof result.trips === 'string'
        ? 'Kết nối được nhưng truy vấn lỗi: kiểm tra đã chạy setup_all.sql đúng project chưa.'
        : !tripsOk
          ? 'Kết nối đúng nhưng bảng trips trống: chạy lại setup_all.sql trong SQL Editor.'
          : 'Mọi thứ đều ổn.'

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
