'use client'
import type { TripSummary } from '@/types'
import { formatVnd, formatSgd, vndToSgd } from '@/lib/utils'

export default function SummaryCards({ s }: { s: TripSummary }) {
  const spentPercent = s.budget > 0 ? Math.min(100, Math.round((s.spent / s.budget) * 100)) : 0

  return (
    <div className="space-y-3 mb-5">
      {/* Thẻ Ngân sách tổng theo chuẩn Techcombank Priority (Nâu Espresso & Vàng Đồng) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#23170f] via-[#3a2618] to-[#5c3d24] border border-[#c5a059] p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#d9b87c]">
              🎯 Ngân sách chuyến đi
            </p>
            <p className="text-2xl font-extrabold text-[#fdf8f0] mt-0.5">{formatVnd(s.budget)}</p>
            <p className="text-xs font-medium text-[#e8d5b5] mt-0.5">
              ≈ {formatSgd(vndToSgd(s.budget, s.rate))} · Tỷ giá {formatVnd(s.rate)}/SGD
            </p>
          </div>
          <span className="rounded-full bg-[#c5a059]/20 border border-[#c5a059]/50 px-3 py-1 text-xs font-bold text-[#f3dfb6]">
            Đã chi {spentPercent}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-black/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c5a059] to-[#f3dfb6] transition-all duration-500"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
      </div>

      {/* Hàng 2: Dự toán + Dự kiến còn dư */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#fffdf9] border border-[#decba8] p-3.5 shadow-sm">
          <p className="text-xs font-bold text-[#7a5c38]">📋 Tổng dự toán</p>
          <p className="text-lg font-extrabold text-[#2b1c12] mt-0.5">{formatVnd(s.planned)}</p>
          <p className="text-xs text-[#8c7a66]">{formatSgd(vndToSgd(s.planned, s.rate))}</p>
        </div>
        <div
          className={`rounded-2xl border p-3.5 shadow-sm ${
            s.left < 0
              ? 'bg-rose-50 border-rose-300'
              : 'bg-[#f6efe2] border-[#c5a059]'
          }`}
        >
          <p className={`text-xs font-bold ${s.left < 0 ? 'text-rose-700' : 'text-[#7a5c38]'}`}>
            ✨ Dự kiến còn dư
          </p>
          <p className={`text-lg font-extrabold mt-0.5 ${s.left < 0 ? 'text-rose-700' : 'text-[#3a2618]'}`}>
            {s.left < 0 ? '−' : ''}{formatVnd(Math.abs(s.left))}
          </p>
          <p className="text-xs text-[#7a5c38]">
            {s.left < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.left, s.rate)))}
          </p>
        </div>
      </div>

      {/* Hàng 3: Đã chi + Tiền mặt + Tiền thẻ còn */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#fffdf9] border border-[#decba8] p-3 shadow-sm">
          <p className="text-[11px] font-bold text-[#8c6239]">💸 Đã chi</p>
          <p className="text-sm sm:text-base font-extrabold text-[#2b1c12] mt-0.5">{formatVnd(s.spent)}</p>
          <p className="text-[11px] text-[#8c7a66]">{formatSgd(vndToSgd(s.spent, s.rate))}</p>
        </div>
        <div className="rounded-2xl bg-[#fffdf9] border border-[#decba8] p-3 shadow-sm">
          <p className="text-[11px] font-bold text-[#8c6239]">💵 Tiền mặt</p>
          <p className="text-sm sm:text-base font-extrabold text-[#2b1c12] mt-0.5">
            {s.cashSgd.toLocaleString('vi-VN')} SGD
          </p>
          <p className="text-[11px] text-[#8c7a66]">≈ {formatVnd(s.cashVnd)}</p>
        </div>
        <div
          className={`rounded-2xl border p-3 shadow-sm ${
            s.cardLeft < 0 ? 'bg-rose-50 border-rose-300' : 'bg-[#fffdf9] border-[#decba8]'
          }`}
        >
          <p className={`text-[11px] font-bold ${s.cardLeft < 0 ? 'text-rose-700' : 'text-[#8c6239]'}`}>
            💳 Thẻ còn
          </p>
          <p className={`text-sm sm:text-base font-extrabold mt-0.5 ${s.cardLeft < 0 ? 'text-rose-700' : 'text-[#2b1c12]'}`}>
            {s.cardLeft < 0 ? '−' : ''}{formatVnd(Math.abs(s.cardLeft))}
          </p>
          <p className="text-[11px] text-[#8c7a66]">
            {s.cardLeft < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.cardLeft, s.rate)))}
          </p>
        </div>
      </div>
    </div>
  )
}
