'use client'
import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { computeSummary, CAT_ORDER, formatVnd } from '@/lib/utils'
import SummaryCards from '@/components/SummaryCards'
import CostTable from '@/components/CostTable'
import ItineraryView from '@/components/ItineraryView'
import type { Trip, Cost } from '@/types'

type View = 'lich' | 'chiphi'
type Filter = 'all' | 'chua' | 'dat' | 'tra'
const FILTER_LABEL: Record<Filter, string> = { all: 'Tất cả', chua: 'Chưa chi', dat: 'Đã đặt', tra: 'Đã trả' }

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('lich')
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

  useEffect(() => {
    if (!trip) return
    loadCosts()
    const t = setInterval(loadCosts, 15000)
    const onFocus = () => loadCosts()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
    }
  }, [trip, loadCosts])

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<Cost>) => {
      if (!trip) return
      setCosts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
      const r = await fetch(`/api/costs/${id}?trip_id=${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!r.ok) alertError('Lưu không thành công, đã tải lại dữ liệu.')
      loadCosts()
    },
    [trip, loadCosts]
  )

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
    setNewLabel('')
    setNewPlanned('')
    setAddOpen(false)
    loadCosts()
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
        <div className="rounded-2xl border border-[#c5a059] bg-[#fffdf9] px-8 py-6 shadow-md text-center">
          <p className="text-[#3a2618] font-bold">{error || 'Đang tải hành trình...'}</p>
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
    <div className="min-h-screen bg-[#faf7f2]">
      {/* HEADER FULL VIỀN TRÊN CÙNG (Full-bleed top banner, không bị hở viền) */}
      <header
        className="w-full bg-cover bg-center border-b-2 border-[#c5a059] text-white shadow-md"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(35,23,15,0.94) 0%, rgba(58,38,24,0.88) 55%, rgba(107,74,43,0.82) 100%), url("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80")',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#c5a059]/20 hover:bg-[#c5a059]/35 border border-[#c5a059]/60 px-3 py-1 text-xs font-bold text-[#f3dfb6] transition-colors"
            >
              ← Danh sách chuyến đi
            </Link>
            <span className="rounded-lg bg-black/40 border border-[#c5a059]/50 px-2.5 py-1 text-xs font-bold text-[#f3dfb6]">
              💱 1 SGD = {formatVnd(trip.rate)}
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#fdf8f0]">{trip.name}</h1>
              <p className="text-xs sm:text-sm text-[#e8d5b5] mt-0.5">
                📅 {trip.start_date} → {trip.end_date} · 👨‍👩‍👧‍👦 {trip.members} thành viên
              </p>
            </div>
            <div className="rounded-xl bg-black/35 border border-[#c5a059]/60 px-3 py-1.5 text-right">
              <p className="text-[10px] uppercase font-bold text-[#d9b87c]">Ngân sách</p>
              <p className="text-sm font-extrabold text-[#f3dfb6]">{formatVnd(trip.budget_vnd)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* THANH CHUYỂN TAB DÍNH SÁT ĐỈNH TRANG (Lịch trình Ngày 1-4 / Chi phí) */}
      <div className="sticky top-0 z-20 w-full bg-[#f4ecdd]/95 backdrop-blur border-b border-[#decba8] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#e6d8c0] p-1" role="tablist">
            {(
              [
                ['lich', '🗓️ Lịch trình (Ngày 1, 2, 3, 4)'],
                ['chiphi', '💰 Chi phí & Ngân sách'],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-lg py-2 px-3 text-xs sm:text-sm font-extrabold transition-all ${
                  view === v
                    ? 'bg-gradient-to-r from-[#2b1c12] via-[#3a2618] to-[#5c3d24] text-[#f3dfb6] border border-[#c5a059] shadow'
                    : 'text-[#5c3d24] hover:text-[#2b1c12]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <main className="max-w-3xl mx-auto px-4 py-5 pb-14">
        {error && (
          <p className="mb-4 rounded-xl bg-rose-50 border border-rose-300 px-3.5 py-2.5 text-xs font-bold text-rose-800">
            ⚠️ {error}
          </p>
        )}

        {view === 'lich' && <ItineraryView trip={trip} />}

        {view === 'chiphi' && (
          <div>
            <SummaryCards s={summary} />

            {/* Ô tìm kiếm khoản chi */}
            <div className="flex items-center bg-[#fffdf9] border border-[#decba8] rounded-xl px-3.5 py-2.5 mb-3 text-[#5c3d24] shadow-sm">
              <span className="mr-2 text-sm">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm khoản chi hoặc ghi chú..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#2b1c12] placeholder-[#9c8974] outline-none"
              />
            </div>

            {/* Lọc trạng thái + Thêm khoản chi */}
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              {(Object.keys(FILTER_LABEL) as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    filter === f
                      ? 'bg-[#3a2618] text-[#f3dfb6] border-[#c5a059] shadow-sm'
                      : 'bg-[#fffdf9] text-[#6e5a44] border-[#decba8] hover:border-[#8c6239]'
                  }`}
                >
                  {FILTER_LABEL[f]}
                </button>
              ))}
              <button
                onClick={() => setAddOpen(v => !v)}
                className="ml-auto px-4 py-1.5 bg-gradient-to-r from-[#8c6239] to-[#b88b4a] hover:from-[#734f2c] hover:to-[#9a6f38] text-white rounded-xl text-xs font-extrabold shadow-sm"
              >
                + Thêm khoản chi
              </button>
            </div>

            {addOpen && (
              <div className="bg-[#fffdf9] border-2 border-[#c5a059] rounded-2xl p-4 mb-4 shadow-md">
                <p className="text-sm font-extrabold text-[#2b1c12] mb-3">✨ Thêm khoản chi mới</p>
                <div className="space-y-2.5 mb-3">
                  <select
                    id="new-cat"
                    className="w-full bg-[#faf6ee] border border-[#decba8] rounded-xl px-3 py-2 text-sm font-bold text-[#3a2618] outline-none"
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                  >
                    {CAT_ORDER.map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    id="new-label"
                    className="w-full bg-[#faf6ee] border border-[#decba8] rounded-xl px-3 py-2 text-sm text-[#2b1c12] placeholder-[#8c7a66] outline-none"
                    placeholder="Tên khoản chi..."
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                  />
                  <input
                    id="new-planned"
                    inputMode="numeric"
                    className="w-full bg-[#faf6ee] border border-[#decba8] rounded-xl px-3 py-2 text-sm text-[#2b1c12] placeholder-[#8c7a66] outline-none"
                    placeholder="Dự toán (đ)..."
                    value={newPlanned}
                    onChange={e => setNewPlanned(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCost}
                    className="bg-[#3a2618] hover:bg-[#2b1c12] text-[#f3dfb6] border border-[#c5a059] px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    Thêm vào bảng
                  </button>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="bg-[#e8dcc8] hover:bg-[#decba8] text-[#3a2618] px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}

            <CostTable costs={filtered} rate={trip.rate} onUpdate={handleUpdate} />

            <p className="text-xs text-[#8c7a66] text-center mt-6">
              Bấm vào dòng để sửa · Nhập <code className="text-[#8c6239] font-bold">42s</code> = 42 SGD tự quy đổi · Tự làm mới mỗi 15 giây
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
