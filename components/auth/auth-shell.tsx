'use client'

import type { ReactNode } from 'react'
import Box from '@cloudscape-design/components/box'
import Container from '@cloudscape-design/components/container'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Image from 'next/image'

const LOGO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 30 30"><rect width="30" height="30" rx="9" fill="#0f766e"/><path d="M9 20V10m0 0h7a3 3 0 0 1 0 6H9m0 0h8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)}`

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-scaled-xl, 24px)',
        background: 'var(--color-background-layout-main, #f4f4f7)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <SpaceBetween size="l">
          <Box textAlign="center">
            <SpaceBetween size="s" alignItems="center">
              <Image src={LOGO} alt="Budgeting width" width={44} height={44} />
              <div>
                <Box variant="h1" padding={{ bottom: 'xxs' }}>
                  {title}
                </Box>
                <Box variant="p" color="text-body-secondary">
                  {subtitle}
                </Box>
              </div>
            </SpaceBetween>
          </Box>

          <Container>{children}</Container>

          <Box textAlign="center" color="text-body-secondary" fontSize="body-s">
            {footer}
          </Box>
        </SpaceBetween>
      </div>
    </div>
  )
}
