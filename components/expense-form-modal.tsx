'use client'

import { useState } from 'react'
import Box from '@cloudscape-design/components/box'
import Button from '@cloudscape-design/components/button'
import FormField from '@cloudscape-design/components/form-field'
import Input from '@cloudscape-design/components/input'
import Modal from '@cloudscape-design/components/modal'
import Select, { SelectProps } from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'
import { CATEGORIES, type Category } from '@/lib/types'

const CATEGORY_OPTIONS: SelectProps.Option[] = CATEGORIES.map((c) => ({
  label: c,
  value: c,
}))

export interface ExpenseFormValues {
  description: string
  amount: number
  category: Category
}

interface ExpenseFormModalProps {
  visible: boolean
  mode: 'create' | 'edit'
  initial?: {
    description?: string
    amount?: number | null
    category?: Category | null
  }
  onDismiss: () => void
  onSubmit: (values: ExpenseFormValues) => void
}

export function ExpenseFormModal({
  visible,
  mode,
  initial,
  onDismiss,
  onSubmit,
}: ExpenseFormModalProps) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(
    initial?.amount !== null && initial?.amount !== undefined
      ? String(initial.amount)
      : '',
  )
  const [category, setCategory] = useState<SelectProps.Option | null>(
    initial?.category
      ? { label: initial.category, value: initial.category }
      : null,
  )
  const [errors, setErrors] = useState<{
    description?: string
    amount?: string
    category?: string
  }>({})

  function submit() {
    const next: typeof errors = {}
    const parsedAmount = Number(amount)
    if (!description.trim()) next.description = 'Contanos en qué fue el gasto.'
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0)
      next.amount = 'Ingresá un monto mayor a 0.'
    if (!category) next.category = 'Elegí una categoría.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      description: description.trim(),
      amount: Math.round(parsedAmount),
      category: category!.value as Category,
    })
  }

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={mode === 'edit' ? 'Editar gasto' : 'Cargar gasto a mano'}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={submit}>
              {mode === 'edit' ? 'Guardar cambios' : 'Guardar gasto'}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="l">
        <FormField label="Descripción" errorText={errors.description}>
          <Input
            value={description}
            placeholder="Ej: Compra en el super"
            onChange={({ detail }) => setDescription(detail.value)}
          />
        </FormField>

        <FormField
          label="Monto"
          description="En pesos argentinos (ARS)."
          errorText={errors.amount}
        >
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            placeholder="Ej: 70000"
            onChange={({ detail }) => setAmount(detail.value)}
          />
        </FormField>

        <FormField label="Categoría" errorText={errors.category}>
          <Select
            selectedOption={category}
            options={CATEGORY_OPTIONS}
            placeholder="Elegí una categoría"
            onChange={({ detail }) => setCategory(detail.selectedOption)}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  )
}
