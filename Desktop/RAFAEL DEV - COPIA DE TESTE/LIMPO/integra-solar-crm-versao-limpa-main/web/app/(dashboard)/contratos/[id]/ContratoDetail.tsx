// web/app/(dashboard)/contratos/[id]/ContratoDetail.tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateContractStatus } from '@/lib/contratos/actions'
import type { ContratoClient } from '@/lib/contratos/queries'
import type { ContractStatus } from '@/lib/contratos/actions'

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
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.40)',
  marginBottom: 6,
  display: 'block',
}

export function ContratoDetail({ client }: { client: ContratoClient }) {
  const contract = client.contract
  const [status, setStatus] = useState<ContractStatus>(
    (contract?.status as ContractStatus) ?? 'aguardando_assinatura'
  )
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateContractStatus(client.id, status)
      if (result.error) setMessage({ type: 'error', text: result.error })
      if (result.success) setMessage({ type: 'success', text: result.success })
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Arquivos */}
      <div
        className="flex flex-col gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Documentos
        </p>
        {contract?.contract_url ? (
          <a
            href={contract.contract_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
            style={{ color: '#3B82F6' }}
          >
            Ver contrato assinado →
          </a>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Nenhum contrato enviado.
          </p>
        )}
        {contract?.power_of_attorney_url && (
          <a
            href={contract.power_of_attorney_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
            style={{ color: '#3B82F6' }}
          >
            Ver procuração →
          </a>
        )}
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>Status do contrato</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ContractStatus)}
          style={selectStyle}
        >
          <option value="aguardando_assinatura">Aguardando assinatura</option>
          <option value="assinado">Assinado</option>
          <option value="distratado">Distratado</option>
        </select>
      </div>

      {message && (
        <p
          className="text-sm"
          style={{ color: message.type === 'error' ? '#EF4444' : '#10B981' }}
        >
          {message.text}
        </p>
      )}

      <Button
        variant="primary"
        onClick={handleSave}
        loading={isPending}
        disabled={isPending}
        type="button"
        className="self-start"
      >
        {status === 'assinado' ? 'Confirmar Assinatura' : 'Salvar Status'}
      </Button>

      {status === 'assinado' && (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Ao confirmar, o cliente avança automaticamente para o módulo Financeiro.
        </p>
      )}
    </div>
  )
}
