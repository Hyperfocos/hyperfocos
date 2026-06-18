// web/lib/projetos/queries.ts
import { createClient } from '@/lib/supabase/server'

export type ProjetoChecklist = {
  memorial_calculo: boolean
  art: boolean
  homologacao: boolean
}

export type ProjetoClient = {
  id: string
  client_id: string
  client_name: string
  client_city: string | null
  responsavel_id: string | null
  responsavel_name: string | null
  numero_processo: string | null
  data_protocolo: string | null
  prazo_protocolo: string | null
  data_solicitacao_vistoria: string | null
  prazo_vistoria: string | null
  status: string
  checklist: ProjetoChecklist
  dias_usados: number
  contract_max_days: number | null
  primeira_parcela_confirmed_at: string | null
}

export type ProjetoMember = {
  id: string
  name: string
}

export async function getProjetos(): Promise<ProjetoClient[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('client_projects')
    .select(`
      id,
      client_id,
      responsavel_id,
      numero_processo,
      data_protocolo,
      prazo_protocolo,
      data_solicitacao_vistoria,
      prazo_vistoria,
      status,
      checklist,
      clients!inner (
        name,
        city,
        contract_max_days,
        pipeline_flags
      )
    `)
    .not('clients.pipeline_flags->>projetos', 'is', null)
    .neq('status', 'aprovado')

  if (error || !data) return []

  // Fetch primeira parcela confirmed_at for prazo global
  const clientIds: string[] = data.map((r: any) => r.client_id)
  const { data: parcelas } = await (supabase as any)
    .from('client_installments')
    .select('client_id, confirmed_at')
    .in('client_id', clientIds)
    .eq('position', 1)
    .not('confirmed_at', 'is', null)

  const parcelaMap: Record<string, string> = {}
  for (const p of parcelas ?? []) {
    parcelaMap[p.client_id] = p.confirmed_at
  }

  return data.map((r: any) => {
    const confirmedAt = parcelaMap[r.client_id] ?? null
    const diasUsados = confirmedAt
      ? Math.floor((Date.now() - new Date(confirmedAt).getTime()) / 86400000)
      : 0

    return {
      id: r.id,
      client_id: r.client_id,
      client_name: r.clients.name,
      client_city: r.clients.city ?? null,
      responsavel_id: r.responsavel_id ?? null,
      responsavel_name: null, // loaded separately in detail
      numero_processo: r.numero_processo ?? null,
      data_protocolo: r.data_protocolo ?? null,
      prazo_protocolo: r.prazo_protocolo ?? null,
      data_solicitacao_vistoria: r.data_solicitacao_vistoria ?? null,
      prazo_vistoria: r.prazo_vistoria ?? null,
      status: r.status,
      checklist: r.checklist ?? { memorial_calculo: false, art: false, homologacao: false },
      dias_usados: diasUsados,
      contract_max_days: r.clients.contract_max_days ?? null,
      primeira_parcela_confirmed_at: confirmedAt,
    }
  })
}

export async function getProjetoById(clientId: string): Promise<ProjetoClient | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('client_projects')
    .select(`
      id,
      client_id,
      responsavel_id,
      numero_processo,
      data_protocolo,
      prazo_protocolo,
      data_solicitacao_vistoria,
      prazo_vistoria,
      status,
      checklist,
      clients!inner (
        name,
        city,
        contract_max_days
      )
    `)
    .eq('client_id', clientId)
    .single()

  if (error || !data) return null

  const { data: parcela } = await (supabase as any)
    .from('client_installments')
    .select('confirmed_at')
    .eq('client_id', clientId)
    .eq('position', 1)
    .not('confirmed_at', 'is', null)
    .maybeSingle()

  const confirmedAt = parcela?.confirmed_at ?? null
  const diasUsados = confirmedAt
    ? Math.floor((Date.now() - new Date(confirmedAt).getTime()) / 86400000)
    : 0

  // Resolve responsavel name
  let responsavelName: string | null = null
  if (data.responsavel_id) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('name')
      .eq('id', data.responsavel_id)
      .single()
    responsavelName = profile?.name ?? null
  }

  return {
    id: data.id,
    client_id: data.client_id,
    client_name: data.clients.name,
    client_city: data.clients.city ?? null,
    responsavel_id: data.responsavel_id ?? null,
    responsavel_name: responsavelName,
    numero_processo: data.numero_processo ?? null,
    data_protocolo: data.data_protocolo ?? null,
    prazo_protocolo: data.prazo_protocolo ?? null,
    data_solicitacao_vistoria: data.data_solicitacao_vistoria ?? null,
    prazo_vistoria: data.prazo_vistoria ?? null,
    status: data.status,
    checklist: data.checklist ?? { memorial_calculo: false, art: false, homologacao: false },
    dias_usados: diasUsados,
    contract_max_days: data.clients.contract_max_days ?? null,
    primeira_parcela_confirmed_at: confirmedAt,
  }
}

export async function getProjetoMembers(): Promise<ProjetoMember[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('profiles')
    .select('id, name')
    .order('name')
  return (data ?? []).map((p: any) => ({ id: p.id, name: p.name }))
}
