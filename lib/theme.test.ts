import { describe, expect, it, beforeEach } from 'vitest'

import { applyThemeMode, getNextThemeMode } from './theme'

describe('theme helpers', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    localStorage.clear()
  })

  it('toggles between light and dark modes predictably', () => {
    expect(getNextThemeMode('light')).toBe('dark')
    expect(getNextThemeMode('dark')).toBe('light')
  })

  it('applies the dark class and persists the preference', () => {
    applyThemeMode('dark')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('budgeting-theme')).toBe('dark')

    applyThemeMode('light')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('budgeting-theme')).toBe('light')
  })
})
