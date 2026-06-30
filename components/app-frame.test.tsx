import { act, fireEvent, render, screen } from '@testing-library/react'
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

vi.mock('@/lib/store', () => ({
  useStore: () => ({
    expenses: [],
    loading: false,
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
}))

vi.mock('@/components/capture-console', () => {
  const { useState, useEffect } = require('react')
  return {
    CaptureConsole: ({ onSaved }: { onSaved: (msg: string) => void }) => {
      const [isOpen, setIsOpen] = useState(false)
      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault()
            setIsOpen((prev: boolean) => !prev)
          }
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }
        const handleFocusEvent = () => {
          setIsOpen(true)
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('focus-capture-console', handleFocusEvent)
        return () => {
          window.removeEventListener('keydown', handleKeyDown)
          window.removeEventListener('focus-capture-console', handleFocusEvent)
        }
      }, [])

      return (
        <div>
          <button aria-label="Capturar gasto" onClick={() => setIsOpen(true)}>
            Capturar gasto
          </button>
          {isOpen && (
            <div role="dialog" aria-label="Capturar gasto">
              <p>modal open</p>
              <button onClick={() => onSaved('saved')}>simulate save</button>
            </div>
          )}
        </div>
      )
    },
  }
})

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

    // Default section is 'inicio' → Panel link is active
    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute(
      'href',
      '#/inicio',
    )
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute(
      'href',
      '#/historial',
    )
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute(
      'href',
      '#/insights',
    )
  })

  it('switches sections from hash anchors and toggles dark mode from the app header', () => {
    render(<AppFrame />)

    fireEvent.click(screen.getByRole('link', { name: 'Historial' }))
    expect(screen.getByText('history screen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute(
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
    expect(
      screen.queryByRole('button', { name: /cerrar sesión/i }),
    ).not.toBeInTheDocument()

    fireEvent.click(trigger)
    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i })
    expect(logoutBtn).toBeInTheDocument()

    fireEvent.click(trigger)
    expect(
      screen.queryByRole('button', { name: /cerrar sesión/i }),
    ).not.toBeInTheDocument()
  })

  it('opens modal via Ctrl+K keyboard shortcut', () => {
    render(<AppFrame />)

    // Modal should not be open
    expect(screen.queryByText('modal open')).not.toBeInTheDocument()

    // Trigger Ctrl+K keydown — opens modal
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
    expect(screen.getByText('modal open')).toBeInTheDocument()

    // Trigger Ctrl+K keydown again — closes modal
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
    expect(screen.queryByText('modal open')).not.toBeInTheDocument()
  })

  it('opens modal when Dashboard CTA dispatches focus-capture-console', () => {
    render(<AppFrame />)

    expect(screen.queryByText('modal open')).not.toBeInTheDocument()

    // Click "go capture" button on mocked dashboard screen
    fireEvent.click(screen.getByRole('button', { name: 'go capture' }))

    expect(screen.getByText('modal open')).toBeInTheDocument()
  })
})
