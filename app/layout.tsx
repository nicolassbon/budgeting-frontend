import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Budgeting — Control de gastos',
  description:
    'Registrá tus gastos cotidianos con la menor fricción posible. Contá o dictá tu gasto y guardalo en segundos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
