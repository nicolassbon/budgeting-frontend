import { describe, it, expect } from 'vitest'
import { computeMonthStats, getMonthExpenses } from './insights'
import type { Expense } from './types'

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
      date: '2026-05-15T10:00:00.000Z', // May, not June
    },
  ]

  const refDate = new Date('2026-06-27T12:00:00.000Z')

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
})
