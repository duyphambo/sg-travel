'use client'
import { use, useCallback, useEffect, useState } from 'react'
import { computeSummary, CAT_ORDER } from '@/lib/utils'
import SummaryCards from '@/components/SummaryCards'
import CostTable from '@/components/CostTable'
import type { Trip, Cost } from '@/types'

type Filter = 'all' | 'chua' | 'dat' | 'tra'
const FILTER_LABEL: Record<Filter, string> = { all: 'Tất cả', chua: 'Chưa chi', dat: 'Đã đặt', tra: 'Đã trả' }

export default function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [costs, setCosts] = useState<Cost[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
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
        <p className="text-gray-500 text-center">{error || 'Đang tải...'}</p>
      </div>
    )
  }

  const summary = computeSummary(trip, costs)
  const filtered = filter === 'all' ? costs : costs.filter(c => c.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
          <p className="text-sm text-gray-500">{trip.start_date} → {trip.end_date} · {trip.members} người</p>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}

        <SummaryCards s={summary} />

        <div className="flex gap-2 mb-3 flex-wrap">
          {(Object.keys(FILTER_LABEL) as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {FILTER_LABEL[f]}
            </button>
          ))}
          <button onClick={() => setAddOpen(true)} className="ml-auto px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
            + Thêm
          </button>
        </div>

        {addOpen && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
            <p className="text-sm font-medium mb-2">Thêm khoản chi</p>
            <select id="new-cat" className="w-full border rounded-lg px-2 py-1 text-sm mb-2" value={newCat} onChange={e => setNewCat(e.target.value)}>
              {CAT_ORDER.map(c => <option key={c}>{c}</option>)}
            </select>
            <input id="new-label" className="w-full border rounded-lg px-2 py-1 text-sm mb-2" placeholder="Tên khoản chi..." value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            <input id="new-planned" inputMode="numeric" className="w-full border rounded-lg px-2 py-1 text-sm mb-2" placeholder="Dự toán (đ)..." value={newPlanned} onChange={e => setNewPlanned(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={addCost} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">Thêm</button>
              <button onClick={() => setAddOpen(false)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm">Huỷ</button>
            </div>
          </div>
        )}

        <CostTable costs={filtered} rate={trip.rate} onUpdate={handleUpdate} />

        <p className="text-xs text-gray-400 text-center mt-6">Bấm vào dòng để sửa · Nhập 42s = 42 SGD tự quy đổi · Tự làm mới mỗi 15 giây</p>
      </div>
    </div>
  )
}
