import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth'
import React from 'react'

describe('auth hook', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should start with null user', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
  })

  it('should support signup and then login', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signup('test@budgeting.app', 'supersecret')
    })

    expect(result.current.user?.email).toBe('test@budgeting.app')

    act(() => {
      result.current.signOut()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
    })
    expect(result.current.user).toBeNull()

    await act(async () => {
      await result.current.login('test@budgeting.app', 'supersecret')
    })
    expect(result.current.user?.email).toBe('test@budgeting.app')
  })

  it('should fail signup on password too short', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.signup('test@budgeting.app', '123')
      }),
    ).rejects.toThrow('Usá al menos 6 caracteres.')
  })

  it('should fail login on incorrect credentials', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('unknown@budgeting.app', 'wrongpassword')
      }),
    ).rejects.toThrow('Credenciales inválidas.')
  })
})
