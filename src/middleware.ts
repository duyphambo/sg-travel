import { NextResponse, type NextRequest } from 'next/server'

// Mật khẩu là TUỲ CHỌN.
// - Không đặt SITE_PASSWORD trên Vercel  → web mở tự do, không hỏi đăng nhập.
// - Đặt SITE_PASSWORD (và tuỳ chọn SITE_USER) → bật lại ô đăng nhập cho cả nhà.
export function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD
  if (!password) return NextResponse.next()

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}
