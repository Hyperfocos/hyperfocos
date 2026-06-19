'use client'

import { useState, useTransition } from 'react'
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
        setError(data.error ?? 'Erro ao gerar proposta.')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-y-auto"
        style={{ background: '#0f1424', maxHeight: '90vh' }}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Gerar Proposta PDF</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>

          {/* Breakdown de custos */}
          <div className="rounded-xl p-4 space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
              <span className="text-base font-bold" style={{ color: '#FFD080' }}>{formatCurrency(pricing.preco_total)}</span>
            </div>
          </div>

          {/* Condições de pagamento */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Condições de Pagamento</p>
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
            {numParcelas > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,208,128,0.06)', border: '1px solid rgba(255,208,128,0.15)' }}>
                <p className="text-xs text-white/50">
                  {numParcelas}x de{' '}
                  <span className="font-semibold" style={{ color: '#FFD080' }}>{formatCurrency(valorParcelas)}</span>
                  {' '}· Restante: {formatCurrency(pricing.preco_total - valorEntrada)}
                </p>
              </div>
            )}
          </div>

          {/* Seleção de template */}
          <div>
            <label className={labelCls}>Template da Proposta *</label>
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

          <div className="flex gap-2 pt-2">
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
              {isPending ? 'Gerando PDF...' : 'Gerar Proposta PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
