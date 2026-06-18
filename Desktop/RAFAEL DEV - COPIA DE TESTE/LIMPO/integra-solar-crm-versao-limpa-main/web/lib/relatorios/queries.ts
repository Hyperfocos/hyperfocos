// web/lib/relatorios/queries.ts
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export type RelatorioFilter = {
  dateFrom: string | null
  dateTo: string | null
}

export type VendasPorPeriodoRow = {
  mes: string
  label: string
  qtd_contratos: number
  valor_total: number
  ticket_medio: number
}

export type ComercialSummary = {
  qtd_propostas: number
  qtd_contratos: number
  valor_total: number
  ticket_medio: number
  taxa_conversao: number
  margem_media: number
  residencial: number
  comercial: number
  rural: number
  vendas_por_periodo: VendasPorPeriodoRow[]
}

export type LeadOrigemRow = {
  origem: string
  total_leads: number
  leads_convertidos: number
  taxa_conversao: number
}

export type RankingVendedorRow = {
  nome: string
  qtd_leads: number
  qtd_contratos: number
  valor_vendido: number
}

export type ComissaoVendedorRow = {
  nome: string
  qtd_contratos: number
  valor_total: number
  comissao: number
}

export type TecnicoSummary = {
  tempo_medio_implantacao: number | null
  modulos_por_fabricante: { fabricante: string; quantidade: number }[]
  inversores_por_fabricante: { fabricante: string; quantidade: number }[]
  total_kwh_projetados: number
  economia_financeira_estimada: number
}

