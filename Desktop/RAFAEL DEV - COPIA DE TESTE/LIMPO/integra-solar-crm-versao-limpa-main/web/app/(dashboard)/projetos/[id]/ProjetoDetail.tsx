// web/app/(dashboard)/projetos/[id]/ProjetoDetail.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjetoClient, ProjetoMember } from '@/lib/projetos/queries'
import { upsertProject } from '@/lib/projetos/actions'
import { DatePicker } from '@/components/ui/inputs'

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovado' },
]

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  enviado: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  em_analise: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  aprovado: 'bg-green-500/20 text-green-300 border-green-500/40',
}

export default function ProjetoDetail({
  projeto,
  members,
  clientId,
}: {
  projeto: ProjetoClient
  members: ProjetoMember[]
  clientId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    responsavel_id: projeto.responsavel_id ?? '',
    numero_processo: projeto.numero_processo ?? '',
    data_protocolo: projeto.data_protocolo ?? '',
    prazo_protocolo: projeto.prazo_protocolo ?? '',
    data_solicitacao_vistoria: projeto.data_solicitacao_vistoria ?? '',
    prazo_vistoria: projeto.prazo_vistoria ?? '',
    status: projeto.status,
    checklist: { ...projeto.checklist },
  })

  function handleCheckbox(key: keyof typeof form.checklist) {
    setForm((f) => ({ ...f, checklist: { ...f.checklist, [key]: !f.checklist[key] } }))
  }

  function handleSave() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await upsertProject(clientId, {
        responsavel_id: form.responsavel_id || null,
        numero_processo: form.numero_processo || null,
        data_protocolo: form.data_protocolo || null,
        prazo_protocolo: form.prazo_protocolo || null,
        data_solicitacao_vistoria: form.data_solicitacao_vistoria || null,
        prazo_vistoria: form.prazo_vistoria || null,
        status: form.status,
        checklist: form.checklist,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.success ?? 'Salvo.')
        if (form.status === 'aprovado') router.push('/projetos')
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
          <h1 className="text-2xl font-bold text-white">{projeto.client_name}</h1>
          <p className="text-white/40 text-sm mt-0.5">{projeto.client_city}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs border ${STATUS_BADGE[projeto.status] ?? 'bg-gray-500/20 text-gray-300'}`}
        >
          {STATUS_OPTIONS.find((o) => o.value === projeto.status)?.label ?? projeto.status}
        </span>
      </div>

      {/* Prazo global */}
      <div
        className="rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <span className="text-white/50 text-sm">Prazo global:</span>
        <span className="text-white font-semibold">
          {projeto.dias_usados} / {projeto.contract_max_days ?? '—'} dias
        </span>
      </div>

      {/* Checklist */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Checklist</h2>
        {(
          [
            ['memorial_calculo', 'Memorial de Cálculo'],
            ['art', 'ART'],
            ['homologacao', 'Homologação junto à concessionária'],
          ] as [keyof typeof form.checklist, string][]
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.checklist[key]}
              onChange={() => handleCheckbox(key)}
              className="w-4 h-4 accent-yellow-400"
            />
            <span className="text-sm text-white/80">{label}</span>
          </label>
        ))}
      </div>

      {/* Responsável + Status */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Responsável e Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Responsável técnico</label>
            <select
              value={form.responsavel_id}
              onChange={(e) => setForm((f) => ({ ...f, responsavel_id: e.target.value }))}
              className={inputCls}
            >
              <option value="">— Selecionar —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
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
        </div>
      </div>

      {/* Datas */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-sm font-semibold text-white/70">Datas do Processo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Número do processo</label>
            <input
              type="text"
              value={form.numero_processo}
              onChange={(e) => setForm((f) => ({ ...f, numero_processo: e.target.value }))}
              className={inputCls}
              placeholder="Ex: 2024/001234"
            />
          </div>
          <div />
          <div>
            <DatePicker label="Data de protocolo" value={form.data_protocolo || null} onChange={(iso) => setForm((f) => ({ ...f, data_protocolo: iso }))} />
          </div>
          <div>
            <DatePicker label="Prazo do protocolo" value={form.prazo_protocolo || null} onChange={(iso) => setForm((f) => ({ ...f, prazo_protocolo: iso }))} />
          </div>
          <div>
            <DatePicker label="Data de solicitação de vistoria" value={form.data_solicitacao_vistoria || null} onChange={(iso) => setForm((f) => ({ ...f, data_solicitacao_vistoria: iso }))} />
          </div>
          <div>
            <DatePicker label="Prazo da vistoria" value={form.prazo_vistoria || null} onChange={(iso) => setForm((f) => ({ ...f, prazo_vistoria: iso }))} />
          </div>
        </div>
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
