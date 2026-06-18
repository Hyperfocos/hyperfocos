// web/app/(dashboard)/entrega-obra/[id]/EntregaObraDetail.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EntregaObraClient } from '@/lib/entrega-obra/queries'
import { upsertObraDelivery } from '@/lib/entrega-obra/actions'

export default function EntregaObraDetail({
  entrega,
  clientId,
}: {
  entrega: EntregaObraClient
  clientId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    data_entrega: entrega.data_entrega ?? '',
    termo_url: entrega.termo_url ?? '',
    observacoes: entrega.observacoes ?? '',
    status: entrega.status,
    checklist: { ...entrega.checklist },
  })

  function handleCheckbox(key: keyof typeof form.checklist) {
    setForm((f) => ({ ...f, checklist: { ...f.checklist, [key]: !f.checklist[key] } }))
  }

  function handleSave() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await upsertObraDelivery(clientId, {
        data_entrega: form.data_entrega || null,
        termo_url: form.termo_url || null,
        observacoes: form.observacoes || null,
        checklist: form.checklist,
        status: form.status,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.success ?? 'Salvo.')
        if (form.status === 'concluida') router.push('/entrega-obra')
      }
    })
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60'
  const labelCls = 'block text-xs text-white/50 mb-1'
  const cardCls = 'rounded-2xl border border-white/10 p-5 space-y-4'
  const cardStyle = { background: 'rgba(255,255,255,0.04)' }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{entrega.client_name}</h1>
          <p className="text-white/40 text-sm mt-0.5">{entrega.client_city}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs border ${entrega.status === 'concluida' ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'}`}>
          {entrega.status === 'concluida' ? 'Concluída' : 'Pendente'}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3" style={cardStyle}>
        <span className="text-white/50 text-sm">Prazo global:</span>
        <span className="text-white font-semibold">{entrega.dias_usados} / {entrega.contract_max_days ?? '—'} dias</span>
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Checklist de Entrega</h2>
        {([
          ['vistoria', 'Vistoria realizada'],
          ['fotos', 'Fotos registradas'],
          ['cliente_ok', 'Aprovação do cliente'],
        ] as [keyof typeof form.checklist, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.checklist[key]} onChange={() => handleCheckbox(key)} className="w-4 h-4 accent-yellow-400" />
            <span className="text-sm text-white/80">{label}</span>
          </label>
        ))}
      </div>

      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Dados da Entrega</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Data de entrega ao cliente</label>
            <input type="date" value={form.data_entrega} onChange={(e) => setForm((f) => ({ ...f, data_entrega: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
              <option value="pendente">Pendente</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>URL do termo de entrega assinado</label>
            <input type="url" value={form.termo_url} onChange={(e) => setForm((f) => ({ ...f, termo_url: e.target.value }))} className={inputCls} placeholder="https://..." />
          </div>
          {entrega.termo_url && (
            <div className="col-span-2">
              <a href={entrega.termo_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: '#FFD080' }}>Ver termo atual</a>
            </div>
          )}
          <div className="col-span-2">
            <label className={labelCls}>Observações gerais</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Observações sobre a entrega da obra..."
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">{success}</p>}
      <button onClick={handleSave} disabled={isPending} className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50" style={{ background: '#FFD080', color: '#0a0e1a' }}>
        {isPending ? 'Salvando…' : 'Salvar e liberar Pós-Obra'}
      </button>
    </div>
  )
}
