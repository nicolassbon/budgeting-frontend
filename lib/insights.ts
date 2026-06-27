import { useMemo } from 'react'
import {
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
} from '@cloudscape-design/design-tokens'
import { CATEGORIES, type Category, type Expense } from './types'
import { useStore } from './store'

export const CATEGORY_COLOR: Record<Category, string> = {
  GROCERIES: colorChartsPaletteCategorical1,
  PHARMA: colorChartsPaletteCategorical2,
  AUTO: colorChartsPaletteCategorical3,
}

export interface CategoryBreakdown {
  category: Category
  total: number
  share: number // 0..1
}

export interface MonthStats {
  total: number
  count: number
  average: number
  breakdown: CategoryBreakdown[]
  topCategory: CategoryBreakdown | null
  monthLabel: string
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function getMonthExpenses(
  expenses: Expense[],
  ref = new Date(),
): Expense[] {
  return expenses.filter((e) => {
    const d = new Date(e.date)
    return (
      d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
    )
  })
}

export function computeMonthStats(
  expenses: Expense[],
  ref = new Date(),
): MonthStats {
  const monthExpenses = getMonthExpenses(expenses, ref)
  const total = monthExpenses.reduce((acc, e) => acc + e.amount, 0)
  const count = monthExpenses.length

  const breakdown: CategoryBreakdown[] = CATEGORIES.map((category) => {
    const catTotal = monthExpenses
      .filter((e) => e.category === category)
      .reduce((acc, e) => acc + e.amount, 0)
    return {
      category,
      total: catTotal,
      share: total > 0 ? catTotal / total : 0,
    }
  }).sort((a, b) => b.total - a.total)

  const topCategory = breakdown.find((b) => b.total > 0) ?? null

  return {
    total,
    count,
    average: count > 0 ? Math.round(total / count) : 0,
    breakdown,
    topCategory,
    monthLabel: `${MONTHS[ref.getMonth()]} ${ref.getFullYear()}`,
  }
}

export function useDashboardStats(): { stats: MonthStats; loading: boolean } {
  const { expenses, loading } = useStore()

  const stats = useMemo(() => {
    return computeMonthStats(expenses)
  }, [expenses])

  return { stats, loading }
}
