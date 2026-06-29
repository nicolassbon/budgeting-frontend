'use client'

import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { useDashboardStats } from '@/lib/insights'
import { formatARS } from '@/lib/format'
import {
  applyThemeMode,
  getNextThemeMode,
  readStoredThemeMode,
  type ThemeMode,
} from '@/lib/theme'
import { CaptureScreen } from '@/components/screens/capture-screen'
import { DashboardScreen } from '@/components/screens/dashboard-screen'
import { HistoryScreen } from '@/components/screens/history-screen'

export type Section = 'capturar' | 'inicio' | 'historial'

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'capturar', label: 'Capturar gasto' },
  { id: 'inicio', label: 'Inicio' },
  { id: 'historial', label: 'Historial' },
]

function readSectionFromHash(hash: string): Section | null {
  const section = hash.replace(/^#\//, '')

  return NAV_ITEMS.some((item) => item.id === section)
    ? (section as Section)
    : null
}

export function AppFrame({ onSignOut }: { onSignOut?: () => void }) {
  const { user, signOut } = useAuth()
  const { stats } = useDashboardStats()
  const [section, setSection] = useState<Section>('capturar')
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initialTheme = readStoredThemeMode()
    setThemeMode(initialTheme)
    applyThemeMode(initialTheme)
  }, [])

  useEffect(() => {
    function syncSectionFromHash() {
      const sectionFromHash = readSectionFromHash(window.location.hash)

      if (sectionFromHash) {
        setSection(sectionFromHash)
      }
    }

    syncSectionFromHash()
    window.addEventListener('hashchange', syncSectionFromHash)

    return () => window.removeEventListener('hashchange', syncSectionFromHash)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function navigateToSection(nextSection: Section) {
    setSection(nextSection)

    if (window.location.hash !== `#/${nextSection}`) {
      window.location.hash = `#/${nextSection}`
    }
  }

  async function handleSignOut() {
    await signOut()
    onSignOut?.()
  }

  function toggleTheme() {
    const nextTheme = getNextThemeMode(themeMode)
    setThemeMode(nextTheme)
    applyThemeMode(nextTheme)
  }

  function notifySaved(message: string) {
    setFlashMessage(message)
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-background">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 44 44"
                className="rounded-md"
              >
                <rect width="44" height="44" rx="14" className="fill-primary" />
                <path
                  d="M15 29V15m0 0h10a4 4 0 0 1 0 8H15m0 0h12"
                  fill="none"
                  className="stroke-primary-foreground"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-foreground">
                  Budgeting
                </h1>
                <p className="text-xs text-muted-foreground">
                  Registrá tus gastos sin fricción
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                aria-label={themeMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {themeMode === 'dark' ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>

              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground font-mono shadow-level-1 hover:bg-accent hover:text-foreground transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{user?.email ?? 'vos@budgeting.app'}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      userMenuOpen && 'rotate-180',
                    )}
                  />
                </Button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-2 shadow-level-3 z-50 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate font-mono px-1">
                      {user?.email ?? 'vos@budgeting.app'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleSignOut()
                      }}
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-6">
          <div className="space-y-6">
            <nav
              aria-label="Secciones de Budgeting"
              className="space-y-2 pb-4 border-b border-border h-fit"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = section === item.id

                return (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    className={cn(
                      'flex items-center w-full h-10 text-sm transition-colors rounded-md',
                      isActive
                        ? 'text-foreground border-l-2 border-primary pl-[10px] pr-3 ml-[-2px] font-medium bg-transparent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 px-3',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setSection(item.id)}
                  >
                    {item.label}
                  </a>
                )
              })}
            </nav>

            <div className="hidden lg:block bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="text-xs text-muted-foreground">
                Gastado este mes
              </div>
              <div className="text-lg font-semibold font-mono text-foreground">
                {formatARS(stats.total)}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {stats.count} {stats.count === 1 ? 'movimiento' : 'movimientos'}
              </div>
            </div>
          </div>

          <main id="main-content" className="space-y-4">
            {flashMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                {flashMessage}
              </div>
            )}

            {section === 'capturar' && (
              <CaptureScreen
                onSaved={() => {
                  notifySaved('Gasto guardado. Lo vas a ver en tu historial.')
                  navigateToSection('inicio')
                }}
                onOpenHelp={() => {}}
              />
            )}

            {section === 'inicio' && (
              <DashboardScreen
                onCapture={() => navigateToSection('capturar')}
                onSeeHistory={() => navigateToSection('historial')}
              />
            )}

            {section === 'historial' && (
              <HistoryScreen
                onUpdated={() => notifySaved('Gasto actualizado.')}
              />
            )}
          </main>
        </div>
      </div>
    </>
  )
}
