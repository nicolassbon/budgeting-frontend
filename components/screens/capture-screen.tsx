'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatARS, mockCaptureService } from '@/lib/format'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, translateCategory } from '@/lib/types'

type CaptureState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'interpreting'
  | 'preview'
  | 'saving'

const EXAMPLES = ['70 mil en el super', 'Farmacia 12.300', 'Cargué nafta 45000']
const SIMULATED_DICTATION = 'Gasté 32500 en el super'

interface CaptureScreenProps {
  onSaved: () => void
  onOpenHelp: () => void
}

export function CaptureScreen({ onSaved, onOpenHelp }: CaptureScreenProps) {
  const { addExpense } = useStore()

  const [state, setState] = useState<CaptureState>('idle')
  const [text, setText] = useState('')
  const [showSpeechWarning, setShowSpeechWarning] = useState(false)

  const [draftDescription, setDraftDescription] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [draftCategory, setDraftCategory] = useState<Category | ''>('')
  const [draftErrors, setDraftErrors] = useState<{
    amount?: string
    category?: string
    description?: string
  }>({})
  const [interpretIncomplete, setInterpretIncomplete] = useState(false)
  const [helpExpanded, setHelpExpanded] = useState(false)

  const timers = useRef<number[]>([])
  const recognitionRef = useRef<{ stop?: () => void } | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach((timerId) => window.clearTimeout(timerId))
    timers.current = []
  }, [])

  useEffect(() => {
    const recognition = recognitionRef.current

    return () => {
      clearTimers()

      try {
        recognition?.stop?.()
      } catch {
        // noop
      }
    }
  }, [clearTimers])

  function interpret(raw: string) {
    const value = raw.trim()
    if (!value) return
    setState('interpreting')
    mockCaptureService
      .interpretText(value)
      .then((result) => {
        setDraftDescription(result.description)
        setDraftAmount(result.amount !== null ? String(result.amount) : '')
        setDraftCategory(result.category ?? '')
        setInterpretIncomplete(
          result.amount === null || result.category === null,
        )
        setDraftErrors({})
        setState('preview')
      })
      .catch((error) => {
        console.error('NLP interpretation failed', error)
        setState('idle')
      })
  }

  function startRecording() {
    setText('')
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'es-AR'
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript ?? ''
          setText(transcript)
          setState('transcribing')
          const timerId = window.setTimeout(() => interpret(transcript), 700)
          timers.current.push(timerId)
        }
        recognition.onerror = () => {
          setState('idle')
        }
        recognition.onend = () => {
          setState((current) => (current === 'recording' ? 'idle' : current))
        }
        recognitionRef.current = recognition
        recognition.start()
        setState('recording')
        return
      } catch {
        // Fall back to the local simulation below.
      }
    }

    setShowSpeechWarning(true)
    setState('recording')
    const firstTimer = window.setTimeout(() => {
      setText(SIMULATED_DICTATION)
      setState('transcribing')
      const secondTimer = window.setTimeout(
        () => interpret(SIMULATED_DICTATION),
        700,
      )
      timers.current.push(secondTimer)
    }, 1600)

    timers.current.push(firstTimer)
  }

  function stopRecording() {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // noop
    }

    clearTimers()
    setState('idle')
  }

  function resetAll() {
    clearTimers()
    setText('')
    setDraftDescription('')
    setDraftAmount('')
    setDraftCategory('')
    setDraftErrors({})
    setInterpretIncomplete(false)
    setShowSpeechWarning(false)
    setState('idle')
  }

  function openManual() {
    clearTimers()
    setDraftDescription(text.trim())
    setDraftAmount('')
    setDraftCategory('')
    setInterpretIncomplete(false)
    setDraftErrors({})
    setState('preview')
  }

  function saveDraft() {
    const next: typeof draftErrors = {}
    const parsedAmount = Number(draftAmount)

    if (!draftDescription.trim()) next.description = 'Agregá una descripción.'
    if (!draftAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      next.amount = 'Ingresá un monto mayor a 0.'
    }
    if (!draftCategory) next.category = 'Elegí una categoría.'

    setDraftErrors(next)
    if (Object.keys(next).length > 0) return

    setState('saving')
    const timerId = window.setTimeout(() => {
      addExpense({
        description: draftDescription.trim(),
        amount: Math.round(parsedAmount),
        category: draftCategory as Category,
      })
      resetAll()
      onSaved()
    }, 700)

    timers.current.push(timerId)
  }

  const busy =
    state === 'recording' ||
    state === 'transcribing' ||
    state === 'interpreting'
  const showPrompt = state === 'idle' || busy
  const showDraft = state === 'preview' || state === 'saving'

  return (
    <div className="mx-auto max-w-[600px] w-full space-y-6">
      <div className="space-y-3 text-center">
        <Badge variant="success" className="mx-auto w-fit">
          Captura con IA
        </Badge>
        <div className="space-y-2">
          <h2 className="font-sans text-3xl font-semibold tracking-tight tracking-[-0.02em]">
            Contame o dictá tu gasto.
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Escribilo en una línea o usá el micrófono. Te armamos un borrador
            para que lo revises antes de guardar.
          </p>
        </div>
      </div>

      {showPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Describí tu gasto</CardTitle>
            <CardDescription>Ej: 70 mil en el super</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showSpeechWarning && (
              <Alert variant="warning">
                <AlertTitle>Dictado simulado</AlertTitle>
                <AlertDescription>
                  Simulando dictado porque el navegador no soporta la captura de
                  voz.
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ej: 70 mil en el super"
              disabled={busy}
              aria-label="Describí tu gasto"
              rows={3}
              className="min-h-[80px]"
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => interpret(text)}
                disabled={busy || !text.trim()}
              >
                Interpretar gasto
              </Button>

              {state === 'recording' ? (
                <Button variant="secondary" onClick={stopRecording}>
                  Detener
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={startRecording}
                  disabled={busy}
                >
                  Dictar
                </Button>
              )}
            </div>

            {state !== 'idle' && (
              <p className="text-sm text-muted-foreground">
                {state === 'recording' && 'Grabando… hablá con naturalidad'}
                {state === 'transcribing' && 'Transcribiendo…'}
                {state === 'interpreting' && 'Interpretando tu gasto…'}
              </p>
            )}

            {state === 'idle' && (
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Probá con
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((example) => (
                    <Button
                      key={example}
                      variant="ghost"
                      size="sm"
                      onClick={() => setText(example)}
                    >
                      {`"${example}"`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showDraft && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Borrador interpretado</CardTitle>
                <CardDescription>
                  Revisá y ajustá lo que haga falta. Nada se guarda hasta que
                  confirmes.
                </CardDescription>
              </div>
              <Badge variant="success">Borrador</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {interpretIncomplete && (
              <Alert variant="info">
                <AlertTitle>Completá lo que falta</AlertTitle>
                <AlertDescription>
                  No pudimos interpretar todo el gasto. Revisá el monto y la
                  categoría y completalos a mano.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border border-border bg-muted p-5 text-center">
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="mt-2 text-4xl font-semibold font-mono text-foreground dark:text-[#f7f8f8]">
                {formatARS(draftAmount ? Number(draftAmount) : null)}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="draft-description"
                className="text-sm font-medium"
              >
                Descripción
              </label>
              <Input
                id="draft-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="¿En qué fue el gasto?"
              />
              {draftErrors.description && (
                <p className="text-sm text-destructive">
                  {draftErrors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="draft-amount" className="text-sm font-medium">
                Monto
              </label>
              <Input
                id="draft-amount"
                type="number"
                inputMode="decimal"
                value={draftAmount}
                onChange={(event) => setDraftAmount(event.target.value)}
                placeholder="Ej: 70000"
              />
              <p className="text-xs text-muted-foreground">
                En pesos argentinos (ARS).
              </p>
              {draftErrors.amount && (
                <p className="text-sm text-destructive">{draftErrors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="draft-category" className="text-sm font-medium">
                Categoría
              </label>
              <select
                id="draft-category"
                value={draftCategory}
                onChange={(event) =>
                  setDraftCategory(event.target.value as Category | '')
                }
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent"
              >
                <option value="">Elegí una categoría</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {translateCategory(category)}
                  </option>
                ))}
              </select>
              {draftErrors.category && (
                <p className="text-sm text-destructive">
                  {draftErrors.category}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={resetAll}
                disabled={state === 'saving'}
              >
                Volver a intentar
              </Button>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  onClick={resetAll}
                  disabled={state === 'saving'}
                >
                  Cancelar
                </Button>
                <Button onClick={saveDraft} disabled={state === 'saving'}>
                  {state === 'saving' ? 'Guardando…' : 'Guardar gasto'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {helpExpanded && (
        <Card className="border border-border bg-card p-5 text-left">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              ¿Cómo funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3 text-xs text-muted-foreground">
            <p>
              Escribí o dictá tu gasto en lenguaje natural, por ejemplo: “70 mil en el super”.
            </p>
            <p>
              Te mostramos una vista previa editable. Revisala, ajustá lo que haga falta y recién ahí guardás.
            </p>
            <p>
              Si no logramos interpretarlo, podés completar los datos a mano sin perder el ritmo.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm border-t border-border pt-4 text-muted-foreground">
        {!showDraft && (
          <>
            <Button
              variant="link"
              className="h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={openManual}
            >
              Prefiero cargarlo a mano
            </Button>
            <span className="text-muted-foreground/50 select-none">•</span>
          </>
        )}
        <Button
          variant="link"
          className="h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setHelpExpanded((expanded) => !expanded)}
          aria-expanded={helpExpanded}
        >
          ¿Cómo funciona?
        </Button>
      </div>
    </div>
  )
}
