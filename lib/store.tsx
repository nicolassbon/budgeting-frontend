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
import type { Category, Expense } from './types'
import { useAuth } from './auth'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
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
    const categories: Category[] = ['GROCERIES', 'PHARMA', 'AUTO']
    const urls = categories.map((cat) => `/transactions/${cat}`)

    const responses = await Promise.all(urls.map((url) => fetch(url)))

    for (const res of responses) {
      if (!res.ok) {
        throw new Error(
          `Failed to fetch transactions from backend: status ${res.status}`,
        )
      }
    }

    const dataArrays = await Promise.all(responses.map((res) => res.json()))
    const flattened: Expense[] = []

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      const items = dataArrays[i]
      if (Array.isArray(items)) {
        for (const item of items) {
          flattened.push({
            id: String(item.id),
            description: item.description || '',
            amount: item.amount / 100,
            category: item.category || category,
            date: new Date().toISOString(),
          })
        }
      }
    }

    return flattened
  }

  async createExpense(input: Omit<Expense, 'id' | 'date'>): Promise<Expense> {
    const csrfToken = getCookie('XSRF-TOKEN')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken
    }

    const res = await fetch('/transactions', {
      method: 'POST',
      headers,
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
      date: new Date().toISOString(),
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    return {
      id,
      description: '',
      amount: 0,
      category: 'GROCERIES',
      date: new Date().toISOString(),
      ...updates,
    } as Expense
  }

  async deleteExpense(id: string): Promise<void> {
    return
  }
}

interface StoreValue {
  expenses: Expense[]
  loading: boolean
  addExpense: (input: Omit<Expense, 'id' | 'date'>) => Promise<void>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
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
    repository.fetchExpenses().then((data) => {
      if (active) {
        setExpenses(data)
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
      } finally {
        setLoading(false)
      }
    },
    [repository],
  )

  const updateExpense = useCallback(
    async (id: string, updates: Partial<Expense>) => {
      if (!repository) return
      setLoading(true)
      try {
        const updated = await repository.updateExpense(id, updates)
        setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
      } finally {
        setLoading(false)
      }
    },
    [repository],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!repository) return
      setLoading(true)
      try {
        await repository.deleteExpense(id)
        setExpenses((prev) => prev.filter((e) => e.id !== id))
      } finally {
        setLoading(false)
      }
    },
    [repository],
  )

  const value = useMemo(
    () => ({ expenses, loading, addExpense, updateExpense, deleteExpense }),
    [expenses, loading, addExpense, updateExpense, deleteExpense],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
