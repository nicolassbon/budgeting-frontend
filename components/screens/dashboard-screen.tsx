'use client'

import { useMemo } from 'react'
import { PieChart, ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatARS, formatDate } from '@/lib/format'
import { getWeekExpenses, useDashboardStats } from '@/lib/insights'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { translateCategory, type Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { summarizeWeeklyBudget, useWeeklyBudget } from '@/lib/weekly-budget'

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

function getWeeklyBudgetStatusStyle(status: string): string {
  switch (status) {
    case 'exceeded':
      return 'border-red-500/30 bg-red-500/10 text-red-200'
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-100'
    default:
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
  }
}

interface DashboardScreenProps {
  onCapture: () => void
  onSeeHistory: () => void
  refDate?: Date
}

export function DashboardScreen({
  onCapture,
  onSeeHistory,
  refDate = new Date(),
}: DashboardScreenProps) {
  const { stats, loading } = useDashboardStats()
  const { expenses, expenseMutationsVersion } = useStore()
  const { user } = useAuth()
  const email = user?.email ?? 'anonymous'
  const { budget } = useWeeklyBudget(email)

  const recent = useMemo(() => {
    return [...expenses]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5)
  }, [expenses])

  const weekExpenses = useMemo(() => {
    void expenseMutationsVersion
    return getWeekExpenses(expenses, refDate)
  }, [expenses, expenseMutationsVersion, refDate])
  const weeklyBudgetSummary = budget
    ? summarizeWeeklyBudget(
        budget,
        weekExpenses.reduce((acc, expense) => acc + expense.amount, 0),
      )
    : null

  if (loading) {
    return (
      <Card className="hairline-border bg-surface-1">
        <CardContent className="flex items-center justify-center py-20 text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
          Cargando...
        </CardContent>
      </Card>
    )
  }

  const hasRecentMovements = recent.length > 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Gastado */}
        <div className="bg-surface-1 hairline-border rounded-xl overflow-hidden group hover:border-primary/50 transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center p-8 text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
            Total Gastado / {stats.monthLabel}
          </span>
          <h1 className="text-5xl font-mono font-bold tracking-[-0.04em] text-foreground">
            {formatARS(stats.total).split(',')[0]}
          </h1>
          <a
            href="#/insights"
            className="mt-4 px-3 py-1.5 bg-muted border border-border rounded-full text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            Ver Insights
          </a>
        </div>

        {/* Focus Category */}
        <div className="bg-surface-1 hairline-border rounded-xl p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Categoría destacada
              </span>
              <PieChart className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Mayor gasto en
            </h3>
            <p className="text-2xl font-mono mt-1 tracking-tighter text-foreground">
              {stats.topCategory
                ? translateCategory(stats.topCategory.category)
                : 'Sin datos'}
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">% del total</span>
                <span className="text-foreground">
                  {stats.topCategory
                    ? Math.round(stats.topCategory.share * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--primary)] transition-all duration-1000"
                  style={{
                    width: `${stats.topCategory ? stats.topCategory.share * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <a
              href="#/insights"
              className="inline-flex text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              Ver Insights
            </a>
          </div>
        </div>
      </div>

      <section className="bg-surface-1 hairline-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Semana actual
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Presupuesto semanal
            </h2>
          </div>
          <a
            href="#/insights"
            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Ajustar en Insights
          </a>
        </div>

        {weeklyBudgetSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-4">
            <div
              className={cn(
                'rounded-lg border p-4 space-y-2',
                getWeeklyBudgetStatusStyle(weeklyBudgetSummary.status),
              )}
            >
              <p className="text-sm font-semibold">
                {weeklyBudgetSummary.title}
              </p>
              <p className="text-sm opacity-90">
                {weeklyBudgetSummary.message}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Gastaste
                </p>
                <p className="mt-1 text-xl font-mono font-semibold tracking-tight">
                  {formatARS(weeklyBudgetSummary.spent)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Te quedan
                </p>
                <p className="mt-1 text-xl font-mono font-semibold tracking-tight">
                  {formatARS(weeklyBudgetSummary.remaining)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Uso
                </p>
                <p className="mt-1 text-xl font-mono font-semibold tracking-tight">
                  {weeklyBudgetSummary.percentUsed}% usado
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Definí un presupuesto semanal en Insights para ver el avance acá.
          </p>
        )}
      </section>

      {/* Activity Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Últimos movimientos
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSeeHistory}
            className="text-[10px] font-mono text-muted-foreground hover:text-primary tracking-widest uppercase transition-colors"
          >
            Ver todos los movimientos
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((expense) => (
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
                </TableRow>
              ))}
              {!hasRecentMovements && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-20 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest"
                  >
                    Sin movimientos registrados
                    <div className="mt-4">
                      <Button
                        onClick={onCapture}
                        variant="outline"
                        size="sm"
                        className="font-mono text-[10px] tracking-widest uppercase"
                      >
                        Capturar primer gasto
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
