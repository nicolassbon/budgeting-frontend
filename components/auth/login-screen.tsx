'use client'

import { useState } from 'react'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import Form from '@cloudscape-design/components/form'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Link from '@cloudscape-design/components/link'
import SpaceBetween from '@cloudscape-design/components/space-between'

import { AuthShell } from './auth-shell'

interface LoginScreenProps {
  onLogin: () => void
  onGoToSignup: () => void
}

export function LoginScreen({ onLogin, onGoToSignup }: LoginScreenProps) {
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
    window.setTimeout(() => onLogin(), 600)
  }

  return (
    <AuthShell
      title="Hola de nuevo"
      subtitle="Entrá para seguir registrando tus gastos."
      footer={
        <span>
          ¿Todavía no tenés cuenta?{' '}
          <Link onFollow={onGoToSignup} variant="primary">
            Creá una
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
              Iniciar sesión
            </Button>
          }
        >
          <SpaceBetween size="l">
            <FormField label="Email" errorText={emailError}>
              <Input
                type="email"
                value={email}
                placeholder="vos@ejemplo.com"
                onChange={({ detail }) => setEmail(detail.value)}
              />
            </FormField>

            <FormField
              label="Contraseña"
              errorText={passwordError}
              secondaryControl={
                <Link variant="info" onFollow={() => undefined}>
                  ¿La olvidaste?
                </Link>
              }
            >
              <Input
                type="password"
                value={password}
                placeholder="Tu contraseña"
                onChange={({ detail }) => setPassword(detail.value)}
              />
            </FormField>

            <Box>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-scaled-s, 12px)',
                  color: 'var(--color-text-body-secondary, #5f6b7a)',
                  fontSize: 'var(--font-size-body-s, 12px)',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--color-border-divider-default, #c6c6cd)',
                  }}
                />
                o continuá con
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--color-border-divider-default, #c6c6cd)',
                  }}
                />
              </div>
            </Box>

            <div
              style={{ display: 'flex', gap: 'var(--space-scaled-xs, 8px)' }}
            >
              <div style={{ flex: 1 }}>
                <Button fullWidth iconName="contact" onClick={() => undefined}>
                  Google
                </Button>
              </div>
              <div style={{ flex: 1 }}>
                <Button fullWidth iconName="contact" onClick={() => undefined}>
                  Apple
                </Button>
              </div>
            </div>
          </SpaceBetween>
        </Form>
      </form>
    </AuthShell>
  )
}
