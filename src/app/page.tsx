import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { formatVnd } from '@/lib/utils'
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
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Header Full-Bleed sát mép trên cùng theo bộ màu Techcombank Priority (Nâu Vàng) */}
      <header className="w-full bg-gradient-to-r from-[#23170f] via-[#3a2618] to-[#5c3d24] border-b-2 border-[#c5a059] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-[#c5a059]/20 border border-[#c5a059]/60 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#f3dfb6] mb-1.5">
                ✦ Family Priority Travel
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdf8f0]">
                🧳 Hành trình Du lịch Gia đình
              </h1>
              <p className="text-xs sm:text-sm text-[#e8d5b5] mt-1">
                Lịch trình chi tiết Ngày 1, 2, 3, 4 & Quản lý ngân sách chuyến đi
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-bold mb-1">Không đọc được dữ liệu từ Supabase</p>
            <p className="break-words">{error}</p>
          </div>
        )}

        {!error && trips.length === 0 && (
          <div className="mb-4 rounded-2xl border border-[#c5a059] bg-[#f6efe2] p-4 text-sm text-[#3a2618]">
            <p className="font-bold mb-1">Chưa thấy chuyến đi nào</p>
            <p>
              Thường do dùng sai khoá (cần service_role / sb_secret) hoặc chưa chạy <code>setup_all.sql</code>. Mở{' '}
              <Link href="/api/health" className="underline font-bold text-[#8c6239]">
                trang tự kiểm tra
              </Link>{' '}
              để xem nguyên nhân.
            </p>
          </div>
        )}

        {/* Danh sách chuyến đi */}
        <div className="space-y-4">
          {trips.map(t => (
            <Link
              key={t.id}
              href={`/trips/${t.slug}`}
              className="group block rounded-2xl overflow-hidden border-2 border-[#decba8] hover:border-[#c5a059] bg-[#fffdf9] shadow-md hover:shadow-lg transition-all"
            >
              <div
                className="relative h-44 bg-cover bg-center flex flex-col justify-end p-5 text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(to top, rgba(35,23,15,0.92) 0%, rgba(45,30,18,0.4) 60%, rgba(0,0,0,0.15) 100%), url("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1000&q=80")',
                }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-[#c5a059] px-2.5 py-0.5 text-[11px] font-extrabold text-[#23170f] mb-1">
                      LỊCH TRÌNH 4 NGÀY · NGÀY 1 → NGÀY 4
                    </span>
                    <p className="text-xl font-extrabold text-[#fdf8f0] group-hover:text-[#f3dfb6] transition-colors">
                      {t.name}
                    </p>
                    <p className="text-xs text-[#e8d5b5] mt-0.5">
                      📅 {t.start_date} → {t.end_date} · 👨‍👩‍👧‍👦 {t.members} người
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#23170f]/80 border border-[#c5a059] px-3 py-1.5 text-right shrink-0">
                    <p className="text-[10px] text-[#d9b87c] uppercase font-bold">Ngân sách</p>
                    <p className="text-sm font-extrabold text-[#f3dfb6]">{formatVnd(t.budget_vnd)}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-[#f6efe2] flex items-center justify-between text-xs font-bold text-[#5c3d24]">
                <span>🗓️ Xem chi tiết Ngày 1, Ngày 2, Ngày 3, Ngày 4 & Bảng chi phí</span>
                <span className="text-[#8c6239] group-hover:translate-x-1 transition-transform">Mở ngay →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
