import type { Category } from './types'

// ARS formatting
export function formatARS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '$ —'
  }
  return `$ ${Math.round(amount).toLocaleString('es-AR')}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Best-effort local interpretation of a free-text or dictated expense.
// The backend does not return a structured draft, so the UI parses what it can
// and always lets the user correct the result before saving.
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  GROCERIES: [
    'super',
    'supermercado',
    'almacen',
    'almacén',
    'verduleria',
    'verdulería',
    'comida',
    'mercado',
    'coto',
    'carrefour',
    'dia',
    'chino',
  ],
  PHARMA: [
    'farmacia',
    'remedio',
    'remedios',
    'medicamento',
    'pastilla',
    'pastillas',
    'farmacity',
  ],
  AUTO: [
    'auto',
    'nafta',
    'combustible',
    'estacion',
    'estación',
    'ypf',
    'shell',
    'peaje',
    'cochera',
    'gomeria',
    'gomería',
    'mecanico',
    'mecánico',
  ],
}

export interface Interpretation {
  description: string
  amount: number | null
  category: Category | null
}

export interface CaptureService {
  interpretText(rawText: string): Promise<Interpretation>
}

export function interpretExpense(rawText: string): Interpretation {
  const text = rawText.trim()
  const lower = text.toLowerCase()

  let amount: number | null = null

  const milMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(mil|k)\b/)
  if (milMatch) {
    const base = parseFloat(milMatch[1].replace(',', '.'))
    if (!Number.isNaN(base)) amount = Math.round(base * 1000)
  }

  if (amount === null) {
    const numMatch = lower.match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/)
    if (numMatch) {
      const intPart = numMatch[1].replace(/\./g, '')
      const parsed = parseInt(intPart, 10)
      if (!Number.isNaN(parsed)) amount = parsed
    }
  }

  let category: Category | null = null
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as Category[]) {
    if (CATEGORY_KEYWORDS[cat].some((kw) => lower.includes(kw))) {
      category = cat
      break
    }
  }

  return {
    description: text,
    amount,
    category,
  }
}

export const mockCaptureService: CaptureService = {
  async interpretText(rawText: string): Promise<Interpretation> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return interpretExpense(rawText)
  },
}
