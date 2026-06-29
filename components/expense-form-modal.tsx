'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES, type Category, translateCategory } from '@/lib/types'

export interface ExpenseFormValues {
  description: string
  amount: number
  category: Category
}

interface ExpenseFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  initial?: {
    description?: string
    amount?: number | null
    category?: Category | null
  }
  onDismiss: () => void
  onSubmit: (values: ExpenseFormValues) => void
}

export function ExpenseFormModal({
  visible,
  mode,
  initial,
  onDismiss,
  onSubmit,
}: ExpenseFormModalProps) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(
    initial?.amount !== null && initial?.amount !== undefined
      ? String(initial.amount)
      : '',
  )
  const [category, setCategory] = useState<Category | ''>(
    initial?.category ?? '',
  )
  const [errors, setErrors] = useState<{
    description?: string
    amount?: string
    category?: string
  }>({})

  useEffect(() => {
    setDescription(initial?.description ?? '')
    setAmount(
      initial?.amount !== null && initial?.amount !== undefined
        ? String(initial.amount)
        : '',
    )
    setCategory(initial?.category ?? '')
    setErrors({})
  }, [initial, visible])

  useEffect(() => {
    if (!visible) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, onDismiss])

  function submit() {
    const next: typeof errors = {}
    const parsedAmount = Number(amount)

    if (!description.trim()) next.description = 'Contanos en qué fue el gasto.'
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      next.amount = 'Ingresá un monto mayor a 0.'
    }
    if (!category) next.category = 'Elegí una categoría.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      description: description.trim(),
      amount: Math.round(parsedAmount),
      category: category as Category,
    })
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-level-5"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="expense-modal-title"
              className="text-xl font-sans font-semibold tracking-tight"
            >
              {mode === 'edit' ? 'Editar gasto' : 'Cargar gasto a mano'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Revisá los datos antes de confirmar.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Cerrar
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="expense-description"
              className="text-sm font-medium"
            >
              Descripción
            </label>
            <Input
              id="expense-description"
              value={description}
              placeholder="Ej: Compra en el super"
              onChange={(event) => setDescription(event.target.value)}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="expense-amount" className="text-sm font-medium">
              Monto
            </label>
            <Input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              placeholder="Ej: 70000"
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              En pesos argentinos (ARS).
            </p>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="expense-category" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="expense-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as Category | '')
              }
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent"
            >
              <option value="">Elegí una categoría</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {translateCategory(item)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onDismiss}>
            Cancelar
          </Button>
          <Button onClick={submit}>
            {mode === 'edit' ? 'Guardar cambios' : 'Guardar gasto'}
          </Button>
        </div>
      </div>
    </div>
  )
}
