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
    <div className="space-y-4">
      {grouped.map(({ cat, items }) => {
        const catPlanned = items.reduce((a, c) => a + (c.planned ?? 0), 0)
        const catSpent = items.reduce((a, c) => a + (c.actual > 0 ? c.actual : 0), 0)
        const style = CAT_STYLE[cat] ?? { icon: '📌', badge: 'bg-[#3a2618] text-[#f3dfb6]', headerBg: 'bg-[#f5efe4]' }

        return (
          <div key={cat} className="rounded-2xl border border-[#decba8] bg-[#fffdf9] overflow-hidden shadow-sm">
            {/* Tiêu đề nhóm chi phí */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#f4ecdd] to-[#faf6ee] border-b border-[#e8dcc8]">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm ${style.badge}`}>
                  {style.icon}
                </span>
                <h3 className="font-extrabold text-sm text-[#2b1c12]">{cat}</h3>
              </div>
              <span className="text-xs text-[#6e5a44]">
                {formatVnd(catPlanned)} dự toán · <strong className="text-[#8c6239]">{formatVnd(catSpent)} đã chi</strong>
              </span>
            </div>

            <div>
              {items.map((c, i) => (
                <div key={c.id}>
                  {editing === c.id ? (
                    <div className="p-4 bg-[#f7f1e5] border-b border-[#e2d3bc]">
                      <p className="text-sm font-extrabold text-[#2b1c12] mb-2.5">{c.label}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                        <div>
                          <label className="text-xs font-bold text-[#6e5a44]">Thực chi (đ hoặc 42s = 42 SGD)</label>
                          <input
                            className="w-full bg-white border border-[#c5a059] rounded-xl px-3 py-1.5 text-sm text-[#2b1c12] mt-1 outline-none"
                            value={form.actual}
                            onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#6e5a44]">Trạng thái</label>
                          <select
                            className="w-full bg-white border border-[#c5a059] rounded-xl px-3 py-1.5 text-sm font-bold text-[#3a2618] mt-1 outline-none"
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                          >
                            <option value="chua">Chưa chi</option>
                            <option value="dat">Đã đặt</option>
                            <option value="tra">Đã trả</option>
                          </select>
                        </div>
                      </div>
                      <input
                        className="w-full bg-white border border-[#c5a059] rounded-xl px-3 py-1.5 text-sm text-[#2b1c12] mb-3 outline-none"
                        value={form.note}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="Ghi chú..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => save(c)}
                          className="bg-[#3a2618] hover:bg-[#2b1c12] text-[#f3dfb6] border border-[#c5a059] px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                        >
                          Lưu thay đổi
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="bg-[#e8dcc8] hover:bg-[#decba8] text-[#3a2618] px-4 py-1.5 rounded-xl text-xs font-bold"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center px-4 py-3 cursor-pointer hover:bg-[#f6efe2] transition-colors ${
                        i < items.length - 1 ? 'border-b border-[#f0e6d6]' : ''
                      }`}
                      onClick={() => openEdit(c)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2b1c12] truncate">{c.label}</p>
                        {c.note && <p className="text-xs text-[#7a5c38] truncate mt-0.5">{c.note}</p>}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className={`text-sm font-extrabold ${c.actual > 0 ? 'text-[#8c6239]' : 'text-[#2b1c12]'}`}>
                          {c.actual > 0 ? formatVnd(c.actual) : formatVnd(c.planned)}
                        </p>
                        <p className="text-[11px] text-[#8c7a66]">
                          {c.actual > 0 ? formatSgd(vndToSgd(c.actual, rate)) : formatSgd(vndToSgd(c.planned, rate))}
                        </p>
                      </div>
                      <span className={`ml-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_COLOR[c.status]}`}>
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
