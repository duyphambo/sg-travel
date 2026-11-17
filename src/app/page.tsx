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
    <div className="min-h-screen sm:py-8 sm:px-4 flex justify-center">
      {/* Khung ứng dụng giống màn hình thứ 3 "Let's Travel" trong ảnh */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[820px] sm:rounded-[38px] sm:shadow-2xl sm:border-[6px] sm:border-[#d8eff8] relative flex flex-col justify-between overflow-hidden">
        <div className="px-6 pt-7 pb-28">
          {/* Top Greeting + Avatar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-slate-400">Xin chào gia đình 👋</p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Let&apos;s Travel</h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#eef7fb] border-2 border-[#0077a8]/20 flex items-center justify-center text-xl shadow-sm">
              🧳
            </div>
          </div>

          {/* Search bar màu xanh nhạt #eef7fb */}
          <div className="flex items-center justify-between bg-[#eef7fb] rounded-2xl px-4 py-3 mb-5 text-[#0077a8]">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="text-xs font-medium text-[#5299b7]">Tìm chuyến đi của gia đình...</span>
            </div>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>

          {/* Category Pills giống Forest / Mountains / Beach / City */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
            <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#0077a8] text-white shrink-0 shadow-sm">
              Tất cả
            </span>
            <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#eef7fb] text-[#0077a8] shrink-0">
              Singapore
            </span>
            <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#eef7fb] text-[#0077a8] shrink-0">
              Gia đình
            </span>
            <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#eef7fb] text-[#0077a8] shrink-0">
              Sắp tới
            </span>
          </div>

          {/* Điểm đến nổi bật (3 thẻ dọc giống Popular Experiences) */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Điểm đến nổi bật</h2>
            <div className="grid grid-cols-3 gap-2.5">
              <div
                className="relative h-32 rounded-2xl overflow-hidden shadow-sm bg-cover bg-center flex flex-col justify-end p-2.5 text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(to top, rgba(0,30,50,0.75), rgba(0,0,0,0.05)), url("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400&q=80")',
                }}
              >
                <p className="text-[11px] font-bold leading-tight">Marina Bay</p>
                <p className="text-[9px] text-white/80">Singapore</p>
              </div>
              <div
                className="relative h-32 rounded-2xl overflow-hidden shadow-sm bg-cover bg-center flex flex-col justify-end p-2.5 text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(to top, rgba(0,30,50,0.75), rgba(0,0,0,0.05)), url("https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=400&q=80")',
                }}
              >
                <p className="text-[11px] font-bold leading-tight">Gardens Bay</p>
                <p className="text-[9px] text-white/80">Vé tham quan</p>
              </div>
              <div
                className="relative h-32 rounded-2xl overflow-hidden shadow-sm bg-cover bg-center flex flex-col justify-end p-2.5 text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(to top, rgba(0,30,50,0.75), rgba(0,0,0,0.05)), url("https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=400&q=80")',
                }}
              >
                <p className="text-[11px] font-bold leading-tight">Sentosa</p>
                <p className="text-[9px] text-white/80">Khám phá</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              <p className="font-bold mb-1">Không đọc được dữ liệu từ Supabase</p>
              <p className="break-words">{error}</p>
            </div>
          )}

          {!error && trips.length === 0 && (
            <div className="mb-4 rounded-2xl bg-[#eef7fb] p-4 text-xs text-[#0077a8]">
              <p className="font-bold mb-1">Chưa thấy chuyến đi nào</p>
              <p>
                Thường do dùng sai khoá (cần service_role / sb_secret) hoặc chưa chạy <code>setup_all.sql</code>. Mở{' '}
                <Link href="/api/health" className="underline font-semibold">
                  trang tự kiểm tra
                </Link>{' '}
                để xem nguyên nhân.
              </p>
            </div>
          )}

          {/* Danh sách chuyến đi giống phần "Featured" có ảnh nền + tên + sao */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3">Chuyến đi của bạn</h2>
            <div className="space-y-3.5">
              {trips.map(t => (
                <Link
                  key={t.id}
                  href={`/trips/${t.slug}`}
                  className="group block relative h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'linear-gradient(to top, rgba(0,25,45,0.82) 0%, rgba(0,25,45,0.2) 60%, rgba(0,0,0,0.05) 100%), url("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80")',
                  }}
                >
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-white group-hover:text-[#aee4ff] transition-colors">
                          {t.name}
                        </p>
                        <p className="text-xs text-white/80 mt-0.5">
                          {t.start_date} → {t.end_date} · {t.members} người
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-white shrink-0">
                        <span>{formatVnd(t.budget_vnd)}</span>
                        <span className="text-amber-400">★</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar màu xanh #0077a8 đặc trưng của ảnh mẫu */}
        <div className="sticky bottom-0 left-0 right-0 bg-[#0077a8] h-16 rounded-t-[24px] px-7 flex items-center justify-between text-white shadow-lg">
          <Link href="/" className="w-9 h-9 rounded-full bg-white text-[#0077a8] flex items-center justify-center shadow">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>
          <span className="text-white/80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>

          {/* Nút tròn + nổi ở giữa */}
          <div className="-mt-8 bg-white p-1.5 rounded-full shadow-lg border-4 border-[#eef7fb]">
            <div className="w-10 h-10 rounded-full bg-white text-[#0077a8] flex items-center justify-center font-bold text-xl">
              +
            </div>
          </div>

          <span className="text-white/80">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </span>
          <Link href="/api/health" title="Kiểm tra hệ thống" className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
