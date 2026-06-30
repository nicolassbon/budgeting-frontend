import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const globalsCssPath = join(process.cwd(), 'app', 'globals.css')
const globalsCss = readFileSync(globalsCssPath, 'utf8')

// Regression guard for the dark-mode native <select> option visibility bug:
// when `color-scheme: dark` is active (see lib/theme.ts), Chromium paints native
// <option> elements with light text over a light popup, inheriting the trigger's
// `text-muted-foreground` color. The fix forces native options in dark mode to use
// the semantic popover tokens so options stay legible in both light and dark mode.
describe('app/globals.css — dark mode native <select> option styling', () => {
  it('applies background-color and color to native options in dark mode', () => {
    const darkOptionRule = new RegExp(
      String.raw`\.dark\s+(?:[^{}]+\s+)?option\s*\{[^}]*background-color\s*:\s*var\(--popover\)[^}]*color\s*:\s*var\(--popover-foreground\)[^}]*\}`,
      's',
    )

    expect(globalsCss).toMatch(darkOptionRule)
  })

  it('does not force the same rule globally in light mode', () => {
    // Light mode already renders options legibly with browser defaults;
    // adding a global rule there would override dark-on-light accents.
    const rootOptionRule = /^:root[^{}]*\{[^}]*option\s*\{/m
    expect(globalsCss).not.toMatch(rootOptionRule)
  })
})
