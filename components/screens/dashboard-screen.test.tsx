import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardScreen } from './dashboard-screen'

const mockUseDashboardStats = vi.fn()
const mockUseStore = vi.fn()

vi.mock('@/lib/insights', () => ({
  useDashboardStats: () => mockUseDashboardStats(),
}))

vi.mock('@/lib/store', () => ({
  useStore: () => mockUseStore(),
}))

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset()
    mockUseStore.mockReset()
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

    render(
      <DashboardScreen onCapture={vi.fn()} onSeeHistory={vi.fn()} />,
    )

    expect(screen.getByText('Supermercado Disco')).toBeInTheDocument()
    expect(screen.queryByText('Sin movimientos registrados')).not.toBeInTheDocument()
    expect(screen.getByText('$ 70.000')).toBeInTheDocument()
  })
})
