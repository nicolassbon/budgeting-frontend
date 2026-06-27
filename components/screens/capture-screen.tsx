'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@cloudscape-design/components/alert'
import Badge from '@cloudscape-design/components/badge'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import Container from '@cloudscape-design/components/container'
import FormField from '@cloudscape-design/components/form-field'
import Header from '@cloudscape-design/components/header'
import Input from '@cloudscape-design/components/input'
import Link from '@cloudscape-design/components/link'
import PromptInput from '@cloudscape-design/components/prompt-input'
import Select, { SelectProps } from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Spinner from '@cloudscape-design/components/spinner'
import StatusIndicator from '@cloudscape-design/components/status-indicator'

import { useStore } from '@/lib/store'
import { interpretExpense } from '@/lib/format'
import { formatARS } from '@/lib/format'
import { CATEGORIES, type Category } from '@/lib/types'

type CaptureState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'interpreting'
  | 'preview'
  | 'saving'

const CATEGORY_OPTIONS: SelectProps.Option[] = CATEGORIES.map((c) => ({
  label: c,
  value: c,
}))

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

  // Editable draft fields (the interpreted preview).
  const [draftDescription, setDraftDescription] = useState('')
  const [draftAmount, setDraftAmount] = useState('')
  const [draftCategory, setDraftCategory] = useState<SelectProps.Option | null>(
    null,
  )
  const [draftErrors, setDraftErrors] = useState<{
    amount?: string
    category?: string
    description?: string
  }>({})
  const [interpretIncomplete, setInterpretIncomplete] = useState(false)

  const timers = useRef<number[]>([])
  const recognitionRef = useRef<any>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  useEffect(() => {
    return () => {
      clearTimers()
      try {
        recognitionRef.current?.stop?.()
      } catch {
        /* noop */
      }
    }
  }, [clearTimers])

  function buildDraftFrom(raw: string) {
    const result = interpretExpense(raw)
    setDraftDescription(result.description)
    setDraftAmount(result.amount !== null ? String(result.amount) : '')
    setDraftCategory(
      result.category
        ? { label: result.category, value: result.category }
        : null,
    )
    setInterpretIncomplete(result.amount === null || result.category === null)
    setDraftErrors({})
    setState('preview')
  }

  function interpret(raw: string) {
    const value = raw.trim()
    if (!value) return
    setState('interpreting')
    const t = window.setTimeout(() => buildDraftFrom(value), 900)
    timers.current.push(t)
  }

  // ---- microphone ---------------------------------------------------------

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
          const t1 = window.setTimeout(() => interpret(transcript), 700)
          timers.current.push(t1)
        }
        recognition.onerror = () => {
          // Fall back to manual typing if speech fails.
          setState('idle')
        }
        recognition.onend = () => {
          setState((s) => (s === 'recording' ? 'idle' : s))
        }
        recognitionRef.current = recognition
        recognition.start()
        setState('recording')
        return
      } catch {
        /* fall through to simulation */
      }
    }

    // Fallback: simulate a dictation so the flow stays demonstrable.
    setState('recording')
    const t = window.setTimeout(() => {
      setText(SIMULATED_DICTATION)
      setState('transcribing')
      const t2 = window.setTimeout(() => interpret(SIMULATED_DICTATION), 700)
      timers.current.push(t2)
    }, 1600)
    timers.current.push(t)
  }

  function stopRecording() {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* noop */
    }
    clearTimers()
    setState('idle')
  }

  // ---- actions ------------------------------------------------------------

  function resetAll() {
    clearTimers()
    setText('')
    setDraftDescription('')
    setDraftAmount('')
    setDraftCategory(null)
    setDraftErrors({})
    setInterpretIncomplete(false)
    setState('idle')
  }

  function openManual() {
    clearTimers()
    setDraftDescription(text.trim())
    setDraftAmount('')
    setDraftCategory(null)
    setInterpretIncomplete(false)
    setDraftErrors({})
    setState('preview')
  }

  function saveDraft() {
    const next: typeof draftErrors = {}
    const parsed = Number(draftAmount)
    if (!draftDescription.trim()) next.description = 'Agregá una descripción.'
    if (!draftAmount || Number.isNaN(parsed) || parsed <= 0)
      next.amount = 'Ingresá un monto mayor a 0.'
    if (!draftCategory) next.category = 'Elegí una categoría.'
    setDraftErrors(next)
    if (Object.keys(next).length > 0) return

    setState('saving')
    const t = window.setTimeout(() => {
      addExpense({
        description: draftDescription.trim(),
        amount: Math.round(parsed),
        category: draftCategory!.value as Category,
      })
      resetAll()
      onSaved()
    }, 700)
    timers.current.push(t)
  }

  const busy =
    state === 'recording' ||
    state === 'transcribing' ||
    state === 'interpreting'
  const showPrompt = state === 'idle' || busy
  const showDraft = state === 'preview' || state === 'saving'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <SpaceBetween size="xl">
        <Box textAlign="center" padding={{ top: 'l' }}>
          <SpaceBetween size="xs" alignItems="center">
            <Badge color="green">Captura con IA</Badge>
            <Box variant="h1" fontSize="display-l">
              Contame o dictá tu gasto
            </Box>
            <Box variant="p" color="text-body-secondary" fontSize="heading-s">
              Escribilo en una línea o usá el micrófono. Te armamos un borrador
              para que lo revises antes de guardar.
            </Box>
          </SpaceBetween>
        </Box>

        {showPrompt && (
          <SpaceBetween size="m">
            <PromptInput
              value={text}
              onChange={({ detail }) => setText(detail.value)}
              onAction={({ detail }) => interpret(detail.value)}
              placeholder="Ej: 70 mil en el super"
              actionButtonIconName="send"
              actionButtonAriaLabel="Interpretar gasto"
              disableActionButton={busy || !text.trim()}
              disabled={busy}
              minRows={2}
              maxRows={6}
              ariaLabel="Describí tu gasto"
              secondaryActions={
                state === 'recording' ? (
                  <Button
                    iconName="microphone-off"
                    variant="primary"
                    onClick={stopRecording}
                  >
                    Detener
                  </Button>
                ) : (
                  <Button
                    iconName="microphone"
                    variant="normal"
                    onClick={startRecording}
                    disabled={busy}
                  >
                    Dictar
                  </Button>
                )
              }
            />

            {/* Visible processing states */}
            {state === 'recording' && (
              <Box textAlign="center">
                <StatusIndicator type="in-progress">
                  Grabando… hablá con naturalidad
                </StatusIndicator>
              </Box>
            )}
            {state === 'transcribing' && (
              <Box textAlign="center">
                <StatusIndicator type="loading">
                  Transcribiendo…
                </StatusIndicator>
              </Box>
            )}
            {state === 'interpreting' && (
              <Box textAlign="center">
                <StatusIndicator type="loading">
                  Interpretando tu gasto…
                </StatusIndicator>
              </Box>
            )}

            {state === 'idle' && (
              <Box textAlign="center">
                <SpaceBetween size="xs">
                  <Box
                    variant="span"
                    color="text-body-secondary"
                    fontSize="body-s"
                  >
                    Probá con
                  </Box>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-scaled-xs, 8px)',
                      justifyContent: 'center',
                    }}
                  >
                    {EXAMPLES.map((ex) => (
                      <Button
                        key={ex}
                        variant="inline-link"
                        onClick={() => setText(ex)}
                      >
                        {`“${ex}”`}
                      </Button>
                    ))}
                  </div>
                </SpaceBetween>
              </Box>
            )}
          </SpaceBetween>
        )}

        {showDraft && (
          <Container
            header={
              <Header
                variant="h2"
                description="Revisá y ajustá lo que haga falta. Nada se guarda hasta que confirmes."
                actions={<Badge color="green">Borrador</Badge>}
              >
                Borrador interpretado
              </Header>
            }
          >
            <SpaceBetween size="l">
              {interpretIncomplete && (
                <Alert type="info" header="Completá lo que falta">
                  No pudimos interpretar todo el gasto. Revisá el monto y la
                  categoría y completalos a mano.
                </Alert>
              )}

              {/* Amount, shown large for confidence */}
              <Box textAlign="center" padding={{ vertical: 's' }}>
                <Box variant="awsui-key-label">Monto</Box>
                <Box
                  variant="h1"
                  fontSize="display-l"
                  color={draftAmount ? 'inherit' : 'text-status-inactive'}
                >
                  {formatARS(draftAmount ? Number(draftAmount) : null)}
                </Box>
              </Box>

              <FormField
                label="Descripción"
                errorText={draftErrors.description}
              >
                <Input
                  value={draftDescription}
                  onChange={({ detail }) => setDraftDescription(detail.value)}
                  placeholder="¿En qué fue el gasto?"
                />
              </FormField>

              <FormField
                label="Monto"
                description="En pesos argentinos (ARS)."
                errorText={draftErrors.amount}
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  value={draftAmount}
                  onChange={({ detail }) => setDraftAmount(detail.value)}
                  placeholder="Ej: 70000"
                />
              </FormField>

              <FormField label="Categoría" errorText={draftErrors.category}>
                <Select
                  selectedOption={draftCategory}
                  options={CATEGORY_OPTIONS}
                  placeholder="Elegí una categoría"
                  onChange={({ detail }) =>
                    setDraftCategory(detail.selectedOption)
                  }
                />
              </FormField>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-scaled-s, 12px)',
                }}
              >
                <Button
                  iconName="redo"
                  variant="normal"
                  onClick={resetAll}
                  disabled={state === 'saving'}
                >
                  Volver a intentar
                </Button>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="link"
                    onClick={resetAll}
                    disabled={state === 'saving'}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    iconName="check"
                    onClick={saveDraft}
                    loading={state === 'saving'}
                  >
                    Guardar gasto
                  </Button>
                </SpaceBetween>
              </div>
            </SpaceBetween>
          </Container>
        )}

        <Box textAlign="center">
          <SpaceBetween size="xs" alignItems="center">
            {!showDraft && (
              <Link onFollow={openManual}>Prefiero cargarlo a mano</Link>
            )}
            <Button
              variant="inline-link"
              iconName="status-info"
              onClick={onOpenHelp}
            >
              ¿Cómo funciona?
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </div>
  )
}
