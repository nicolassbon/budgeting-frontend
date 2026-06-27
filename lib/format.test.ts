import { describe, it, expect } from 'vitest'
import { formatARS, formatDate, interpretExpense } from './format'

describe('format utilities', () => {
  it('should format ARS amounts', () => {
    expect(formatARS(70000)).toBe('$ 70.000')
    expect(formatARS(null)).toBe('$ —')
  })

  it('should format ISO dates to dd/MM/yyyy', () => {
    // Avoid timezone offset shift issues in testing environments by using a clean date
    const d = new Date('2026-06-27T12:00:00.000Z')
    const formatted = formatDate(d.toISOString())
    expect(formatted).toBe('27/06/2026')
  })

  it('should interpret simple expense prompts', () => {
    const res = interpretExpense('70 mil en el super')
    expect(res.amount).toBe(70000)
    expect(res.category).toBe('Supermercado')
  })
})
