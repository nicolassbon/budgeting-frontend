'use client'

import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={64}
            height={64}
            viewBox="0 0 44 44"
            className="mx-auto"
          >
            <rect width="44" height="44" className="rounded-lg fill-primary" rx="8" />
            <path
              d="M15 29V15m0 0h10a4 4 0 0 1 0 8H15m0 0h12"
              fill="none"
              className="stroke-primary-foreground"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Card className="bg-card border-border rounded-lg shadow-level-4 p-8">
          <CardHeader className="sr-only">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">{children}</CardContent>
          <CardFooter className="justify-center p-0 pt-6 text-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
