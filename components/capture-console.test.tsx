import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CATEGORIES, translateCategory } from '@/lib/types'

import { CaptureConsole } from './capture-console'

const addExpense = vi.fn()
const mockFetch = vi.fn()

vi.mock('@/lib/store', () => ({
  useStore: () => ({
    addExpense,
  }),
}))

vi.mock('@/lib/format', () => ({
  mockCaptureService: {
    interpretText: vi.fn().mockResolvedValue({
      description: 'Coto supermercado',
      amount: 32500,
      category: 'COMIDA',
    }),
  },
}))

let lastSpeechInstance: any = null

class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onstart = () => {}
  onresult = (_event: any) => {}
  onerror = (_event: any) => {}
  onend = () => {}
  constructor() {
    lastSpeechInstance = this
  }
  start() {
    this.onstart()
  }
  stop() {
    this.onend()
  }
}

describe('CaptureConsole', () => {
  beforeEach(() => {
    addExpense.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('Floating trigger button', () => {
    it('renders the trigger button with label and shortcut badge', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      const trigger = screen.getByLabelText('Capturar gasto')
      expect(trigger).toBeInTheDocument()
      expect(screen.getByText('Capturar gasto')).toBeInTheDocument()
    })

    it('opens the modal in idle state when trigger button is clicked', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))

      expect(
        screen.getByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Iniciar grabación')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Subir archivo de audio'),
      ).toBeInTheDocument()
    })
  })

  describe('Keyboard shortcut Ctrl+K', () => {
    it('toggles the modal open and closed via Ctrl+K', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      // Open modal
      fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
      expect(
        screen.getByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).toBeInTheDocument()

      // Close modal
      fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
      expect(
        screen.queryByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Custom event focus-capture-console', () => {
    it('opens the modal in idle state on focus-capture-console event', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      act(() => {
        window.dispatchEvent(new CustomEvent('focus-capture-console'))
      })

      expect(
        screen.getByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).toBeInTheDocument()
    })
  })

  describe('Escape key', () => {
    it('closes the modal when Escape is pressed', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      expect(
        screen.getByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(
        screen.queryByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).not.toBeInTheDocument()
    })
  })

  describe('State 1: Idle capture', () => {
    it('shows welcome text, mic button, and file upload button', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))

      expect(
        screen.getByText('Contanos tu gasto y nosotros te lo cargamos'),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Iniciar grabación')).toBeInTheDocument()
      expect(
        screen.getByLabelText('Subir archivo de audio'),
      ).toBeInTheDocument()
    })

    it('transitions to recording state when mic button is clicked', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      expect(screen.getByText('Grabando audio...')).toBeInTheDocument()
      expect(screen.getByTestId('wave-bars')).toBeInTheDocument()
    })
  })

  describe('State 2: Recording / Processing', () => {
    it('shows wave bars and stop button during recording', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      expect(screen.getByTestId('wave-bars')).toBeInTheDocument()
      expect(screen.getByLabelText('Detener grabación')).toBeInTheDocument()
    })

    it('shows processing indicator during interpretation', () => {
      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      // Simulate speech result
      act(() => {
        lastSpeechInstance.onresult({
          results: [[{ transcript: '70 mil en el super' }]],
        })
      })

      // Click stop to transition to processing
      fireEvent.click(screen.getByLabelText('Detener grabación'))

      expect(screen.getByText('Interpretando datos...')).toBeInTheDocument()
    })
  })

  describe('State 3: Confirm draft', () => {
    it('shows editable form with amount, category, description and action buttons', async () => {
      const { mockCaptureService } = await import('@/lib/format')
      ;(
        mockCaptureService.interpretText as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        description: 'Coto supermercado',
        amount: 32500,
        category: 'COMIDA',
      })

      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      // Simulate speech result
      act(() => {
        lastSpeechInstance.onresult({
          results: [[{ transcript: 'coto supermercado' }]],
        })
      })

      // Click stop to transition to processing
      fireEvent.click(screen.getByLabelText('Detener grabación'))

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Confirmar Gasto' }),
        ).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Monto')).toHaveValue(32500)
      expect(screen.getByLabelText('Categoría')).toHaveTextContent('Comida')
      expect(screen.getByLabelText('Descripción')).toHaveValue(
        'Coto supermercado',
      )
    })

    it('awaits save before closing the modal and notifying success', async () => {
      const onSaved = vi.fn()
      let resolveExpense: (() => void) | undefined
      addExpense.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveExpense = resolve
          }),
      )
      const { mockCaptureService } = await import('@/lib/format')
      ;(
        mockCaptureService.interpretText as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        description: 'Coto supermercado',
        amount: 32500,
        category: 'COMIDA',
      })

      render(<CaptureConsole onSaved={onSaved} />)

      // Open modal and trigger recording
      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      // We need to simulate the speech recognition result.
      // Since MockSpeechRecognition is constructed inside the component,
      // we can't easily access the instance from outside. Let's test the
      // draft flow by directly verifying the file upload path instead.
      // File upload is more testable since we control fetch.

      // Test via file upload path
      // Close and reopen
      fireEvent.keyDown(window, { key: 'Escape' })
      fireEvent.click(screen.getByLabelText('Capturar gasto'))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'gasté 32500 en coto supermercado',
      })

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      const file = new File(['audio-data'], 'test.mp3', { type: 'audio/mp3' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Confirmar Gasto' }),
        ).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Monto')).toHaveValue(32500)
      expect(screen.getByLabelText('Categoría')).toHaveTextContent('Comida')
      expect(screen.getByLabelText('Descripción')).toHaveValue(
        'Coto supermercado',
      )

      fireEvent.click(screen.getByRole('button', { name: 'Confirmar Gasto' }))

      expect(addExpense).toHaveBeenCalledWith({
        description: 'Coto supermercado',
        amount: 32500,
        category: 'COMIDA',
      })
      expect(
        screen.getByRole('button', { name: 'Guardando...' }),
      ).toBeDisabled()
      expect(onSaved).not.toHaveBeenCalled()
      expect(
        screen.getByRole('heading', { name: 'Confirmar Gasto' }),
      ).toBeInTheDocument()

      resolveExpense?.()

      await waitFor(() => {
        expect(onSaved).toHaveBeenCalledWith(
          'Gasto guardado. Lo vas a ver en tu historial.',
        )
      })

      expect(
        screen.queryByRole('heading', { name: 'Confirmar Gasto' }),
      ).not.toBeInTheDocument()
    })

    it('keeps the draft open and shows an error when save fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const onSaved = vi.fn()
      addExpense.mockRejectedValueOnce(new Error('backend down'))

      const { mockCaptureService } = await import('@/lib/format')
      ;(
        mockCaptureService.interpretText as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        description: 'Factura de internet',
        amount: 18900,
        category: 'SERVICIOS',
      })

      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      act(() => {
        lastSpeechInstance.onresult({
          results: [[{ transcript: 'factura de internet 18900' }]],
        })
      })

      fireEvent.click(screen.getByLabelText('Detener grabación'))

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Confirmar Gasto' }),
        ).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Categoría')).toHaveTextContent('Servicios')

      fireEvent.click(screen.getByRole('button', { name: 'Confirmar Gasto' }))

      await waitFor(() => {
        expect(
          screen.getByText('No pudimos guardar el gasto. Probá de nuevo.'),
        ).toBeInTheDocument()
      })

      expect(onSaved).not.toHaveBeenCalled()
      expect(
        screen.getByRole('heading', { name: 'Confirmar Gasto' }),
      ).toBeInTheDocument()

      consoleError.mockRestore()
    })

    it('discards draft and closes modal on Descartar click', async () => {
      const onSaved = vi.fn()
      const { mockCaptureService } = await import('@/lib/format')
      ;(
        mockCaptureService.interpretText as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        description: 'Farmacia compra',
        amount: 5000,
        category: 'FARMACIA',
      })

      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'farmacia compra 5000',
      })

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      const file = new File(['audio-data'], 'test.mp3', { type: 'audio/mp3' })
      Object.defineProperty(fileInput, 'files', { value: [file] })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Confirmar Gasto' }),
        ).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))

      expect(addExpense).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('heading', { name: 'Confirmar Gasto' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Unsupported speech recognition', () => {
    it('shows error message when speech recognition is not available', () => {
      vi.stubGlobal('SpeechRecognition', undefined)
      vi.stubGlobal('webkitSpeechRecognition', undefined)

      const onSaved = vi.fn()
      render(<CaptureConsole onSaved={onSaved} />)

      fireEvent.click(screen.getByLabelText('Capturar gasto'))
      fireEvent.click(screen.getByLabelText('Iniciar grabación'))

      expect(
        screen.getByText(
          'El reconocimiento de voz no está soportado en este navegador.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('renders all backend-supported categories in the draft selector', async () => {
    const { mockCaptureService } = await import('@/lib/format')
    ;(
      mockCaptureService.interpretText as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      description: 'Factura de internet',
      amount: 18900,
      category: 'SERVICIOS',
    })

    render(<CaptureConsole onSaved={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Capturar gasto'))
    fireEvent.click(screen.getByLabelText('Iniciar grabación'))

    act(() => {
      lastSpeechInstance.onresult({
        results: [[{ transcript: 'factura de internet 18900' }]],
      })
    })

    fireEvent.click(screen.getByLabelText('Detener grabación'))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Confirmar Gasto' }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Categoría'))

    for (const category of CATEGORIES) {
      expect(
        screen.getByRole('button', { name: translateCategory(category) }),
      ).toBeInTheDocument()
    }
  })
})
