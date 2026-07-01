import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaptureScreen } from './capture-screen'

const addExpense = vi.fn()
const mockFetch = vi.fn()

vi.mock('@/lib/store', () => ({
  useStore: () => ({
    addExpense,
  }),
}))

describe('CaptureScreen', () => {
  beforeEach(() => {
    addExpense.mockReset()
    vi.useFakeTimers()
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('creates a local interpretation preview and waits for explicit confirmation before saving', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        description: '70 mil en el super',
        amount: 7000000,
        category: 'COMIDA',
      }),
    })

    const onSaved = vi.fn()

    render(<CaptureScreen onSaved={onSaved} onOpenHelp={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Describí tu gasto'), {
      target: { value: '70 mil en el super' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar gasto' }))

    await act(async () => {
      // Flush the microtask queue for the fetch promise chain
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(
      screen.getByRole('heading', { name: 'Borrador interpretado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/nada se guarda hasta que confirmes/i),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('70 mil en el super')).toBeInTheDocument()
    expect(screen.getByLabelText('Monto')).toHaveValue(70000)
    expect(screen.getByLabelText('Categoría')).toHaveValue('COMIDA')
    expect(addExpense).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }))

    expect(addExpense).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(addExpense).toHaveBeenCalledWith({
      description: '70 mil en el super',
      amount: 70000,
      category: 'COMIDA',
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('keeps manual preview validation on required fields, category, and amount', () => {
    render(<CaptureScreen onSaved={vi.fn()} onOpenHelp={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: /prefiero cargarlo a mano/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }))

    expect(screen.getByText('Agregá una descripción.')).toBeInTheDocument()
    expect(screen.getByText('Ingresá un monto mayor a 0.')).toBeInTheDocument()
    expect(screen.getByText('Elegí una categoría.')).toBeInTheDocument()
    expect(addExpense).not.toHaveBeenCalled()
  })
})
