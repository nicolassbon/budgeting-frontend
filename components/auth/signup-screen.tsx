'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { AuthShell } from './auth-shell'

interface SignupScreenProps {
  onSignup: () => void
  onGoToLogin: () => void
}

export function SignupScreen({ onSignup, onGoToLogin }: SignupScreenProps) {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirm?: string
  }>({})
  const [loading, setLoading] = useState(false)

  function submit() {
    const next: typeof errors = {}

    if (!email.trim() || !email.includes('@'))
      next.email = 'Ingresá un email válido.'
    if (password.length < 6) next.password = 'Usá al menos 6 caracteres.'
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    signup(email, password)
      .then(() => {
        onSignup()
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Error al crear cuenta.'
        setErrors({ password: message })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <AuthShell
      title="Creá tu cuenta."
      subtitle="Empezá a registrar tus gastos en segundos."
      footer={
        <span>
          ¿Ya tenés cuenta?{' '}
          <button
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={onGoToLogin}
          >
            Iniciá sesión
          </button>
        </span>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            placeholder="vos@ejemplo.com"
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Contraseña
          </label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            placeholder="Creá una contraseña"
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-confirm" className="text-sm font-medium">
            Repetir contraseña
          </label>
          <Input
            id="signup-confirm"
            type="password"
            value={confirm}
            placeholder="Repetí la contraseña"
            onChange={(event) => setConfirm(event.target.value)}
          />
          {errors.confirm && (
            <p className="text-sm text-destructive">{errors.confirm}</p>
          )}
        </div>

        <Button type="submit" variant="default" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  )
}
