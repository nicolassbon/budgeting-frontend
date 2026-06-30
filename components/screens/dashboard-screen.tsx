'use client'

import { useMemo } from 'react'
import { TrendingUp, PieChart, ArrowRight } from 'lucide-react'

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
import { useDashboardStats } from '@/lib/insights'
import { useStore } from '@/lib/store'
import { translateCategory, type Category } from '@/lib/types'
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

interface DashboardScreenProps {
  onCapture: () => void
  onSeeHistory: () => void
}

function Sparkline() {
  return (
    <svg viewBox="0 0 200 80" className="w-full h-full">
      <path
        d="M0 60 Q 25 50, 50 65 T 100 45 T 150 70 T 200 10"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-[dash_2s_ease-out_forwards]"
        style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
      />
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
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
      <Card className="hairline-border bg-surface-1">
        <CardContent className="flex items-center justify-center py-20 text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
          Cargando...
        </CardContent>
      </Card>
    )
  }

  const hasData = stats.count > 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <div className="bg-surface-1 hairline-border rounded-xl p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Tendencia semanal
              </span>
              <TrendingUp className="h-4 w-4 text-cyan" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Promedio semanal
            </h3>
            <p className="text-2xl font-mono mt-1 tracking-tighter text-foreground">
              {formatARS(stats.average * 7 || 0).split(',')[0]}
            </p>
          </div>
          <div className="h-20 mt-4 relative">
            <Sparkline />
          </div>
        </div>

        {/* Total Gastado */}
        <div className="bg-surface-1 hairline-border rounded-xl overflow-hidden group hover:border-primary/50 transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center p-8 text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
            Total Gastado / {stats.monthLabel}
          </span>
          <h1 className="text-5xl font-mono font-bold tracking-[-0.04em] text-foreground">
            {formatARS(stats.total).split(',')[0]}
          </h1>
          <div className="mt-4 px-3 py-1.5 bg-muted border border-border rounded-full text-[10px] font-mono text-muted-foreground">
            Comparativa mensual próximamente
          </div>
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
                <span className="text-muted-foreground">Participación</span>
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
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Presupuesto semanal próximamente.
            </p>
          </div>
        </div>
      </div>

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
                  Estado
                </TableHead>
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
                  <TableCell className="py-4 px-6">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
                  </TableCell>
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
              {!hasData && (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
