export type Category =
  | 'COMIDA'
  | 'SUPERMERCADO'
  | 'FARMACIA'
  | 'ROPA'
  | 'TRANSPORTE'
  | 'VIVIENDA'
  | 'HOGAR'
  | 'SERVICIOS'
  | 'ENTRETENIMIENTO'
  | 'EDUCACION'
  | 'SALUD'
  | 'CUIDADO_PERSONAL'
  | 'MASCOTAS'
  | 'SUSCRIPCIONES'
  | 'REGALOS'
  | 'IMPUESTOS'
  | 'DEUDAS'
  | 'OTROS'

export const CATEGORIES: Category[] = [
  'COMIDA',
  'SUPERMERCADO',
  'FARMACIA',
  'ROPA',
  'TRANSPORTE',
  'VIVIENDA',
  'HOGAR',
  'SERVICIOS',
  'ENTRETENIMIENTO',
  'EDUCACION',
  'SALUD',
  'CUIDADO_PERSONAL',
  'MASCOTAS',
  'SUSCRIPCIONES',
  'REGALOS',
  'IMPUESTOS',
  'DEUDAS',
  'OTROS',
]

export const CATEGORY_TRANSLATIONS: Record<Category, string> = {
  COMIDA: 'Comida',
  SUPERMERCADO: 'Supermercado',
  FARMACIA: 'Farmacia',
  ROPA: 'Ropa',
  TRANSPORTE: 'Transporte',
  VIVIENDA: 'Vivienda',
  HOGAR: 'Hogar',
  SERVICIOS: 'Servicios',
  ENTRETENIMIENTO: 'Entretenimiento',
  EDUCACION: 'Educación',
  SALUD: 'Salud',
  CUIDADO_PERSONAL: 'Cuidado personal',
  MASCOTAS: 'Mascotas',
  SUSCRIPCIONES: 'Suscripciones',
  REGALOS: 'Regalos',
  IMPUESTOS: 'Impuestos',
  DEUDAS: 'Deudas',
  OTROS: 'Otros',
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.includes(value as Category)
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
