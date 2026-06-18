// web/app/(dashboard)/compras/[id]/CompraDetail.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CompraClient } from '@/lib/compras/queries'
import { upsertPurchase } from '@/lib/compras/actions'

const STATUS_OPTIONS = [
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'entregue', label: 'Entregue' },
]

const STATUS_BADGE: Record<string, string> = {
  aguardando: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  confirmado: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  entregue: 'bg-green-500/20 text-green-300 border-green-500/40',
}

function formatCurrency(val: number | null) {
  if (val == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function CompraDetail({
  compra,
  clientId,
}: {
  compra: CompraClient
  clientId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    fornecedor: compra.fornecedor ?? '',
    itens: compra.itens ?? '',
    valor: compra.valor?.toString() ?? '',
    data_prevista: compra.data_prevista ?? '',
    status: compra.status,
    nf_url: compra.nf_url ?? '',
  })

  function handleSave() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await upsertPurchase(clientId, {
        fornecedor: form.fornecedor || null,
        itens: form.itens || null,
        valor: form.valor ? parseFloat(form.valor) : null,
        data_prevista: form.data_prevista || null,
        status: form.status,
        nf_url: form.nf_url || null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.success ?? 'Salvo.')
        if (form.status === 'entregue') router.push('/compras')
      }
    })
  }

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60'
  const labelCls = 'block text-xs text-white/50 mb-1'
  const cardCls = 'rounded-2xl border border-white/10 p-5 space-y-4'
  const cardStyle = { background: 'rgba(255,255,255,0.04)' }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{compra.client_name}</h1>
          <p className="text-white/40 text-sm mt-0.5">Pedido de Compra</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs border ${STATUS_BADGE[compra.status] ?? 'bg-gray-500/20 text-gray-300'}`}
        >
          {STATUS_OPTIONS.find((o) => o.value === compra.status)?.label ?? compra.status}
        </span>
      </div>

      {/* Prazo global */}
      <div
        className="rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <span className="text-white/50 text-sm">Prazo global:</span>
        <span className="text-white font-semibold">
          {compra.dias_usados} / {compra.contract_max_days ?? '—'} dias
        </span>
      </div>

      {/* Pedido */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Pedido</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Fornecedor</label>
            <input
              type="text"
              value={form.fornecedor}
              onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))}
              className={inputCls}
              placeholder="Nome do fornecedor"
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Itens</label>
            <textarea
              value={form.itens}
              onChange={(e) => setForm((f) => ({ ...f, itens: e.target.value }))}
              className={inputCls + ' min-h-[80px] resize-none'}
              placeholder="Descrição dos itens do pedido"
            />
          </div>
          <div>
            <label className={labelCls}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              className={inputCls}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className={labelCls}>Data prevista de entrega</label>
            <input
              type="date"
              value={form.data_prevista}
              onChange={(e) => setForm((f) => ({ ...f, data_prevista: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Status + NF */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Status e Documentos</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={inputCls}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>URL da NF / comprovante</label>
            <input
              type="url"
              value={form.nf_url}
              onChange={(e) => setForm((f) => ({ ...f, nf_url: e.target.value }))}
              className={inputCls}
              placeholder="https://..."
            />
          </div>
        </div>
        {compra.nf_url && (
          <a
            href={compra.nf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: '#FFD080' }}
          >
            Ver NF atual
          </a>
        )}
      </div>

      {/* Feedback + Salvar */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
          {success}
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
        style={{ background: '#FFD080', color: '#0a0e1a' }}
      >
        {isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}
