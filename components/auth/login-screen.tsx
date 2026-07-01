'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { AuthShell } from './auth-shell'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

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
  const [showPassword, setShowPassword] = useState(false)

  // Recovery modal states
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverError, setRecoverError] = useState('')
  const [recoverSuccess, setRecoverSuccess] = useState(false)
  const [recoverLoading, setRecoverLoading] = useState(false)

  const handleRecoverSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setRecoverError('')

    if (!recoverEmail.trim() || !recoverEmail.includes('@')) {
      setRecoverError('Ingresá un email válido.')
      return
    }

    setRecoverLoading(true)
    const xsrf = getCookie('XSRF-TOKEN')
    try {
      const response = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrf || '',
        },
        body: JSON.stringify({ email: recoverEmail.trim() }),
      })

      if (response.status === 202) {
        setRecoverSuccess(true)
      } else {
        setRecoverError('Ocurrió un error. Por favor intentá de nuevo.')
      }
    } catch (err) {
      setRecoverError('Error de conexión con el servidor.')
    } finally {
      setRecoverLoading(false)
    }
  }

  const closeRecoverModal = () => {
    setIsRecoverModalOpen(false)
    setRecoverEmail('')
    setRecoverError('')
    setRecoverSuccess(false)
    setRecoverLoading(false)
  }

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
              onClick={() => setIsRecoverModalOpen(true)}
            >
              ¿La olvidaste?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              placeholder="Tu contraseña"
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={
                passwordError ? 'login-password-error' : undefined
              }
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
          {passwordError && (
            <p id="login-password-error" className="text-sm text-destructive">
              {passwordError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>

      {isRecoverModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-1 hairline-border p-6 rounded-xl max-w-sm w-full mx-4 space-y-4 shadow-level-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-foreground font-mono uppercase tracking-wider">
              Recuperar contraseña
            </h3>

            {recoverSuccess ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Te enviamos un mail con las instrucciones para restablecer tu
                  contraseña. Revisá tu casilla de correo.
                </p>
                <Button onClick={closeRecoverModal} className="w-full">
                  Entendido
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRecoverSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ingresá tu email para que te enviemos las instrucciones para
                  restablecer tu contraseña.
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="recover-email"
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="recover-email"
                    type="email"
                    placeholder="vos@ejemplo.com"
                    value={recoverEmail}
                    onChange={(event) => setRecoverEmail(event.target.value)}
                    disabled={recoverLoading}
                  />
                  {recoverError && (
                    <p className="text-xs text-destructive mt-1">
                      {recoverError}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeRecoverModal}
                    disabled={recoverLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={recoverLoading}>
                    {recoverLoading ? 'Enviando…' : 'Enviar enlace'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthShell>
  )
}
