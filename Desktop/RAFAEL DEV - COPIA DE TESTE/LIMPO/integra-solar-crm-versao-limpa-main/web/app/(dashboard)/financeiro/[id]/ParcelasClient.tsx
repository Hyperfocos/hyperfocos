// web/app/(dashboard)/financeiro/[id]/ParcelasClient.tsx
'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { confirmInstallment, advanceToProjects } from '@/lib/financeiro/actions'
import type { FinanceiroInstallment } from '@/lib/financeiro/queries'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ParcelasClient({
  clientId,
  parcelas,
  pipelineStage,
}: {
  clientId: string
  parcelas: FinanceiroInstallment[]
  pipelineStage: string
}) {
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm(installmentId: string) {
    startTransition(async () => {
      const result = await confirmInstallment(installmentId)
      if (result.error) setMessage({ type: 'error', text: result.error })
      if (result.success) setMessage({ type: 'success', text: result.success })
    })
  }

  function handleAdvance() {
    startTransition(async () => {
      const result = await advanceToProjects(clientId)
      if (result.error) setMessage({ type: 'error', text: result.error })
      if (result.success) setMessage({ type: 'success', text: result.success })
    })
  }

  const total = parcelas.reduce((sum, p) => sum + p.amount, 0)
  const confirmadas = parcelas.filter((p) => p.status === 'confirmada').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Total da venda</p>
          <p className="text-base font-semibold mt-1" style={{ color: '#FFD080' }}>{formatBRL(total)}</p>
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Confirmado</p>
          <p className="text-base font-semibold mt-1" style={{ color: '#10B981' }}>{formatBRL(confirmadas)}</p>
        </div>
      </div>

      {/* Parcelas */}
      <div className="flex flex-col gap-2">
        {parcelas.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                {p.position === 1 ? 'Entrada' : `Parcela ${p.position}`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Venc: {new Date(p.due_date).toLocaleDateString('pt-BR')}
                {p.confirmed_at
                  ? ` · Pago em: ${new Date(p.confirmed_at).toLocaleDateString('pt-BR')}`
                  : ''}
              </p>
            </div>
            <p className="text-sm font-semibold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {formatBRL(p.amount)}
            </p>
            {p.status === 'confirmada' ? (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.10)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                ✓ Pago
              </span>
            ) : (
              <Button
                variant="secondary"
                className="text-xs py-1 px-2.5"
                onClick={() => handleConfirm(p.id)}
                loading={isPending}
                type="button"
              >
                Confirmar
              </Button>
            )}
          </div>
        ))}
      </div>

      {message && (
        <p className="text-sm" style={{ color: message.type === 'error' ? '#EF4444' : '#10B981' }}>
          {message.text}
        </p>
      )}

      {/* Avançar pipeline */}
      {pipelineStage === 'financeiro' && (
        <div
          className="flex items-center justify-between p-3 rounded-xl mt-2"
          style={{ background: 'rgba(255,200,100,0.05)', border: '1px solid rgba(255,200,100,0.15)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Avançar para Projetos
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Quando o financeiro estiver em ordem
            </p>
          </div>
          <Button
            variant="primary"
            className="text-xs py-1.5 px-3"
            onClick={handleAdvance}
            loading={isPending}
            type="button"
          >
            Avançar →
          </Button>
        </div>
      )}
    </div>
  )
}
