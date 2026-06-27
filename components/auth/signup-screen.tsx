'use client'

import { useState } from 'react'
import Button from '@cloudscape-design/components/button'
import Form from '@cloudscape-design/components/form'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Link from '@cloudscape-design/components/link'
import SpaceBetween from '@cloudscape-design/components/space-between'

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
      .catch((err: any) => {
        setErrors({ password: err.message || 'Error al crear cuenta.' })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Empezá a registrar tus gastos en segundos."
      footer={
        <span>
          ¿Ya tenés cuenta?{' '}
          <Link onFollow={onGoToLogin} variant="primary">
            Iniciá sesión
          </Link>
        </span>
      }
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <Form
          actions={
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={submit}
            >
              Crear cuenta
            </Button>
          }
        >
          <SpaceBetween size="l">
            <FormField label="Email" errorText={errors.email}>
              <Input
                type="email"
                value={email}
                placeholder="vos@ejemplo.com"
                onChange={({ detail }) => setEmail(detail.value)}
              />
            </FormField>

            <FormField
              label="Contraseña"
              description="Mínimo 6 caracteres."
              errorText={errors.password}
            >
              <Input
                type="password"
                value={password}
                placeholder="Creá una contraseña"
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>

            <FormField label="Repetir contraseña" errorText={errors.confirm}>
              <Input
                type="password"
                value={confirm}
                placeholder="Repetí la contraseña"
                onChange={({ detail }) => setConfirm(detail.value)}
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </form>
    </AuthShell>
  )
}
