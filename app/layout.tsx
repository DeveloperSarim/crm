import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rayash CRM',
  description: 'Internal lead management portal for Rayash Real Estate',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
