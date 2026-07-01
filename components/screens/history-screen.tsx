'use client'

import { useMemo, useState } from 'react'
import { Trash2, Filter } from 'lucide-react'

import {
  ExpenseFormModal,
  type ExpenseFormValues,
} from '@/components/expense-form-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatARS, formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import {
  CATEGORIES,
  type Category,
  type Expense,
  translateCategory,
} from '@/lib/types'
import { cn } from '@/lib/utils'

function getCategoryStyle(category: Category): string {
  switch (category) {
    case 'COMIDA':
    case 'SUPERMERCADO':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    case 'FARMACIA':
    case 'SALUD':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    case 'TRANSPORTE':
    case 'SERVICIOS':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    default:
      return 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  }
}

interface HistoryScreenProps {
  onUpdated: () => void
}

export function HistoryScreen({ onUpdated }: HistoryScreenProps) {
  const { expenses, updateExpense } = useStore()
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const items = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date),
    )

    if (categoryFilter === 'all') return sorted
    return sorted.filter((expense) => expense.category === categoryFilter)
  }, [expenses, categoryFilter])

  function closeEditor() {
    setEditing(null)
    setEditError(null)
    setSavingEdit(false)
  }

  async function handleSubmit(values: ExpenseFormValues) {
    if (!editing) return
    setSavingEdit(true)
    setEditError(null)

    try {
      await updateExpense(editing.id, values)
      closeEditor()
      onUpdated()
    } catch (error) {
      console.error(error)
      setEditError('No pudimos guardar los cambios. Probá de nuevo.')
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight">Historial.</h2>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest text-[10px]">
            {items.length} registros detectados en el sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-surface-1 hairline-border rounded-md px-3 py-1.5 shadow-sm">
            <Filter
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor="category-filter" className="sr-only">
              Filtrar por categoría
            </label>
            <select
              id="category-filter"
              aria-label="Filtrar por categoría"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as Category | 'all')
              }
              className="bg-transparent border-none outline-none text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {translateCategory(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-1 hairline-border rounded-xl overflow-hidden shadow-level-3">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
                Fecha
              </TableHead>
              <TableHead className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
                Descripción
              </TableHead>
              <TableHead className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold text-right">
                Categoría
              </TableHead>
              <TableHead className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold text-right">
                Monto (ARS)
              </TableHead>
              <TableHead className="py-3 px-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((expense) => (
              <TableRow
                key={expense.id}
                className="hover:bg-white/[0.03] transition-colors group border-b border-border last:border-0"
              >
                <TableCell className="py-4 px-6 text-[11px] font-mono text-muted-foreground">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell className="py-4 px-6 text-sm font-medium text-foreground">
                  {expense.description}
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-[4px] px-2 py-0.5 text-[10px] font-mono border-hairline transition-colors',
                      getCategoryStyle(expense.category),
                    )}
                  >
                    {translateCategory(expense.category)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-6 text-right font-mono text-sm group-hover:text-primary transition-colors">
                  {formatARS(expense.amount)}
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(expense)}
                      className="h-8 px-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      aria-label="Eliminar"
                      className="h-8 w-8 text-muted-foreground/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-20 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest"
                >
                  Sin movimientos en esta categoría
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-40">
        Eliminar gastos llega más adelante. Por ahora podés editarlos.
      </p>

      <ExpenseFormModal
        key={editing?.id ?? 'closed'}
        visible={editing !== null}
        mode="edit"
        initial={
          editing
            ? {
                description: editing.description,
                amount: editing.amount,
                category: editing.category,
              }
            : undefined
        }
        onDismiss={closeEditor}
        onSubmit={handleSubmit}
        submitting={savingEdit}
        submitError={editError}
      />
    </div>
  )
}
