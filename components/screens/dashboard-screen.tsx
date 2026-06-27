'use client'

import Badge from '@cloudscape-design/components/badge'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import ColumnLayout from '@cloudscape-design/components/column-layout'
import Container from '@cloudscape-design/components/container'
import Header from '@cloudscape-design/components/header'
import Link from '@cloudscape-design/components/link'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Table from '@cloudscape-design/components/table'

import { useStore } from '@/lib/store'
import { formatARS, formatDate } from '@/lib/format'
import { CATEGORY_COLOR, computeMonthStats } from '@/lib/insights'
import type { Expense } from '@/lib/types'

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
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--space-scaled-s, 12px)',
          marginBottom: 'var(--space-scaled-xxs, 4px)',
        }}
      >
        <Box variant="span" fontWeight="bold">
          {label}
        </Box>
        <Box variant="span" color="text-body-secondary" fontSize="body-s">
          {`${formatARS(amount)} · ${pct}%`}
        </Box>
      </div>
      <div
        role="presentation"
        style={{
          height: 10,
          borderRadius: 'var(--border-radius-badge, 4px)',
          background: 'var(--color-background-input-disabled, #e9ebed)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(pct, share > 0 ? 2 : 0)}%`,
            height: '100%',
            background: color,
            borderRadius: 'var(--border-radius-badge, 4px)',
            transition: 'width 240ms ease',
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
  const { expenses } = useStore()
  const stats = computeMonthStats(expenses)
  const recent = [...expenses]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5)

  const hasData = stats.count > 0

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={`Tu resumen de ${stats.monthLabel}.`}
        actions={
          <Button variant="primary" iconName="microphone" onClick={onCapture}>
            Capturar gasto
          </Button>
        }
      >
        ¿Cómo venís este mes?
      </Header>

      {/* Hero total */}
      <Container>
        <SpaceBetween size="xs">
          <Box variant="awsui-key-label">Gastaste este mes</Box>
          <Box variant="h1" fontSize="display-l">
            {formatARS(stats.total)}
          </Box>
          <Box color="text-body-secondary">
            {hasData
              ? `${stats.count} movimiento${stats.count === 1 ? '' : 's'} · promedio ${formatARS(
                  stats.average,
                )}`
              : 'Todavía no registraste movimientos este mes.'}
          </Box>
        </SpaceBetween>
      </Container>

      {hasData && (
        <ColumnLayout columns={2} variant="default">
          {/* Breakdown */}
          <Container header={<Header variant="h2">Por categoría</Header>}>
            <SpaceBetween size="m">
              {stats.breakdown.map((b) => (
                <CategoryBar
                  key={b.category}
                  label={b.category}
                  amount={b.total}
                  share={b.share}
                  color={CATEGORY_COLOR[b.category]}
                />
              ))}
            </SpaceBetween>
          </Container>

          {/* Light insights */}
          <Container
            header={<Header variant="h2">Para tener en cuenta</Header>}
          >
            <SpaceBetween size="m">
              {stats.topCategory && (
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-scaled-s, 12px)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: 4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: CATEGORY_COLOR[stats.topCategory.category],
                    }}
                  />
                  <Box variant="span">
                    Lo que más pesa es{' '}
                    <Box variant="span" fontWeight="bold">
                      {stats.topCategory.category}
                    </Box>
                    {`, con ${Math.round(stats.topCategory.share * 100)}% de tu gasto del mes.`}
                  </Box>
                </div>
              )}
              <Box variant="span" color="text-body-secondary">
                {`Vas a un promedio de ${formatARS(stats.average)} por movimiento. `}
                Registrar a tiempo te ayuda a que el número no te sorprenda.
              </Box>
            </SpaceBetween>
          </Container>
        </ColumnLayout>
      )}

      {/* Recent movements */}
      <Table<Expense>
        variant="container"
        items={recent}
        trackBy="id"
        header={
          <Header
            variant="h2"
            counter={hasData ? `(${expenses.length})` : undefined}
            actions={<Link onFollow={onSeeHistory}>Ver historial</Link>}
          >
            Movimientos recientes
          </Header>
        }
        columnDefinitions={[
          {
            id: 'date',
            header: 'Fecha',
            cell: (e) => formatDate(e.date),
            width: 120,
          },
          {
            id: 'description',
            header: 'Descripción',
            cell: (e) => e.description,
            isRowHeader: true,
          },
          {
            id: 'category',
            header: 'Categoría',
            cell: (e) => <Badge>{e.category}</Badge>,
            width: 150,
          },
          {
            id: 'amount',
            header: 'Monto',
            cell: (e) => (
              <Box textAlign="right" fontWeight="bold">
                {formatARS(e.amount)}
              </Box>
            ),
            width: 140,
          },
        ]}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
            <SpaceBetween size="s">
              <b>Todavía no registraste movimientos</b>
              <Button iconName="microphone" onClick={onCapture}>
                Capturar tu primer gasto
              </Button>
            </SpaceBetween>
          </Box>
        }
      />
    </SpaceBetween>
  )
}
