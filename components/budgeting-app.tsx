'use client'

import { useState } from 'react'
import { StoreProvider } from '@/lib/store'
import { LoginScreen } from '@/components/auth/login-screen'
import { SignupScreen } from '@/components/auth/signup-screen'
import { AppFrame } from '@/components/app-frame'

type AuthView = 'login' | 'signup'

export default function BudgetingApp() {
  const [authed, setAuthed] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')

  if (!authed) {
    if (authView === 'signup') {
      return (
        <SignupScreen
          onSignup={() => setAuthed(true)}
          onGoToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <LoginScreen
        onLogin={() => setAuthed(true)}
        onGoToSignup={() => setAuthView('signup')}
      />
    )
  }

  return (
    <StoreProvider>
      <AppFrame onSignOut={() => setAuthed(false)} />
    </StoreProvider>
  )
}
