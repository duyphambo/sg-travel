'use client'
import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { computeSummary, CAT_ORDER, formatVnd } from '@/lib/utils'
import SummaryCards from '@/components/SummaryCards'
import CostTable from '@/components/CostTable'
import type { Trip, Cost } from '@/types'

type Filter = 'all' | 'chua' | 'dat' | 'tra'
const FILTER_LABEL: Record<Filter, string> = { all: 'Tất cả', chua: 'Chưa chi', dat: 'Đã đặt', tra: 'Đã trả' }

const SG_SPOTS = [
  {
    name: 'Marina Bay',
    sub: 'Biểu tượng SG',
    img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Gardens Bay',
    sub: 'Siêu cây & Vòm hoa',
    img: 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Đảo Sentosa',
    sub: 'Universal Studios',
    img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=500&q=80',
  },
]

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newCat, setNewCat] = useState('Phát sinh')
  const [newPlanned, setNewPlanned] = useState('')

  useEffect(() => {
    fetch(`/api/trips?slug=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setTrip)
      .catch(() => setError('Không tải được chuyến đi. Kiểm tra lại đường dẫn hoặc cấu hình Supabase.'))
  }, [slug])

  const loadCosts = useCallback(async () => {
    if (!trip) return
    const r = await fetch(`/api/costs?trip_id=${trip.id}`, { cache: 'no-store' })
    if (r.ok) setCosts(await r.json())
  }, [trip])

  // Tải lần đầu + tự làm mới mỗi 15 giây và khi quay lại tab, để cả nhà thấy cập nhật của nhau
  useEffect(() => {
    if (!trip) return
    loadCosts()
    const t = setInterval(loadCosts, 15000)
    const onFocus = () => loadCosts()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus) }
  }, [trip, loadCosts])

  const handleUpdate = useCallback(async (id: string, patch: Partial<Cost>) => {
    if (!trip) return
    setCosts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
    const r = await fetch(`/api/costs/${id}?trip_id=${trip.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!r.ok) alertError('Lưu không thành công, đã tải lại dữ liệu.')
    loadCosts()
  }, [trip, loadCosts])

  function alertError(msg: string) {
    setError(msg)
    setTimeout(() => setError(''), 4000)
  }

  async function addCost() {
    if (!trip || !newLabel.trim()) return
    const r = await fetch('/api/costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_id: trip.id,
        cat: newCat,
        label: newLabel,
        planned: Number(newPlanned.replace(/[^0-9]/g, '')) || 0,
      }),
    })
    if (!r.ok) return alertError('Thêm khoản chi không thành công.')
    setNewLabel(''); setNewPlanned(''); setAddOpen(false)
    loadCosts()
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-xl text-center">
          <p className="text-[#0077a8] font-semibold">{error || 'Đang tải chuyến đi...'}</p>
        </div>
      </div>
    )
  }

  const summary = computeSummary(trip, costs)
  const filtered = costs.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return c.label.toLowerCase().includes(q) || (c.note ?? '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="min-h-screen sm:py-8 sm:px-4 flex justify-center">
      {/* Khung ứng dụng giống màn hình thứ 4 "Mount Everest" trong ảnh mẫu */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[840px] sm:rounded-[38px] sm:shadow-2xl sm:border-[6px] sm:border-[#d8eff8] relative flex flex-col justify-between overflow-hidden">
        <div>
          {/* Ảnh bìa trên cùng + nút Back vuông màu xanh #0077a8 + tên chuyến đi + ngôi sao vàng */}
          <div
            className="relative h-60 bg-cover bg-center flex flex-col justify-between p-5 text-white"
            style={{
              backgroundImage:
                'linear-gradient(to top, rgba(0,22,40,0.85) 0%, rgba(0,22,40,0.2) 55%, rgba(0,0,0,0.15) 100%), url("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1000&q=80")',
            }}
          >
            <div className="flex items-center justify-between pt-1">
              <Link
                href="/"
                aria-label="Quay lại"
                className="w-9 h-9 rounded-xl bg-[#0077a8] hover:bg-[#00628a] text-white flex items-center justify-center shadow-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <span className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-semibold">
                1 SGD = {formatVnd(trip.rate)}
              </span>
            </div>

            <div className="pb-3 flex items-end justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{trip.name}</h1>
                <p className="text-xs text-white/80 mt-0.5">
                  {trip.start_date} → {trip.end_date}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-white shrink-0">
                <span>{trip.members} người</span>
                <span className="text-amber-400">★</span>
              </div>
            </div>
          </div>

          {/* Phần thân màu trắng bo góc tròn đè lên ảnh bìa */}
          <div className="relative z-10 -mt-4 bg-white rounded-t-[28px] px-5 pt-6 pb-24">
            {error && (
              <p className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            {/* 3 trụ icon xanh #0077a8 + thông số tổng quan */}
            <SummaryCards s={summary} />

            {/* 3 Thẻ ảnh địa điểm nổi bật giống Popular Experiences ở màn hình 3 */}
            <div className="mb-5">
              <h2 className="text-xs font-bold text-slate-800 mb-2.5">Điểm đến nổi bật</h2>
              <div className="grid grid-cols-3 gap-2.5">
                {SG_SPOTS.map(spot => (
                  <div
                    key={spot.name}
                    className="relative h-28 rounded-2xl overflow-hidden shadow-sm bg-cover bg-center flex flex-col justify-end p-2.5 text-white"
                    style={{
                      backgroundImage: `linear-gradient(to top, rgba(0,25,45,0.8), rgba(0,0,0,0.05)), url("${spot.img}")`,
                    }}
                  >
                    <p className="text-[11px] font-bold leading-tight">{spot.name}</p>
                    <p className="text-[9px] text-white/80">{spot.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ô tìm kiếm khoản chi màu xanh băng #eef7fb */}
            <div className="flex items-center bg-[#eef7fb] rounded-2xl px-4 py-2.5 mb-3.5 text-[#0077a8]">
              <svg className="w-4 h-4 shrink-0 mr-2.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm khoản chi hoặc ghi chú..."
                className="w-full bg-transparent text-xs font-medium text-slate-700 placeholder-[#5299b7] outline-none"
              />
            </div>

            {/* Thanh lọc trạng thái giống Forest / Mountains / Beach / City */}
            <div className="flex gap-2 mb-5 flex-wrap items-center">
              {(Object.keys(FILTER_LABEL) as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filter === f
                      ? 'bg-[#0077a8] text-white shadow-sm'
                      : 'bg-[#eef7fb] text-[#0077a8] hover:bg-[#dceef7]'
                  }`}
                >
                  {FILTER_LABEL[f]}
                </button>
              ))}
              <button
                onClick={() => setAddOpen(v => !v)}
                className="ml-auto px-3.5 py-1.5 bg-[#0077a8] hover:bg-[#00628a] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                + Thêm
              </button>
            </div>

            {/* Form thêm khoản chi theo phong cách "Create your Account" trong ảnh mẫu */}
            {addOpen && (
              <div className="bg-white border-2 border-[#eef7fb] rounded-3xl p-4 mb-5 shadow-md">
                <p className="text-sm font-bold text-slate-800 mb-3">Thêm khoản chi mới</p>
                <div className="space-y-2.5 mb-3.5">
                  <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                    <span className="text-[#0077a8] mr-2.5 text-sm">📂</span>
                    <select
                      id="new-cat"
                      className="w-full bg-transparent text-sm font-semibold text-[#0077a8] outline-none"
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                    >
                      {CAT_ORDER.map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                    <span className="text-[#0077a8] mr-2.5 text-sm">✏️</span>
                    <input
                      id="new-label"
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-[#6caac4] outline-none"
                      placeholder="Tên khoản chi..."
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                    <span className="text-[#0077a8] mr-2.5 text-sm">💰</span>
                    <input
                      id="new-planned"
                      inputMode="numeric"
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-[#6caac4] outline-none"
                      placeholder="Dự toán (đ)..."
                      value={newPlanned}
                      onChange={e => setNewPlanned(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCost}
                    className="flex-1 bg-[#0077a8] hover:bg-[#00628a] text-white py-2.5 rounded-full text-xs font-semibold shadow-sm transition-colors"
                  >
                    Thêm khoản chi
                  </button>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="px-5 bg-[#eef7fb] hover:bg-[#dceef7] text-[#0077a8] py-2.5 rounded-full text-xs font-semibold transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}

            {/* Bảng chi phí */}
            <CostTable costs={filtered} rate={trip.rate} onUpdate={handleUpdate} />

            {/* 2 nút hành động giống hệt "Site Map" & "Start" ở màn hình 4 */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => loadCosts()}
                className="flex items-center justify-center gap-1.5 border border-[#0077a8] text-[#0077a8] hover:bg-[#eef7fb] rounded-xl py-2.5 text-xs font-semibold transition-colors"
              >
                <span>🔄</span>
                <span>Làm mới</span>
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="bg-[#0077a8] hover:bg-[#00628a] text-white rounded-xl py-2.5 text-xs font-semibold shadow-sm transition-colors"
              >
                + Khoản chi mới
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Bấm vào dòng để sửa · Nhập <code className="text-[#0077a8] font-semibold">42s</code> = 42 SGD tự quy đổi
            </p>
          </div>
        </div>

        {/* Thanh điều hướng dưới cùng màu xanh #0077a8 với nút + nổi chính giữa */}
        <div className="sticky bottom-0 left-0 right-0 z-20 bg-[#0077a8] h-16 rounded-t-[24px] px-7 flex items-center justify-between text-white shadow-lg">
          <Link href="/" className="w-9 h-9 rounded-full bg-white text-[#0077a8] flex items-center justify-center shadow">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </Link>
          <button onClick={() => setFilter('all')} className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {/* Nút tròn + nổi ở giữa */}
          <button
            onClick={() => setAddOpen(v => !v)}
            aria-label="Thêm khoản chi"
            className="-mt-8 bg-white p-1.5 rounded-full shadow-lg border-4 border-[#eef7fb] hover:scale-105 transition-transform"
          >
            <span className="w-10 h-10 rounded-full bg-white text-[#0077a8] flex items-center justify-center font-bold text-xl">
              +
            </span>
          </button>

          <button onClick={() => setFilter('dat')} className="text-white/80 hover:text-white" title="Đã đặt">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
          <button onClick={() => setFilter('tra')} className="text-white/80 hover:text-white" title="Đã trả">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
