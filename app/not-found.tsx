import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010102] text-[#f7f8f8] px-6">
      <div className="max-w-[400px] w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-[#5e6ad2] text-xs font-semibold uppercase tracking-wider">
            Código 404
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Página no encontrada.
          </h1>
          <p className="text-sm text-[#8a8f98]">
            La dirección que ingresaste no existe o fue movida permanentemente.
          </p>
        </div>

        <div className="flex justify-center">
          <Link href="/" className={buttonVariants({ variant: 'default' })}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
