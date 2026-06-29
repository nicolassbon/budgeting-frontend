'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function mapBackendUser(data: { id: number; email: string }): User {
  return {
    id: String(data.id),
    email: data.email,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      try {
        const response = await fetch('/auth/me')
        if (response.status === 200) {
          const data = await response.json()
          setUser(mapBackendUser(data))
        } else {
          setUser(null)
        }
      } catch (e) {
        console.error('Failed to parse session', e)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  const login = async (email: string, password: string) => {
    if (!email.trim() || !email.includes('@')) {
      throw new Error('Ingresá un email válido.')
    }
    if (!password) {
      throw new Error('Ingresá tu contraseña.')
    }

    const xsrf = getCookie('XSRF-TOKEN')
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf || '',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    if (!response.ok) {
      throw new Error('Credenciales inválidas.')
    }

    const data = await response.json()
    setUser(mapBackendUser(data))
  }

  const signup = async (email: string, password: string) => {
    if (!email.trim() || !email.includes('@')) {
      throw new Error('Ingresá un email válido.')
    }
    if (password.length < 6) {
      throw new Error('Usá al menos 6 caracteres.')
    }

    const xsrf = getCookie('XSRF-TOKEN')
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf || '',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    if (!response.ok) {
      throw new Error('El usuario ya está registrado.')
    }

    const data = await response.json()
    setUser(mapBackendUser(data))
  }

  const signOut = async () => {
    try {
      const xsrf = getCookie('XSRF-TOKEN')
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': xsrf || '',
        },
      })
    } catch (e) {
      console.error('Failed to log out', e)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
