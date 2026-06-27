export type Category = 'GROCERIES' | 'PHARMA' | 'AUTO'

export const CATEGORIES: Category[] = ['GROCERIES', 'PHARMA', 'AUTO']

export const CATEGORY_TRANSLATIONS: Record<Category, string> = {
  GROCERIES: 'Supermercado',
  PHARMA: 'Farmacia',
  AUTO: 'Auto',
}

export function translateCategory(category: Category): string {
  return CATEGORY_TRANSLATIONS[category] || category
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: Category
  date: string
}

export interface DraftExpense {
  description: string
  amount: number | null
  category: Category | null
}
