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

function id() {
  return Math.random().toString(36).slice(2, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function seedExpenses(): Expense[] {
  return [
    {
      id: id(),
      description: 'Compra semanal en el super',
      amount: 84500,
      category: 'GROCERIES',
      date: daysAgo(1),
    },
    {
      id: id(),
      description: 'Nafta YPF',
      amount: 45000,
      category: 'AUTO',
      date: daysAgo(2),
    },
    {
      id: id(),
      description: 'Ibuprofeno y vitaminas',
      amount: 12300,
      category: 'PHARMA',
      date: daysAgo(3),
    },
    {
      id: id(),
      description: 'Verdulería del barrio',
      amount: 18700,
      category: 'GROCERIES',
      date: daysAgo(5),
    },
    {
      id: id(),
      description: 'Peaje autopista',
      amount: 4200,
      category: 'AUTO',
      date: daysAgo(6),
    },
    {
      id: id(),
      description: 'Carrefour',
      amount: 96200,
      category: 'GROCERIES',
      date: daysAgo(9),
    },
    {
      id: id(),
      description: 'Protector solar',
      amount: 21500,
      category: 'PHARMA',
      date: daysAgo(12),
    },
    {
      id: id(),
      description: 'Cochera mensual',
      amount: 38000,
      category: 'AUTO',
      date: daysAgo(14),
    },
    {
      id: id(),
      description: 'Almacén de la esquina',
      amount: 9600,
      category: 'GROCERIES',
      date: daysAgo(18),
    },
  ]
}

export interface ExpenseRepository {
  fetchExpenses(): Promise<Expense[]>
  createExpense(expense: Omit<Expense, 'id' | 'date'>): Promise<Expense>
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>
  deleteExpense(id: string): Promise<void>
}

export class LocalStorageExpenseRepository implements ExpenseRepository {
  private key: string

  constructor(email: string) {
    this.key = `budgeting_expenses_${email}`
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem(this.key)
        if (!existing) {
          localStorage.setItem(this.key, JSON.stringify(seedExpenses()))
        }
      } catch (e) {
        console.error('Failed to seed expenses', e)
      }
    }
  }

  async fetchExpenses(): Promise<Expense[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return this.fetchExpensesDirect()
  }

  async createExpense(input: Omit<Expense, 'id' | 'date'>): Promise<Expense> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newExpense: Expense = {
      id: id(),
      date: new Date().toISOString(),
      ...input,
    }
    if (typeof window === 'undefined') return newExpense
    try {
      const expenses = this.fetchExpensesDirect()
      const updated = [newExpense, ...expenses]
      localStorage.setItem(this.key, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to create expense', e)
    }
    return newExpense
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (typeof window === 'undefined') {
      return {
        id,
        description: '',
        amount: 0,
        category: 'GROCERIES',
        date: '',
        ...updates,
      } as Expense
    }
    const expenses = this.fetchExpensesDirect()
    let updatedExpense: Expense | null = null
    const updated = expenses.map((e) => {
      if (e.id === id) {
        updatedExpense = { ...e, ...updates }
        return updatedExpense
      }
      return e
    })
    if (!updatedExpense) {
      throw new Error(`Expense with id ${id} not found`)
    }
    localStorage.setItem(this.key, JSON.stringify(updated))
    return updatedExpense
  }

  async deleteExpense(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (typeof window === 'undefined') return
    try {
      const expenses = this.fetchExpensesDirect()
      const updated = expenses.filter((e) => e.id !== id)
      localStorage.setItem(this.key, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to delete expense', e)
    }
  }

  private fetchExpensesDirect(): Expense[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(this.key)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to fetch expenses direct', e)
      return []
    }
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
    return new LocalStorageExpenseRepository(user.email)
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
