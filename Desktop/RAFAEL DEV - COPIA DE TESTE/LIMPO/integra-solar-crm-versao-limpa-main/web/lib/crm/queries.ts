// web/lib/crm/queries.ts
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import type { Lead, FunnelStage, LeadSource, Proposal, Supplier } from './types'

export async function getFunnelStages(): Promise<FunnelStage[]> {
  const user = await getCurrentUserData()
  if (!user?.membership) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('organization_id', user.membership.organization.id)
    .order('order', { ascending: true })
  return (data as FunnelStage[]) ?? []
}

export async function getLeadSources(): Promise<LeadSource[]> {
  const user = await getCurrentUserData()
  if (!user?.membership) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('lead_sources')
    .select('id, name')
    .eq('organization_id', user.membership.organization.id)
    .order('name')
  return data ?? []
}

export async function getOrgMembers() {
  const user = await getCurrentUserData()
  if (!user?.membership) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_members')
    .select('user_id, profiles:profiles(id, full_name, email)')
    .eq('organization_id', user.membership.organization.id)
  return (data ?? []).map((m: any) => m.profiles).filter(Boolean)
}

export async function getLeads(): Promise<Lead[]> {
  const user = await getCurrentUserData()
  if (!user?.membership) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select(`
      *,
      stage:pipeline_stages(id, name, color, is_final_stage, order),
      assigned_user:profiles!assigned_to_user_id(id, full_name, email),
      lead_source:lead_sources(id, name),
      followups:tasks!related_to_lead_id(id, title, description, due_date, completed_at, assigned_to_user_id)
    `)
    .eq('organization_id', user.membership.organization.id)
    .order('created_at', { ascending: false })
  const leads = (data ?? []) as any[]
  // lead_notes not in DB types — fetch separately if needed; return empty array for now
  return leads.map((l) => ({ ...l, notes: l.notes ?? [] })) as Lead[]
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select(`
      *,
      stage:pipeline_stages(id, name, color, is_final_stage, order),
      assigned_user:profiles!assigned_to_user_id(id, full_name, email),
      lead_source:lead_sources(id, name),
      followups:tasks!related_to_lead_id(id, title, description, due_date, completed_at, assigned_to_user_id)
    `)
    .eq('id', id)
    .single()
  if (!data) return null
  return { ...(data as any), notes: [] } as Lead
}

export async function getProposalsByLead(leadId: string): Promise<Proposal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select(`*, supplier:suppliers(id, name)`)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  return (data as unknown as Proposal[]) ?? []
}

export async function getSuppliers(): Promise<Supplier[]> {
  const user = await getCurrentUserData()
  if (!user?.membership) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('organization_id', user.membership.organization.id)
    .order('name')
  return data ?? []
}

// Retorna fator de geração da org (padrão 1.0 se não configurado)
export async function getGenerationFactor(): Promise<number> {
  const user = await getCurrentUserData()
  if (!user?.membership) return 1.0
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('setting_value')
    .eq('organization_id', user.membership.organization.id)
    .eq('setting_key', 'generation_factor')
    .single()
  return (data?.setting_value as number) ?? 1.0
}

// Cria etapas padrão se a org não tiver nenhuma
export async function ensureDefaultStages(orgId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('pipeline_stages')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
  if (count && count > 0) return
  const defaults = [
    { name: 'Novo', order: 1, color: '#6B7A90' },
    { name: 'Em contato', order: 2, color: '#3B82F6' },
    { name: 'Visita agendada', order: 3, color: '#8B5CF6' },
    { name: 'Proposta enviada', order: 4, color: '#F59E0B' },
    { name: 'Fechado', order: 5, color: '#10B981', is_final_stage: true },
    { name: 'Perdido', order: 6, color: '#EF4444', is_final_stage: true },
  ]
  await supabase.from('pipeline_stages').insert(
    defaults.map((d) => ({ ...d, organization_id: orgId }))
  )
}
