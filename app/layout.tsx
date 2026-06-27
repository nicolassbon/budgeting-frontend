import type { Metadata } from 'next'
// Cloudscape global styles: Open Sans font + the system's typography/color baseline.
// This import must happen once, at the application root.
import '@cloudscape-design/global-styles/index.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budgeting — Control de gastos',
  description:
    'Registrá tus gastos cotidianos con la menor fricción posible. Contá o dictá tu gasto y guardalo en segundos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  )
}
