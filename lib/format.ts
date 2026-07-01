import { isCategory, type Category } from './types'

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
  COMIDA: [
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
  SUPERMERCADO: ['supermercado', 'hiper', 'mayorista'],
  FARMACIA: [
    'farmacia',
    'remedio',
    'remedios',
    'medicamento',
    'pastilla',
    'pastillas',
    'farmacity',
  ],
  TRANSPORTE: [
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
  ROPA: ['ropa', 'remera', 'pantalon', 'pantalón', 'zapatilla', 'zapatillas'],
  VIVIENDA: ['alquiler', 'expensas', 'hipoteca', 'consorcio'],
  HOGAR: ['hogar', 'limpieza', 'mueble', 'muebles', 'ferreteria', 'ferretería'],
  SERVICIOS: [
    'servicio',
    'luz',
    'agua',
    'gas',
    'internet',
    'telefono',
    'teléfono',
  ],
  ENTRETENIMIENTO: ['cine', 'salida', 'streaming', 'juego', 'juegos'],
  EDUCACION: ['colegio', 'curso', 'facultad', 'universidad', 'libro', 'libros'],
  SALUD: ['consulta', 'doctor', 'médico', 'medico', 'obra social', 'estudio'],
  CUIDADO_PERSONAL: ['peluqueria', 'peluquería', 'cosmetica', 'cosmética'],
  MASCOTAS: ['mascota', 'veterinaria', 'veterinario', 'alimento balanceado'],
  SUSCRIPCIONES: ['suscripcion', 'suscripción', 'netflix', 'spotify', 'plan'],
  REGALOS: ['regalo', 'regalos'],
  IMPUESTOS: ['impuesto', 'impuestos', 'afip', 'abl'],
  DEUDAS: ['deuda', 'cuota', 'prestamo', 'préstamo', 'tarjeta'],
  OTROS: [],
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

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export class HttpCaptureService implements CaptureService {
  async interpretText(rawText: string): Promise<Interpretation> {
    const xsrfToken = getCookie('XSRF-TOKEN')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken
    }

    const res = await fetch('/transactions/interpret', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: rawText }),
    })

    if (!res.ok) {
      throw new Error(`Failed to interpret expense: status ${res.status}`)
    }

    const data = await res.json()

    // The `/transactions/interpret` draft endpoint returns `amount` in integer
    // centavos. We divide it by 100 to convert to pesos, which is the unit
    // expected by the client-side `Interpretation` and UI draft preview.
    const amount =
      data.amount !== null && data.amount !== undefined
        ? data.amount / 100
        : null

    const category = isCategory(data.category) ? data.category : null

    const description = data.description || rawText

    return {
      description,
      amount,
      category,
    }
  }
}

export const mockCaptureService: CaptureService = new HttpCaptureService()
