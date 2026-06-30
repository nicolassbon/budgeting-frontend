'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isCategory, type Category, type Expense } from './types'
import { useAuth } from './auth'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function buildMutationHeaders(): Record<string, string> {
  const csrfToken = getCookie('XSRF-TOKEN')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken
  }

  return headers
}

export interface ExpenseRepository {
  fetchExpenses(): Promise<Expense[]>
  createExpense(expense: Omit<Expense, 'id' | 'date'>): Promise<Expense>
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
}

export class HttpExpenseRepository implements ExpenseRepository {
  constructor(public email?: string) {}

  async fetchExpenses(): Promise<Expense[]> {
    const res = await fetch('/transactions')

    if (!res.ok) {
      throw new Error(
        `Failed to fetch transactions from backend: status ${res.status}`,
      )
    }

    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []

    return items
      .filter((item: { category?: unknown }) => isCategory(item.category))
      .map(
        (item: {
          id: string | number
          description?: string
          amount: number
          category: Category
          date?: string
        }) => ({
          id: String(item.id),
          description: item.description || '',
          amount: item.amount / 100,
          category: item.category,
          date: item.date || new Date().toISOString(),
        }),
      )
  }

  async createExpense(input: Omit<Expense, 'id' | 'date'>): Promise<Expense> {
    const res = await fetch('/transactions', {
      method: 'POST',
      headers: buildMutationHeaders(),
      body: JSON.stringify({
        description: input.description,
        category: input.category,
        amount: Math.round(input.amount * 100),
      }),
    })

    if (!res.ok) {
      throw new Error(
        `Failed to create expense in backend: status ${res.status}`,
      )
    }

    const data = await res.json()
    return {
      id: String(data.id),
      description: data.description || input.description,
      amount: data.amount / 100,
      category: data.category || input.category,
      date: data.date || new Date().toISOString(),
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const body: {
      description?: string
      category?: Category
      amount?: number
      date?: string
    } = {
      description: updates.description,
      category: updates.category,
      amount:
        updates.amount !== undefined
          ? Math.round(updates.amount * 100)
          : undefined,
    }

    if (updates.date !== undefined) {
      body.date = updates.date
    }

    const res = await fetch(`/transactions/${id}`, {
      method: 'PUT',
      headers: buildMutationHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `Failed to update expense in backend: status ${res.status}`,
      )
    }

    const data = await res.json()
    return {
      id: String(data.id ?? id),
      description: data.description || updates.description || '',
      amount: data.amount / 100,
      category: data.category || updates.category || 'COMIDA',
      date: data.date || updates.date || new Date().toISOString(),
    } as Expense
  }

  async deleteExpense(id: string): Promise<void> {
    return
  }
}

interface StoreValue {
  expenses: Expense[]
  loading: boolean
  expenseMutationsVersion: number
  addExpense: (input: Omit<Expense, 'id' | 'date'>) => Promise<void>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseMutationsVersion, setExpenseMutationsVersion] = useState(0)
  const [loading, setLoading] = useState(true)

  const repository = useMemo(() => {
    if (!user) return null
    return new HttpExpenseRepository(user.email)
  }, [user])

  useEffect(() => {
    if (!repository) {
      setExpenses([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    repository
      .fetchExpenses()
      .then((data) => {
        if (active) {
          setExpenses(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [repository])

  const addExpense = useCallback(
    async (input: Omit<Expense, 'id' | 'date'>) => {
      if (!repository) return
      setLoading(true)
      try {
        const newExpense = await repository.createExpense(input)
        setExpenses((prev) => [newExpense, ...prev])
        setExpenseMutationsVersion((prev) => prev + 1)
      } finally {
        setLoading(false)
      }
    },
    [repository],
  )

  const updateExpense = useCallback(
    async (id: string, updates: Partial<Expense>) => {
      if (!repository) return
      const currentExpense = expenses.find((expense) => expense.id === id)
      const payload: Partial<Expense> = {
        description: updates.description ?? currentExpense?.description,
        amount: updates.amount ?? currentExpense?.amount,
        category: updates.category ?? currentExpense?.category,
      }

      if (updates.date !== undefined) {
        payload.date = updates.date
      }

      setLoading(true)
      try {
        const updated = await repository.updateExpense(id, payload)
        setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
        setExpenseMutationsVersion((prev) => prev + 1)
      } finally {
        setLoading(false)
      }
    },
    [expenses, repository],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!repository) return
      setLoading(true)
      try {
        await repository.deleteExpense(id)
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        setExpenseMutationsVersion((prev) => prev + 1)
      } finally {
        setLoading(false)
      }
    },
    [repository],
  )

  const value = useMemo(
    () => ({
      expenses,
      loading,
      expenseMutationsVersion,
      addExpense,
      updateExpense,
      deleteExpense,
    }),
    [
      expenses,
      loading,
      expenseMutationsVersion,
      addExpense,
      updateExpense,
      deleteExpense,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
