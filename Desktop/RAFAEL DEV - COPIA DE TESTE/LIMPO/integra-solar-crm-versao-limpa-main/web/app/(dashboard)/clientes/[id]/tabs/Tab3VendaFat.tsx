// web/app/(dashboard)/clientes/[id]/tabs/Tab3VendaFat.tsx
'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { updateTab3 } from '@/lib/clients/actions'
import type { Client, ActionResult } from '@/lib/clients/types'

interface Installment {
  position: number
  due_date: string
  amount: number
  notes: string
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#E0E8F0',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.40)',
  marginBottom: 6,
  display: 'block',
}

export function Tab3VendaFat({ client }: { client: Client }) {
  const action = updateTab3.bind(null, client.id)

  const initialInstallments: Installment[] = client.installments.map((inst) => ({
    position: inst.position,
    due_date: inst.due_date,
    amount: inst.amount,
    notes: inst.notes ?? '',
  }))

  const [installments, setInstallments] = useState<Installment[]>(
    initialInstallments.length > 0
      ? initialInstallments
      : [{ position: 1, due_date: '', amount: 0, notes: '' }]
  )

  const [state, formAction] = useFormState(
    async (prev: ActionResult, formData: FormData) => {
      formData.set('installments_json', JSON.stringify(installments))
      return action(prev, formData)
    },
    {} as ActionResult
  )

  function addInstallment() {
    setInstallments((prev) => [
      ...prev,
      { position: prev.length + 1, due_date: '', amount: 0, notes: '' },
    ])
  }

  function removeInstallment(idx: number) {
    setInstallments((prev) =>
      prev.filter((_, i) => i !== idx).map((inst, i) => ({ ...inst, position: i + 1 }))
    )
  }

  function updateInstallment(idx: number, field: keyof Installment, value: string | number) {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === idx ? { ...inst, [field]: value } : inst))
    )
  }

  const totalInstallments = installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      {/* Dados da venda */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Dados da Venda
        </p>
        <Input
          name="sale_value"
          label="Valor total da venda (R$) *"
          type="number"
          step="0.01"
          min="0"
          defaultValue={client.sale?.sale_value.toString() ?? ''}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Forma de pagamento</label>
          <select name="payment_method" defaultValue={client.sale?.payment_method ?? ''} style={selectStyle}>
            <option value="">— Selecione —</option>
            <option value="financiamento">Financiamento</option>
            <option value="a_vista">À Vista</option>
            <option value="parcelado_cartao">Parcelado no Cartão</option>
            <option value="consorcio">Consórcio</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="commission_pct"
            label="Comissão (%)"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={client.sale?.commission_pct.toString() ?? '0'}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>Observações NF</label>
          <textarea
            name="nf_notes"
            defaultValue={client.sale?.nf_notes ?? ''}
            placeholder="Observações para nota fiscal..."
            rows={2}
            style={{ ...selectStyle, resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Parcelas */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Parcelas
          </p>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Total: {totalInstallments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        {installments.map((inst, idx) => (
          <div
            key={idx}
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: idx === 0 ? '#FFD080' : 'rgba(255,255,255,0.50)' }}>
                {idx === 0 ? 'Parcela 1 (Entrada)' : `Parcela ${idx + 1}`}
              </span>
              {installments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstallment(idx)}
                  className="text-xs"
                  style={{ color: 'rgba(255,80,80,0.50)' }}
                >
                  remover
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label style={{ ...labelStyle, marginBottom: 3 }}>Vencimento</label>
                <input
                  type="date"
                  value={inst.due_date}
                  onChange={(e) => updateInstallment(idx, 'due_date', e.target.value)}
                  style={selectStyle}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label style={{ ...labelStyle, marginBottom: 3 }}>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={inst.amount || ''}
                  onChange={(e) => updateInstallment(idx, 'amount', Number(e.target.value))}
                  style={selectStyle}
                  required
                />
              </div>
            </div>
            <input
              type="text"
              value={inst.notes}
              onChange={(e) => updateInstallment(idx, 'notes', e.target.value)}
              placeholder="Observação (opcional)"
              style={{ ...selectStyle, padding: '7px 12px', fontSize: 13 }}
            />
          </div>
        ))}

        <Button type="button" variant="secondary" className="self-start text-xs py-1.5" onClick={addInstallment}>
          + Adicionar parcela
        </Button>
      </div>

      <FormError message={state?.error} />
      {state?.success && (
        <p className="text-sm" style={{ color: '#10B981' }}>{state.success}</p>
      )}
      <SubmitButton className="self-start">Salvar Venda e Faturamento</SubmitButton>
    </form>
  )
}
