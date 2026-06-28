'use client'

import { useMemo } from 'react'

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
import { CATEGORY_COLOR, useDashboardStats } from '@/lib/insights'
import { useStore } from '@/lib/store'
import { translateCategory, type Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORY_STYLES: Record<Category, string> = {
  GROCERIES: 'bg-indigo-500/15 text-indigo-400 border-transparent',
  AUTO: 'bg-emerald-500/15 text-emerald-400 border-transparent',
  PHARMA: 'bg-rose-500/15 text-rose-400 border-transparent',
}

interface DashboardScreenProps {
  onCapture: () => void
  onSeeHistory: () => void
}

function CategoryBar({
  label,
  amount,
  share,
  color,
}: {
  label: string
  amount: number
  share: number
  color: string
}) {
  const pct = Math.round(share * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans font-medium">{label}</span>
        <span className="text-sm text-muted-foreground font-sans">
          <span className="font-mono">{formatARS(amount)}</span>
          {' · '}
          <span className="font-mono">{pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-md bg-secondary border border-border overflow-hidden">
        <div
          className="h-full rounded-md transition-all"
          style={{
            width: `${Math.max(pct, share > 0 ? 2 : 0)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

export function DashboardScreen({
  onCapture,
  onSeeHistory,
}: DashboardScreenProps) {
  const { stats, loading } = useDashboardStats()
  const { expenses } = useStore()

  const recent = useMemo(() => {
    return [...expenses]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5)
  }, [expenses])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
          Cargando datos...
        </CardContent>
      </Card>
    )
  }

  const hasData = stats.count > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge variant="success" className="w-fit">
            Resumen del mes
          </Badge>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight tracking-[-0.6px]">
              Cómo venís este mes.
            </h2>
            <p className="text-sm text-muted-foreground">
              {`Tu resumen de ${stats.monthLabel}.`}
            </p>
          </div>
        </div>

        <Button onClick={onCapture}>Capturar gasto</Button>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Gastaste este mes</CardDescription>
          <CardTitle className="text-4xl font-sans font-black text-foreground dark:text-[#f7f8f8]">
            {formatARS(stats.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasData
              ? `${stats.count} movimiento${stats.count === 1 ? '' : 's'} · promedio ${formatARS(
                  stats.average,
                )}`
              : 'Todavía no registraste movimientos este mes.'}
          </p>
        </CardContent>
      </Card>

      {hasData && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Por categoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.breakdown.map((item) => (
                <CategoryBar
                  key={item.category}
                  label={translateCategory(item.category)}
                  amount={item.total}
                  share={item.share}
                  color={CATEGORY_COLOR[item.category]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Para tener en cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {stats.topCategory && (
                <p>
                  Lo que más pesa es{' '}
                  <span className="font-semibold text-foreground">
                    {translateCategory(stats.topCategory.category)}
                  </span>
                  {`, con ${Math.round(stats.topCategory.share * 100)}% de tu gasto del mes.`}
                </p>
              )}
              <p>
                {`Vas a un promedio de ${formatARS(stats.average)} por movimiento. `}
                Registrar a tiempo te ayuda a que el número no te sorprenda.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>
              {hasData
                ? `${expenses.length} movimientos registrados.`
                : 'Todavía no hay movimientos.'}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onSeeHistory}>
            Ver historial
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Descripción</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Categoría</TableHead>
                  <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((expense) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-border p-6 text-center">
              <p className="font-medium">Todavía no registraste movimientos</p>
              <Button onClick={onCapture}>Capturar tu primer gasto</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
