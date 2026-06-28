'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'

import {
  ExpenseFormModal,
  type ExpenseFormValues,
} from '@/components/expense-form-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const CATEGORY_STYLES: Record<Category, string> = {
  GROCERIES: 'bg-indigo-500/15 text-indigo-400 border-transparent',
  AUTO: 'bg-emerald-500/15 text-emerald-400 border-transparent',
  PHARMA: 'bg-rose-500/15 text-rose-400 border-transparent',
}

interface HistoryScreenProps {
  onUpdated: () => void
}

export function HistoryScreen({ onUpdated }: HistoryScreenProps) {
  const { expenses, updateExpense } = useStore()
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [editing, setEditing] = useState<Expense | null>(null)

  const items = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date),
    )

    if (categoryFilter === 'all') return sorted
    return sorted.filter((expense) => expense.category === categoryFilter)
  }, [expenses, categoryFilter])

  function handleSubmit(values: ExpenseFormValues) {
    if (!editing) return
    updateExpense(editing.id, values)
    setEditing(null)
    onUpdated()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-semibold tracking-[-0.6px]">Historial.</h2>
        <p className="text-sm text-muted-foreground">
          Todos tus gastos, del más nuevo al más viejo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
          <CardDescription>{`${items.length} resultado${items.length === 1 ? '' : 's'}.`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="category-filter" className="text-sm font-medium">
                Filtrar por categoría
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as Category | 'all')
                }
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {translateCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="date-filter" className="text-sm font-medium">
                Filtrar por fecha
              </label>
              <div title="Próximamente">
                <Button
                  id="date-filter"
                  variant="outline"
                  className="w-full justify-start text-muted-foreground opacity-50 cursor-not-allowed"
                  disabled
                >
                  Seleccionar fecha
                </Button>
              </div>
            </div>
          </div>

          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Descripción</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Categoría</TableHead>
                  <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Monto</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("rounded-xs", CATEGORY_STYLES[expense.category])}
                      >
                        {translateCategory(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-foreground dark:text-[#f7f8f8]">
                      {formatARS(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(expense)}
                        >
                          Editar
                        </Button>
                        <div title="Próximamente" className="inline-block">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="h-8 w-8 text-muted-foreground"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="font-medium">No hay gastos en esta categoría</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá cambiar el filtro.
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Eliminar gastos llega más adelante. Por ahora podés editarlos.
          </p>
        </CardContent>
      </Card>

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
        onDismiss={() => setEditing(null)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
