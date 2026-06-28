'use client'

import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { AuthShell } from './auth-shell'

interface LoginScreenProps {
  onLogin: () => void
  onGoToSignup: () => void
}

export function LoginScreen({ onLogin, onGoToSignup }: LoginScreenProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)

  function submit() {
    let ok = true

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Ingresá un email válido.')
      ok = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('Ingresá tu contraseña.')
      ok = false
    } else {
      setPasswordError('')
    }

    if (!ok) return

    setLoading(true)
    login(email, password)
      .then(() => {
        onLogin()
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Error al iniciar sesión.'
        setPasswordError(message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function handleThirdParty(provider: string) {
    setPasswordError(
      `Simulando ingreso con ${provider} (no disponible en este entorno de prueba).`,
    )
  }

  return (
    <AuthShell
      title="Hola de nuevo."
      subtitle="Entrá para seguir registrando tus gastos."
      footer={
        <span>
          ¿Todavía no tenés cuenta?{' '}
          <button
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={onGoToSignup}
          >
            Creá una
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
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            value={email}
            placeholder="vos@ejemplo.com"
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={emailError ? 'true' : 'false'}
            aria-describedby={emailError ? 'login-email-error' : undefined}
          />
          {emailError && (
            <p id="login-email-error" className="text-sm text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-medium">
              Contraseña
            </label>
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              ¿La olvidaste?
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            value={password}
            placeholder="Tu contraseña"
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={passwordError ? 'true' : 'false'}
            aria-describedby={
              passwordError ? 'login-password-error' : undefined
            }
          />
          {passwordError && (
            <p id="login-password-error" className="text-sm text-destructive">
              {passwordError}
            </p>
          )}
        </div>

        {passwordError.includes('Simulando ingreso') && (
          <Alert variant="info">
            <AlertTitle>Ingreso social</AlertTitle>
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" variant="default" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </Button>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o continuá con
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => handleThirdParty('Google')}
            >
              Google
            </Button>
            <Button variant="outline" onClick={() => handleThirdParty('Apple')}>
              Apple
            </Button>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}
