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
  chua: 'bg-gray-100 text-gray-600',
  dat: 'bg-amber-100 text-amber-700',
  tra: 'bg-green-100 text-green-700',
}
