'use client'
import { useState } from 'react'
import type { Cost } from '@/types'
import { formatVnd, formatSgd, vndToSgd, STATUS_LABEL, STATUS_COLOR, CAT_ORDER, CAT_STYLE } from '@/lib/utils'

interface Props {
  costs: Cost[]
  rate: number
  onUpdate: (id: string, patch: Partial<Cost>) => Promise<void>
}

export default function CostTable({ costs, rate, onUpdate }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{ actual: string; status: string; note: string }>({ actual: '', status: 'chua', note: '' })

  function openEdit(c: Cost) {
    setEditing(c.id)
    setForm({ actual: c.actual ? String(c.actual) : '', status: c.status, note: c.note ?? '' })
  }

  async function save(c: Cost) {
    let actual = 0
    const raw = form.actual.trim()
    if (raw.toLowerCase().endsWith('s')) {
      actual = Math.round(Number(raw.slice(0, -1)) * rate)
    } else {
      actual = Number(raw.replace(/[^0-9]/g, ''))
    }
    await onUpdate(c.id, { actual, status: form.status as Cost['status'], note: form.note })
    setEditing(null)
  }

  const grouped = CAT_ORDER.map(cat => ({ cat, items: costs.filter(c => c.cat === cat) })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-5">
      {grouped.map(({ cat, items }) => {
        const catPlanned = items.reduce((a, c) => a + (c.planned ?? 0), 0)
        const catSpent = items.reduce((a, c) => a + (c.actual > 0 ? c.actual : 0), 0)
        const style = CAT_STYLE[cat] ?? { icon: '📌', badge: 'bg-[#0077a8] text-white', headerBg: 'bg-[#eef7fb]' }

        return (
          <div key={cat}>
            {/* Section Title giống "Popular Experiences" / "Featured" */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0077a8] text-white flex items-center justify-center text-xs shadow-sm">
                  {style.icon}
                </span>
                <h3 className="font-bold text-sm text-slate-800">{cat}</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {formatVnd(catPlanned)} · <strong className="text-[#0077a8]">{formatVnd(catSpent)} đã chi</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-[#e3f1f8] bg-white overflow-hidden shadow-sm">
              {items.map((c, i) => (
                <div key={c.id}>
                  {editing === c.id ? (
                    <div className="p-4 bg-[#f7fbfd] border-b border-[#e3f1f8]">
                      <p className="text-sm font-bold text-slate-800 mb-3">{c.label}</p>
                      <div className="space-y-2.5 mb-3">
                        <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                          <span className="text-[#0077a8] mr-2.5 text-sm">💵</span>
                          <input
                            className="w-full bg-transparent text-sm text-slate-800 placeholder-[#6caac4] outline-none font-medium"
                            value={form.actual}
                            onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                            placeholder="Thực chi (đ hoặc 42s = 42 SGD)"
                          />
                        </div>
                        <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                          <span className="text-[#0077a8] mr-2.5 text-sm">🏷️</span>
                          <select
                            className="w-full bg-transparent text-sm text-[#0077a8] font-semibold outline-none"
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                          >
                            <option value="chua">Chưa chi</option>
                            <option value="dat">Đã đặt</option>
                            <option value="tra">Đã trả</option>
                          </select>
                        </div>
                        <div className="flex items-center bg-[#eef7fb] rounded-2xl px-3.5 py-2.5">
                          <span className="text-[#0077a8] mr-2.5 text-sm">📝</span>
                          <input
                            className="w-full bg-transparent text-sm text-slate-800 placeholder-[#6caac4] outline-none"
                            value={form.note}
                            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            placeholder="Ghi chú..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => save(c)}
                          className="flex-1 bg-[#0077a8] hover:bg-[#00628a] text-white py-2 rounded-full text-xs font-semibold shadow-sm transition-colors"
                        >
                          Lưu lại
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-5 bg-[#eef7fb] hover:bg-[#dceef7] text-[#0077a8] py-2 rounded-full text-xs font-semibold transition-colors"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center px-3.5 py-3 cursor-pointer hover:bg-[#f4fafe] transition-colors ${
                        i < items.length - 1 ? 'border-b border-[#eef7fb]' : ''
                      }`}
                      onClick={() => openEdit(c)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.label}</p>
                        {c.note && <p className="text-xs text-slate-400 truncate mt-0.5">{c.note}</p>}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className={`text-sm font-bold ${c.actual > 0 ? 'text-[#0077a8]' : 'text-slate-700'}`}>
                          {c.actual > 0 ? formatVnd(c.actual) : formatVnd(c.planned)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {c.actual > 0 ? formatSgd(vndToSgd(c.actual, rate)) : formatSgd(vndToSgd(c.planned, rate))}
                        </p>
                      </div>
                      <span className={`ml-2.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${STATUS_COLOR[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
