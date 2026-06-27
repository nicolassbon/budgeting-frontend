'use client'

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { StoreProvider } from '@/lib/store'
import { LoginScreen } from '@/components/auth/login-screen'
import { SignupScreen } from '@/components/auth/signup-screen'
import { AppFrame } from '@/components/app-frame'

function BudgetingAppContent() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  if (loading) {
    return null
  }

  if (!user) {
    if (authView === 'signup') {
      return (
        <SignupScreen
          onSignup={() => {}}
          onGoToLogin={() => setAuthView('login')}
        />
      )
    }
    return (
      <LoginScreen
        onLogin={() => {}}
        onGoToSignup={() => setAuthView('signup')}
      />
    )
  }

  return (
    <StoreProvider>
      <AppFrame />
    </StoreProvider>
  )
}

export default function BudgetingApp() {
  return (
    <AuthProvider>
      <BudgetingAppContent />
    </AuthProvider>
  )
}
