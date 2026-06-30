'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Paperclip, Square, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockCaptureService } from '@/lib/format'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, translateCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

type ModalState = 'idle' | 'recording' | 'processing' | 'draft'

interface CaptureConsoleProps {
  onSaved: (message: string) => void
}

export function CaptureConsole({ onSaved }: CaptureConsoleProps) {
  const { addExpense } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const [isOpen, setIsOpen] = useState(false)
  const [modalState, setModalState] = useState<ModalState>('idle')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState<{
    description: string
    amount: string
    category: Category | ''
  } | null>(null)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isOpenRef = useRef(isOpen)
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Open modal in idle state
  const openModal = useCallback(() => {
    setIsOpen(true)
    setModalState('idle')
    setErrorMessage(null)
    setDraft(null)
    setIsSaving(false)
  }, [])

  // Close modal and reset everything
  const closeModal = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // noop
    }
    setIsOpen(false)
    setModalState('idle')
    setErrorMessage(null)
    setDraft(null)
    setIsCategoryDropdownOpen(false)
    setIsSaving(false)
  }, [])

  const interpretTextDirectly = useCallback(async (rawText: string) => {
    if (!rawText.trim()) {
      setModalState('idle')
      setErrorMessage('No pudimos transcribir el audio.')
      return
    }
    setModalState('processing')
    try {
      const result = await mockCaptureService.interpretText(rawText)
      setDraft({
        description: result.description,
        amount: result.amount !== null ? String(result.amount) : '',
        category: result.category ?? '',
      })
      setModalState('draft')
    } catch {
      setModalState('idle')
      setErrorMessage('No pudimos transcribir el audio.')
    }
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition)

    if (!SpeechRecognition) {
      setErrorMessage(
        'El reconocimiento de voz no está soportado en este navegador.',
      )
      return
    }

    setErrorMessage(null)
    transcriptRef.current = ''
    setLiveTranscript('')

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-AR'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setModalState('recording')
      }

      recognition.onresult = (event: any) => {
        let accumulated = ''
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript
        }
        transcriptRef.current = accumulated
        setLiveTranscript(accumulated)
      }

      recognition.onerror = () => {
        setModalState('idle')
        setErrorMessage('No pudimos transcribir el audio.')
      }

      recognition.onend = () => {
        // Continuous mode may auto-restart; no action needed here.
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setModalState('idle')
      setErrorMessage('No pudimos transcribir el audio.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // noop
    }
    const accumulated = transcriptRef.current.trim()
    if (accumulated) {
      interpretTextDirectly(accumulated)
    } else {
      setModalState('idle')
      setErrorMessage('No detectamos audio. Intentá de nuevo.')
    }
  }, [interpretTextDirectly])

  // Keyboard shortcuts and custom events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpenRef.current) {
          closeModal()
        } else {
          openModal()
        }
      }
      if (e.key === 'Escape' && isOpenRef.current) {
        closeModal()
      }
    }
    const handleFocusEvent = () => {
      openModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('focus-capture-console', handleFocusEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('focus-capture-console', handleFocusEvent)
    }
  }, [openModal, closeModal])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setModalState('processing')
    setErrorMessage(null)
    try {
      const csrfToken = getCookie('XSRF-TOKEN')
      const headers: Record<string, string> = {}
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Failed to transcribe file: status ${res.status}`)
      }

      const transcribedText = await res.text()
      await interpretTextDirectly(transcribedText)
    } catch {
      setModalState('idle')
      setErrorMessage('No pudimos transcribir el archivo de audio.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!draft || isSaving) return
    const amount = Number(draft.amount)
    if (isNaN(amount) || !draft.category || !draft.description) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await addExpense({
        description: draft.description,
        amount: Math.round(amount),
        category: draft.category as Category,
      })
      setDraft(null)
      setIsOpen(false)
      setModalState('idle')
      onSaved('Gasto guardado. Lo vas a ver en tu historial.')
    } catch (error) {
      console.error(error)
      setErrorMessage('No pudimos guardar el gasto. Probá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.userAgent)
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K'

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-fit">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000" />
          <button
            onClick={openModal}
            className="relative h-11 px-4 rounded-full flex items-center gap-2 bg-secondary/80 backdrop-blur-xl border border-border/40 shadow-xl cursor-pointer hover:bg-accent transition-all duration-300 hover:border-primary/40 hover:shadow-primary/5 active:scale-[0.98]"
            aria-label="Capturar gasto"
          >
            <Mic className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Capturar gasto
            </span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground ml-1.5 select-none font-mono">
              {shortcutLabel}
            </kbd>
          </button>
        </div>
      </div>

      {/* Capture Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Capturar gasto"
        >
          <div
            className={cn(
              'w-full bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out animate-in zoom-in-95 duration-200',
              modalState === 'draft' ? 'max-w-lg' : 'max-w-md',
            )}
          >
            <div className="p-6">
              {/* State 1: Idle */}
              {modalState === 'idle' && (
                <div className="flex flex-col items-center text-center py-4">
                  <p className="text-base font-medium text-foreground/90 mb-6">
                    Contanos tu gasto y nosotros te lo cargamos
                  </p>

                  {errorMessage && (
                    <p className="text-sm text-red-400 mb-4" role="alert">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center mx-auto hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
                    aria-label="Iniciar grabación"
                  >
                    <Mic className="h-7 w-7" />
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg border border-border/40 cursor-pointer transition-all mt-4 mx-auto w-max"
                    aria-label="Subir archivo de audio"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>Subir audio</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {/* State 2: Recording */}
              {modalState === 'recording' && (
                <div className="flex flex-col items-center text-center py-4">
                  <p className="text-sm font-medium text-foreground/80 mb-6">
                    Grabando audio...
                  </p>

                  <div
                    className="flex items-center gap-1 h-8 mb-6"
                    data-testid="wave-bars"
                  >
                    <span
                      className="w-1 h-6 bg-primary rounded-full wave-bar-animation"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="w-1 h-6 bg-primary rounded-full wave-bar-animation"
                      style={{ animationDelay: '0.3s' }}
                    />
                    <span
                      className="w-1 h-6 bg-primary rounded-full wave-bar-animation"
                      style={{ animationDelay: '0.5s' }}
                    />
                    <span
                      className="w-1 h-6 bg-primary rounded-full wave-bar-animation"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>

                  <button
                    onClick={stopRecording}
                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
                    aria-label="Detener grabación"
                  >
                    <Square className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* State 2b: Processing */}
              {modalState === 'processing' && (
                <div className="flex flex-col items-center text-center py-8">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Interpretando datos...
                  </p>
                </div>
              )}

              {/* State 3: Confirm Draft */}
              {modalState === 'draft' && draft && (
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground mb-6">
                    Confirmar Gasto
                  </h3>

                  {errorMessage && (
                    <p
                      className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                      role="alert"
                    >
                      {errorMessage}
                    </p>
                  )}

                  <div className="space-y-4">
                    {/* Amount Field */}
                    <div className="p-4 bg-muted rounded-xl border border-border group hover:border-primary/50 transition-all">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block mb-1.5">
                        Monto (ARS)
                      </label>
                      <div className="flex items-center text-foreground">
                        <span className="text-xl font-mono font-semibold">
                          $
                        </span>
                        <input
                          type="number"
                          value={draft.amount}
                          onChange={(e) =>
                            setDraft({ ...draft, amount: e.target.value })
                          }
                          disabled={isSaving}
                          className="bg-transparent border-none outline-none text-xl font-mono font-semibold w-full focus:ring-0 ml-1"
                          aria-label="Monto"
                        />
                      </div>
                    </div>

                    {/* Category Field */}
                    <div className="p-4 bg-muted rounded-xl border border-border group hover:border-primary/50 transition-all relative">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block mb-1.5">
                        Categoría
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                          }
                          disabled={isSaving}
                          className="w-full bg-transparent flex justify-between items-center text-base font-medium text-foreground outline-none text-left"
                          aria-label="Categoría"
                        >
                          <span>
                            {draft.category
                              ? translateCategory(draft.category)
                              : 'Elegí categoría'}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform duration-200',
                              isCategoryDropdownOpen && 'rotate-180',
                            )}
                          />
                        </button>

                        {isCategoryDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-3 bg-card border border-border rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-100">
                            {CATEGORIES.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setDraft({ ...draft, category: cat })
                                  setIsCategoryDropdownOpen(false)
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors font-medium cursor-pointer',
                                  draft.category === cat &&
                                    'bg-primary/10 text-primary hover:bg-primary/20',
                                )}
                              >
                                {translateCategory(cat)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description Field */}
                    <div className="p-4 bg-muted rounded-xl border border-border group hover:border-primary/50 transition-all">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block mb-1.5">
                        Descripción
                      </label>
                      <input
                        value={draft.description}
                        onChange={(e) =>
                          setDraft({ ...draft, description: e.target.value })
                        }
                        disabled={isSaving}
                        className="bg-transparent border-none outline-none text-base font-medium w-full focus:ring-0 text-foreground"
                        aria-label="Descripción"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      onClick={closeModal}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors border border-border/20"
                    >
                      Descartar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm bg-primary hover:bg-primary/95 text-white font-medium rounded-lg transition-all shadow-md shadow-primary/10"
                    >
                      {isSaving ? 'Guardando...' : 'Confirmar Gasto'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
