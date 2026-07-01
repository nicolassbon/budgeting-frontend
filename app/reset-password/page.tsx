'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function ResetPasswordFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Token de restablecimiento faltante.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const xsrf = getCookie('XSRF-TOKEN')
    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrf || '',
        },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (response.status === 204) {
        setSuccess(true)
      } else {
        const data = await response.json().catch(() => ({}))
        if (data.code === 'reset_token_invalid') {
          setError('El enlace de restablecimiento es inválido o ha expirado.')
        } else {
          setError(
            'Ocurrió un error al restablecer la contraseña. Intentá de nuevo.',
          )
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          Falta el token de restablecimiento o el enlace es incorrecto.
        </p>
        <Button onClick={() => router.push('/')} className="w-full">
          Volver al inicio
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          ¡Tu contraseña fue restablecida con éxito! Ya podés ingresar con tu
          nueva contraseña.
        </p>
        <Button onClick={() => router.push('/')} className="w-full">
          Iniciar sesión
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reset-password" className="text-sm font-medium">
          Nueva contraseña
        </label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Al menos 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reset-password-confirm" className="text-sm font-medium">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Input
            id="reset-password-confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repetir contraseña"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
            required
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={
              showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Restableciendo…' : 'Restablecer contraseña'}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Restablecer contraseña"
      subtitle="Ingresá tu nueva contraseña para volver a entrar."
      footer={
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver al inicio
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="text-center font-mono text-[10px] text-muted-foreground uppercase tracking-widest py-8">
            Cargando...
          </div>
        }
      >
        <ResetPasswordFormContent />
      </Suspense>
    </AuthShell>
  )
}
