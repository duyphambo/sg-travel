'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ItineraryItem, ItineraryPlan, Trip } from '@/types'

const KIND_STYLE: Record<string, string> = {
  'Trong nhà': 'bg-green-100 text-green-700',
  'Có mái che': 'bg-teal-100 text-teal-700',
  'Ngoài trời': 'bg-orange-100 text-orange-700',
}

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const mapsDir = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=transit`
const fmtSgd = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

// Ngày hiện tại theo giờ Singapore (UTC+8), dạng YYYY-MM-DD
function todayInSingapore(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export default function ItineraryView({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<ItineraryItem[] | null>(null)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [plan, setPlan] = useState<ItineraryPlan>('nang')
  const [day, setDay] = useState(1)
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const load = useCallback(() => {
    fetch(`/api/itinerary?trip_id=${trip.id}`, { cache: 'no-store' })
      .then(async r => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then((data: ItineraryItem[]) => setItems(data))
      .catch(e => setError(String(e || 'Không tải được lịch trình')))
  }, [trip.id])

  // Tải lần đầu và mỗi khi quay lại tab, để thấy cả nhà đã tích/nhập gì
  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    return () => window.removeEventListener('focus', load)
  }, [load])

  // Trong chuyến đi thì tự mở đúng ngày hôm nay
  useEffect(() => {
    const today = todayInSingapore()
    if (trip.start_date && today >= trip.start_date && (!trip.end_date || today <= trip.end_date)) {
      const diff = Math.round((Date.parse(today) - Date.parse(trip.start_date)) / 86400000)
      setDay(diff + 1)
    }
  }, [trip.start_date, trip.end_date])

  const save = useCallback(async (id: number, patch: Partial<ItineraryItem>) => {
    setItems(prev => prev?.map(it => (it.id === id ? { ...it, ...patch } : it)) ?? prev)
    const r = await fetch(`/api/itinerary/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!r.ok) {
      setSaveError('Lưu không thành công, đã tải lại. Nếu lỗi lặp lại: chạy 004_itinerary_extras.sql trong Supabase.')
      setTimeout(() => setSaveError(''), 5000)
      load()
    }
  }, [load])

  function commitSpent(it: ItineraryItem) {
    const raw = drafts[it.id]
    if (raw === undefined) return
    const cleaned = raw.replace(',', '.').trim()
    const value = cleaned === '' ? null : Number(cleaned)
    setDrafts(d => { const n = { ...d }; delete n[it.id]; return n })
    if (value !== null && (!Number.isFinite(value) || value < 0)) return
    if (value === (it.spent_sgd ?? null)) return
    save(it.id, { spent_sgd: value })
  }

  const days = useMemo(() => {
    const map = new Map<number, string>()
    for (const it of items ?? []) if (!map.has(it.day)) map.set(it.day, it.day_label)
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [items])

  // Danh sách địa điểm (không trùng), theo ngày
  const places = useMemo(() => {
    const seen = new Set<string>()
    const out: { q: string; day: number; title: string }[] = []
    for (const it of [...(items ?? [])].sort((a, b) => a.day - b.day || (a.plan === b.plan ? a.order_num - b.order_num : a.plan === 'nang' ? -1 : 1))) {
      if (!it.map_query || seen.has(it.map_query)) continue
      seen.add(it.map_query)
      out.push({ q: it.map_query, day: it.day, title: it.title })
    }
    return out
  }, [items])

  const list = (items ?? []).filter(it => it.plan === plan && it.day === day)
  const outdoorCount = (items ?? []).filter(it => it.plan === 'nang' && it.day === day && it.kind === 'Ngoài trời').length
  const doneCount = list.filter(it => it.done).length
  const daySpent = (items ?? []).filter(it => it.day === day).reduce((s, it) => s + (Number(it.spent_sgd) || 0), 0)
  const tripSpent = (items ?? []).reduce((s, it) => s + (Number(it.spent_sgd) || 0), 0)

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Chưa có dữ liệu lịch trình</p>
        <p>Vào Supabase → SQL Editor, chạy file <code>supabase/migrations/003_itinerary.sql</code> rồi tải lại trang.</p>
        <p className="mt-1 text-xs opacity-70 break-words">{error}</p>
      </div>
    )
  }
  if (!items) return <p className="text-sm text-gray-400 py-6 text-center">Đang tải lịch trình…</p>

  const hasExtras = items.some(it => it.map_query)

  return (
    <div>
      {/* Trời đẹp / Trời mưa */}
      <div className="grid grid-cols-2 gap-2 mb-3" role="tablist" aria-label="Chọn lịch theo thời tiết">
        <button role="tab" aria-selected={plan === 'nang'} onClick={() => setPlan('nang')}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold border ${plan === 'nang' ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-gray-200 text-gray-500'}`}>
          ☀️ Trời đẹp
        </button>
        <button role="tab" aria-selected={plan === 'mua'} onClick={() => setPlan('mua')}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold border ${plan === 'mua' ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-white border-gray-200 text-gray-500'}`}>
          🌧️ Khi trời mưa
        </button>
      </div>

      {/* Chọn ngày */}
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {days.map(([d, label]) => (
          <button key={d} onClick={() => setDay(d)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border ${day === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            N{d} · {label}
          </button>
        ))}
      </div>

      {/* Tóm tắt nhỏ của ngày + danh sách địa điểm */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>✓ Đã đi {doneCount}/{list.length}</span>
        <span>💵 Hôm nay {fmtSgd(daySpent)} SGD ≈ {Math.round(daySpent * trip.rate).toLocaleString('vi-VN')}đ</span>
        <span className="text-gray-400">Cả chuyến {fmtSgd(tripSpent)} SGD</span>
      </div>

      {hasExtras && (
        <details className="mb-3 rounded-xl border border-gray-200 bg-white text-xs">
          <summary className="cursor-pointer select-none px-3 py-2 font-medium text-gray-700">📍 Địa điểm & chỉ đường ({places.length})</summary>
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {places.map(p => (
              <li key={p.q} className="flex items-center gap-2 px-3 py-1.5">
                <span className="shrink-0 rounded bg-gray-100 px-1.5 text-[10px] text-gray-500">N{p.day}</span>
                <span className="min-w-0 flex-1 truncate text-gray-700" title={p.q}>{p.q}</span>
                <a href={mapsSearch(p.q)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-600 hover:underline">Địa chỉ</a>
                <a href={mapsDir(p.q)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-600 hover:underline">Chỉ đường</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {plan === 'nang' && outdoorCount > 0 && (
        <p className="mb-3 text-xs text-gray-500">
          Ngày này có {outdoorCount} hoạt động ngoài trời. Trời mưa thì bấm “Khi trời mưa” để xem lịch thay thế.
        </p>
      )}

      {saveError && <p className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{saveError}</p>}

      {/* Danh sách hoạt động */}
      <ol className="relative border-l-2 border-gray-200 ml-2 space-y-3">
        {list.map(it => (
          <li key={it.id} className="ml-4">
            <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 ${it.done ? 'bg-green-500 border-green-500' : 'bg-white border-blue-500'}`} aria-hidden />
            <div className={`border rounded-xl p-3 ${it.done ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-blue-700 tabular-nums">{it.time_label}</p>
                <div className="flex items-center gap-1.5">
                  {it.kind && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE[it.kind] ?? 'bg-gray-100 text-gray-600'}`}>
                      {it.kind}
                    </span>
                  )}
                  {hasExtras && (
                    <label className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${it.done ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                      <input id={`done-${it.id}`} type="checkbox" className="h-3 w-3 accent-green-600" checked={!!it.done}
                        onChange={e => save(it.id, { done: e.target.checked })} />
                      Đã đi
                    </label>
                  )}
                </div>
              </div>
              <p className={`mt-0.5 text-sm font-semibold ${it.done ? 'text-gray-500' : 'text-gray-900'}`}>{it.title}</p>
              {it.detail && <p className="mt-0.5 text-sm text-gray-600">{it.detail}</p>}
              {it.transport && it.transport !== '—' && <p className="mt-1 text-xs text-gray-500">🚕 {it.transport}</p>}
              {it.directions && <p className="mt-1 text-xs text-gray-500">🧭 {it.directions}</p>}
              {plan === 'nang' && it.rain_tip && it.rain_tip !== 'Giữ nguyên' && (
                <p className="mt-2 rounded-lg bg-sky-50 px-2 py-1.5 text-xs text-sky-800">🌧️ Nếu mưa: {it.rain_tip}</p>
              )}
              {plan === 'mua' && it.replaces && it.replaces !== 'Giữ nguyên' && (
                <p className="mt-2 text-xs text-gray-500">↺ Thay cho: {it.replaces}</p>
              )}
              {it.note && <p className="mt-1 text-xs text-gray-400">{it.note}</p>}

              {hasExtras && (
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs">
                  {it.map_query
                    ? <a href={mapsDir(it.map_query)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">📍 Chỉ đường</a>
                    : <span />}
                  <label className="flex items-center gap-1 text-gray-500">
                    Đã chi
                    <input id={`spent-${it.id}`} inputMode="decimal" placeholder="0"
                      className="w-16 rounded-md border border-gray-200 px-1.5 py-0.5 text-right tabular-nums text-gray-800 focus:border-blue-400 focus:outline-none"
                      value={drafts[it.id] ?? (it.spent_sgd != null ? String(Number(it.spent_sgd)) : '')}
                      onChange={e => setDrafts(d => ({ ...d, [it.id]: e.target.value }))}
                      onBlur={() => commitSpent(it)}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
                    SGD
                  </label>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {hasExtras && (
        <p className="mt-4 text-[11px] text-gray-400 text-center">Hướng dẫn tự đi mang tính tham khảo · bấm 📍 để Google Maps chỉ đường chính xác</p>
      )}
      {!hasExtras && (
        <p className="mt-4 text-[11px] text-amber-600 text-center">Chạy 004_itinerary_extras.sql trong Supabase để bật chỉ đường, “Đã đi” và nhập tiền SGD.</p>
      )}
    </div>
  )
}
