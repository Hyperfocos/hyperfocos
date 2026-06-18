// web/lib/dashboard/queries.ts
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export type PipelineCard = {
  label: string
  href: string
  total: number
  pending: number
  color: string
}

export type KpiData = {
  qtd_vendas: number
  valor_total: number
  potencia_kwp: number
  ticket_medio: number
}

export type FaturamentoMes = {
  mes: string       // '2025-01', '2025-02', etc.
  label: string     // 'Jan', 'Fev', etc.
  ano_atual: number
  ano_anterior: number
}

export type LeadOrigemItem = {
  name: string
  count: number
}

export type MetaData = {
  meta_anual: number
  meta_mensal: number
  realizado_mes: number
  realizado_ano: number
}

// ---------- helpers ----------

async function countTotal(supabase: any, table: string, orgId: string): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
  return count ?? 0
}

async function countPending(
  supabase: any,
  table: string,
  orgId: string,
  statusField: string,
  pendingValues: string[]
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in(statusField, pendingValues)
  return count ?? 0
}

// ---------- pipeline cards ----------

export async function getPipelineCards(): Promise<PipelineCard[]> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return []

  const supabase = await createClient()

  const [
    leadsTotal, leadsPending,
    contratosTotal, contratosPending,
    finTotal, finPending,
    projTotal, projPending,
    compTotal, compPending,
    comTotal, comPending,
    entregaTotal, entregaPending,
    obraTotal, obraPending,
    entregaObraTotal, entregaObraPending,
    posObraTotal, posObraPending,
  ] = await Promise.all([
    // Leads: total ativos (não convertidos)
    (async () => {
      const { count } = await (supabase as any)
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('converted', false)
      return count ?? 0
    })(),
    // Leads pendentes: tem next_action_date passada ou sem stage terminal
    (async () => {
      const { count } = await (supabase as any)
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('converted', false)
      return count ?? 0
    })(),
    // Contratos: total
    countTotal(supabase as any, 'client_contracts', orgId),
    // Contratos pendentes: não assinados
    countPending(supabase as any, 'client_contracts', orgId, 'status', ['aguardando_assinatura', 'aguardando']),
    // Financeiro: total parcelas
    countTotal(supabase as any, 'client_installments', orgId),
    // Financeiro pendentes
    countPending(supabase as any, 'client_installments', orgId, 'status', ['pendente']),
    // Projetos
    countTotal(supabase as any, 'client_projects', orgId),
    countPending(supabase as any, 'client_projects', orgId, 'status', ['pendente', 'em_andamento']),
    // Compras
    countTotal(supabase as any, 'client_purchases', orgId),
    countPending(supabase as any, 'client_purchases', orgId, 'status', ['aguardando', 'confirmado']),
    // Comissões
    countTotal(supabase as any, 'client_commissions', orgId),
    countPending(supabase as any, 'client_commissions', orgId, 'status', ['pendente']),
    // Entrega Material
    countTotal(supabase as any, 'client_deliveries', orgId),
    countPending(supabase as any, 'client_deliveries', orgId, 'status', ['pendente']),
    // Obra
    countTotal(supabase as any, 'client_obras', orgId),
    countPending(supabase as any, 'client_obras', orgId, 'status', ['aguardando', 'em_andamento']),
    // Entrega da Obra
    countTotal(supabase as any, 'client_obra_deliveries', orgId),
    countPending(supabase as any, 'client_obra_deliveries', orgId, 'status', ['pendente']),
    // Pós-Obra
    countTotal(supabase as any, 'client_pos_obra', orgId),
    countPending(supabase as any, 'client_pos_obra', orgId, 'status', ['pendente']),
  ])

  return [
    { label: 'Leads',             href: '/leads',             total: leadsTotal,       pending: leadsPending,       color: '#60a5fa' },
    { label: 'Contratos',         href: '/contratos',         total: contratosTotal,   pending: contratosPending,   color: '#a78bfa' },
    { label: 'Financeiro',        href: '/financeiro',        total: finTotal,         pending: finPending,         color: '#34d399' },
    { label: 'Projetos',          href: '/projetos',          total: projTotal,        pending: projPending,        color: '#fbbf24' },
    { label: 'Compras',           href: '/compras',           total: compTotal,        pending: compPending,        color: '#f87171' },
    { label: 'Comissões',         href: '/comissoes',         total: comTotal,         pending: comPending,         color: '#fb923c' },
    { label: 'Entrega Material',  href: '/entrega-material',  total: entregaTotal,     pending: entregaPending,     color: '#38bdf8' },
    { label: 'Obra',              href: '/obra',              total: obraTotal,        pending: obraPending,        color: '#4ade80' },
    { label: 'Entrega da Obra',   href: '/entrega-obra',      total: entregaObraTotal, pending: entregaObraPending, color: '#c084fc' },
    { label: 'Pós-Obra',          href: '/pos-obra',          total: posObraTotal,     pending: posObraPending,     color: '#FFD080' },
  ]
}

// ---------- KPIs ----------

