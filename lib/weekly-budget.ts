'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export interface WeeklyBudget {
  amount: number
  updatedAt: string
}

export interface WeeklyBudgetRepository {
  read: (email: string) => Promise<WeeklyBudget | null>
  write: (email: string, amount: number) => Promise<WeeklyBudget | null>
  clear: (email: string) => Promise<WeeklyBudget | null>
}

export type WeeklyBudgetStatus = 'healthy' | 'warning' | 'exceeded'

export interface WeeklyBudgetSummary {
  spent: number
  remaining: number
  percentUsed: number
  status: WeeklyBudgetStatus
  title: string
  message: string
}

export function weeklyBudgetKey(email: string): string {
  return `budgeting_weekly_budget_${email}`
}

function isWeeklyBudget(value: unknown): value is WeeklyBudget {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WeeklyBudget).amount === 'number' &&
    Number.isFinite((value as WeeklyBudget).amount) &&
    typeof (value as WeeklyBudget).updatedAt === 'string'
  )
}

export function readWeeklyBudget(email: string): WeeklyBudget | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(weeklyBudgetKey(email))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return isWeeklyBudget(parsed) ? parsed : null
  } catch (error) {
    console.warn('Invalid weekly budget stored in localStorage:', error)
    return null
  }
}

export function writeWeeklyBudget(email: string, amount: number): void {
  if (typeof window === 'undefined') return

  const budget: WeeklyBudget = {
    amount,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(weeklyBudgetKey(email), JSON.stringify(budget))
}

export function summarizeWeeklyBudget(
  budget: WeeklyBudget,
  spent: number,
): WeeklyBudgetSummary {
  const percentUsed =
    budget.amount === 0
      ? spent > 0
        ? 999
        : 0
      : Math.min(Math.round((spent / budget.amount) * 100), 999)
  const status: WeeklyBudgetStatus =
    percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'healthy'
  const remaining = Math.max(budget.amount - spent, 0)

  switch (status) {
    case 'exceeded':
      return {
        spent,
        remaining,
        percentUsed,
        status,
        title: 'Presupuesto excedido',
        message: 'Ya superaste tu presupuesto semanal. Revisá próximos gastos.',
      }
    case 'warning':
      return {
        spent,
        remaining,
        percentUsed,
        status,
        title: 'Atención al presupuesto',
        message: 'Estás cerca del límite semanal. Priorizá los gastos clave.',
      }
    case 'healthy':
      return {
        spent,
        remaining,
        percentUsed,
        status,
        title: 'Presupuesto saludable',
        message: 'Venís dentro del presupuesto semanal.',
      }
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function mapBackendWeeklyBudget(value: unknown): WeeklyBudget | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('amount' in value) ||
    value.amount === null
  ) {
    return null
  }

  return typeof value.amount === 'number' && Number.isFinite(value.amount)
    ? { amount: value.amount, updatedAt: new Date().toISOString() }
    : null
}

async function requestBackendWeeklyBudget(
  init?: RequestInit,
): Promise<WeeklyBudget | null> {
  const response = init
    ? await fetch('/auth/me/weekly-budget', init)
    : await fetch('/auth/me/weekly-budget')
  if (!response.ok) {
    throw new Error(`Weekly budget request failed: status ${response.status}`)
  }

  return mapBackendWeeklyBudget(await response.json())
}

export const localStorageWeeklyBudgetRepository: WeeklyBudgetRepository = {
  read: async (email) => readWeeklyBudget(email),
  write: async (email, amount) => {
    writeWeeklyBudget(email, amount)
    return readWeeklyBudget(email)
  },
  clear: async (email) => {
    if (typeof window === 'undefined') return null
    window.localStorage.removeItem(weeklyBudgetKey(email))
    return null
  },
}

export const backendWeeklyBudgetRepository: WeeklyBudgetRepository = {
  read: async () => requestBackendWeeklyBudget(),
  write: async (_email, amount) => {
    const xsrf = getCookie('XSRF-TOKEN')
    return requestBackendWeeklyBudget({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf || '',
      },
      body: JSON.stringify({ amount }),
    })
  },
  clear: async () => {
    const xsrf = getCookie('XSRF-TOKEN')
    return requestBackendWeeklyBudget({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf || '',
      },
      body: JSON.stringify({ amount: null }),
    })
  },
}

export function createWeeklyBudgetRepository(
  useBackend = process.env.NEXT_PUBLIC_USE_BACKEND_WEEKLY_BUDGET,
): WeeklyBudgetRepository {
  return useBackend?.toLowerCase() === 'false'
    ? localStorageWeeklyBudgetRepository
    : backendWeeklyBudgetRepository
}

export function useWeeklyBudget(email: string): {
  budget: WeeklyBudget | null
  setAmount: (amount: number) => void
  clear: () => void
} {
  const repository = useMemo(() => createWeeklyBudgetRepository(), [])
  const [budget, setBudget] = useState<WeeklyBudget | null>(() =>
    repository === localStorageWeeklyBudgetRepository
      ? readWeeklyBudget(email)
      : null,
  )

  useEffect(() => {
    if (repository === localStorageWeeklyBudgetRepository) {
      setBudget(readWeeklyBudget(email))
      return
    }

    let active = true

    repository
      .read(email)
      .then((storedBudget) => {
        if (active) setBudget(storedBudget)
      })
      .catch((error) => {
        console.error('Failed to read weekly budget:', error)
        if (active) setBudget(null)
      })

    return () => {
      active = false
    }
  }, [email, repository])

  const setAmount = useCallback(
    (amount: number) => {
      if (repository === localStorageWeeklyBudgetRepository) {
        writeWeeklyBudget(email, amount)
        setBudget(readWeeklyBudget(email))
        return
      }

      setBudget({ amount, updatedAt: new Date().toISOString() })
      void repository
        .write(email, amount)
        .then(setBudget)
        .catch((error) => {
          console.error('Failed to write weekly budget:', error)
        })
    },
    [email, repository],
  )

  const clear = useCallback(() => {
    if (repository === localStorageWeeklyBudgetRepository) {
      window.localStorage.removeItem(weeklyBudgetKey(email))
      setBudget(null)
      return
    }

    setBudget(null)
    void repository.clear(email).catch((error) => {
      console.error('Failed to clear weekly budget:', error)
    })
  }, [email, repository])

  return { budget, setAmount, clear }
}
