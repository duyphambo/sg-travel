import { createClient } from '@supabase/supabase-js'

// Chỉ dùng phía server (API routes, Server Components).
// Service role key KHÔNG bao giờ được gửi xuống trình duyệt.
export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong Environment Variables')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
