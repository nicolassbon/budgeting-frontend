'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Category, Expense } from './types'

// ---- helpers -------------------------------------------------------------

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
      category: 'Supermercado',
      date: daysAgo(1),
    },
    {
      id: id(),
      description: 'Nafta YPF',
      amount: 45000,
      category: 'Auto',
      date: daysAgo(2),
    },
    {
      id: id(),
      description: 'Ibuprofeno y vitaminas',
      amount: 12300,
      category: 'Farmacia',
      date: daysAgo(3),
    },
    {
      id: id(),
      description: 'Verdulería del barrio',
      amount: 18700,
      category: 'Supermercado',
      date: daysAgo(5),
    },
    {
      id: id(),
      description: 'Peaje autopista',
      amount: 4200,
      category: 'Auto',
      date: daysAgo(6),
    },
    {
      id: id(),
      description: 'Carrefour',
      amount: 96200,
      category: 'Supermercado',
      date: daysAgo(9),
    },
    {
      id: id(),
      description: 'Protector solar',
      amount: 21500,
      category: 'Farmacia',
      date: daysAgo(12),
    },
    {
      id: id(),
      description: 'Cochera mensual',
      amount: 38000,
      category: 'Auto',
      date: daysAgo(14),
    },
    {
      id: id(),
      description: 'Almacén de la esquina',
      amount: 9600,
      category: 'Supermercado',
      date: daysAgo(18),
    },
  ]
}

// ---- context -------------------------------------------------------------

interface StoreValue {
  expenses: Expense[]
  addExpense: (input: {
    description: string
    amount: number
    category: Category
  }) => void
  updateExpense: (
    id: string,
    input: { description: string; amount: number; category: Category },
  ) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => seedExpenses())

  const addExpense = useCallback<StoreValue['addExpense']>((input) => {
    setExpenses((prev) => [
      { id: id(), date: new Date().toISOString(), ...input },
      ...prev,
    ])
  }, [])

  const updateExpense = useCallback<StoreValue['updateExpense']>(
    (expenseId, input) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, ...input } : e)),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({ expenses, addExpense, updateExpense }),
    [expenses, addExpense, updateExpense],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
