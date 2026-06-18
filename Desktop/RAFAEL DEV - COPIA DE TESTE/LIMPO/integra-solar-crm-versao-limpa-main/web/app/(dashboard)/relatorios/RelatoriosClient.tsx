'use client'

import { useState, useTransition } from 'react'
import './print.css'
import {
  getComercialData, getLeadsData, getFinanceiroData, getTecnicoData,
} from '@/lib/relatorios/queries'
import type {
  ComercialSummary, LeadOrigemRow, RankingVendedorRow,
  ComissaoVendedorRow, TecnicoSummary, RelatorioFilter,
} from '@/lib/relatorios/queries'

type Tab = 'comercial' | 'leads' | 'financeiro' | 'tecnico'

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function fmtNum(v: number, decimals = 0) { return v.toLocaleString('pt-BR', { maximumFractionDigits: decimals }) }
function fmtPct(v: number) { return v.toFixed(1) + '%' }

function FilterBar({
  dateFrom, dateTo, onChange, onApply, isPending,
}: {
  dateFrom: string
  dateTo: string
  onChange: (f: string, t: string) => void
  onApply: () => void
  isPending: boolean
}) {
  return (
    <div className="no-print flex items-center gap-3 mb-6">
      <div>
        <label className="text-xs text-white/40 block mb-1">De</label>
        <input
          type="date"
          className="px-3 py-2 rounded-xl text-sm text-white border border-white/10 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          value={dateFrom}
          onChange={(e) => onChange(e.target.value, dateTo)}
        />
      </div>
      <div>
        <label className="text-xs text-white/40 block mb-1">Até</label>
        <input
          type="date"
          className="px-3 py-2 rounded-xl text-sm text-white border border-white/10 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          value={dateTo}
          onChange={(e) => onChange(dateFrom, e.target.value)}
        />
      </div>
      <button
        onClick={onApply}
        disabled={isPending}
        className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-50"
      >
        {isPending ? 'Buscando...' : 'Aplicar'}
      </button>
    </div>
  )
}

function EmptyState() {
  return <p className="text-white/30 py-12 text-center">Aplique um filtro para ver os dados.</p>
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/08">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      {children}
    </th>
  )
}

function Td({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td className="px-4 py-2.5 font-medium"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        color: highlight ? '#FFD080' : 'rgba(255,255,255,0.8)',
      }}>
      {children}
    </td>
  )
}

