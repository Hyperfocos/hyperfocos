'use client'

import { useState, useTransition } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Proposal, ProposalTemplate } from '@/lib/crm/types'
import { calcularPreco } from '@/lib/proposals/pricing'
import { formatCurrency } from '@/lib/format'
import type { OrgConfig } from '@/lib/configuracoes/queries'

interface ProposalPricingReviewProps {
  proposal: Proposal
  orgConfig: OrgConfig
  templates: ProposalTemplate[]
  onClose: () => void
  onGenerated: (pdfUrl: string) => void
}

type ExtraCost = {
  id: string
  categoria: string
  item: string
  qtd: number
  custo_unit: number
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
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const pricing = calcularPreco(
    {
      kit_value: proposal.kit_value,
      total_power_kwp: proposal.total_power_kwp,
      panel_qty: proposal.panel_qty,
      km_rodados: (proposal as any).km_rodados ?? 0,
    },
    orgConfig
  )

  const pct_imposto  = (orgConfig.pct_imposto  ?? 0) / 100
  const pct_margem   = (orgConfig.pct_margem   ?? 0) / 100
  const pct_comissao = (orgConfig.pct_comissao ?? 0) / 100
  const divisor = 1 - pct_imposto - pct_margem - pct_comissao
  const d = divisor > 0 ? divisor : 1

  type Row = {
    categoria: string
    item: string
    qtd: number | string
    custoUnit: number
    custo: number
    imposto: number
    lucro: number
    venda: number
  }

  function buildRow(categoria: string, item: string, qtd: number | string, custoUnit: number, custo: number): Row {
    const venda = custo / d
    return {
      categoria,
      item,
      qtd,
      custoUnit,
      custo,
      imposto: venda * pct_imposto,
      lucro: venda * pct_margem,
      venda,
    }
  }

  const rows: Row[] = [
    buildRow('Kit', 'Equipamentos', 1, proposal.kit_value, pricing.custo_kit),
    buildRow('Projeto', 'Engenharia elétrica', proposal.total_power_kwp.toFixed(2) + ' kWp', orgConfig.valor_projeto_por_kwp ?? 0, pricing.custo_projeto),
    buildRow('Instalação', 'Mão de obra', proposal.panel_qty, orgConfig.valor_instalacao_por_placa ?? 0, pricing.custo_instalacao),
    buildRow('Quilometragem', 'Deslocamento', (proposal as any).km_rodados ?? 0, orgConfig.quilometragem ?? 0, pricing.custo_km),
    buildRow('Material CA', '% sobre kit', `${orgConfig.pct_material_ca ?? 0}%`, pricing.custo_ca, pricing.custo_ca),
  ]

  for (const ec of extraCosts) {
    const custo = ec.qtd * ec.custo_unit
    rows.push(buildRow(ec.categoria || 'Extra', ec.item || '—', ec.qtd, ec.custo_unit, custo))
  }

  const totals = rows.reduce(
    (acc, r) => ({
      custo: acc.custo + r.custo,
      imposto: acc.imposto + r.imposto,
      lucro: acc.lucro + r.lucro,
      venda: acc.venda + r.venda,
    }),
    { custo: 0, imposto: 0, lucro: 0, venda: 0 }
  )

  function addExtraCost() {
    setExtraCosts((prev) => [...prev, { id: crypto.randomUUID(), categoria: '', item: '', qtd: 1, custo_unit: 0 }])
  }

  function updateExtra(id: string, field: keyof ExtraCost, value: string | number) {
    setExtraCosts((prev) => prev.map((ec) => ec.id === id ? { ...ec, [field]: value } : ec))
  }

  function removeExtra(id: string) {
    setExtraCosts((prev) => prev.filter((ec) => ec.id !== id))
  }

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
          valor_entrada: 0,
          valor_parcelas: 0,
          num_parcelas: 0,
          extras: extraCosts.map((ec) => ({
            categoria: ec.categoria,
            item: ec.item,
            qtd: ec.qtd,
            custo_unit: ec.custo_unit,
          })),
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
  const thCls = 'text-[10px] font-semibold uppercase tracking-wide text-white/40 py-2 px-2 text-left'
  const tdCls = 'text-xs text-white/70 py-2 px-2 whitespace-nowrap'
  const inputSmCls = 'w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none border border-white/10 focus:border-white/30 bg-white/5'

  return (
    <>
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed left-56 right-0 top-0 bottom-0 z-[71] flex flex-col"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info do sistema */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,200,100,0.04)', border: '1px solid rgba(255,200,100,0.10)' }}>
              <p className="text-[10px] text-white/35 uppercase tracking-wide">Sistema</p>
              <p className="text-sm font-semibold" style={{ color: '#FFD080' }}>{proposal.total_power_kwp.toFixed(2)} kWp</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,200,100,0.04)', border: '1px solid rgba(255,200,100,0.10)' }}>
              <p className="text-[10px] text-white/35 uppercase tracking-wide">Geração/mês</p>
              <p className="text-sm font-semibold text-white/70">{Math.round(proposal.monthly_generation_kwh)} kWh</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,200,100,0.04)', border: '1px solid rgba(255,200,100,0.10)' }}>
              <p className="text-[10px] text-white/35 uppercase tracking-wide">R$/kWp</p>
              <p className="text-sm font-semibold text-white/70">
                {proposal.total_power_kwp > 0
                  ? formatCurrency(totals.venda / proposal.total_power_kwp)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Tabela de composição */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Composição do Preço</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className={thCls}>Categoria</th>
                    <th className={thCls}>Item</th>
                    <th className={`${thCls} text-right`}>Qtd.</th>
                    <th className={`${thCls} text-right`}>Custo unit.</th>
                    <th className={`${thCls} text-right`}>Custo</th>
                    <th className={`${thCls} text-right`}>Imposto</th>
                    <th className={`${thCls} text-right`}>Lucro</th>
                    <th className={`${thCls} text-right`}>Venda</th>
                    <th className={thCls} style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isExtra = i >= rows.length - extraCosts.length
                    const extraIdx = i - (rows.length - extraCosts.length)
                    const ec = isExtra ? extraCosts[extraIdx] : null

                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className={tdCls}>
                          {isExtra && ec ? (
                            <input
                              className={inputSmCls}
                              value={ec.categoria}
                              onChange={(e) => updateExtra(ec.id, 'categoria', e.target.value)}
                              placeholder="Categoria"
                              style={{ width: 90 }}
                            />
                          ) : r.categoria}
                        </td>
                        <td className={tdCls}>
                          {isExtra && ec ? (
                            <input
                              className={inputSmCls}
                              value={ec.item}
                              onChange={(e) => updateExtra(ec.id, 'item', e.target.value)}
                              placeholder="Descrição"
                              style={{ width: 120 }}
                            />
                          ) : r.item}
                        </td>
                        <td className={`${tdCls} text-right`}>
                          {isExtra && ec ? (
                            <input
                              className={`${inputSmCls} text-right`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={ec.qtd}
                              onChange={(e) => updateExtra(ec.id, 'qtd', parseFloat(e.target.value) || 0)}
                              style={{ width: 60 }}
                            />
                          ) : r.qtd}
                        </td>
                        <td className={`${tdCls} text-right`}>
                          {isExtra && ec ? (
                            <input
                              className={`${inputSmCls} text-right`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={ec.custo_unit}
                              onChange={(e) => updateExtra(ec.id, 'custo_unit', parseFloat(e.target.value) || 0)}
                              style={{ width: 80 }}
                            />
                          ) : formatCurrency(r.custoUnit)}
                        </td>
                        <td className={`${tdCls} text-right`}>{formatCurrency(r.custo)}</td>
                        <td className={`${tdCls} text-right`}>{formatCurrency(r.imposto)}</td>
                        <td className={`${tdCls} text-right`}>{formatCurrency(r.lucro)}</td>
                        <td className={`${tdCls} text-right font-medium`}>{formatCurrency(r.venda)}</td>
                        <td className={tdCls}>
                          {isExtra && ec && (
                            <button
                              onClick={() => removeExtra(ec.id)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <Trash2 size={12} style={{ color: 'rgba(255,80,80,0.5)' }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.10)' }}>
                    <td colSpan={4} className={`${tdCls} font-semibold text-white`}>Total</td>
                    <td className={`${tdCls} text-right font-semibold text-white`}>{formatCurrency(totals.custo)}</td>
                    <td className={`${tdCls} text-right font-semibold text-white`}>{formatCurrency(totals.imposto)}</td>
                    <td className={`${tdCls} text-right font-semibold text-white`}>{formatCurrency(totals.lucro)}</td>
                    <td className={`${tdCls} text-right font-bold text-base`} style={{ color: '#FFD080' }}>{formatCurrency(totals.venda)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botão adicionar custo */}
            <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                onClick={addExtraCost}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <Plus size={13} />
                Adicionar custo extra
              </button>
            </div>
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
