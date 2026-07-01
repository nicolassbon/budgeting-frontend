import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardScreen } from './dashboard-screen'

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

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset()
    mockUseStore.mockReset()
    mockUseAuth.mockReset()
    mockUseWeeklyBudget.mockReset()

    mockUseAuth.mockReturnValue({ user: { email: 'ana@example.com' } })
    mockUseWeeklyBudget.mockReturnValue({
      budget: null,
      setAmount: vi.fn(),
      clear: vi.fn(),
    })
  })

  it('hides the empty state when there is at least one recent movement row', () => {
    mockUseDashboardStats.mockReturnValue({
      loading: false,
      stats: {
        total: 0,
        count: 0,
        average: 0,
        breakdown: [],
        topCategory: null,
        monthLabel: 'junio 2026',
      },
    })
    mockUseStore.mockReturnValue({
      expenses: [
        {
          id: 'expense-1',
          description: 'Supermercado Disco',
          amount: 70000,
          category: 'SUPERMERCADO',
          date: '2026-06-20T10:00:00.000Z',
        },
      ],
    })

    render(<DashboardScreen onCapture={vi.fn()} onSeeHistory={vi.fn()} />)

    expect(screen.getByText('Supermercado Disco')).toBeInTheDocument()
    expect(
      screen.queryByText('Sin movimientos registrados'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('$ 70.000')).toBeInTheDocument()
  })

  it('links dashboard insight cards to the Insights section without placeholder copy', () => {
    mockUseDashboardStats.mockReturnValue({
      loading: false,
      stats: {
        total: 120000,
        count: 3,
        average: 40000,
        breakdown: [],
        topCategory: {
          category: 'SUPERMERCADO',
          total: 90000,
          share: 0.75,
        },
        monthLabel: 'julio 2026',
      },
    })
    mockUseStore.mockReturnValue({ expenses: [] })

    render(<DashboardScreen onCapture={vi.fn()} onSeeHistory={vi.fn()} />)

    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /ver insights/i })).toHaveLength(
      2,
    )
    for (const link of screen.getAllByRole('link', { name: /ver insights/i })) {
      expect(link).toHaveAttribute('href', '#/insights')
    }
  })

  it('surfaces the weekly budget warning directly on the dashboard', () => {
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
      expenses: [
        {
          id: 'current-week',
          description: 'Supermercado',
          amount: 85000,
          category: 'SUPERMERCADO',
          date: '2026-07-01T12:00:00.000Z',
        },
      ],
      expenseMutationsVersion: 1,
    })
    mockUseWeeklyBudget.mockReturnValue({
      budget: { amount: 100000, updatedAt: '2026-07-01T12:00:00.000Z' },
      setAmount: vi.fn(),
      clear: vi.fn(),
    })

    render(
      <DashboardScreen
        onCapture={vi.fn()}
        onSeeHistory={vi.fn()}
        refDate={new Date('2026-07-02T12:00:00.000Z')}
      />,
    )

    expect(mockUseWeeklyBudget).toHaveBeenCalledWith('ana@example.com')
    expect(screen.getByText('Presupuesto semanal')).toBeInTheDocument()
    expect(screen.getByText('Atención al presupuesto')).toBeInTheDocument()
    expect(screen.getByText('85% usado')).toBeInTheDocument()
    expect(screen.getByText('$ 15.000')).toBeInTheDocument()
  })
})