// ---------- Aba Comercial ----------
function AbaComercial({ data }: { data: ComercialSummary | null }) {
  if (!data) return <EmptyState />
  return (
    <div id="print-area">
      <h2 className="text-white font-bold text-lg mb-4">Relatório Comercial</h2>
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-3">
        {[
          { label: 'Propostas', value: fmtNum(data.qtd_propostas) },
          { label: 'Contratos Fechados', value: fmtNum(data.qtd_contratos) },
          { label: 'Valor Vendido', value: fmt(data.valor_total) },
          { label: 'Ticket Médio', value: fmt(data.ticket_medio) },
          { label: 'Taxa de Conversão', value: fmtPct(data.taxa_conversao) },
          { label: 'Margem Média', value: fmtPct(data.margem_media) },
          { label: 'Residencial', value: fmtNum(data.residencial) },
          { label: 'Comercial', value: fmtNum(data.comercial) },
          { label: 'Rural', value: fmtNum(data.rural) },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-white/40 mb-1">{k.label}</p>
            <p className="text-lg font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-white/70 mb-2">Vendas por Período</h3>
      <TableWrapper>
        <thead><tr><Th>Mês</Th><Th>Contratos</Th><Th>Valor Total</Th><Th>Ticket Médio</Th></tr></thead>
        <tbody>
          {data.vendas_por_periodo.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30">Sem dados</td></tr>
          )}
          {data.vendas_por_periodo.map((r) => (
            <tr key={r.mes}>
              <Td>{r.label}</Td>
              <Td>{r.qtd_contratos}</Td>
              <Td>{fmt(r.valor_total)}</Td>
              <Td highlight>{fmt(r.ticket_medio)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  )
}

// ---------- Aba Leads ----------
function AbaLeads({ origens, ranking }: { origens: LeadOrigemRow[] | null; ranking: RankingVendedorRow[] | null }) {
  if (!origens) return <EmptyState />
  return (
    <div id="print-area">
      <h2 className="text-white font-bold text-lg mb-4">Relatório de Leads</h2>
      <h3 className="text-sm font-semibold text-white/70 mb-2">Leads por Origem</h3>
      <TableWrapper>
        <thead><tr><Th>Origem</Th><Th>Total</Th><Th>Convertidos</Th><Th>Taxa de Conversão</Th></tr></thead>
        <tbody>
          {origens.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30">Sem dados</td></tr>}
          {origens.map((r) => (
            <tr key={r.origem}>
              <Td>{r.origem}</Td>
              <Td>{r.total_leads}</Td>
              <Td>{r.leads_convertidos}</Td>
              <Td highlight>{fmtPct(r.taxa_conversao)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>

      <h3 className="text-sm font-semibold text-white/70 mt-6 mb-2">Ranking de Vendedores</h3>
      <TableWrapper>
        <thead><tr><Th>#</Th><Th>Vendedor</Th><Th>Leads</Th><Th>Contratos</Th><Th>Valor Vendido</Th></tr></thead>
        <tbody>
          {(ranking ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30">Sem dados</td></tr>}
          {(ranking ?? []).map((r, i) => (
            <tr key={r.nome}>
              <Td><span className="text-white/30">{i + 1}</span></Td>
              <Td>{r.nome}</Td>
              <Td>{r.qtd_leads}</Td>
              <Td>{r.qtd_contratos}</Td>
              <Td highlight>{fmt(r.valor_vendido)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  )
}

// ---------- Aba Financeiro ----------
function AbaFinanceiro({ comissoes }: { comissoes: ComissaoVendedorRow[] | null }) {
  if (!comissoes) return <EmptyState />
  return (
    <div id="print-area">
      <h2 className="text-white font-bold text-lg mb-4">Comissões por Vendedor</h2>
      <TableWrapper>
        <thead><tr><Th>Vendedor</Th><Th>Contratos</Th><Th>Valor Total</Th><Th>Comissão</Th></tr></thead>
        <tbody>
          {comissoes.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30">Sem dados</td></tr>}
          {comissoes.map((r) => (
            <tr key={r.nome}>
              <Td>{r.nome}</Td>
              <Td>{r.qtd_contratos}</Td>
              <Td>{fmt(r.valor_total)}</Td>
              <Td highlight>{fmt(r.comissao)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  )
}

// ---------- Aba Técnico ----------
function AbaTecnico({ data }: { data: TecnicoSummary | null }) {
  if (!data) return <EmptyState />
  return (
    <div id="print-area">
      <h2 className="text-white font-bold text-lg mb-4">Relatório Técnico</h2>
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-3">
        {[
          { label: 'Tempo Médio de Implantação', value: data.tempo_medio_implantacao != null ? `${data.tempo_medio_implantacao} dias` : '—' },
          { label: 'Total kWh Projetados', value: fmtNum(data.total_kwh_projetados, 2) + ' kWh' },
          { label: 'Economia Financeira Estimada', value: fmt(data.economia_financeira_estimada) },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-white/40 mb-1">{k.label}</p>
            <p className="text-lg font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-2">Módulos por Fabricante</h3>
          <TableWrapper>
            <thead><tr><Th>Fabricante</Th><Th>Qtd</Th></tr></thead>
            <tbody>
              {data.modulos_por_fabricante.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-white/30">Sem dados</td></tr>}
              {data.modulos_por_fabricante.map((r) => (
                <tr key={r.fabricante}><Td>{r.fabricante}</Td><Td>{r.quantidade}</Td></tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/70 mb-2">Inversores por Fabricante</h3>
          <TableWrapper>
            <thead><tr><Th>Fabricante</Th><Th>Qtd</Th></tr></thead>
            <tbody>
              {data.inversores_por_fabricante.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-white/30">Sem dados</td></tr>}
              {data.inversores_por_fabricante.map((r) => (
                <tr key={r.fabricante}><Td>{r.fabricante}</Td><Td>{r.quantidade}</Td></tr>
              ))}
            </tbody>
          </TableWrapper>
        </div>
      </div>
    </div>
  )
}

// ---------- Main ----------
export default function RelatoriosClient() {
  const [tab, setTab] = useState<Tab>('comercial')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()

  const [comercialData, setComercialData] = useState<ComercialSummary | null>(null)
  const [leadsOrigens, setLeadsOrigens] = useState<LeadOrigemRow[] | null>(null)
  const [leadsRanking, setLeadsRanking] = useState<RankingVendedorRow[] | null>(null)
  const [comissoes, setComissoes] = useState<ComissaoVendedorRow[] | null>(null)
  const [tecnicoData, setTecnicoData] = useState<TecnicoSummary | null>(null)

  const filter: RelatorioFilter = { dateFrom: dateFrom || null, dateTo: dateTo || null }

  function handleApply() {
    startTransition(async () => {
      if (tab === 'comercial') {
        setComercialData(await getComercialData(filter))
      } else if (tab === 'leads') {
        const d = await getLeadsData(filter)
        setLeadsOrigens(d.origens)
        setLeadsRanking(d.ranking)
      } else if (tab === 'financeiro') {
        const d = await getFinanceiroData(filter)
        setComissoes(d.comissoes)
      } else if (tab === 'tecnico') {
        setTecnicoData(await getTecnicoData(filter))
      }
    })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'comercial', label: 'Comercial' },
    { key: 'leads', label: 'Leads' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'tecnico', label: 'Técnico' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <button
          className="no-print px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          style={{ background: '#FFD080', color: '#1A1A1A' }}
          onClick={() => window.print()}
        >
          Baixar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key
              ? { background: 'rgba(255,200,100,0.12)', color: '#FFD080', fontWeight: 600 }
              : { color: 'rgba(255,255,255,0.4)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={(f, t) => { setDateFrom(f); setDateTo(t) }}
        onApply={handleApply}
        isPending={isPending}
      />

      <div className="rounded-2xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {tab === 'comercial' && <AbaComercial data={comercialData} />}
        {tab === 'leads' && <AbaLeads origens={leadsOrigens} ranking={leadsRanking} />}
        {tab === 'financeiro' && <AbaFinanceiro comissoes={comissoes} />}
        {tab === 'tecnico' && <AbaTecnico data={tecnicoData} />}
      </div>
    </div>
  )
}
