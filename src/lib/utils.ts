import type { Cost, TripSummary, Trip } from '@/types'

export function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}

export function formatSgd(n: number): string {
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' SGD'
}

export function vndToSgd(vnd: number, rate: number): number {
  return Math.round(vnd / rate)
}

export function computeSummary(trip: Trip, costs: Cost[]): TripSummary {
  const planned = costs.reduce((a, r) => a + (r.planned ?? 0), 0)
  const spent = costs.reduce((a, r) => a + (r.actual > 0 ? r.actual : 0), 0)
  const committed = costs.reduce((a, r) => a + (r.actual > 0 ? r.actual : (r.planned ?? 0)), 0)
  const left = trip.budget_vnd - committed
  const cashVnd = trip.cash_sgd * trip.rate
  const cardLeft = trip.budget_vnd - spent - cashVnd

  return { budget: trip.budget_vnd, planned, spent, committed, left, cashVnd, cardLeft, rate: trip.rate, cashSgd: trip.cash_sgd }
}

export const CAT_ORDER = ['Cố định', 'Vé tham quan', 'Ăn uống', 'Đi lại', 'Phát sinh'] as const

export const STATUS_LABEL: Record<string, string> = {
  chua: 'Chưa chi',
  dat: 'Đã đặt',
  tra: 'Đã trả',
}

export const STATUS_COLOR: Record<string, string> = {
  chua: 'bg-[#f4efe6] text-[#6e5a44] border border-[#e2d3bc]',
  dat: 'bg-[#fdf3dc] text-[#94621b] border border-[#e6c687]',
  tra: 'bg-[#3a2618] text-[#f3dfb6] border border-[#8c6239]',
}

export const CAT_STYLE: Record<string, { icon: string; badge: string; headerBg: string }> = {
  'Cố định': {
    icon: '🏨',
    badge: 'bg-[#3a2618] text-[#f3dfb6]',
    headerBg: 'bg-[#f5efe4]',
  },
  'Vé tham quan': {
    icon: '🎡',
    badge: 'bg-[#8c6239] text-white',
    headerBg: 'bg-[#f5efe4]',
  },
  'Ăn uống': {
    icon: '🍜',
    badge: 'bg-[#9a6f38] text-white',
    headerBg: 'bg-[#f5efe4]',
  },
  'Đi lại': {
    icon: '🚇',
    badge: 'bg-[#5c3d24] text-[#f3dfb6]',
    headerBg: 'bg-[#f5efe4]',
  },
  'Phát sinh': {
    icon: '🛍️',
    badge: 'bg-[#734f2c] text-white',
    headerBg: 'bg-[#f5efe4]',
  },
}
