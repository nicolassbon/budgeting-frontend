'use client'

import { useEffect } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Button } from '@/components/ui/button'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled layout error:', error)
  }, [error])

  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="font-sans antialiased bg-[#010102] text-[#f7f8f8] flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-[480px] w-full text-center space-y-6">
          <div className="space-y-2">
            <p className="text-[#5e6ad2] text-xs font-semibold uppercase tracking-wider">
              Error crítico de sistema
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Ocurrió un error general.
            </h1>
            <p className="text-sm text-[#8a8f98]">
              No pudimos cargar la aplicación debido a un fallo crítico de
              inicialización.
            </p>
          </div>

          {error.message && (
            <div className="p-4 rounded-lg bg-[#0f1011] border border-[#23252a] text-left">
              <p className="text-xs font-mono text-[#8a8f98] break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={() => reset()}>Reiniciar aplicación</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
