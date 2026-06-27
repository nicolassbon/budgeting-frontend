'use client'

import { useMemo, useState } from 'react'
import Badge from '@cloudscape-design/components/badge'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import Header from '@cloudscape-design/components/header'
import Select, { SelectProps } from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Table from '@cloudscape-design/components/table'

import { useStore } from '@/lib/store'
import { formatARS, formatDate } from '@/lib/format'
import { CATEGORIES, type Category, type Expense } from '@/lib/types'
import {
  ExpenseFormModal,
  type ExpenseFormValues,
} from '@/components/expense-form-modal'

const ALL_OPTION: SelectProps.Option = {
  label: 'Todas las categorías',
  value: 'all',
}
const CATEGORY_OPTIONS: SelectProps.Option[] = [
  ALL_OPTION,
  ...CATEGORIES.map((c) => ({ label: c, value: c })),
]

interface HistoryScreenProps {
  onUpdated: () => void
}

export function HistoryScreen({ onUpdated }: HistoryScreenProps) {
  const { expenses, updateExpense } = useStore()
  const [categoryFilter, setCategoryFilter] =
    useState<SelectProps.Option>(ALL_OPTION)
  const [editing, setEditing] = useState<Expense | null>(null)

  const items = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date),
    )
    if (categoryFilter.value === 'all') return sorted
    return sorted.filter((e) => e.category === categoryFilter.value)
  }, [expenses, categoryFilter])

  function handleSubmit(values: ExpenseFormValues) {
    if (!editing) return
    updateExpense(editing.id, values)
    setEditing(null)
    onUpdated()
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Todos tus gastos, del más nuevo al más viejo."
      >
        Historial
      </Header>

      <Table<Expense>
        variant="container"
        items={items}
        trackBy="id"
        header={
          <Header variant="h2" counter={`(${items.length})`}>
            Gastos
          </Header>
        }
        filter={
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-scaled-s, 12px)',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ minWidth: 220 }}>
              <Select
                selectedOption={categoryFilter}
                options={CATEGORY_OPTIONS}
                onChange={({ detail }) =>
                  setCategoryFilter(detail.selectedOption)
                }
                ariaLabel="Filtrar por categoría"
              />
            </div>
            <div style={{ minWidth: 220 }}>
              <Select
                selectedOption={null}
                options={[]}
                disabled
                placeholder="Filtrar por fecha (pronto)"
                ariaLabel="Filtrar por fecha, próximamente"
              />
            </div>
          </div>
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
          {
            id: 'actions',
            header: 'Acciones',
            cell: (e) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="inline-link"
                  iconName="edit"
                  ariaLabel={`Editar ${e.description}`}
                  onClick={() => setEditing(e)}
                >
                  Editar
                </Button>
                <Button
                  variant="inline-icon"
                  iconName="remove"
                  disabled
                  ariaLabel="Eliminar (próximamente)"
                />
              </SpaceBetween>
            ),
            width: 150,
          },
        ]}
        empty={
          <Box textAlign="center" color="inherit" padding={{ vertical: 'l' }}>
            <SpaceBetween size="xs">
              <b>No hay gastos en esta categoría</b>
              <Box variant="span" color="text-body-secondary">
                Probá cambiar el filtro.
              </Box>
            </SpaceBetween>
          </Box>
        }
        footer={
          <Box textAlign="center" color="text-body-secondary" fontSize="body-s">
            Eliminar gastos llega más adelante. Por ahora podés editarlos.
          </Box>
        }
      />

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
    </SpaceBetween>
  )
}
