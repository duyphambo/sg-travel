'use client'
import { useState } from 'react'
import type { Cost } from '@/types'
import { formatVnd, formatSgd, vndToSgd, STATUS_LABEL, STATUS_COLOR, CAT_ORDER } from '@/lib/utils'

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
    // Cho phép nhập SGD bằng cách gõ số + 's' cuối
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
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-gray-700">{cat}</h3>
              <span className="text-xs text-gray-400">{formatVnd(catPlanned)} dự toán · {formatVnd(catSpent)} đã chi</span>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {items.map((c, i) => (
                <div key={c.id}>
                  {editing === c.id ? (
                    <div className="p-3 bg-blue-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800 mb-2">{c.label}</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-500">Thực chi (đ hoặc 42s = 42 SGD)</label>
                          <input
                            className="w-full border rounded-lg px-2 py-1 text-sm mt-0.5"
                            value={form.actual}
                            onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Trạng thái</label>
                          <select
                            className="w-full border rounded-lg px-2 py-1 text-sm mt-0.5"
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
                        className="w-full border rounded-lg px-2 py-1 text-sm mb-2"
                        value={form.note}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="Ghi chú..."
                      />
                      <div className="flex gap-2">
                        <button onClick={() => save(c)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">Lưu</button>
                        <button onClick={() => setEditing(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm">Huỷ</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
                      onClick={() => openEdit(c)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{c.label}</p>
                        {c.note && <p className="text-xs text-gray-400 truncate">{c.note}</p>}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {c.actual > 0 ? formatVnd(c.actual) : formatVnd(c.planned)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.actual > 0 ? formatSgd(vndToSgd(c.actual, rate)) : formatSgd(vndToSgd(c.planned, rate))}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status]}`}>
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
