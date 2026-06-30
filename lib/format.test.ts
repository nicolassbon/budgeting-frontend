import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatARS,
  formatDate,
  interpretExpense,
  HttpCaptureService,
} from './format'

describe('format utilities', () => {
  it('should format ARS amounts', () => {
    expect(formatARS(70000)).toBe('$ 70.000')
    expect(formatARS(null)).toBe('$ —')
  })

  it('should format ISO dates to dd/MM/yyyy', () => {
    const d = new Date('2026-06-27T12:00:00.000Z')
    const formatted = formatDate(d.toISOString())
    expect(formatted).toBe('27/06/2026')
  })

  it('should interpret simple expense prompts', () => {
    const res = interpretExpense('70 mil en el super')
    expect(res.amount).toBe(70000)
    expect(res.category).toBe('COMIDA')
  })
})

describe('HttpCaptureService', () => {
  const mockFetch = vi.fn()

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

  it('should send POST request to /transactions/interpret with CSRF token and payload', async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'XSRF-TOKEN=test-csrf-interpret'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        description: 'Supermercado Coto',
        amount: 3500,
        category: 'COMIDA',
      }),
    })

    const service = new HttpCaptureService()
    const res = await service.interpretText('supermercado 3500')

    expect(mockFetch).toHaveBeenCalledWith('/transactions/interpret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': 'test-csrf-interpret',
      },
      body: JSON.stringify({ prompt: 'supermercado 3500' }),
    })

    expect(res).toEqual({
      description: 'Supermercado Coto',
      amount: 3500,
      category: 'COMIDA',
    })
  })

  it('should map invalid or null fields properly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        description: null,
        amount: null,
        category: 'INVALID_CATEGORY',
      }),
    })

    const service = new HttpCaptureService()
    const res = await service.interpretText('Some raw prompt')

    expect(res).toEqual({
      description: 'Some raw prompt',
      amount: null,
      category: null,
    })

    // Test with empty string description fallback
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        description: '',
        amount: undefined,
        category: undefined,
      }),
    })

    const res2 = await service.interpretText('Other raw prompt')
    expect(res2).toEqual({
      description: 'Other raw prompt',
      amount: null,
      category: null,
    })
  })

  it('should throw an error when fetch response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const service = new HttpCaptureService()
    await expect(service.interpretText('hello')).rejects.toThrow(
      'Failed to interpret expense: status 500',
    )
  })
})
