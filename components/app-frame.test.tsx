import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { AppFrame } from './app-frame'

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { email: 'nico@budgeting.app' },
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/lib/insights', () => ({
  useDashboardStats: () => ({
    stats: {
      total: 0,
      count: 0,
      average: 0,
      breakdown: [],
      topCategory: null,
      monthLabel: 'junio 2026',
    },
    loading: false,
  }),
}))

vi.mock('@/components/screens/capture-screen', () => ({
  CaptureScreen: ({
    onSaved,
    onOpenHelp,
  }: {
    onSaved: () => void
    onOpenHelp: () => void
  }) => (
    <div>
      <p>capture screen</p>
      <button onClick={onSaved}>simulate save</button>
      <button onClick={onOpenHelp}>open help</button>
    </div>
  ),
}))

vi.mock('@/components/screens/dashboard-screen', () => ({
  DashboardScreen: ({
    onCapture,
    onSeeHistory,
  }: {
    onCapture: () => void
    onSeeHistory: () => void
  }) => (
    <div>
      <p>dashboard screen</p>
      <button onClick={onCapture}>go capture</button>
      <button onClick={onSeeHistory}>go history</button>
    </div>
  ),
}))

vi.mock('@/components/screens/history-screen', () => ({
  HistoryScreen: () => <p>history screen</p>,
}))

describe('AppFrame', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    window.location.hash = ''
  })

  it('renders an accessible shell with skip link and hash section navigation', () => {
    render(<AppFrame />)

    expect(
      screen.getByRole('link', { name: /saltar al contenido/i }),
    ).toHaveAttribute('href', '#main-content')
    expect(
      screen.getByRole('heading', { name: 'Budgeting' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /capturar gasto/i }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: /capturar gasto/i }),
    ).toHaveAttribute('href', '#/capturar')
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute(
      'href',
      '#/inicio',
    )
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute(
      'href',
      '#/historial',
    )
  })

  it('switches sections from hash anchors and toggles dark mode from the app header', () => {
    render(<AppFrame />)

    fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))
    expect(screen.getByText('dashboard screen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.click(screen.getByRole('button', { name: /modo oscuro/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('syncs section state from browser hash changes', () => {
    render(<AppFrame />)

    window.location.hash = '#/historial'
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(screen.getByText('history screen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('toggles the user menu', () => {
    render(<AppFrame />)

    const trigger = screen.getByRole('button', { name: 'nico@budgeting.app' })
    expect(screen.queryByRole('button', { name: /cerrar sesión/i })).not.toBeInTheDocument()

    fireEvent.click(trigger)
    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i })
    expect(logoutBtn).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.queryByRole('button', { name: /cerrar sesión/i })).not.toBeInTheDocument()
  })
})
