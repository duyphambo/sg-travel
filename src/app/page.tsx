import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import type { Trip } from '@/types'

export const dynamic = 'force-dynamic'

async function loadTrips(): Promise<{ trips: Trip[]; error: string | null }> {
  try {
    const sb = createServerClient()
    const { data, error } = await sb.from('trips').select('*').order('start_date')
    if (error) return { trips: [], error: error.message }
    return { trips: (data ?? []) as Trip[], error: null }
  } catch (e) {
    return { trips: [], error: e instanceof Error ? e.message : String(e) }
  }
}

export default async function Home() {
  const { trips, error } = await loadTrips()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">🧳 Chuyến đi</h1>
        <p className="text-sm text-gray-500 mb-6">Chọn chuyến đi để theo dõi chi phí</p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Không đọc được dữ liệu từ Supabase</p>
            <p className="break-words">{error}</p>
          </div>
        )}

        {!error && trips.length === 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Chưa thấy chuyến đi nào</p>
            <p>
              Thường do dùng sai khoá (cần service_role / sb_secret) hoặc chưa chạy <code>setup_all.sql</code>.
              Mở <Link href="/api/health" className="underline">trang tự kiểm tra</Link> để xem nguyên nhân.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {trips.map(t => (
            <Link key={t.id} href={`/trips/${t.slug}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.start_date} → {t.end_date} · {t.members} người</p>
                </div>
                <span aria-hidden className="text-gray-400">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
