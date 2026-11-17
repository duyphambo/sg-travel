'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ItineraryItem, ItineraryPlan, Trip } from '@/types'
import { FALLBACK_ITinerary } from '@/lib/itineraryFallback'

const KIND_STYLE: Record<string, string> = {
  'Trong nhà': 'bg-[#efe7d8] text-[#5c3d24] border border-[#d9c5a3]',
  'Có mái che': 'bg-[#f6edd9] text-[#7c5325] border border-[#e3c893]',
  'Ngoài trời': 'bg-[#3a2618] text-[#f3dfb6] border border-[#8c6239]',
}

const DAY_META: Record<number, { title: string; subtitle: string; image: string }> = {
  1: {
    title: 'Ngày 1 · Changi, Jewel & Vịnh Marina Bay',
    subtitle: 'Thứ Bảy 21/11 · Nhập cảnh, thác Rain Vortex, Merlion & nhạc nước Spectra',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80',
  },
  2: {
    title: 'Ngày 2 · Kampong Glam & Gardens by the Bay',
    subtitle: 'Chủ Nhật 22/11 · Thánh đường Sultan, Bak Kut Teh, Cloud Forest & Supertree Grove',
    image: 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=900&q=80',
  },
  3: {
    title: 'Ngày 3 · Cáp treo Mount Faber & Đảo Sentosa',
    subtitle: 'Thứ Hai 23/11 · Singapore Oceanarium, Quả địa cầu Universal & Wings of Time',
    image: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=900&q=80',
  },
  4: {
    title: 'Ngày 4 · Phố cổ Chinatown, Phật Nha Tự & Về nước',
    subtitle: 'Thứ Ba 24/11 · Mua quà Chinatown, chùa Răng Phật, cơm gà Tian Tian & ra sân bay',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
  },
}

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const mapsDir = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=transit`
const fmtSgd = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

function todayInSingapore(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export default function ItineraryView({ trip }: { trip: Trip }) {
  const [items, setItems] = useState<ItineraryItem[] | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [plan, setPlan] = useState<ItineraryPlan>('nang')
  // day = 0 nghĩa là xem tất cả 4 ngày cùng lúc; 1..4 là xem riêng từng ngày
  const [day, setDay] = useState<number>(1)
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const load = useCallback(() => {
    fetch(`/api/itinerary?trip_id=${trip.id}`, { cache: 'no-store' })
      .then(async r => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then((data: ItineraryItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data)
          setUsingFallback(false)
        } else {
          setItems(FALLBACK_ITinerary)
          setUsingFallback(true)
        }
      })
      .catch(() => {
        setItems(FALLBACK_ITinerary)
        setUsingFallback(true)
      })
  }, [trip.id])

  useEffect(() => {
    load()
    window.addEventListener('focus', load)
    return () => window.removeEventListener('focus', load)
  }, [load])

  useEffect(() => {
    const today = todayInSingapore()
    if (trip.start_date && today >= trip.start_date && (!trip.end_date || today <= trip.end_date)) {
      const diff = Math.round((Date.parse(today) - Date.parse(trip.start_date)) / 86400000)
      if (diff >= 0 && diff < 4) setDay(diff + 1)
    }
  }, [trip.start_date, trip.end_date])

  const save = useCallback(
    async (id: number, patch: Partial<ItineraryItem>) => {
      setItems(prev => prev?.map(it => (it.id === id ? { ...it, ...patch } : it)) ?? prev)
      if (usingFallback) return
      const r = await fetch(`/api/itinerary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!r.ok) {
        setSaveError('Lưu chưa thành công lên Supabase (kiểm tra đã chạy 003 & 004 SQL chưa).')
        setTimeout(() => setSaveError(''), 5000)
        load()
      }
    },
    [load, usingFallback]
  )

  function commitSpent(it: ItineraryItem) {
    const raw = drafts[it.id]
    if (raw === undefined) return
    const cleaned = raw.replace(',', '.').trim()
    const value = cleaned === '' ? null : Number(cleaned)
    setDrafts(d => {
      const n = { ...d }
      delete n[it.id]
      return n
    })
    if (value !== null && (!Number.isFinite(value) || value < 0)) return
    if (value === (it.spent_sgd ?? null)) return
    save(it.id, { spent_sgd: value })
  }

  const days = useMemo(() => {
    const map = new Map<number, string>()
    for (const it of items ?? []) if (!map.has(it.day)) map.set(it.day, it.day_label)
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [items])

  const places = useMemo(() => {
    const seen = new Set<string>()
    const out: { q: string; day: number; title: string }[] = []
    for (const it of [...(items ?? [])].sort(
      (a, b) => a.day - b.day || (a.plan === b.plan ? a.order_num - b.order_num : a.plan === 'nang' ? -1 : 1)
    )) {
      if (!it.map_query || seen.has(it.map_query)) continue
      seen.add(it.map_query)
      out.push({ q: it.map_query, day: it.day, title: it.title })
    }
    return out
  }, [items])

  if (!items) {
    return (
      <div className="rounded-2xl border border-[#decba8] bg-[#fffdf9] p-6 text-center text-sm text-[#7a5c38]">
        Đang tải lịch trình 4 ngày…
      </div>
    )
  }

  const hasExtras = items.some(it => it.map_query)
  const visibleDays = day === 0 ? days.map(([d]) => d) : [day]
  const planItems = items.filter(it => it.plan === plan)
  const currentList = day === 0 ? planItems : planItems.filter(it => it.day === day)
  const doneCount = currentList.filter(it => it.done).length
  const daySpent = (day === 0 ? items : items.filter(it => it.day === day)).reduce(
    (s, it) => s + (Number(it.spent_sgd) || 0),
    0
  )
  const tripSpent = items.reduce((s, it) => s + (Number(it.spent_sgd) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Chọn kịch bản thời tiết: Trời đẹp / Khi trời mưa */}
      <div className="grid grid-cols-2 gap-2.5" role="tablist" aria-label="Chọn lịch theo thời tiết">
        <button
          role="tab"
          aria-selected={plan === 'nang'}
          onClick={() => setPlan('nang')}
          className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
            plan === 'nang'
              ? 'bg-gradient-to-r from-[#3a2618] via-[#5c3d24] to-[#7a5230] border-[#c5a059] text-[#f5dfb0] shadow-md'
              : 'bg-[#fffdf9] border-[#e2d3bc] text-[#6e5a44] hover:border-[#b88b4a]'
          }`}
        >
          ☀️ Lịch trình Trời đẹp
        </button>
        <button
          role="tab"
          aria-selected={plan === 'mua'}
          onClick={() => setPlan('mua')}
          className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
            plan === 'mua'
              ? 'bg-gradient-to-r from-[#3a2618] via-[#5c3d24] to-[#7a5230] border-[#c5a059] text-[#f5dfb0] shadow-md'
              : 'bg-[#fffdf9] border-[#e2d3bc] text-[#6e5a44] hover:border-[#b88b4a]'
          }`}
        >
          🌧️ Phương án Khi trời mưa
        </button>
      </div>

      {/* Bộ chọn NGÀY 1, NGÀY 2, NGÀY 3, NGÀY 4 rõ ràng nổi bật */}
      <div className="rounded-2xl border border-[#decba8] bg-[#fffdf9] p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7a5c38]">
            📅 Chọn ngày hành trình
          </p>
          <button
            onClick={() => setDay(day === 0 ? 1 : 0)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
              day === 0
                ? 'bg-[#8c6239] text-white border-[#8c6239]'
                : 'bg-[#f4efe6] text-[#5c3d24] border-[#decba8] hover:bg-[#eadec9]'
            }`}
          >
            {day === 0 ? '✓ Đang xem tất cả 4 ngày' : 'Xem tất cả 4 ngày'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {days.map(([d, label]) => {
            const active = day === d
            const count = planItems.filter(it => it.day === d).length
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`text-left rounded-xl p-2.5 border transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#2b1c12] via-[#3d2817] to-[#6b4a2b] border-[#c5a059] text-white shadow-md'
                    : 'bg-[#faf6ee] border-[#e2d3bc] text-[#2b1c12] hover:border-[#b88b4a] hover:bg-[#f4ecdd]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wide ${
                      active ? 'text-[#f3dfb6]' : 'text-[#8c6239]'
                    }`}
                  >
                    NGÀY {d}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-[#c5a059]/25 text-[#f3dfb6]' : 'bg-[#e8dcc8] text-[#5c3d24]'
                    }`}
                  >
                    {count} mục
                  </span>
                </div>
                <p className={`text-xs font-bold mt-0.5 ${active ? 'text-white' : 'text-[#2b1c12]'}`}>
                  {label}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Thanh tóm tắt tiến độ + địa điểm */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2d3bc] bg-[#f5efe4] px-3.5 py-2 text-xs text-[#5c3d24]">
        <span className="font-bold">
          ✓ Đã đi: {doneCount}/{currentList.length} điểm
        </span>
        <span>
          💵 Chi lặt vặt: <strong>{fmtSgd(daySpent)} SGD</strong> (≈{' '}
          {Math.round(daySpent * trip.rate).toLocaleString('vi-VN')}đ)
        </span>
        <span className="text-[#7a5c38]">Tổng 4 ngày: {fmtSgd(tripSpent)} SGD</span>
      </div>

      {hasExtras && (
        <details className="rounded-xl border border-[#decba8] bg-[#fffdf9] text-xs shadow-sm">
          <summary className="cursor-pointer select-none px-3.5 py-2.5 font-bold text-[#3a2618]">
            📍 Danh sách tất cả địa điểm & Google Maps chỉ đường ({places.length} điểm)
          </summary>
          <ul className="divide-y divide-[#efe6d5] border-t border-[#efe6d5]">
            {places.map(p => (
              <li key={p.q} className="flex items-center gap-2 px-3.5 py-2">
                <span className="shrink-0 rounded bg-[#3a2618] px-1.5 py-0.5 text-[10px] font-bold text-[#f3dfb6]">
                  Ngày {p.day}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-[#2b1c12]" title={p.q}>
                  {p.q}
                </span>
                <a
                  href={mapsSearch(p.q)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-bold text-[#8c6239] hover:underline"
                >
                  Bản đồ
                </a>
                <a
                  href={mapsDir(p.q)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md bg-[#f4efe6] border border-[#decba8] px-2 py-0.5 font-bold text-[#5c3d24] hover:bg-[#e8dcc8]"
                >
                  Chỉ đường
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {saveError && (
        <p className="rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-2 text-xs text-amber-900">
          {saveError}
        </p>
      )}

      {/* Hiển thị lịch trình theo từng ngày (1 ngày đang chọn hoặc cả 4 ngày) */}
      <div className="space-y-6">
        {visibleDays.map(d => {
          const dayItems = planItems.filter(it => it.day === d)
          const meta = DAY_META[d] ?? {
            title: `Ngày ${d}`,
            subtitle: '',
            image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80',
          }
          const dayOutdoorCount = items.filter(
            it => it.plan === 'nang' && it.day === d && it.kind === 'Ngoài trời'
          ).length

          return (
            <section key={d} className="space-y-3">
              {/* Banner Ảnh + Tiêu đề Ngày */}
              <div
                className="relative h-36 sm:h-44 rounded-2xl overflow-hidden shadow-md border border-[#c5a059]/60 bg-cover bg-center flex flex-col justify-end p-4 text-white"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(35,23,15,0.92) 0%, rgba(45,30,18,0.45) 55%, rgba(0,0,0,0.15) 100%), url("${meta.image}")`,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center rounded-full bg-[#c5a059] px-3 py-0.5 text-xs font-extrabold text-[#23170f] uppercase tracking-wider">
                    NGÀY {d} · {dayItems[0]?.day_label}
                  </span>
                  <span className="rounded-full bg-black/45 backdrop-blur-sm border border-[#c5a059]/50 px-2.5 py-0.5 text-[11px] font-bold text-[#f3dfb6]">
                    {plan === 'nang' ? '☀️ Lịch trời đẹp' : '🌧️ Lịch trời mưa'} · {dayItems.length} hoạt động
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#fdf8f0] leading-snug">
                  {meta.title}
                </h3>
                <p className="text-xs text-[#e8d5b5] mt-0.5">{meta.subtitle}</p>
              </div>

              {plan === 'nang' && dayOutdoorCount > 0 && (
                <p className="text-xs text-[#7a5c38] bg-[#f6efe2] border border-[#e2d3bc] rounded-xl px-3 py-2">
                  💡 <strong>Ngày {d}</strong> có {dayOutdoorCount} hoạt động ngoài trời. Nếu gặp mưa lớn hoặc sấm sét, bấm nút{' '}
                  <button
                    onClick={() => setPlan('mua')}
                    className="font-bold underline text-[#5c3d24] hover:text-[#2b1c12]"
                  >
                    🌧️ Phương án Khi trời mưa
                  </button>{' '}
                  ở trên để xem lịch thay thế trong nhà.
                </p>
              )}

              {/* Danh sách hoạt động trong ngày */}
              <ol className="relative border-l-2 border-[#c5a059] ml-3 space-y-3">
                {dayItems.map(it => (
                  <li key={it.id} className="ml-4">
                    <span
                      className={`absolute -left-[7px] mt-3 h-3 w-3 rounded-full border-2 ${
                        it.done ? 'bg-[#8c6239] border-[#3a2618]' : 'bg-[#fffdf9] border-[#8c6239]'
                      }`}
                      aria-hidden
                    />
                    <div
                      className={`border rounded-2xl p-3.5 shadow-sm transition-colors ${
                        it.done
                          ? 'bg-[#f4efe6]/80 border-[#decba8]'
                          : 'bg-[#fffdf9] border-[#e2d3bc] hover:border-[#c5a059]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center rounded-lg bg-[#3a2618] px-2.5 py-0.5 text-xs font-bold text-[#f3dfb6] tabular-nums">
                          🕒 {it.time_label}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {it.kind && (
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                KIND_STYLE[it.kind] ?? 'bg-[#f4efe6] text-[#5c3d24]'
                              }`}
                            >
                              {it.kind}
                            </span>
                          )}
                          {hasExtras && (
                            <label
                              className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                                it.done
                                  ? 'border-[#8c6239] bg-[#3a2618] text-[#f3dfb6]'
                                  : 'border-[#decba8] bg-[#faf6ee] text-[#6e5a44]'
                              }`}
                            >
                              <input
                                id={`done-${it.id}`}
                                type="checkbox"
                                className="h-3 w-3 accent-[#8c6239]"
                                checked={!!it.done}
                                onChange={e => save(it.id, { done: e.target.checked })}
                              />
                              Đã đi
                            </label>
                          )}
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-sm sm:text-base font-extrabold ${
                          it.done ? 'line-through text-[#8c7a66]' : 'text-[#2b1c12]'
                        }`}
                      >
                        {it.title}
                      </p>

                      {it.detail && <p className="mt-1 text-xs sm:text-sm text-[#5c4938]">{it.detail}</p>}
                      {it.transport && it.transport !== '—' && (
                        <p className="mt-1.5 text-xs font-medium text-[#7a5c38]">🚕 Di chuyển: {it.transport}</p>
                      )}
                      {it.directions && (
                        <p className="mt-1.5 text-xs text-[#5c4938] bg-[#faf6ee] border border-[#ece0cc] rounded-xl px-2.5 py-1.5">
                          🧭 <strong>Chỉ dẫn:</strong> {it.directions}
                        </p>
                      )}
                      {plan === 'nang' && it.rain_tip && it.rain_tip !== 'Giữ nguyên' && (
                        <p className="mt-2 rounded-xl bg-[#f5efe4] border border-[#decba8] px-2.5 py-1.5 text-xs text-[#6e4e2a]">
                          🌧️ <strong>Nếu mưa:</strong> {it.rain_tip}
                        </p>
                      )}
                      {plan === 'mua' && it.replaces && it.replaces !== 'Giữ nguyên' && (
                        <p className="mt-2 text-xs font-medium text-[#7a5c38]">↺ Thay cho: {it.replaces}</p>
                      )}
                      {it.note && <p className="mt-1.5 text-xs italic text-[#8c7a66]">📌 Lưu ý: {it.note}</p>}

                      {hasExtras && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#efe6d5] pt-2 text-xs">
                          {it.map_query ? (
                            <a
                              href={mapsDir(it.map_query)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-[#8c6239] hover:text-[#3a2618] hover:underline"
                            >
                              📍 Mở Google Maps chỉ đường
                            </a>
                          ) : (
                            <span />
                          )}
                          <label className="flex items-center gap-1.5 font-medium text-[#6e5a44]">
                            <span>Tiêu tại điểm:</span>
                            <input
                              id={`spent-${it.id}`}
                              inputMode="decimal"
                              placeholder="0"
                              className="w-16 rounded-lg border border-[#decba8] bg-[#faf6ee] px-2 py-0.5 text-right font-bold tabular-nums text-[#2b1c12] focus:border-[#8c6239] focus:outline-none"
                              value={drafts[it.id] ?? (it.spent_sgd != null ? String(Number(it.spent_sgd)) : '')}
                              onChange={e => setDrafts(d => ({ ...d, [it.id]: e.target.value }))}
                              onBlur={() => commitSpent(it)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                              }}
                            />
                            <span className="font-bold text-[#8c6239]">SGD</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}
