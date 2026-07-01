import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InsightsScreen } from './insights-screen'

const mockUseDashboardStats = vi.fn()
const mockUseStore = vi.fn()
const mockUseAuth = vi.fn()
const mockUseWeeklyBudget = vi.fn()

vi.mock('@/lib/insights', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/insights')>('@/lib/insights')
  return {
    ...actual,
    useDashboardStats: () => mockUseDashboardStats(),
  }
})

vi.mock('@/lib/store', () => ({
  useStore: () => mockUseStore(),
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/lib/weekly-budget', async () => {
  const actual = await vi.importActual<typeof import('@/lib/weekly-budget')>(
    '@/lib/weekly-budget',
  )
  return {
    ...actual,
    useWeeklyBudget: (email: string) => mockUseWeeklyBudget(email),
  }
})

describe('InsightsScreen', () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset()
    mockUseStore.mockReset()
    mockUseAuth.mockReset()
    mockUseWeeklyBudget.mockReset()

    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'ana@example.com' } })
    mockUseDashboardStats.mockReturnValue({
      loading: false,
      stats: {
        total: 0,
        count: 0,
        average: 0,
        breakdown: [],
        topCategory: null,
        monthLabel: 'julio 2026',
      },
    })
    mockUseStore.mockReturnValue({
      expenses: [],
      expenseMutationsVersion: 0,
    })
    mockUseWeeklyBudget.mockReturnValue({
      budget: null,
      setAmount: vi.fn(),
      clear: vi.fn(),
    })
  })

  it('renders the three insight blocks without próximo placeholder copy', () => {
    render(<InsightsScreen />)

    expect(
      screen.getByRole('heading', { name: /resumen del mes/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /comparativa mensual/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /presupuesto semanal/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument()
  })

  it('shows empty states for current month and previous month when data is absent', () => {
    render(<InsightsScreen />)

    expect(
      screen.getByText(/registrá un gasto para ver el resumen/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/mes anterior sin movimientos/i),
    ).toBeInTheDocument()
    expect(screen.queryByText('-100%')).not.toBeInTheDocument()
  })

  it('computes monthly comparison and weekly budget from store expenses', () => {
    mockUseDashboardStats.mockReturnValue({
      loading: false,
      stats: {
        total: 50000,
        count: 2,
        average: 25000,
        breakdown: [
          { category: 'COMIDA', total: 30000, share: 0.6 },
          { category: 'TRANSPORTE', total: 20000, share: 0.4 },
        ],
        topCategory: { category: 'COMIDA', total: 30000, share: 0.6 },
        monthLabel: 'julio 2026',
      },
    })
    mockUseStore.mockReturnValue({
      expenses: [
        {
          id: 'current-week',
          description: 'Super',
          amount: 50000,
          category: 'COMIDA',
          date: '2026-07-01T12:00:00.000Z',
        },
        {
          id: 'previous-month',
          description: 'Farmacia',
          amount: 25000,
          category: 'FARMACIA',
          date: '2026-06-10T12:00:00.000Z',
        },
      ],
      expenseMutationsVersion: 2,
    })
    mockUseWeeklyBudget.mockReturnValue({
      budget: { amount: 100000, updatedAt: '2026-07-01T12:00:00.000Z' },
      setAmount: vi.fn(),
      clear: vi.fn(),
    })

    render(<InsightsScreen refDate={new Date('2026-07-02T12:00:00.000Z')} />)

    expect(screen.getAllByText('$ 50.000').length).toBeGreaterThan(0)
    expect(screen.getByText(/subiste/i)).toHaveTextContent('$ 25.000')
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText(/gastaste/i)).toBeInTheDocument()
    expect(screen.getByText(/te quedan/i)).toBeInTheDocument()
    expect(screen.getAllByText('$ 50.000').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('50% usado')).toBeInTheDocument()
  })

  it('persists the active user budget through the weekly budget hook', () => {
    const setAmount = vi.fn()
    mockUseWeeklyBudget.mockReturnValue({
      budget: null,
      setAmount,
      clear: vi.fn(),
    })

    render(<InsightsScreen />)

    expect(mockUseWeeklyBudget).toHaveBeenCalledWith('ana@example.com')

    const openBtn = screen.getByRole('button', { name: /definir presupuesto/i })
    fireEvent.click(openBtn)

    const input = screen.getByLabelText(/monto semanal/i)
    fireEvent.change(input, { target: { value: '75000' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(setAmount).toHaveBeenCalledWith(75000)
  })

  it('shows zero percent used when a zero budget has no weekly spending', () => {
    mockUseWeeklyBudget.mockReturnValue({
      budget: { amount: 0, updatedAt: '2026-07-01T12:00:00.000Z' },
      setAmount: vi.fn(),
      clear: vi.fn(),
    })

    render(<InsightsScreen refDate={new Date('2026-07-02T12:00:00.000Z')} />)

    expect(screen.getByText('0% usado')).toBeInTheDocument()
    expect(screen.queryByText(/NaN% usado/i)).not.toBeInTheDocument()
  })

  it('shows capped usage when a zero budget has weekly spending', () => {
    mockUseStore.mockReturnValue({
      expenses: [
        {
          id: 'current-week',
          description: 'Super',
          amount: 25000,
          category: 'COMIDA',
          date: '2026-07-01T12:00:00.000Z',
        },
      ],
      expenseMutationsVersion: 1,
    })
    mockUseWeeklyBudget.mockReturnValue({
      budget: { amount: 0, updatedAt: '2026-07-01T12:00:00.000Z' },
      setAmount: vi.fn(),
      clear: vi.fn(),
    })

    render(<InsightsScreen refDate={new Date('2026-07-02T12:00:00.000Z')} />)

    expect(screen.getByText('999% usado')).toBeInTheDocument()
    expect(screen.queryByText(/Infinity% usado/i)).not.toBeInTheDocument()
  })
})
