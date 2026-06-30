import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HttpExpenseRepository, StoreProvider, useStore } from './store'

const mockUser = {
  id: 'user-1',
  email: 'user@budgeting.app',
}

vi.mock('./auth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

describe('HttpExpenseRepository tests', () => {
  const mockFetch = vi.fn()
  const storeWrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(StoreProvider, null, children)

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=; Max-Age=0'
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchExpenses', () => {
    it('should fetch expenses from GET /transactions and preserve backend dates', async () => {
      const backendFoodDate = '2026-06-20T10:00:00.000Z'
      const backendTransportDate = '2026-06-21T15:30:00.000Z'
      const backendServicesDate = '2026-06-22T09:15:00.000Z'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              id: 1,
              description: 'Leche',
              amount: 15050,
              category: 'COMIDA',
              date: backendFoodDate,
            },
            {
              id: 2,
              description: 'Nafta',
              amount: 500000,
              category: 'TRANSPORTE',
              date: backendTransportDate,
            },
            {
              id: 3,
              description: 'Internet hogar',
              amount: 189000,
              category: 'SERVICIOS',
              date: backendServicesDate,
            },
          ],
          totalAmountCents: 704050,
          totalAmount: 7040.5,
          transactionCount: 3,
        }),
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      const expenses = await repo.fetchExpenses()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/transactions')
      expect(expenses).toEqual([
        {
          id: '1',
          description: 'Leche',
          amount: 150.5,
          category: 'COMIDA',
          date: backendFoodDate,
        },
        {
          id: '2',
          description: 'Nafta',
          amount: 5000,
          category: 'TRANSPORTE',
          date: backendTransportDate,
        },
        {
          id: '3',
          description: 'Internet hogar',
          amount: 1890,
          category: 'SERVICIOS',
          date: backendServicesDate,
        },
      ])
    })

    it('should throw an error if GET /transactions is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      await expect(repo.fetchExpenses()).rejects.toThrow()
    })
  })

  describe('createExpense', () => {
    it('should send POST request to /transactions with CSRF token and preserve backend response date', async () => {
      if (typeof document !== 'undefined') {
        document.cookie = 'XSRF-TOKEN=test-csrf-value'
      }

      const backendDate = '2026-06-24T14:20:00.000Z'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 3,
          description: 'Remedio',
          amount: 20045,
          category: 'FARMACIA',
          date: backendDate,
        }),
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      const saved = await repo.createExpense({
        description: 'Remedio',
        amount: 200.45,
        category: 'FARMACIA',
      })

      expect(mockFetch).toHaveBeenCalledWith('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'test-csrf-value',
        },
        body: JSON.stringify({
          description: 'Remedio',
          category: 'FARMACIA',
          amount: 20045,
        }),
      })

      expect(saved).toEqual({
        id: '3',
        description: 'Remedio',
        amount: 200.45,
        category: 'FARMACIA',
        date: backendDate,
      })
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
          category: 'FARMACIA',
        }),
      ).rejects.toThrow()
    })
  })

  describe('updateExpense', () => {
    it('should omit date from edit payload after fetching an expense and preserve backend response date', async () => {
      const fetchedDate = '2026-06-20T10:00:00.000Z'
      const updatedDate = '2026-06-22T08:45:00.000Z'

      mockFetch.mockImplementation(
        async (input: string, init?: RequestInit) => {
          if (input === '/transactions' && !init) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                items: [
                  {
                    id: 1,
                    description: 'Leche',
                    amount: 15050,
                    category: 'COMIDA',
                    date: fetchedDate,
                  },
                ],
                totalAmountCents: 15050,
                totalAmount: 150.5,
                transactionCount: 1,
              }),
            }
          }

          if (input === '/transactions/1' && init?.method === 'PUT') {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                id: 1,
                description: 'Leche descremada',
                amount: 15050,
                category: 'COMIDA',
                date: updatedDate,
              }),
            }
          }

          return { ok: false, status: 404 }
        },
      )

      const { result } = renderHook(() => useStore(), { wrapper: storeWrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.expenses).toEqual([
        {
          id: '1',
          description: 'Leche',
          amount: 150.5,
          category: 'COMIDA',
          date: fetchedDate,
        },
      ])

      await act(async () => {
        await result.current.updateExpense('1', {
          description: 'Leche descremada',
          amount: 150.5,
          category: 'COMIDA',
        })
      })

      const putCall = mockFetch.mock.calls.find(
        ([url, init]) => url === '/transactions/1' && init?.method === 'PUT',
      )

      expect(putCall).toBeDefined()
      const rawPutBody = putCall?.[1]?.body
      if (typeof rawPutBody !== 'string') {
        throw new Error('Expected PUT request body to be a JSON string')
      }
      let putBody: {
        description: string
        category: string
        amount: number
        date?: string
      }

      try {
        putBody = JSON.parse(rawPutBody) as {
          description: string
          category: string
          amount: number
          date?: string
        }
      } catch (error) {
        throw new Error(`Invalid PUT request body JSON: ${String(error)}`)
      }
      expect(putBody).toEqual({
        description: 'Leche descremada',
        category: 'COMIDA',
        amount: 15050,
      })
      expect(result.current.expenses).toEqual([
        {
          id: '1',
          description: 'Leche descremada',
          amount: 150.5,
          category: 'COMIDA',
          date: updatedDate,
        },
      ])
    })

    it('should send PUT request with centavos payload and preserve backend response date', async () => {
      if (typeof document !== 'undefined') {
        document.cookie = 'XSRF-TOKEN=test-csrf-value'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          description: 'Updated Gasto',
          amount: 30045,
          category: 'COMIDA',
          date: '2026-06-20T10:00:00.000Z',
        }),
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')
      const updated = await repo.updateExpense('1', {
        description: 'Updated Gasto',
        amount: 300.45,
        category: 'COMIDA',
        date: '2026-06-18T09:00:00.000Z',
      })

      expect(mockFetch).toHaveBeenCalledWith('/transactions/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': 'test-csrf-value',
        },
        body: JSON.stringify({
          description: 'Updated Gasto',
          category: 'COMIDA',
          amount: 30045,
          date: '2026-06-18T09:00:00.000Z',
        }),
      })

      expect(updated).toEqual({
        id: '1',
        description: 'Updated Gasto',
        amount: 300.45,
        category: 'COMIDA',
        date: '2026-06-20T10:00:00.000Z',
      })
    })

    it('should throw an error if the update response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const repo = new HttpExpenseRepository('user@budgeting.app')

      await expect(
        repo.updateExpense('1', {
          description: 'Updated Gasto',
          amount: 300,
          category: 'COMIDA',
          date: '2026-06-18T09:00:00.000Z',
        }),
      ).rejects.toThrow()
    })
  })

  describe('deleteExpense', () => {
    it('should remain a client-side no-op without firing HTTP network requests', async () => {
      const repo = new HttpExpenseRepository('user@budgeting.app')

      await expect(repo.deleteExpense('1')).resolves.not.toThrow()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
