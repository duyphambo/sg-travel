import { createClient } from '@supabase/supabase-js'

// Chuẩn hoá biến môi trường: bỏ dấu cách/dấu nháy thừa và đuôi /rest/v1 nếu lỡ dán vào.
export function supabaseEnv() {
  const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, '').trim()
  const url = clean(process.env.SUPABASE_URL)?.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return { url, key }
}

// Chỉ dùng phía server (API routes, Server Components).
// Service role key KHÔNG bao giờ được gửi xuống trình duyệt.
export function createServerClient() {
  const { url, key } = supabaseEnv()
  if (!url || !key) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong Environment Variables')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
