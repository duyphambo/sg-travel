import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import type { Trip } from '@/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = createServerClient()
  const { data: trips } = await sb.from('trips').select('*').order('start_date')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">🧳 Chuyến đi</h1>
        <p className="text-sm text-gray-500 mb-6">Chọn chuyến đi để theo dõi chi phí</p>
        <div className="space-y-3">
          {(trips ?? []).map((t: Trip) => (
            <Link key={t.id} href={`/trips/${t.slug}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.start_date} → {t.end_date} · {t.members} người</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
