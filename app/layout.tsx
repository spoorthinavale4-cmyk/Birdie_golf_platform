import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Birdie - Golf with Purpose',
  description: 'Play golf. Win prizes. Fund causes that matter.',
  keywords: ['golf', 'charity', 'subscription', 'prize draw', 'stableford'],
  other: {
    'format-detection': 'telephone=no, date=no, email=no, address=no',
  },
  openGraph: {
    title: 'Birdie - Golf with Purpose',
    description: 'Play golf. Win prizes. Fund causes that matter.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="font-body bg-obsidian text-ivory antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
