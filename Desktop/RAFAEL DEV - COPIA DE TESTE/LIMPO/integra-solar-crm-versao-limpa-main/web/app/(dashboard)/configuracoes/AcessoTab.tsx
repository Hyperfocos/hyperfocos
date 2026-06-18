'use client'

import { useState, useTransition } from 'react'
import type { Colaborador } from '@/lib/colaboradores/queries'
import { createColaborador, removeColaborador } from '@/lib/colaboradores/actions'

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/60'
const labelCls = 'block text-xs text-white/50 mb-1'
const cardCls = 'rounded-2xl border border-white/10 p-5 space-y-4'
const cardStyle = { background: 'rgba(255,255,255,0.04)' }

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'leads', label: 'CRM / Leads' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'compras', label: 'Compras' },
  { key: 'comissoes', label: 'Comissões' },
  { key: 'entrega_material', label: 'Entrega do Material' },
  { key: 'obra', label: 'Obra' },
  { key: 'entrega_obra', label: 'Entrega da Obra' },
  { key: 'pos_obra', label: 'Pós-Obra' },
  { key: 'configuracoes', label: 'Configurações' },
]

const PERM_COLS = [
  { key: 'access', label: 'Acessar' },
  { key: 'view_all', label: 'Ver todos' },
  { key: 'add', label: 'Adicionar' },
  { key: 'edit', label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
] as const

type PermKey = typeof PERM_COLS[number]['key']

type PermRow = Record<PermKey, boolean>
type Permissions = Record<string, PermRow>

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  instalador: 'Instalador',
  projetista: 'Projetista',
}

const defaultPermissions = (): Permissions =>
  Object.fromEntries(
    MODULES.map((m) => [
      m.key,
      { access: false, view_all: false, add: false, edit: false, delete: false },
    ])
  )

export default function AcessoTab({ colaboradores: initial }: { colaboradores: Colaborador[] }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(initial)
  const [removePending, startRemove] = useTransition()

  // Add form
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'vendedor',
  })
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions())
  const [addPending, startAdd] = useTransition()
  const [addResult, setAddResult] = useState<{ error?: string; success?: string } | null>(null)

  function handleRemove(id: string, user_id: string) {
    if (!window.confirm('Remover colaborador?')) return
    startRemove(async () => {
      const res = await removeColaborador(id, user_id)
      if (res.success) {
        setColaboradores((prev) => prev.filter((c) => c.id !== id))
      }
    })
  }

  function togglePerm(moduleKey: string, permKey: PermKey, value: boolean) {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [permKey]: value },
    }))
  }

  function toggleAllInCol(permKey: PermKey, value: boolean) {
    setPermissions((prev) => {
      const next = { ...prev }
      MODULES.forEach((m) => {
        next[m.key] = { ...next[m.key], [permKey]: value }
      })
      return next
    })
  }

  function isColChecked(permKey: PermKey) {
    return MODULES.every((m) => permissions[m.key][permKey])
  }

  function handleAdd() {
    setAddResult(null)
    startAdd(async () => {
      const res = await createColaborador({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        permissions,
      })
      setAddResult(res)
      if (res.success) {
        setForm({ full_name: '', email: '', password: '', role: 'vendedor' })
        setPermissions(defaultPermissions())
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ── Lista de Colaboradores ─────────────────────────────────────── */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-semibold text-white">Colaboradores</h2>

        {colaboradores.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhum colaborador cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-white/50 font-medium">Nome</th>
                  <th className="text-left py-2 pr-4 text-white/50 font-medium">E-mail</th>
                  <th className="text-left py-2 pr-4 text-white/50 font-medium">Função</th>
                  <th className="text-left py-2 text-white/50 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-white">{c.full_name ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-white/70">{c.email}</td>
                    <td className="py-2.5 pr-4 text-white/70">
                      {ROLE_LABELS[c.role] ?? c.role}
                    </td>
                    <td className="py-2.5">
                      {c.role !== 'owner' && (
                        <button
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                          disabled={removePending}
                          onClick={() => handleRemove(c.id, c.user_id)}
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Adicionar Colaborador ──────────────────────────────────────── */}
      <div className={cardCls} style={cardStyle}>
        <h2 className="text-base font-semibold text-white">Adicionar Colaborador</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome completo</label>
            <input
              className={inputCls}
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Senha</label>
            <input
              className={inputCls}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Função</label>
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="admin">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="vendedor">Vendedor</option>
              <option value="instalador">Instalador</option>
              <option value="projetista">Projetista</option>
            </select>
          </div>
        </div>

        {/* Permissions grid */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-white/50 font-medium w-40">Módulo</th>
                {PERM_COLS.map((col) => (
                  <th key={col.key} className="py-2 px-3 text-white/50 font-medium text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{col.label}</span>
                      <input
                        type="checkbox"
                        checked={isColChecked(col.key)}
                        onChange={(e) => toggleAllInCol(col.key, e.target.checked)}
                        className="accent-yellow-400"
                        title="Marcar todos"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-white/70">{m.label}</td>
                  {PERM_COLS.map((col) => (
                    <td key={col.key} className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={permissions[m.key][col.key]}
                        onChange={(e) => togglePerm(m.key, col.key, e.target.checked)}
                        className="accent-yellow-400"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            className="px-5 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-50"
            style={{ background: '#FFD080', color: '#0a0e1a' }}
            disabled={addPending}
            onClick={handleAdd}
          >
            {addPending ? 'Criando...' : 'Criar Colaborador'}
          </button>
          {addResult?.error && (
            <p className="text-red-400 text-xs">{addResult.error}</p>
          )}
          {addResult?.success && (
            <p className="text-green-400 text-xs">{addResult.success}</p>
          )}
        </div>
      </div>
    </div>
  )
}
