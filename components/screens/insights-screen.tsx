'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/format'
import {
  computeComparison,
  getWeekExpenses,
  useDashboardStats,
  type Comparison,
  type MonthStats,
} from '@/lib/insights'
import { useStore } from '@/lib/store'
import { translateCategory, type Expense } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import {
  summarizeWeeklyBudget,
  useWeeklyBudget,
  type WeeklyBudget,
} from '@/lib/weekly-budget'

interface InsightsScreenProps {
  refDate?: Date
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-surface-1 hairline-border rounded-xl p-6 space-y-5">
      {children}
    </section>
  )
}

function SummaryBlock({
  stats,
  loading,
}: {
  stats: MonthStats
  loading: boolean
}) {
  const visibleBreakdown = stats.breakdown.filter((item) => item.total > 0)

  return (
    <Panel>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Mes actual
        </p>
        <h2 className="text-lg font-semibold tracking-tight">
          Resumen del mes
        </h2>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando resumen...</p>
      ) : stats.count === 0 ? (
        <p className="text-sm text-muted-foreground">
          Registrá un gasto para ver el resumen de este mes.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Metric label="Gastado" value={formatARS(stats.total)} />
            <Metric label="Movimientos" value={String(stats.count)} />
            <Metric label="Promedio" value={formatARS(stats.average)} />
          </div>
          <div className="space-y-2">
            {visibleBreakdown.slice(0, 4).map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{translateCategory(item.category)}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatARS(item.total)} · {Math.round(item.share * 100)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.share * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-mono font-semibold tracking-tight">
        {value}
      </p>
    </div>
  )
}

function ComparisonBlock({ comparison }: { comparison: Comparison }) {
  const verb =
    comparison.direction === 'current-higher'
      ? 'subiste'
      : comparison.direction === 'current-lower'
        ? 'bajaste'
        : 'te mantuviste igual'

  return (
    <Panel>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Mes contra mes
        </p>
        <h2 className="text-lg font-semibold tracking-tight">
          Comparativa mensual
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Metric
          label={comparison.currentMonthLabel}
          value={formatARS(comparison.currentMonthTotal)}
        />
        <Metric
          label={comparison.previousMonthLabel}
          value={formatARS(comparison.previousMonthTotal)}
        />
      </div>
      {!comparison.hasPreviousData ? (
        <p className="text-sm text-muted-foreground">
          Mes anterior sin movimientos.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Este mes {verb} {formatARS(comparison.absoluteDelta)} respecto del mes
          anterior.
        </p>
      )}
      {comparison.percentageDelta !== null && (
        <p className="text-2xl font-mono font-semibold">
          {Math.round(Math.abs(comparison.percentageDelta))}%
        </p>
      )}
    </Panel>
  )
}

function WeeklyBudgetBlock({
  budget,
  onSetAmount,
  weekExpenses,
}: {
  budget: WeeklyBudget | null
  onSetAmount: (amount: number) => void
  weekExpenses: Expense[]
}) {
  const [value, setValue] = useState(() => String(budget?.amount ?? ''))
  const [error, setError] = useState<string | null>(null)
  const spent = weekExpenses.reduce((acc, expense) => acc + expense.amount, 0)
  const summary = budget ? summarizeWeeklyBudget(budget, spent) : null

  function saveBudget() {
    const amount = Number(value)
    if (!Number.isInteger(amount) || amount < 0) {
      setError('Ingresá un monto entero mayor o igual a cero.')
      return
    }
    setError(null)
    onSetAmount(amount)
  }

  return (
    <Panel>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Semana actual
        </p>
        <h2 className="text-lg font-semibold tracking-tight">
          Presupuesto semanal
        </h2>
      </div>
      {!budget && (
        <p className="text-sm text-muted-foreground">
          Definí un presupuesto semanal.
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          saveBudget()
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="weekly-budget-amount" className="text-sm font-medium">
            Monto semanal
          </label>
          <input
            id="weekly-budget-amount"
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ej: 75000"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'weekly-budget-error' : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && (
            <p
              id="weekly-budget-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="font-mono text-[10px] uppercase tracking-widest"
        >
          Guardar
        </Button>
      </form>
      {summary && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <p className="font-medium">{summary.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.message}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Metric label="Gastaste" value={formatARS(summary.spent)} />
            <Metric label="Te quedan" value={formatARS(summary.remaining)} />
            <Metric label="Uso" value={`${summary.percentUsed}% usado`} />
          </div>
        </div>
      )}
    </Panel>
  )
}

export function InsightsScreen({ refDate = new Date() }: InsightsScreenProps) {
  const { user } = useAuth()
  const { stats, loading } = useDashboardStats()
  const { expenses, expenseMutationsVersion } = useStore()
  const email = user?.email ?? 'anonymous'
  const { budget, setAmount } = useWeeklyBudget(email)

  const comparison = useMemo(() => {
    void expenseMutationsVersion
    return computeComparison(expenses, refDate)
  }, [expenses, expenseMutationsVersion, refDate])
  const weekExpenses = useMemo(() => {
    void expenseMutationsVersion
    return getWeekExpenses(expenses, refDate)
  }, [expenses, expenseMutationsVersion, refDate])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SummaryBlock stats={stats} loading={loading} />
      <ComparisonBlock comparison={comparison} />
      <WeeklyBudgetBlock
        budget={budget}
        onSetAmount={setAmount}
        weekExpenses={weekExpenses}
      />
    </div>
  )
}
