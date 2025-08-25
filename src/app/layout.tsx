import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hiking Gear Recommendation System',
  description: 'Find the perfect hiking gear based on your needs and preferences',
  keywords: ['hiking', 'gear', 'recommendation', 'outdoor', 'equipment'],
  authors: [{ name: 'Hiking Gear Team' }],
  // Remove viewport from here
}

// Separate viewport export (Next.js 15 requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}