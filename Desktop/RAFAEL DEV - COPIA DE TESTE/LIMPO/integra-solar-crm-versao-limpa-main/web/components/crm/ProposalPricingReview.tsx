'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import type { Proposal, ProposalTemplate } from '@/lib/crm/types'
import { calcularPreco } from '@/lib/proposals/pricing'
import { formatCurrency } from '@/lib/format'
import { CurrencyInput } from '@/components/ui/inputs'
import type { OrgConfig } from '@/lib/configuracoes/queries'

interface ProposalPricingReviewProps {
  proposal: Proposal
  orgConfig: OrgConfig
  templates: ProposalTemplate[]
  onClose: () => void
  onGenerated: (pdfUrl: string) => void
}

export function ProposalPricingReview({
  proposal,
  orgConfig,
  templates,
  onClose,
  onGenerated,
}: ProposalPricingReviewProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    proposal.template_id ??
    templates.find((t) => t.is_default)?.id ??
    templates[0]?.id ??
    ''
  )
  const [valorEntrada, setValorEntrada] = useState<number>(proposal.valor_entrada ?? 0)
  const [numParcelas, setNumParcelas] = useState<number>(proposal.num_parcelas ?? 1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const pricing = calcularPreco(
    {
      kit_value: proposal.kit_value,
      total_power_kwp: proposal.total_power_kwp,
      panel_qty: proposal.panel_qty,
    },
    orgConfig
  )

  const valorParcelas = numParcelas > 0
    ? (pricing.preco_total - valorEntrada) / numParcelas
    : 0

  function handleGenerate() {
    if (!selectedTemplateId) { setError('Selecione um template.'); return }
    setError(null)

    startTransition(async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          templateId: selectedTemplateId,
          valor_entrada: valorEntrada,
          valor_parcelas: valorParcelas,
          num_parcelas: numParcelas,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Erro ao gerar orçamento.')
        return
      }

      window.open(data.pdf_url, '_blank')
      onGenerated(data.pdf_url)
    })
  }

  const labelCls = 'text-xs text-white/50 mb-1 block'
  const rowCls = 'flex justify-between items-center py-2'
  const dividerCls = 'border-t border-white/[0.08]'

  return (
    <>
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-[720px] z-[71] flex flex-col"
        style={{
          background: '#0f1424',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold text-white">Gerar Orçamento</h2>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-white/10">
            <X size={16} style={{ color: 'rgba(255,255,255,0.40)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Breakdown de custos */}
          <div className="rounded-xl p-5 space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Breakdown de Custos</p>
            <div className={rowCls}>
              <span className="text-sm text-white/60">Kit Solar</span>
              <span className="text-sm text-white/80">{formatCurrency(pricing.custo_kit)}</span>
            </div>
            <div className={`${rowCls} ${dividerCls}`}>
              <span className="text-sm text-white/60">Projeto (engenharia)</span>
              <span className="text-sm text-white/80">{formatCurrency(pricing.custo_projeto)}</span>
            </div>
            <div className={`${rowCls} ${dividerCls}`}>
              <span className="text-sm text-white/60">Instalação</span>
              <span className="text-sm text-white/80">{formatCurrency(pricing.custo_instalacao)}</span>
            </div>
            <div className={`${rowCls} ${dividerCls}`}>
              <span className="text-sm text-white/60">Material CA</span>
              <span className="text-sm text-white/80">{formatCurrency(pricing.custo_ca)}</span>
            </div>
            <div className={`${rowCls} ${dividerCls}`} style={{ borderTopColor: 'rgba(255,255,255,0.12)' }}>
              <span className="text-sm font-semibold text-white">Preço Total</span>
              <span className="text-lg font-bold" style={{ color: '#FFD080' }}>{formatCurrency(pricing.preco_total)}</span>
            </div>
          </div>

          {/* Info do sistema */}
          <div className="rounded-xl p-4 grid grid-cols-2 gap-4" style={{ background: 'rgba(255,200,100,0.04)', border: '1px solid rgba(255,200,100,0.10)' }}>
            <div>
              <p className="text-xs text-white/35">Sistema</p>
              <p className="text-sm font-semibold" style={{ color: '#FFD080' }}>{proposal.total_power_kwp.toFixed(2)} kWp</p>
            </div>
            <div>
              <p className="text-xs text-white/35">Geração/mês</p>
              <p className="text-sm font-semibold text-white/70">{Math.round(proposal.monthly_generation_kwh)} kWh</p>
            </div>
          </div>

          {/* Condições de pagamento */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Condições de Pagamento</p>
            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput
                label="Valor de Entrada (R$)"
                value={valorEntrada || null}
                onChange={(v) => setValorEntrada(v)}
              />
              <div>
                <label className={labelCls}>Número de Parcelas</label>
                <input
                  type="number"
                  min="0"
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:border-white/30 bg-white/5"
                />
              </div>
            </div>
            {numParcelas > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,208,128,0.06)', border: '1px solid rgba(255,208,128,0.15)' }}>
                <p className="text-sm text-white/50">
                  {numParcelas}x de{' '}
                  <span className="font-semibold" style={{ color: '#FFD080' }}>{formatCurrency(valorParcelas)}</span>
                  {' '}· Restante: {formatCurrency(pricing.preco_total - valorEntrada)}
                </p>
              </div>
            )}
          </div>

          {/* Seleção de template */}
          <div>
            <label className={labelCls}>Template do Orçamento *</label>
            {templates.length === 0 ? (
              <p className="text-xs text-red-400">
                Nenhum template ativo. Cadastre um em Configurações → Templates.
              </p>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 focus:border-white/30"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <option value="">— Selecione —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.category ? ` (${t.category})` : ''}{t.is_default ? ' ★' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm text-white/50 border border-white/10 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isPending || templates.length === 0}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#FFD080', color: '#0a0e1a' }}
          >
            {isPending ? 'Gerando...' : 'Gerar Orçamento'}
          </button>
        </div>
      </div>
    </>
  )
}
