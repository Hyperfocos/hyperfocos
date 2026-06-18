'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { ProposalForm } from './ProposalForm'
import { deleteProposal } from '@/lib/crm/actions'
import type { Lead, Proposal, Supplier } from '@/lib/crm/types'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  approved: 'Aprovada',
  rejected: 'Recusada',
  cancelled: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'rgba(255,255,255,0.40)',
  sent: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: 'rgba(255,255,255,0.25)',
}

export function ProposalsList({ lead }: { lead: Lead }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [generationFactor, setGenerationFactor] = useState(1.0)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/leads/${lead.id}/proposals`)
      .then((r) => r.json())
      .then(({ proposals, suppliers, generationFactor }) => {
        setProposals(proposals)
        setSuppliers(suppliers)
        setGenerationFactor(generationFactor)
      })
  }, [lead.id])

  function handleDelete(id: string) {
    if (!confirm('Excluir proposta?')) return
    startTransition(async () => {
      await deleteProposal(id)
      setProposals((prev) => prev.filter((p) => p.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {!showForm ? (
        <Button className="self-start text-xs py-1.5 px-4" onClick={() => setShowForm(true)}>
          + Nova Proposta
        </Button>
      ) : (
        <ProposalForm
          leadId={lead.id}
          suppliers={suppliers}
          generationFactor={generationFactor}
          onSuccess={() => {
            setShowForm(false)
            fetch(`/api/leads/${lead.id}/proposals`)
              .then((r) => r.json())
              .then(({ proposals }) => setProposals(proposals))
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {proposals.length === 0 && !showForm && (
        <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Nenhuma proposta criada ainda.
        </p>
      )}

      {proposals.map((p) => (
        <div
          key={p.id}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {p.name}
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: `${STATUS_COLORS[p.status]}20`,
                color: STATUS_COLORS[p.status],
                border: `1px solid ${STATUS_COLORS[p.status]}40`,
              }}
            >
              {STATUS_LABELS[p.status]}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Sistema
              </p>
              <p className="text-sm font-medium" style={{ color: '#FFD080' }}>
                {p.total_power_kwp.toFixed(2)} kWp
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Geração/mês
              </p>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {p.monthly_generation_kwh.toFixed(0)} kWh
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Valor kit
              </p>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                {p.kit_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
          {p.supplier && (
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Fornecedor: {p.supplier.name}
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              onClick={() => handleDelete(p.id)}
              disabled={isPending}
              className="text-xs"
              style={{ color: 'rgba(255,80,80,0.50)' }}
            >
              excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
