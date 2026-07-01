'use client'

import { Moon, Sun, User, Activity, Terminal } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  applyThemeMode,
  getNextThemeMode,
  readStoredThemeMode,
  type ThemeMode,
} from '@/lib/theme'
import { DashboardScreen } from '@/components/screens/dashboard-screen'
import { HistoryScreen } from '@/components/screens/history-screen'
import { CaptureConsole } from '@/components/capture-console'
import { InsightsScreen } from '@/components/screens/insights-screen'

export type Section = 'inicio' | 'historial' | 'insights'

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'inicio', label: 'Panel' },
  { id: 'historial', label: 'Historial' },
  { id: 'insights', label: 'Insights' },
]

function readSectionFromHash(hash: string): Section | null {
  const section = hash.replace(/^#\//, '')
  return NAV_ITEMS.some((item) => item.id === section)
    ? (section as Section)
    : null
}

export function AppFrame({ onSignOut }: { onSignOut?: () => void }) {
  const { user, signOut } = useAuth()
  const [section, setSection] = useState<Section>('inicio')
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function navigateToSection(nextSection: Section) {
    setSection(nextSection)
    if (window.location.hash !== `#/${nextSection}`) {
      window.location.hash = `#/${nextSection}`
    }
  }

  function toggleTheme() {
    const nextTheme = getNextThemeMode(themeMode)
    setThemeMode(nextTheme)
    applyThemeMode(nextTheme)
  }

  function notifySaved(message: string) {
    setFlashMessage(message)
    setTimeout(() => setFlashMessage(null), 5000)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-[6px] flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <h1
              aria-label="Budgeting"
              className="text-sm font-semibold tracking-tight m-0"
            >
              Budgeting{' '}
              <span className="text-muted-foreground font-normal">
                / {NAV_ITEMS.find((n) => n.id === section)?.label}
              </span>
            </h1>
          </div>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#/${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigateToSection(item.id)
                }}
                aria-current={section === item.id ? 'page' : undefined}
                className={cn(
                  'hover:text-foreground transition-colors',
                  section === item.id && 'text-foreground font-medium',
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={toggleTheme}
            aria-label={
              themeMode === 'dark'
                ? 'Activar modo claro'
                : 'Activar modo oscuro'
            }
          >
            {themeMode === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label={user?.email ?? 'vos@budgeting.app'}
              className="w-8 h-8 rounded-full bg-surface-2 hairline-border flex items-center justify-center hover:bg-accent transition-colors outline-none"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-2 shadow-level-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-mono truncate border-b border-border mb-1">
                  {user?.email ?? 'vos@budgeting.app'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut()
                    onSignOut?.()
                  }}
                >
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-[1440px] mx-auto w-full p-8 pb-32"
      >
        {flashMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-full backdrop-blur-md animate-in fade-in slide-in-from-top-4 shadow-xl">
            {flashMessage}
          </div>
        )}

        {section === 'inicio' && (
          <DashboardScreen
            onCapture={() => {
              window.dispatchEvent(new CustomEvent('focus-capture-console'))
            }}
            onSeeHistory={() => navigateToSection('historial')}
          />
        )}

        {section === 'historial' && (
          <HistoryScreen onUpdated={() => notifySaved('Gasto actualizado.')} />
        )}

        {section === 'insights' && <InsightsScreen />}
      </main>

      <CaptureConsole onSaved={notifySaved} />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </div>
  )
}
