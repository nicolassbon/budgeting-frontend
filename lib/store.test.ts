import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageExpenseRepository } from './store'
import type { Expense } from './types'

describe('LocalStorageExpenseRepository data isolation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should isolate expenses between different users', async () => {
    const repo1 = new LocalStorageExpenseRepository('user1@budgeting.app')
    const repo2 = new LocalStorageExpenseRepository('user2@budgeting.app')

    const initialExpenses1 = await repo1.fetchExpenses()
    const initialExpenses2 = await repo2.fetchExpenses()

    const newExpenseForUser1: Omit<Expense, 'id' | 'date'> = {
      description: 'Gasto de usuario 1',
      amount: 1500,
      category: 'GROCERIES',
    }

    const saved1 = await repo1.createExpense(newExpenseForUser1)
    expect(saved1.id).toBeDefined()
    expect(saved1.description).toBe('Gasto de usuario 1')

    const expenses1 = await repo1.fetchExpenses()
    expect(expenses1.length).toBe(initialExpenses1.length + 1)
    expect(expenses1.some((e) => e.id === saved1.id)).toBe(true)

    const expenses2 = await repo2.fetchExpenses()
    expect(expenses2.length).toBe(initialExpenses2.length)
    expect(expenses2.some((e) => e.id === saved1.id)).toBe(false)
  })

  it('should support updating and deleting expenses inside isolated user store', async () => {
    const repo = new LocalStorageExpenseRepository('user@budgeting.app')

    const saved = await repo.createExpense({
      description: 'Café',
      amount: 2500,
      category: 'GROCERIES',
    })

    const updated = await repo.updateExpense(saved.id, {
      description: 'Café con medialunas',
    })

    const all = await repo.fetchExpenses()
    const found = all.find((e) => e.id === saved.id)
    expect(found).toBeDefined()
    expect(found!.description).toBe('Café con medialunas')
    expect(found!.amount).toBe(2500)

    await repo.deleteExpense(saved.id)
    const afterDelete = await repo.fetchExpenses()
    expect(afterDelete.some((e) => e.id === saved.id)).toBe(false)
  })
})