const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function mesLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MES_LABELS[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`
}

export async function getComercialData(filter: RelatorioFilter): Promise<ComercialSummary> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return {
    qtd_propostas: 0, qtd_contratos: 0, valor_total: 0, ticket_medio: 0,
    taxa_conversao: 0, margem_media: 0, residencial: 0, comercial: 0, rural: 0,
    vendas_por_periodo: [],
  }

  const supabase = await createClient()

  let propQuery = (supabase as any)
    .from('clients')
    .select('id, client_type, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
  if (filter.dateFrom) propQuery = propQuery.gte('created_at', filter.dateFrom)
  if (filter.dateTo) propQuery = propQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { count: qtd_propostas_count } = await propQuery
  const qtd_propostas = qtd_propostas_count ?? 0

  let contQuery = (supabase as any)
    .from('clients')
    .select(`
      id, client_type, contract_date,
      client_sale (sale_value),
      client_contracts (pct_margem)
    `)
    .eq('organization_id', orgId)
    .not('contract_date', 'is', null)
  if (filter.dateFrom) contQuery = contQuery.gte('contract_date', filter.dateFrom)
  if (filter.dateTo) contQuery = contQuery.lte('contract_date', filter.dateTo)
  const { data: contratos } = await contQuery
  const contratosArr = (contratos ?? []) as any[]

  const qtd_contratos = contratosArr.length
  let valor_total = 0
  let margem_soma = 0
  let margem_count = 0
  let residencial = 0, comercial = 0, rural = 0
  const mesBucket: Record<string, { label: string; qtd: number; valor: number }> = {}

  for (const c of contratosArr) {
    const sale = Array.isArray(c.client_sale) ? c.client_sale[0] : c.client_sale
    const valor = sale?.sale_value ?? 0
    valor_total += valor

    const contract = Array.isArray(c.client_contracts) ? c.client_contracts[0] : c.client_contracts
    if (contract?.pct_margem != null) {
      margem_soma += Number(contract.pct_margem)
      margem_count++
    }

    const ct = (c.client_type ?? '').toLowerCase()
    if (ct === 'residencial') residencial++
    else if (ct === 'comercial') comercial++
    else if (ct === 'rural') rural++

    if (c.contract_date) {
      const key = c.contract_date.substring(0, 7)
      if (!mesBucket[key]) mesBucket[key] = { label: mesLabel(c.contract_date), qtd: 0, valor: 0 }
      mesBucket[key].qtd++
      mesBucket[key].valor += valor
    }
  }

  const ticket_medio = qtd_contratos > 0 ? valor_total / qtd_contratos : 0
  const taxa_conversao = qtd_propostas > 0 ? (qtd_contratos / qtd_propostas) * 100 : 0
  const margem_media = margem_count > 0 ? margem_soma / margem_count : 0

  const vendas_por_periodo: VendasPorPeriodoRow[] = Object.entries(mesBucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      label: v.label,
      qtd_contratos: v.qtd,
      valor_total: v.valor,
      ticket_medio: v.qtd > 0 ? v.valor / v.qtd : 0,
    }))

  return {
    qtd_propostas, qtd_contratos, valor_total, ticket_medio,
    taxa_conversao, margem_media, residencial, comercial, rural,
    vendas_por_periodo,
  }
}

export async function getLeadsData(filter: RelatorioFilter): Promise<{
  origens: LeadOrigemRow[]
  ranking: RankingVendedorRow[]
}> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return { origens: [], ranking: [] }

  const supabase = await createClient()

  let leadsQuery = (supabase as any)
    .from('leads')
    .select(`id, converted, lead_source_id, lead_sources!lead_source_id (name)`)
    .eq('organization_id', orgId)
  if (filter.dateFrom) leadsQuery = leadsQuery.gte('created_at', filter.dateFrom)
  if (filter.dateTo) leadsQuery = leadsQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { data: leadsData } = await leadsQuery

  const origemMap: Record<string, { total: number; convertidos: number }> = {}
  for (const l of (leadsData ?? []) as any[]) {
    const nome = l.lead_sources?.name ?? 'Sem origem'
    if (!origemMap[nome]) origemMap[nome] = { total: 0, convertidos: 0 }
    origemMap[nome].total++
    if (l.converted) origemMap[nome].convertidos++
  }
  const origens: LeadOrigemRow[] = Object.entries(origemMap)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([origem, v]) => ({
      origem,
      total_leads: v.total,
      leads_convertidos: v.convertidos,
      taxa_conversao: v.total > 0 ? (v.convertidos / v.total) * 100 : 0,
    }))

  let rankQuery = (supabase as any)
    .from('clients')
    .select(`
      id, contract_date, responsible_id,
      profiles!responsible_id (full_name, email),
      client_sale (sale_value)
    `)
    .eq('organization_id', orgId)
  if (filter.dateFrom) rankQuery = rankQuery.gte('created_at', filter.dateFrom)
  if (filter.dateTo) rankQuery = rankQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { data: clientsData } = await rankQuery

  const vendedorMap: Record<string, { nome: string; qtd_leads: number; qtd_contratos: number; valor: number }> = {}
  for (const c of (clientsData ?? []) as any[]) {
    const profile = c.profiles
    if (!profile) continue
    const nome = profile.full_name ?? profile.email ?? 'Desconhecido'
    const id = c.responsible_id ?? nome
    if (!vendedorMap[id]) vendedorMap[id] = { nome, qtd_leads: 0, qtd_contratos: 0, valor: 0 }
    vendedorMap[id].qtd_leads++
    if (c.contract_date) {
      vendedorMap[id].qtd_contratos++
      const sale = Array.isArray(c.client_sale) ? c.client_sale[0] : c.client_sale
      vendedorMap[id].valor += sale?.sale_value ?? 0
    }
  }
  const ranking: RankingVendedorRow[] = Object.values(vendedorMap)
    .sort((a, b) => b.valor - a.valor)
    .map((v) => ({
      nome: v.nome,
      qtd_leads: v.qtd_leads,
      qtd_contratos: v.qtd_contratos,
      valor_vendido: v.valor,
    }))

  return { origens, ranking }
}

export async function getFinanceiroData(filter: RelatorioFilter): Promise<{ comissoes: ComissaoVendedorRow[] }> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return { comissoes: [] }

  const supabase = await createClient()

  let query = (supabase as any)
    .from('clients')
    .select(`
      id, contract_date, responsible_id,
      profiles!responsible_id (full_name, email),
      client_sale (sale_value),
      client_contracts (pct_comissao)
    `)
    .eq('organization_id', orgId)
    .not('contract_date', 'is', null)
  if (filter.dateFrom) query = query.gte('contract_date', filter.dateFrom)
  if (filter.dateTo) query = query.lte('contract_date', filter.dateTo)
  const { data } = await query

  const map: Record<string, { nome: string; qtd: number; valor: number; comissao: number }> = {}
  for (const c of (data ?? []) as any[]) {
    const profile = c.profiles
    if (!profile) continue
    const nome = profile.full_name ?? profile.email ?? 'Desconhecido'
    const id = c.responsible_id ?? nome
    if (!map[id]) map[id] = { nome, qtd: 0, valor: 0, comissao: 0 }
    map[id].qtd++
    const sale = Array.isArray(c.client_sale) ? c.client_sale[0] : c.client_sale
    const valor = sale?.sale_value ?? 0
    map[id].valor += valor
    const contract = Array.isArray(c.client_contracts) ? c.client_contracts[0] : c.client_contracts
    const pct = Number(contract?.pct_comissao ?? 0)
    map[id].comissao += valor * pct / 100
  }

  const comissoes: ComissaoVendedorRow[] = Object.values(map)
    .sort((a, b) => b.comissao - a.comissao)
    .map((v) => ({
      nome: v.nome,
      qtd_contratos: v.qtd,
      valor_total: v.valor,
      comissao: v.comissao,
    }))

  return { comissoes }
}

export async function getTecnicoData(filter: RelatorioFilter): Promise<TecnicoSummary> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return {
    tempo_medio_implantacao: null,
    modulos_por_fabricante: [],
    inversores_por_fabricante: [],
    total_kwh_projetados: 0,
    economia_financeira_estimada: 0,
  }

  const supabase = await createClient()

  let projQuery = (supabase as any)
    .from('client_projects')
    .select('modules_brand, inverter_brand, estimated_production, estimated_savings')
    .eq('organization_id', orgId)
  if (filter.dateFrom) projQuery = projQuery.gte('created_at', filter.dateFrom)
  if (filter.dateTo) projQuery = projQuery.lte('created_at', filter.dateTo + 'T23:59:59')
  const { data: projetos } = await projQuery

  const modulosMap: Record<string, number> = {}
  const inversoresMap: Record<string, number> = {}
  let total_kwh = 0
  let total_economia = 0

  for (const p of (projetos ?? []) as any[]) {
    const mb = (p.modules_brand ?? '').trim()
    if (mb) modulosMap[mb] = (modulosMap[mb] ?? 0) + 1
    const ib = (p.inverter_brand ?? '').trim()
    if (ib) inversoresMap[ib] = (inversoresMap[ib] ?? 0) + 1
    total_kwh += Number(p.estimated_production ?? 0)
    total_economia += Number(p.estimated_savings ?? 0)
  }

  const { data: obras } = await (supabase as any)
    .from('client_obras')
    .select(`client_id, data_inicio, clients!client_id (contract_date)`)
    .eq('organization_id', orgId)
    .not('data_inicio', 'is', null)

  let dias_total = 0
  let dias_count = 0
  for (const o of (obras ?? []) as any[]) {
    const contractDate = o.clients?.contract_date
    if (contractDate && o.data_inicio) {
      const dias = Math.floor(
        (new Date(o.data_inicio).getTime() - new Date(contractDate).getTime()) / 86400000
      )
      if (dias >= 0) { dias_total += dias; dias_count++ }
    }
  }

  return {
    tempo_medio_implantacao: dias_count > 0 ? Math.round(dias_total / dias_count) : null,
    modulos_por_fabricante: Object.entries(modulosMap)
      .sort(([, a], [, b]) => b - a)
      .map(([fabricante, quantidade]) => ({ fabricante, quantidade })),
    inversores_por_fabricante: Object.entries(inversoresMap)
      .sort(([, a], [, b]) => b - a)
      .map(([fabricante, quantidade]) => ({ fabricante, quantidade })),
    total_kwh_projetados: total_kwh,
    economia_financeira_estimada: total_economia,
  }
}
