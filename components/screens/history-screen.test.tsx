import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryScreen } from './history-screen'

const updateExpense = vi.fn()

const expenses = [
  {
    id: 'grocery-1',
    description: 'Compra semanal en el super',
    amount: 84500,
    category: 'COMIDA' as const,
    date: '2026-06-20T10:00:00.000Z',
  },
  {
    id: 'auto-1',
    description: 'Nafta YPF',
    amount: 45000,
    category: 'TRANSPORTE' as const,
    date: '2026-06-21T10:00:00.000Z',
  },
  {
    id: 'pharma-1',
    description: 'Ibuprofeno y vitaminas',
    amount: 12300,
    category: 'FARMACIA' as const,
    date: '2026-06-22T10:00:00.000Z',
  },
  {
    id: 'services-1',
    description: 'Factura de internet',
    amount: 18900,
    category: 'SERVICIOS' as const,
    date: '2026-06-23T10:00:00.000Z',
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

  it('shows all backend-supported categories and filters non-legacy ones', () => {
    render(<HistoryScreen onUpdated={vi.fn()} />)

    const filter = screen.getByLabelText('Filtrar por categoría')
    const optionNames = within(filter)
      .getAllByRole('option')
      .map((option) => ({
        label: option.textContent,
        value: option.getAttribute('value'),
      }))

    expect(optionNames).toContainEqual({
      label: 'Todas las categorías',
      value: 'all',
    })
    expect(optionNames).toContainEqual({ label: 'Comida', value: 'COMIDA' })
    expect(optionNames).toContainEqual({
      label: 'Servicios',
      value: 'SERVICIOS',
    })
    expect(optionNames).toContainEqual({ label: 'Otros', value: 'OTROS' })

    fireEvent.change(filter, { target: { value: 'SERVICIOS' } })

    expect(screen.getByText('Factura de internet')).toBeInTheDocument()
    expect(
      screen.queryByText('Compra semanal en el super'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Nafta YPF')).not.toBeInTheDocument()
    expect(screen.queryByText('Ibuprofeno y vitaminas')).not.toBeInTheDocument()
  })

  it('keeps delete filtering as próximamente placeholders', () => {
    render(<HistoryScreen onUpdated={vi.fn()} />)

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

  it('waits for the edit request before closing the modal and notifying updates', async () => {
    let resolveUpdate: (() => void) | undefined
    updateExpense.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    const onUpdated = vi.fn()

    render(<HistoryScreen onUpdated={onUpdated} />)

    const pharmaRow = screen.getByText('Ibuprofeno y vitaminas').closest('tr')
    if (!pharmaRow) throw new Error('Expected expense row')

    fireEvent.click(within(pharmaRow).getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Ibuprofeno editado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(updateExpense).toHaveBeenCalledWith('pharma-1', {
      description: 'Ibuprofeno editado',
      amount: 12300,
      category: 'FARMACIA',
    })
    expect(onUpdated).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
    expect(
      screen.getByRole('dialog', { name: 'Editar gasto' }),
    ).toBeInTheDocument()

    resolveUpdate?.()

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1)
      expect(
        screen.queryByRole('dialog', { name: 'Editar gasto' }),
      ).not.toBeInTheDocument()
    })
  })

  it('keeps the modal open and surfaces an error when the edit request fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    updateExpense.mockRejectedValueOnce(new Error('backend down'))
    const onUpdated = vi.fn()

    render(<HistoryScreen onUpdated={onUpdated} />)

    const groceryRow = screen
      .getByText('Compra semanal en el super')
      .closest('tr')
    if (!groceryRow) throw new Error('Expected expense row')

    fireEvent.click(within(groceryRow).getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(
        screen.getByText('No pudimos guardar los cambios. Probá de nuevo.'),
      ).toBeInTheDocument()
    })

    expect(onUpdated).not.toHaveBeenCalled()
    expect(
      screen.getByRole('dialog', { name: 'Editar gasto' }),
    ).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
