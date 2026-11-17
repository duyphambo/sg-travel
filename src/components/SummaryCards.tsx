'use client'
import type { TripSummary } from '@/types'
import { formatVnd, formatSgd, vndToSgd } from '@/lib/utils'

export default function SummaryCards({ s }: { s: TripSummary }) {
  return (
    <div className="mb-6">
      {/* 3 Icon Pillars (Giống hệt 3 ô vuông xanh Difficulty / Time Needed / Ticket trong ảnh mẫu) */}
      <div className="grid grid-cols-3 gap-3 text-center mb-5">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0077a8] text-white flex items-center justify-center shadow-md shadow-[#0077a8]/20 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Ngân sách</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{formatVnd(s.budget)}</span>
          <span className="text-[10px] text-[#0077a8] font-medium">{formatSgd(vndToSgd(s.budget, s.rate))}</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0077a8] text-white flex items-center justify-center shadow-md shadow-[#0077a8]/20 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Đã chi</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{formatVnd(s.spent)}</span>
          <span className="text-[10px] text-[#0077a8] font-medium">{formatSgd(vndToSgd(s.spent, s.rate))}</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0077a8] text-white flex items-center justify-center shadow-md shadow-[#0077a8]/20 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Dự kiến dư</span>
          <span className={`text-xs sm:text-sm font-bold mt-0.5 ${s.left < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {s.left < 0 ? '−' : ''}{formatVnd(Math.abs(s.left))}
          </span>
          <span className={`text-[10px] font-medium ${s.left < 0 ? 'text-rose-500' : 'text-[#0077a8]'}`}>
            {s.left < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.left, s.rate)))}
          </span>
        </div>
      </div>

      {/* Chi tiết Dự toán / Tiền mặt / Tiền thẻ với tone xanh nhạt #eef7fb của ảnh mẫu */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#eef7fb] rounded-2xl p-3">
          <p className="text-[11px] font-medium text-[#0077a8]">📋 Dự toán</p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{formatVnd(s.planned)}</p>
          <p className="text-[10px] text-slate-500">{formatSgd(vndToSgd(s.planned, s.rate))}</p>
        </div>
        <div className="bg-[#eef7fb] rounded-2xl p-3">
          <p className="text-[11px] font-medium text-[#0077a8]">💵 Tiền mặt</p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{s.cashSgd.toLocaleString('vi-VN')} SGD</p>
          <p className="text-[10px] text-slate-500">≈ {formatVnd(s.cashVnd)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${s.cardLeft < 0 ? 'bg-rose-50' : 'bg-[#eef7fb]'}`}>
          <p className={`text-[11px] font-medium ${s.cardLeft < 0 ? 'text-rose-600' : 'text-[#0077a8]'}`}>💳 Thẻ còn</p>
          <p className={`text-xs sm:text-sm font-bold mt-0.5 ${s.cardLeft < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {s.cardLeft < 0 ? '−' : ''}{formatVnd(Math.abs(s.cardLeft))}
          </p>
          <p className="text-[10px] text-slate-500">
            {s.cardLeft < 0 ? '−' : ''}{formatSgd(Math.abs(vndToSgd(s.cardLeft, s.rate)))}
          </p>
        </div>
      </div>
    </div>
  )
}
