import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryScreen } from './history-screen'

const updateExpense = vi.fn()

const expenses = [
  {
    id: 'grocery-1',
    description: 'Compra semanal en el super',
    amount: 84500,
    category: 'GROCERIES' as const,
    date: '2026-06-20T10:00:00.000Z',
  },
  {
    id: 'auto-1',
    description: 'Nafta YPF',
    amount: 45000,
    category: 'AUTO' as const,
    date: '2026-06-21T10:00:00.000Z',
  },
  {
    id: 'pharma-1',
    description: 'Ibuprofeno y vitaminas',
    amount: 12300,
    category: 'PHARMA' as const,
    date: '2026-06-22T10:00:00.000Z',
  },
]

vi.mock('@/lib/store', () => ({
  useStore: () => ({
    expenses,
    updateExpense,
  }),
}))

describe('HistoryScreen', () => {
  beforeEach(() => {
    updateExpense.mockReset()
  })

  it('limits category filtering to the closed categories', () => {
    render(<HistoryScreen onUpdated={vi.fn()} />)

    const filter = screen.getByLabelText('Filtrar por categoría')
    const optionNames = within(filter)
      .getAllByRole('option')
      .map((option) => ({
        label: option.textContent,
        value: option.getAttribute('value'),
      }))

    expect(optionNames).toEqual([
      { label: 'Todas las categorías', value: 'all' },
      { label: 'Supermercado', value: 'GROCERIES' },
      { label: 'Farmacia', value: 'PHARMA' },
      { label: 'Auto', value: 'AUTO' },
    ])

    fireEvent.change(filter, { target: { value: 'PHARMA' } })

    expect(screen.getByText('Ibuprofeno y vitaminas')).toBeInTheDocument()
    expect(
      screen.queryByText('Compra semanal en el super'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Nafta YPF')).not.toBeInTheDocument()
  })

  it('keeps delete and date filtering as próximamente placeholders', () => {
    render(<HistoryScreen onUpdated={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: /filtrar por fecha/i }),
    ).toBeDisabled()

    for (const button of screen.getAllByRole('button', {
      name: /eliminar/i,
    })) {
      expect(button).toBeDisabled()
    }

    expect(
      screen.getByText(
        'Eliminar gastos llega más adelante. Por ahora podés editarlos.',
      ),
    ).toBeInTheDocument()
  })
})
