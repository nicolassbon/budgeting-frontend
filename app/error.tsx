'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010102] text-[#f7f8f8] px-6">
      <div className="max-w-[480px] w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[#5e6ad2] text-xs font-semibold uppercase tracking-wider">
            Error inesperado
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Algo salió mal.
          </h1>
          <p className="text-sm text-[#8a8f98]">
            Ocurrió un error inesperado al procesar la aplicación. Podés
            intentar recargar la sección.
          </p>
        </div>

        {error.message && (
          <div className="p-4 rounded-lg bg-[#0f1011] border border-[#23252a] text-left">
            <p className="text-xs font-mono text-[#8a8f98] break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Recargar página
          </Button>
          <Button onClick={() => reset()}>Volver a intentar</Button>
        </div>
      </div>
    </div>
  )
}
