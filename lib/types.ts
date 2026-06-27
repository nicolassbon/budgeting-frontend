export type Category = 'Supermercado' | 'Farmacia' | 'Auto'

export const CATEGORIES: Category[] = ['Supermercado', 'Farmacia', 'Auto']

export interface Expense {
  id: string
  description: string
  amount: number // ARS, integer pesos
  category: Category
  date: string // ISO date string
}

export interface DraftExpense {
  description: string
  amount: number | null
  category: Category | null
}
