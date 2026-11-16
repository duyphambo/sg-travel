'use client'
import type { TripSummary } from '@/types'
import { formatVnd, formatSgd, vndToSgd } from '@/lib/utils'

export default function SummaryCards({ s }: { s: TripSummary }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: Ngân sách mốc */}
      <div className="bg-green-50 border border-green-400 rounded-xl p-3">
        <p className="text-xs text-green-700 font-medium">🎯 Ngân sách chuyến đi</p>
        <p className="text-xl font-extrabold text-green-700">{formatVnd(s.budget)}</p>
        <p className="text-xs text-green-600">{formatSgd(vndToSgd(s.budget, s.rate))}</p>
      </div>

      {/* Row 2: Dự toán + Dự kiến còn dư */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">📋 Dự toán</p>
          <p className="text-lg font-extrabold text-gray-800">{formatVnd(s.planned)}</p>
          <p className="text-xs text-gray-400">{formatSgd(vndToSgd(s.planned, s.rate))}</p>
        </div>
        <div className={`border rounded-xl p-3 ${s.left < 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-500">✨ Dự kiến còn dư</p>
          <p className={`text-lg font-extrabold ${s.left < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {s.left < 0 ? '−' : ''}{formatVnd(Math.abs(s.left))}
          </p>
          <p className="text-xs text-gray-400">{s.left < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.left, s.rate)))}</p>
        </div>
      </div>

      {/* Row 3: Đã chi + Tiền mặt + Tiền thẻ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
          <p className="text-xs text-amber-700">💸 Đã chi</p>
          <p className="text-base font-extrabold text-amber-700">{formatVnd(s.spent)}</p>
          <p className="text-xs text-amber-500">{formatSgd(vndToSgd(s.spent, s.rate))}</p>
        </div>
        <div className="bg-green-50 border border-green-400 rounded-xl p-3">
          <p className="text-xs text-green-700">💵 Tiền mặt</p>
          <p className="text-base font-extrabold text-green-700">{s.cashSgd.toLocaleString('vi-VN')} SGD</p>
          <p className="text-xs text-green-500">≈ {formatVnd(s.cashVnd)} · đã đổi</p>
        </div>
        <div className={`border rounded-xl p-3 ${s.cardLeft < 0 ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-400'}`}>
          <p className={`text-xs ${s.cardLeft < 0 ? 'text-red-600' : 'text-blue-700'}`}>💳 Tiền thẻ còn</p>
          <p className={`text-base font-extrabold ${s.cardLeft < 0 ? 'text-red-600' : 'text-blue-700'}`}>
            {s.cardLeft < 0 ? '−' : ''}{formatVnd(Math.abs(s.cardLeft))}
          </p>
          <p className={`text-xs ${s.cardLeft < 0 ? 'text-red-400' : 'text-blue-500'}`}>
            {s.cardLeft < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.cardLeft, s.rate)))}
          </p>
        </div>
      </div>
    </div>
  )
}
