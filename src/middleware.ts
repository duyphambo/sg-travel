import { NextResponse, type NextRequest } from 'next/server'

// Bảo vệ toàn bộ web bằng 1 mật khẩu chung cho cả nhà (HTTP Basic Auth).
// Đặt SITE_PASSWORD (và tuỳ chọn SITE_USER) trong Environment Variables của Vercel.
export function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD
  if (!password) {
    return new NextResponse('Chưa cấu hình SITE_PASSWORD trên server.', { status: 500 })
  }
  const user = process.env.SITE_USER || 'giadinh'

  const header = req.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    const [u, p] = atob(header.slice(6)).split(':')
    if (u === user && p === password) return NextResponse.next()
  }

  return new NextResponse('Cần đăng nhập', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="SG Travel", charset="UTF-8"' },
  })
}

export const config = {
  // Áp dụng cho mọi trang và API, trừ file tĩnh của Next và manifest
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}
