export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'budgeting-theme'

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
  return mode === 'light' ? 'dark' : 'light'
}

export function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  if (typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
}
