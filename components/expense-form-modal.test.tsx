import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ExpenseFormModal } from './expense-form-modal'

describe('ExpenseFormModal', () => {
  it('has dialog basics and closes through cancel or Escape', () => {
    const onDismiss = vi.fn()

    render(
      <ExpenseFormModal
        visible
        mode="create"
        onDismiss={onDismiss}
        onSubmit={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Cargar gasto a mano' }),
    ).toHaveAttribute('aria-modal', 'true')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('validates required description, positive amount, and category before submit', () => {
    const onSubmit = vi.fn()

    render(
      <ExpenseFormModal
        visible
        mode="edit"
        onDismiss={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      screen.getByText('Contanos en qué fue el gasto.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ingresá un monto mayor a 0.')).toBeInTheDocument()
    expect(screen.getByText('Elegí una categoría.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Compra semanal' },
    })
    fireEvent.change(screen.getByLabelText('Monto'), {
      target: { value: '-1' },
    })
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: 'GROCERIES' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Ingresá un monto mayor a 0.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits rounded values only after valid manual entry', () => {
    const onSubmit = vi.fn()

    render(
      <ExpenseFormModal
        visible
        mode="create"
        onDismiss={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: ' Farmacia Central ' },
    })
    fireEvent.change(screen.getByLabelText('Monto'), {
      target: { value: '12300.4' },
    })
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: 'PHARMA' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }))

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'Farmacia Central',
      amount: 12300,
      category: 'PHARMA',
    })
  })
})
