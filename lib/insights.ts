import { useEffect, useState } from 'react'
import { CATEGORIES, isCategory, type Category, type Expense } from './types'
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

interface DashboardCategorySummary {
  category: string
  totalAmountCents: number
  totalAmount: number
  transactionCount: number
}

interface DashboardSummary {
  period?: {
    from?: string
    to?: string
  }
  totalAmountCents?: number
  totalAmount?: number
  transactionCount?: number
  topCategories?: DashboardCategorySummary[]
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

function emptyMonthStats(ref = new Date()): MonthStats {
  return computeMonthStats([], ref)
}

function getMonthLabelFromPeriod(from?: string): string {
  if (!from) {
    const now = new Date()
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  }

  const [yearRaw, monthRaw] = from.split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1

  if (Number.isNaN(year) || Number.isNaN(monthIndex) || !MONTHS[monthIndex]) {
    const now = new Date()
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  }

  return `${MONTHS[monthIndex]} ${year}`
}

export function mapDashboardSummaryToMonthStats(
  summary: DashboardSummary,
): MonthStats {
  const total = (summary.totalAmountCents ?? 0) / 100
  const count = summary.transactionCount ?? 0
  const totalsByCategory = new Map<Category, number>()

  for (const item of summary.topCategories ?? []) {
    if (isCategory(item.category)) {
      totalsByCategory.set(item.category, item.totalAmountCents / 100)
    }
  }

  const breakdown: CategoryBreakdown[] = CATEGORIES.map((category) => {
    const categoryTotal = totalsByCategory.get(category) ?? 0
    return {
      category,
      total: categoryTotal,
      share: total > 0 ? categoryTotal / total : 0,
    }
  }).sort((a, b) => b.total - a.total)

  return {
    total,
    count,
    average: count > 0 ? Number((total / count).toFixed(2)) : 0,
    breakdown,
    topCategory: breakdown.find((item) => item.total > 0) ?? null,
    monthLabel: getMonthLabelFromPeriod(summary.period?.from),
  }
}
export function getTimeZone(): string {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (timeZone) {
          return timeZone
        }
      } catch (innerError) {
        console.warn(
          'Failed to resolve timezone options from Intl.DateTimeFormat:',
          innerError,
        )
      }
    }
  } catch (outerError) {
    console.warn(
      'Intl or Intl.DateTimeFormat is not accessible or threw error:',
      outerError,
    )
  }
  return 'America/Argentina/Buenos_Aires'
}

export function useDashboardStats(): { stats: MonthStats; loading: boolean } {
  const { loading: storeLoading, expenseMutationsVersion } = useStore()
  const [stats, setStats] = useState<MonthStats>(() => emptyMonthStats())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    fetch('/dashboard/spending', {
      headers: {
        'Time-Zone': getTimeZone(),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to fetch dashboard summary from backend: status ${res.status}`,
          )
        }

        return res.json()
      })
      .then((data: DashboardSummary) => {
        if (!active) return
        setStats(mapDashboardSummaryToMonthStats(data))
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        if (!active) return
        setStats(emptyMonthStats())
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [expenseMutationsVersion])

  return { stats, loading: loading || storeLoading }
}
