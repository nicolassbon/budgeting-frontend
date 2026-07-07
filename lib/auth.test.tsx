import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth'
import React from 'react'

describe('auth hook', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=; Max-Age=0'
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should start with null user if no session is active', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          status: 401,
          ok: false,
          json: () => Promise.resolve({}),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for the async mount session check to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/auth/me')
  })

  it('should recover user session on mount if logged in', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ id: 123, email: 'test@budgeting.app' }),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Initially it should be loading
    expect(result.current.loading).toBe(true)

    // Wait for loading to be false
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual({
      id: '123',
      email: 'test@budgeting.app',
    })
  })

  it('should login successfully and set user', async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=mocked-xsrf-token'
    }

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          status: 401,
          ok: false,
        })
      }
      if (url === '/auth/login') {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ id: 456, email: 'test@budgeting.app' }),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.user).toBeNull()

    await act(async () => {
      await result.current.login('test@budgeting.app', 'password123')
    })

    expect(result.current.user).toEqual({
      id: '456',
      email: 'test@budgeting.app',
    })
    expect(mockFetch).toHaveBeenLastCalledWith('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'mocked-xsrf-token',
      },
      body: JSON.stringify({
        email: 'test@budgeting.app',
        password: 'password123',
      }),
    })
  })

  it('should fail login on invalid validations and non-200 responses', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({ status: 401, ok: false })
      }
      if (url === '/auth/login') {
        return Promise.resolve({ status: 401, ok: false })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Client-side validations
    await expect(
      act(async () => {
        await result.current.login('invalid-email', 'password')
      }),
    ).rejects.toThrow('Ingresá un email válido.')

    await expect(
      act(async () => {
        await result.current.login('test@budgeting.app', '')
      }),
    ).rejects.toThrow('Ingresá tu contraseña.')

    // Server failure
    await expect(
      act(async () => {
        await result.current.login('test@budgeting.app', 'wrongpassword')
      }),
    ).rejects.toThrow('Credenciales inválidas.')
  })

  it('should signup successfully and set user', async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=signup-xsrf-token'
    }

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({ status: 401, ok: false })
      }
      if (url === '/auth/register') {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ id: 789, email: 'new@budgeting.app' }),
        })
      }
      if (url === '/auth/login') {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ id: 789, email: 'new@budgeting.app' }),
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.signup('new@budgeting.app', 'supersecret')
    })

    expect(result.current.user).toEqual({
      id: '789',
      email: 'new@budgeting.app',
    })
    expect(mockFetch).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'signup-xsrf-token',
      },
      body: JSON.stringify({
        email: 'new@budgeting.app',
        password: 'supersecret',
      }),
    })
    expect(mockFetch).toHaveBeenLastCalledWith('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'signup-xsrf-token',
      },
      body: JSON.stringify({
        email: 'new@budgeting.app',
        password: 'supersecret',
      }),
    })
  })

  it('should fail signup on invalid validations and non-200 responses', async () => {
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({ status: 401, ok: false })
      }
      if (url === '/auth/register') {
        return Promise.resolve({ status: 409, ok: false })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Client-side validations
    await expect(
      act(async () => {
        await result.current.signup('invalid-email', 'password')
      }),
    ).rejects.toThrow('Ingresá un email válido.')

    await expect(
      act(async () => {
        await result.current.signup('test@budgeting.app', '123')
      }),
    ).rejects.toThrow('Usá al menos 6 caracteres.')

    // Server failure
    await expect(
      act(async () => {
        await result.current.signup('test@budgeting.app', 'password')
      }),
    ).rejects.toThrow('El usuario ya está registrado.')
  })

  it('should logout and clear user state', async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=logout-xsrf-token'
    }

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ id: 123, email: 'test@budgeting.app' }),
        })
      }
      if (url === '/auth/logout') {
        return Promise.resolve({
          status: 200,
          ok: true,
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })
    vi.stubGlobal('fetch', mockFetch)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.user).toEqual({
      id: '123',
      email: 'test@budgeting.app',
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(mockFetch).toHaveBeenLastCalledWith('/auth/logout', {
      method: 'POST',
      headers: {
        'X-XSRF-TOKEN': 'logout-xsrf-token',
      },
    })
  })
})
