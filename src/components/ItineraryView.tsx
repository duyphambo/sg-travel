'use client'
import { useEffect, useMemo, useState } from 'react'
import type { ItineraryItem, ItineraryPlan, Trip } from '@/types'

const KIND_STYLE: Record<string, string> = {
  'Trong nhà': 'bg-green-100 text-green-700',
  'Có mái che': 'bg-teal-100 text-teal-700',
  'Ngoài trời': 'bg-orange-100 text-orange-700',
}

// Ngày hiện tại theo giờ Singapore (UTC+8), dạng YYYY-MM-DD
function todayInSingapore(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export default function ItineraryView({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<ItineraryItem[] | null>(null)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<ItineraryPlan>('nang')
  const [day, setDay] = useState(1)

  useEffect(() => {
    fetch(`/api/itinerary?trip_id=${trip.id}`, { cache: 'no-store' })
      .then(async r => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then((data: ItineraryItem[]) => setItems(data))
      .catch(e => setError(String(e || 'Không tải được lịch trình')))
  }, [trip.id])

  // Trong chuyến đi thì tự mở đúng ngày hôm nay
  useEffect(() => {
    const today = todayInSingapore()
    if (trip.start_date && today >= trip.start_date && (!trip.end_date || today <= trip.end_date)) {
      const diff = Math.round((Date.parse(today) - Date.parse(trip.start_date)) / 86400000)
      setDay(diff + 1)
    }
  }, [trip.start_date, trip.end_date])

  const days = useMemo(() => {
    const map = new Map<number, string>()
    for (const it of items ?? []) if (!map.has(it.day)) map.set(it.day, it.day_label)
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [items])

  const list = (items ?? []).filter(it => it.plan === plan && it.day === day)
  const outdoorCount = (items ?? []).filter(it => it.plan === 'nang' && it.day === day && it.kind === 'Ngoài trời').length

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
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {days.map(([d, label]) => (
          <button key={d} onClick={() => setDay(d)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border ${day === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            N{d} · {label}
          </button>
        ))}
      </div>

      {plan === 'nang' && outdoorCount > 0 && (
        <p className="mb-3 text-xs text-gray-500">
          Ngày này có {outdoorCount} hoạt động ngoài trời. Trời mưa thì bấm “Khi trời mưa” để xem lịch thay thế.
        </p>
      )}

      {/* Danh sách hoạt động */}
      <ol className="relative border-l-2 border-gray-200 ml-2 space-y-3">
        {list.map(it => (
          <li key={it.id} className="ml-4">
            <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-blue-500" aria-hidden />
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-blue-700 tabular-nums">{it.time_label}</p>
                {it.kind && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_STYLE[it.kind] ?? 'bg-gray-100 text-gray-600'}`}>
                    {it.kind}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">{it.title}</p>
              {it.detail && <p className="mt-0.5 text-sm text-gray-600">{it.detail}</p>}
              {it.transport && it.transport !== '—' && <p className="mt-1 text-xs text-gray-500">🚕 {it.transport}</p>}
              {plan === 'nang' && it.rain_tip && it.rain_tip !== 'Giữ nguyên' && (
                <p className="mt-2 rounded-lg bg-sky-50 px-2 py-1.5 text-xs text-sky-800">🌧️ Nếu mưa: {it.rain_tip}</p>
              )}
              {plan === 'mua' && it.replaces && it.replaces !== 'Giữ nguyên' && (
                <p className="mt-2 text-xs text-gray-500">↺ Thay cho: {it.replaces}</p>
              )}
              {it.note && <p className="mt-1 text-xs text-gray-400">{it.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
