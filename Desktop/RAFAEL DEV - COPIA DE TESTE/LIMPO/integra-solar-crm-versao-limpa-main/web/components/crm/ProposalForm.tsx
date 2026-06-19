'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/inputs'
import { FormError } from '@/components/ui/FormError'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Button } from '@/components/ui/Button'
import { createProposal } from '@/lib/crm/actions'
import type { ActionResult } from '@/lib/crm/types'

interface ProposalFormProps {
  leadId: string
  suppliers?: any[]
  generationFactor: number
  onSuccess: () => void
  onCancel: () => void
}

export function ProposalForm({ leadId, generationFactor, onSuccess, onCancel }: ProposalFormProps) {
  const [panelQty, setPanelQty] = useState(0)
  const [panelPower, setPanelPower] = useState(0)

  const systemKwp = (panelQty * panelPower) / 1000
  const monthlyGen = systemKwp * generationFactor

  const boundAction = createProposal.bind(null, leadId)
  const [state, formAction] = useFormState(
    async (prev: ActionResult, formData: FormData) => {
      formData.set('total_power_kwp', systemKwp.toFixed(3))
      formData.set('monthly_generation_kwh', monthlyGen.toFixed(1))
      const result = await boundAction(prev, formData)
      if (result.success) onSuccess()
      return result
    },
    {} as ActionResult
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="name" label="Nome da proposta *" placeholder="Ex: Proposta Residencial 5kWp" required />

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="panel_qty"
          label="Qtd. painéis"
          type="number"
          min="0"
          value={panelQty.toString()}
          onChange={(e) => setPanelQty(Number(e.target.value))}
        />
        <Input
          name="panel_power_w"
          label="Potência placa (W)"
          type="number"
          min="0"
          step="0.01"
          value={panelPower.toString()}
          onChange={(e) => setPanelPower(Number(e.target.value))}
        />
      </div>
      <Input name="panel_brand_model" label="Marca/Modelo do painel" placeholder="Ex: Jinko 550W" />

      <div className="grid grid-cols-2 gap-3">
        <Input name="inverter_qty" label="Qtd. inversores" type="number" min="0" defaultValue="1" />
        <Input name="inverter_power_w" label="Potência inversor (W)" type="number" min="0" step="0.01" />
      </div>
      <Input name="inverter_brand_model" label="Marca/Modelo do inversor" placeholder="Ex: Growatt 5kW" />

      <CurrencyInput name="kit_value" label="Valor do kit (R$)" value={null} />

      <Input name="supplier_name" label="Fornecedor" placeholder="Ex: Aldo Solar" />

      <div
        className="rounded-xl p-3 grid grid-cols-2 gap-3"
        style={{ background: 'rgba(255,200,100,0.06)', border: '1px solid rgba(255,200,100,0.15)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Potência do sistema
          </p>
          <p className="text-sm font-semibold" style={{ color: '#FFD080' }}>
            {systemKwp.toFixed(2)} kWp
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Geração média/mês
          </p>
          <p className="text-sm font-semibold" style={{ color: '#FFD080' }}>
            {monthlyGen.toFixed(0)} kWh
          </p>
        </div>
      </div>

      <FormError message={state?.error} />
      <div className="flex gap-2">
        <SubmitButton className="flex-1 text-xs">Criar proposta</SubmitButton>
        <Button variant="ghost" className="text-xs" onClick={onCancel} type="button">
          Cancelar
        </Button>
      </div>
    </form>
  )
}
