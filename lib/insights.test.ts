import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeComparison,
  computeMonthStats,
  getMonthExpenses,
  getWeekExpenses,
  mapDashboardSummaryToMonthStats,
  useDashboardStats,
} from './insights'
import type { Expense } from './types'

const mockFetch = vi.fn()
const mockStoreState = {
  expenses: [] as Expense[],
  loading: false,
  expenseMutationsVersion: 0,
}

vi.mock('./store', () => ({
  useStore: () => mockStoreState,
}))

describe('insights utilities', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      description: 'Supermercado Coto',
      amount: 10000,
      category: 'COMIDA',
      date: '2026-06-15T10:00:00.000Z',
    },
    {
      id: '2',
      description: 'Farmacia Remedios',
      amount: 5000,
      category: 'FARMACIA',
      date: '2026-06-16T12:00:00.000Z',
    },
    {
      id: '3',
      description: 'Carga Nafta YPF',
      amount: 15000,
      category: 'TRANSPORTE',
      date: '2026-06-17T15:30:00.000Z',
    },
    {
      id: '4',
      description: 'Otro mes',
      amount: 8000,
      category: 'COMIDA',
      date: '2026-05-15T10:00:00.000Z',
    },
  ]

  const refDate = new Date('2026-06-27T12:00:00.000Z')

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    mockStoreState.expenses = []
    mockStoreState.loading = false
    mockStoreState.expenseMutationsVersion = 0

    // Default deterministic fallback timezone spy for existing tests
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'America/Argentina/Buenos_Aires',
      locale: 'es-AR',
      calendar: 'gregory',
      numberingSystem: 'latn',
    })
  })

  it('should filter expenses to only the current month/year', () => {
    const currentMonthExpenses = getMonthExpenses(mockExpenses, refDate)
    expect(currentMonthExpenses).toHaveLength(3)
    expect(currentMonthExpenses.map((e) => e.id)).toEqual(['1', '2', '3'])
  })

  it('should compute correct summary statistics for the month', () => {
    const stats = computeMonthStats(mockExpenses, refDate)
    expect(stats.total).toBe(30000)
    expect(stats.count).toBe(3)
    expect(stats.average).toBe(10000)
    expect(stats.monthLabel).toBe('junio 2026')
  })

  it('should compute correct category breakdowns and sort them descending by total', () => {
    const stats = computeMonthStats(mockExpenses, refDate)
    const nonZeroBreakdown = stats.breakdown.filter((item) => item.total > 0)

    expect(nonZeroBreakdown).toHaveLength(3)
    expect(nonZeroBreakdown[0].category).toBe('TRANSPORTE')
    expect(nonZeroBreakdown[0].total).toBe(15000)
    expect(nonZeroBreakdown[0].share).toBe(0.5)
    expect(nonZeroBreakdown[1].category).toBe('COMIDA')
    expect(nonZeroBreakdown[1].total).toBe(10000)
    expect(nonZeroBreakdown[1].share).toBeCloseTo(0.333, 2)
    expect(nonZeroBreakdown[2].category).toBe('FARMACIA')
    expect(nonZeroBreakdown[2].total).toBe(5000)
    expect(nonZeroBreakdown[2].share).toBeCloseTo(0.167, 2)
    expect(stats.topCategory).not.toBeNull()
    expect(stats.topCategory!.category).toBe('TRANSPORTE')
  })

  it('computes month-over-month comparison when both months have expenses', () => {
    const comparison = computeComparison(
      [
        ...mockExpenses,
        {
          id: '5',
          description: 'Current month extra',
          amount: 2000,
          category: 'SERVICIOS',
          date: '2026-06-18T10:00:00.000Z',
        },
      ],
      refDate,
    )

    expect(comparison.currentMonthTotal).toBe(32000)
    expect(comparison.previousMonthTotal).toBe(8000)
    expect(comparison.absoluteDelta).toBe(24000)
    expect(comparison.percentageDelta).toBe(300)
    expect(comparison.direction).toBe('current-higher')
    expect(comparison.currentMonthLabel).toBe('junio 2026')
    expect(comparison.previousMonthLabel).toBe('mayo 2026')
    expect(comparison.hasPreviousData).toBe(true)
  })

  it('returns a null percentage when the previous month has no movements', () => {
    const comparison = computeComparison(
      mockExpenses.filter((expense) => expense.id !== '4'),
      refDate,
    )

    expect(comparison.currentMonthTotal).toBe(30000)
    expect(comparison.previousMonthTotal).toBe(0)
    expect(comparison.absoluteDelta).toBe(30000)
    expect(comparison.percentageDelta).toBeNull()
    expect(comparison.direction).toBe('current-higher')
    expect(comparison.hasPreviousData).toBe(false)
  })

  it('classifies equal month totals without a percentage delta', () => {
    const comparison = computeComparison(
      [
        {
          id: 'current',
          description: 'Current month',
          amount: 12000,
          category: 'COMIDA',
          date: '2026-06-10T10:00:00.000Z',
        },
        {
          id: 'previous',
          description: 'Previous month',
          amount: 12000,
          category: 'COMIDA',
          date: '2026-05-10T10:00:00.000Z',
        },
      ],
      refDate,
    )

    expect(comparison.currentMonthTotal).toBe(12000)
    expect(comparison.previousMonthTotal).toBe(12000)
    expect(comparison.absoluteDelta).toBe(0)
    expect(comparison.percentageDelta).toBe(0)
    expect(comparison.direction).toBe('equal')
    expect(comparison.hasPreviousData).toBe(true)
  })

  it('filters the current Monday-start local week', () => {
    const weekExpenses = getWeekExpenses(
      [
        {
          id: 'sunday-before',
          description: 'Sunday before',
          amount: 1,
          category: 'COMIDA',
          date: '2026-06-21T12:00:00',
        },
        {
          id: 'monday-start',
          description: 'Monday start',
          amount: 2,
          category: 'COMIDA',
          date: '2026-06-22T00:00:00',
        },
        {
          id: 'sunday-end',
          description: 'Sunday end',
          amount: 3,
          category: 'COMIDA',
          date: '2026-06-28T23:59:59',
        },
        {
          id: 'next-monday',
          description: 'Next Monday',
          amount: 4,
          category: 'COMIDA',
          date: '2026-06-29T00:00:00',
        },
      ],
      new Date('2026-06-25T12:00:00.000Z'),
    )

    expect(weekExpenses.map((expense) => expense.id)).toEqual([
      'monday-start',
      'sunday-end',
    ])
  })

  it('should map dashboard backend summary using cent values and backend period', () => {
    const stats = mapDashboardSummaryToMonthStats({
      period: { from: '2026-06-01', to: '2026-07-01' },
      totalAmountCents: 704050,
      totalAmount: 7040.5,
      transactionCount: 3,
      topCategories: [
        {
          category: 'TRANSPORTE',
          totalAmountCents: 500000,
          totalAmount: 5000,
          transactionCount: 1,
        },
        {
          category: 'SERVICIOS',
          totalAmountCents: 189000,
          totalAmount: 1890,
          transactionCount: 1,
        },
        {
          category: 'COMIDA',
          totalAmountCents: 15050,
          totalAmount: 150.5,
          transactionCount: 1,
        },
      ],
    })

    expect(stats.total).toBe(7040.5)
    expect(stats.count).toBe(3)
    expect(stats.average).toBe(2346.83)
    expect(stats.monthLabel).toBe('junio 2026')
    expect(stats.topCategory).toEqual({
      category: 'TRANSPORTE',
      total: 5000,
      share: expect.closeTo(5000 / 7040.5, 5),
    })
    expect(
      stats.breakdown.find((item) => item.category === 'COMIDA')?.total,
    ).toBe(150.5)
  })

  it('should fetch dashboard stats from GET /dashboard/spending', async () => {
    mockStoreState.expenses = [
      {
        id: '1',
        description: 'Leche',
        amount: 150.5,
        category: 'COMIDA',
        date: '2026-06-20T10:00:00.000Z',
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        period: { from: '2026-06-01', to: '2026-07-01' },
        totalAmountCents: 15050,
        totalAmount: 150.5,
        transactionCount: 1,
        topCategories: [
          {
            category: 'COMIDA',
            totalAmountCents: 15050,
            totalAmount: 150.5,
            transactionCount: 1,
          },
        ],
      }),
    })

    const { result } = renderHook(() => useDashboardStats())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledWith('/dashboard/spending', {
      headers: {
        'Time-Zone': 'America/Argentina/Buenos_Aires',
      },
    })
    expect(result.current.stats.total).toBe(150.5)
    expect(result.current.stats.count).toBe(1)
    expect(result.current.stats.monthLabel).toBe('junio 2026')
    expect(result.current.stats.topCategory?.category).toBe('COMIDA')
  })

  it('should refetch dashboard stats when the store invalidation version changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          period: { from: '2026-06-01', to: '2026-07-01' },
          totalAmountCents: 15050,
          transactionCount: 1,
          topCategories: [
            {
              category: 'COMIDA',
              totalAmountCents: 15050,
              totalAmount: 150.5,
              transactionCount: 1,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          period: { from: '2026-06-01', to: '2026-07-01' },
          totalAmountCents: 65050,
          transactionCount: 2,
          topCategories: [
            {
              category: 'COMIDA',
              totalAmountCents: 65050,
              totalAmount: 650.5,
              transactionCount: 2,
            },
          ],
        }),
      })

    const { result, rerender } = renderHook(() => useDashboardStats())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenNthCalledWith(1, '/dashboard/spending', {
      headers: {
        'Time-Zone': 'America/Argentina/Buenos_Aires',
      },
    })

    mockStoreState.expenseMutationsVersion = 1

    rerender()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    expect(mockFetch).toHaveBeenNthCalledWith(2, '/dashboard/spending', {
      headers: {
        'Time-Zone': 'America/Argentina/Buenos_Aires',
      },
    })

    expect(result.current.stats.total).toBe(650.5)
    expect(result.current.stats.count).toBe(2)
  })

  describe('timezone header integration', () => {
    it('should send the resolved timezone header on fetch when resolution is successful', async () => {
      vi.spyOn(
        Intl.DateTimeFormat.prototype,
        'resolvedOptions',
      ).mockReturnValue({
        timeZone: 'Europe/Paris',
        locale: 'fr-FR',
        calendar: 'gregory',
        numberingSystem: 'latn',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDashboardStats())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/dashboard/spending', {
        headers: {
          'Time-Zone': 'Europe/Paris',
        },
      })
    })

    it('should fallback to America/Argentina/Buenos_Aires when resolved timezone is undefined or empty', async () => {
      vi.spyOn(
        Intl.DateTimeFormat.prototype,
        'resolvedOptions',
      ).mockReturnValue({
        timeZone: undefined as any,
        locale: 'es-AR',
        calendar: 'gregory',
        numberingSystem: 'latn',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDashboardStats())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/dashboard/spending', {
        headers: {
          'Time-Zone': 'America/Argentina/Buenos_Aires',
        },
      })
    })

    it('should fallback to America/Argentina/Buenos_Aires when Intl is not supported', async () => {
      vi.stubGlobal('Intl', undefined)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDashboardStats())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/dashboard/spending', {
        headers: {
          'Time-Zone': 'America/Argentina/Buenos_Aires',
        },
      })
    })
  })
})
