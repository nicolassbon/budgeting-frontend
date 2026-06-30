import { useMemo } from 'react'
import { CATEGORIES, type Category, type Expense } from './types'
import { useStore } from './store'

export const CATEGORY_COLOR: Record<Category, string> = {
  COMIDA: '#5e6ad2',
  SUPERMERCADO: '#4f46e5',
  FARMACIA: '#828fff',
  ROPA: '#db2777',
  TRANSPORTE: '#7a7fad',
  VIVIENDA: '#0f766e',
  HOGAR: '#0f766e',
  SERVICIOS: '#0891b2',
  ENTRETENIMIENTO: '#7c3aed',
  EDUCACION: '#2563eb',
  SALUD: '#dc2626',
  CUIDADO_PERSONAL: '#d946ef',
  MASCOTAS: '#f59e0b',
  SUSCRIPCIONES: '#8b5cf6',
  REGALOS: '#ec4899',
  IMPUESTOS: '#ea580c',
  DEUDAS: '#b91c1c',
  OTROS: '#6b7280',
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
