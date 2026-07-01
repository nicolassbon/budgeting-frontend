import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  backendWeeklyBudgetRepository,
  createWeeklyBudgetRepository,
  localStorageWeeklyBudgetRepository,
  readWeeklyBudget,
  useWeeklyBudget,
  weeklyBudgetKey,
  writeWeeklyBudget,
} from './weekly-budget'

describe('weekly budget persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
  })

  it('namespaces the storage key by user email', () => {
    expect(weeklyBudgetKey('ana@example.com')).toBe(
      'budgeting_weekly_budget_ana@example.com',
    )
    expect(weeklyBudgetKey('nico@example.com')).toBe(
      'budgeting_weekly_budget_nico@example.com',
    )
  })

  it('writes and reads the JSON budget shape for the active user', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))

    writeWeeklyBudget('ana@example.com', 45000)

    expect(readWeeklyBudget('ana@example.com')).toEqual({
      amount: 45000,
      updatedAt: '2026-07-01T12:00:00.000Z',
    })
    expect(readWeeklyBudget('nico@example.com')).toBeNull()

    vi.useRealTimers()
  })

  it('returns null and warns when stored JSON is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(weeklyBudgetKey('ana@example.com'), '{bad-json')

    expect(readWeeklyBudget('ana@example.com')).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      'Invalid weekly budget stored in localStorage:',
      expect.any(SyntaxError),
    )
  })

  it('supports hook write and clear round-trip without touching another user', () => {
    vi.stubEnv('NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET', 'false')
    writeWeeklyBudget('other@example.com', 90000)

    const { result } = renderHook(() => useWeeklyBudget('ana@example.com'))

    expect(result.current.budget).toBeNull()

    act(() => result.current.setAmount(30000))

    expect(result.current.budget?.amount).toBe(30000)
    expect(readWeeklyBudget('other@example.com')?.amount).toBe(90000)

    act(() => result.current.clear())

    expect(result.current.budget).toBeNull()
    expect(readWeeklyBudget('ana@example.com')).toBeNull()
    expect(readWeeklyBudget('other@example.com')?.amount).toBe(90000)
  })

  it('keeps localStorage available as an explicit degraded fallback', async () => {
    const repository = createWeeklyBudgetRepository('false')

    await repository.write('ana@example.com', 0)

    expect(repository).toBe(localStorageWeeklyBudgetRepository)
    expect(readWeeklyBudget('ana@example.com')?.amount).toBe(0)
  })

  it('selects the backend repository by default for delivery', () => {
    expect(createWeeklyBudgetRepository(undefined)).toBe(
      backendWeeklyBudgetRepository,
    )
  })

  it('selects the backend repository unless the fallback flag is explicitly disabled', () => {
    expect(createWeeklyBudgetRepository('true')).toBe(
      backendWeeklyBudgetRepository,
    )
    expect(createWeeklyBudgetRepository('TRUE')).toBe(
      backendWeeklyBudgetRepository,
    )
    expect(createWeeklyBudgetRepository('false')).toBe(
      localStorageWeeklyBudgetRepository,
    )
  })

  it('reads null from the backend weekly budget contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ amount: null }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      backendWeeklyBudgetRepository.read('ana@example.com'),
    ).resolves.toBeNull()

    expect(fetchMock).toHaveBeenCalledWith('/auth/me/weekly-budget')
  })

  it('writes zero and clears null through the backend contract with CSRF', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ amount: null }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      backendWeeklyBudgetRepository.write('ana@example.com', 0),
    ).resolves.toMatchObject({ amount: 0 })
    await expect(
      backendWeeklyBudgetRepository.clear('ana@example.com'),
    ).resolves.toBeNull()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth/me/weekly-budget', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'csrf-token',
      },
      body: JSON.stringify({ amount: 0 }),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/auth/me/weekly-budget', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'csrf-token',
      },
      body: JSON.stringify({ amount: null }),
    })
  })
})