export async function getKpiData(dateFrom: string | null, dateTo: string | null): Promise<KpiData> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return { qtd_vendas: 0, valor_total: 0, potencia_kwp: 0, ticket_medio: 0 }

  const supabase = await createClient()

  // Clientes com contrato no período
  let clientQuery = (supabase as any)
    .from('clients')
    .select('id, system_power_kwp')
    .eq('organization_id', orgId)
    .not('contract_date', 'is', null)

  if (dateFrom) clientQuery = clientQuery.gte('contract_date', dateFrom)
  if (dateTo) clientQuery = clientQuery.lte('contract_date', dateTo)

  const { data: clientsData } = await clientQuery

  const clients = (clientsData ?? []) as { id: string; system_power_kwp: number | null }[]
  const clientIds = clients.map((c) => c.id)
  const qtd_vendas = clients.length
  const potencia_kwp = clients.reduce((sum, c) => sum + (c.system_power_kwp ?? 0), 0)

  // Valor total de vendas
  let valor_total = 0
  if (clientIds.length > 0) {
    const { data: salesData } = await (supabase as any)
      .from('client_sale')
      .select('sale_value')
      .in('client_id', clientIds)

    valor_total = ((salesData ?? []) as { sale_value: number }[])
      .reduce((sum, s) => sum + (s.sale_value ?? 0), 0)
  }

  const ticket_medio = qtd_vendas > 0 ? valor_total / qtd_vendas : 0

  return { qtd_vendas, valor_total, potencia_kwp, ticket_medio }
}

// ---------- faturamento comparativo ----------

const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function getFaturamentoComparativo(): Promise<FaturamentoMes[]> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return []

  const supabase = await createClient()
  const now = new Date()
  const anoAtual = now.getFullYear()
  const anoAnterior = anoAtual - 1

  // Buscar clientes com contract_date nos dois anos + seus valores de venda
  const { data: raw } = await (supabase as any)
    .from('clients')
    .select(`
      contract_date,
      client_sale (sale_value)
    `)
    .eq('organization_id', orgId)
    .not('contract_date', 'is', null)
    .gte('contract_date', `${anoAnterior}-01-01`)
    .lte('contract_date', `${anoAtual}-12-31`)

  const mapAtual: Record<number, number> = {}
  const mapAnterior: Record<number, number> = {}

  for (const c of (raw ?? []) as any[]) {
    const d = new Date(c.contract_date)
    const year = d.getFullYear()
    const month = d.getMonth() // 0-indexed
    const valor = Array.isArray(c.client_sale)
      ? c.client_sale.reduce((s: number, x: any) => s + (x.sale_value ?? 0), 0)
      : (c.client_sale?.sale_value ?? 0)

    if (year === anoAtual) mapAtual[month] = (mapAtual[month] ?? 0) + valor
    else if (year === anoAnterior) mapAnterior[month] = (mapAnterior[month] ?? 0) + valor
  }

  return Array.from({ length: 12 }, (_, i) => ({
    mes: `${anoAtual}-${String(i + 1).padStart(2, '0')}`,
    label: MES_LABELS[i],
    ano_atual: mapAtual[i] ?? 0,
    ano_anterior: mapAnterior[i] ?? 0,
  }))
}

// ---------- leads por origem ----------

export async function getLeadsPorOrigem(): Promise<LeadOrigemItem[]> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return []

  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('leads')
    .select(`
      lead_source_id,
      lead_sources!lead_source_id (name)
    `)
    .eq('organization_id', orgId)

  const map: Record<string, { name: string; count: number }> = {}

  for (const row of (data ?? []) as any[]) {
    const name = row.lead_sources?.name ?? 'Sem origem'
    if (!map[name]) map[name] = { name, count: 0 }
    map[name].count++
  }

  return Object.values(map).sort((a, b) => b.count - a.count)
}

// ---------- meta ----------

export async function getMetaData(dateFrom: string | null, dateTo: string | null): Promise<MetaData> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return { meta_anual: 0, meta_mensal: 0, realizado_mes: 0, realizado_ano: 0 }

  const supabase = await createClient()

  // Get meta from org_config
  const { data: config } = await (supabase as any)
    .from('org_config')
    .select('meta_anual')
    .eq('organization_id', orgId)
    .maybeSingle()

  const meta_anual = config?.meta_anual ?? 0
  const meta_mensal = meta_anual > 0 ? meta_anual / 12 : 0

  // Realizado no período selecionado
  const now = new Date()
  const mesInicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const anoInicio = `${now.getFullYear()}-01-01`
  const anoFim = `${now.getFullYear()}-12-31`

  const fromMes = dateFrom ?? mesInicio
  const toMes = dateTo ?? new Date().toISOString().split('T')[0]
  const fromAno = anoInicio
  const toAno = anoFim

  // Realizado no mês atual
  const { data: clientesMes } = await (supabase as any)
    .from('clients')
    .select('id')
    .eq('organization_id', orgId)
    .gte('contract_date', fromMes)
    .lte('contract_date', toMes)

  const idsMes = ((clientesMes ?? []) as any[]).map((c) => c.id)
  let realizado_mes = 0
  if (idsMes.length > 0) {
    const { data: salesMes } = await (supabase as any)
      .from('client_sale')
      .select('sale_value')
      .in('client_id', idsMes)
    realizado_mes = ((salesMes ?? []) as any[]).reduce((s, x) => s + (x.sale_value ?? 0), 0)
  }

  // Realizado no ano atual
  const { data: clientesAno } = await (supabase as any)
    .from('clients')
    .select('id')
    .eq('organization_id', orgId)
    .gte('contract_date', fromAno)
    .lte('contract_date', toAno)

  const idsAno = ((clientesAno ?? []) as any[]).map((c) => c.id)
  let realizado_ano = 0
  if (idsAno.length > 0) {
    const { data: salesAno } = await (supabase as any)
      .from('client_sale')
      .select('sale_value')
      .in('client_id', idsAno)
    realizado_ano = ((salesAno ?? []) as any[]).reduce((s, x) => s + (x.sale_value ?? 0), 0)
  }

  return { meta_anual, meta_mensal, realizado_mes, realizado_ano }
}
