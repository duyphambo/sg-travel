import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SG Travel Tracker · Priority Edition',
  description: 'Lịch trình & Chi phí chuyến đi Singapore của gia đình',
  manifest: '/manifest.json',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2b1c12',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-[#e8d5b5] selection:text-[#2b1c12]">{children}</body>
    </html>
  )
}
