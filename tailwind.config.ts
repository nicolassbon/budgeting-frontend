import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 18px 50px -20px rgba(15, 23, 42, 0.28)',
        l1: 'var(--shadow-l1)',
        l2: 'var(--shadow-l2)',
        l3: 'var(--shadow-l3)',
        l4: 'var(--shadow-l4)',
        l5: 'var(--shadow-l5)',
        'level-1': 'var(--shadow-l1)',
        'level-2': 'var(--shadow-l2)',
        'level-3': 'var(--shadow-l3)',
        'level-4': 'var(--shadow-l4)',
        'level-5': 'var(--shadow-l5)',
      },
    },
  },
  plugins: [tailwindAnimate],
}

export default config
