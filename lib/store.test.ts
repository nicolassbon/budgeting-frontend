import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HttpExpenseRepository } from './store'

describe('HttpExpenseRepository tests', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=; Max-Age=0'
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchExpenses', () => {
    it('should concurrently fetch expenses from category-specific endpoints and map them correctly', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.endsWith('/transactions/GROCERIES')) {
          return {
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                description: 'Leche',
                amount: 15050,
                category: 'GROCERIES',
              },
            ],
          }
        }
        if (url.endsWith('/transactions/PHARMA')) {
          return {
            ok: true,
            status: 200,
            json: async () => [],
          }
        }
        if (url.endsWith('/transactions/AUTO')) {
          return {
            ok: true,
            status: 200,
            json: async () => [
              { id: 2, description: 'Nafta', amount: 500000, category: 'AUTO' },
            ],
          }
        }
        return { ok: false, status: 404 }
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      const expenses = await repo.fetchExpenses()

      // Verify that all 3 category endpoints were called
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenCalledWith('/transactions/GROCERIES')
      expect(mockFetch).toHaveBeenCalledWith('/transactions/PHARMA')
      expect(mockFetch).toHaveBeenCalledWith('/transactions/AUTO')

      // Verify that the responses are flattened and mapped correctly
      expect(expenses).toHaveLength(2)

      const expense1 = expenses.find((e) => e.id === '1')
      expect(expense1).toBeDefined()
      expect(expense1!.description).toBe('Leche')
      expect(expense1!.amount).toBe(150.5)
      expect(expense1!.category).toBe('GROCERIES')
      expect(new Date(expense1!.date).getTime()).not.toBeNaN()

      const expense2 = expenses.find((e) => e.id === '2')
      expect(expense2).toBeDefined()
      expect(expense2!.description).toBe('Nafta')
      expect(expense2!.amount).toBe(5000)
      expect(expense2!.category).toBe('AUTO')
      expect(new Date(expense2!.date).getTime()).not.toBeNaN()
    })

    it('should throw an error if any of the category requests are not ok', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.endsWith('/transactions/GROCERIES')) {
          return {
            ok: true,
            status: 200,
            json: async () => [],
          }
        }
        if (url.endsWith('/transactions/PHARMA')) {
          return {
            ok: false,
            status: 500,
          }
        }
        if (url.endsWith('/transactions/AUTO')) {
          return {
            ok: true,
            status: 200,
            json: async () => [],
          }
        }
        return { ok: false, status: 404 }
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      await expect(repo.fetchExpenses()).rejects.toThrow()
    })
  })

  describe('createExpense', () => {
    it('should send POST request to /transactions with CSRF token and correct payload structure', async () => {
      if (typeof document !== 'undefined') {
        document.cookie = 'XSRF-TOKEN=test-csrf-value'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 3,
          description: 'Remedio',
          amount: 20045,
          category: 'PHARMA',
        }),
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      const saved = await repo.createExpense({
        description: 'Remedio',
        amount: 200.45,
        category: 'PHARMA',
      })

      expect(mockFetch).toHaveBeenCalledWith('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'test-csrf-value',
        },
        body: JSON.stringify({
          description: 'Remedio',
          category: 'PHARMA',
          amount: 20045,
        }),
      })

      expect(saved.id).toBe('3')
      expect(saved.description).toBe('Remedio')
      expect(saved.amount).toBe(200.45)
      expect(saved.category).toBe('PHARMA')
      expect(new Date(saved.date).getTime()).not.toBeNaN()
    })

    it('should throw an error if the creation response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      await expect(
        repo.createExpense({
          description: 'Remedio',
          amount: 200.45,
          category: 'PHARMA',
        }),
      ).rejects.toThrow()
    })
  })

  describe('no-op operations', () => {
    it('should resolve immediately as successful client-side no-ops without firing HTTP network requests', async () => {
      const repo = new HttpExpenseRepository('user@budgeting.app')

      // updateExpense test
      const updates = { description: 'Updated Gasto', amount: 300 }
      const updated = await repo.updateExpense('1', updates)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(updated.id).toBe('1')
      expect(updated.description).toBe('Updated Gasto')
      expect(updated.amount).toBe(300)

      // deleteExpense test
      await expect(repo.deleteExpense('1')).resolves.not.toThrow()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
