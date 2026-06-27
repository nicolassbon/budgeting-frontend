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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const session = localStorage.getItem('budgeting_user_session')
      if (session) {
        setUser(JSON.parse(session))
      }
    } catch (e) {
      console.error('Failed to parse session', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!email.trim() || !email.includes('@')) {
      throw new Error('Ingresá un email válido.')
    }
    if (!password) {
      throw new Error('Ingresá tu contraseña.')
    }

    let users: any[] = []
    try {
      const usersStr = localStorage.getItem('budgeting_registered_users')
      if (usersStr) {
        users = JSON.parse(usersStr)
      }
    } catch (e) {
      console.error(e)
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    )

    if (!found) {
      throw new Error('Credenciales inválidas.')
    }

    const loggedInUser: User = { id: found.id, email: found.email }
    localStorage.setItem('budgeting_user_session', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
  }

  const signup = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!email.trim() || !email.includes('@')) {
      throw new Error('Ingresá un email válido.')
    }
    if (password.length < 6) {
      throw new Error('Usá al menos 6 caracteres.')
    }

    let users: any[] = []
    try {
      const usersStr = localStorage.getItem('budgeting_registered_users')
      if (usersStr) {
        users = JSON.parse(usersStr)
      }
    } catch (e) {
      console.error(e)
    }

    const exists = users.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (exists) {
      throw new Error('El usuario ya está registrado.')
    }

    const newUser = {
      id: Math.random().toString(36).slice(2, 10),
      email: email.trim(),
      password,
    }

    users.push(newUser)
    localStorage.setItem('budgeting_registered_users', JSON.stringify(users))

    const loggedInUser: User = { id: newUser.id, email: newUser.email }
    localStorage.setItem('budgeting_user_session', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
  }

  const signOut = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    localStorage.removeItem('budgeting_user_session')
    setUser(null)
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
