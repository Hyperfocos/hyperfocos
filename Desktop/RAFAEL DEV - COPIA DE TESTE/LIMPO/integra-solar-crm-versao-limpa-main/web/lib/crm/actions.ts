// web/lib/crm/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import type { ActionResult } from './types'

// ── Helpers ───────────────────────────────────────────────────────

async function getOrgId(): Promise<string | null> {
  const user = await getCurrentUserData()
  return user?.membership?.organization.id ?? null
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ── Lead Actions ──────────────────────────────────────────────────

const leadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  city: z.string().optional(),
  observations: z.string().optional(),
  system_type: z.string().optional(),
  estimated_kwp: z.coerce.number().optional(),
  estimated_value: z.coerce.number().optional(),
  current_stage_id: z.string().uuid('Etapa inválida'),
  assigned_to_user_id: z.string().uuid().optional().or(z.literal('')),
  lead_source_id: z.string().uuid().optional().or(z.literal('')),
  next_action_date: z.string().optional(),
})

export async function createLead(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const orgId = await getOrgId()
  if (!orgId) return { error: 'Sem organização ativa.' }

  const parsed = leadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { assigned_to_user_id, lead_source_id, estimated_kwp, estimated_value, ...rest } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('leads').insert({
    ...rest,
    estimated_kwp: estimated_kwp ?? null,
    estimated_value: estimated_value ?? null,
    assigned_to_user_id: assigned_to_user_id || null,
    lead_source_id: lead_source_id || null,
    organization_id: orgId,
  })

  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Lead criado.' }
}

export async function updateLead(
  leadId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { assigned_to_user_id, lead_source_id, estimated_kwp, estimated_value, ...rest } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('leads').update({
    ...rest,
    estimated_kwp: estimated_kwp ?? null,
    estimated_value: estimated_value ?? null,
    assigned_to_user_id: assigned_to_user_id || null,
    lead_source_id: lead_source_id || null,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)

  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Lead atualizado.' }
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').delete().eq('id', leadId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Lead excluído.' }
}

export async function moveLeadStage(leadId: string, stageId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('leads')
    .update({ current_stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', leadId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Etapa atualizada.' }
}

// ── Note Actions ──────────────────────────────────────────────────
// lead_notes table is not yet in the generated DB types; using `any` cast to avoid tsc errors.

export async function createNote(leadId: string, content: string): Promise<ActionResult> {
  const orgId = await getOrgId()
  const userId = await getUserId()
  if (!orgId) return { error: 'Sem organização ativa.' }
  if (!content.trim()) return { error: 'Anotação não pode ser vazia.' }

  const supabase = await createClient()
  const { error } = await (supabase as any).from('lead_notes').insert({
    lead_id: leadId,
    organization_id: orgId,
    created_by: userId,
    content: content.trim(),
  })
  if (error) return { error: (error as any).message }
  revalidatePath('/leads')
  return { success: 'Anotação salva.' }
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('lead_notes').delete().eq('id', noteId)
  if (error) return { error: (error as any).message }
  revalidatePath('/leads')
  return { success: 'Anotação excluída.' }
}

// ── Follow-up Actions ─────────────────────────────────────────────

const followUpSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Data é obrigatória'),
})

export async function createFollowUp(
  leadId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const orgId = await getOrgId()
  const userId = await getUserId()
  if (!orgId) return { error: 'Sem organização ativa.' }

  const parsed = followUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').insert({
    organization_id: orgId,
    related_to_lead_id: leadId,
    assigned_to_user_id: userId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    due_date: parsed.data.due_date,
  })
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Follow-up agendado.' }
}

export async function toggleFollowUp(taskId: string, done: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Follow-up atualizado.' }
}

// ── Proposal Actions ──────────────────────────────────────────────

const proposalSchema = z.object({
  total_modules: z.coerce.number().min(0),
  module_power_wp: z.coerce.number().min(0),
  total_inverters: z.coerce.number().min(0),
  inverter_power_w: z.coerce.number().min(0),
  kit_value: z.coerce.number().min(0),
  supplier_id: z.string().uuid().optional().or(z.literal('')),
  total_power_kwp: z.coerce.number().min(0),
  monthly_generation_kwh: z.coerce.number().min(0),
  final_value: z.coerce.number().min(0),
  client_id: z.string().uuid('Cliente inválido'),
})

export async function createProposal(
  leadId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const orgId = await getOrgId()
  const userId = await getUserId()
  if (!orgId) return { error: 'Sem organização ativa.' }

  const parsed = proposalSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supplier_id, ...rest } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('proposals').insert({
    ...rest,
    supplier_id: supplier_id || null,
    lead_id: leadId,
    organization_id: orgId,
    created_by_user_id: userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Proposta criada.' }
}

export async function deleteProposal(proposalId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('proposals').delete().eq('id', proposalId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Proposta excluída.' }
}

// ── Funnel Stage Actions ──────────────────────────────────────────

export async function createFunnelStage(name: string, order: number): Promise<ActionResult> {
  const orgId = await getOrgId()
  if (!orgId) return { error: 'Sem organização ativa.' }
  const supabase = await createClient()
  const { error } = await supabase.from('pipeline_stages').insert({
    organization_id: orgId,
    name,
    order,
    color: '#6B7A90',
  })
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Etapa criada.' }
}

export async function updateFunnelStage(
  stageId: string,
  updates: { name?: string; color?: string; order?: number; is_final_stage?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('pipeline_stages').update(updates).eq('id', stageId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Etapa atualizada.' }
}

export async function deleteFunnelStage(stageId: string, moveTo: string): Promise<ActionResult> {
  const supabase = await createClient()
  // Move leads para outra etapa antes de excluir
  await supabase.from('leads').update({ current_stage_id: moveTo }).eq('current_stage_id', stageId)
  const { error } = await supabase.from('pipeline_stages').delete().eq('id', stageId)
  if (error) return { error: error.message }
  revalidatePath('/leads')
  return { success: 'Etapa excluída.' }
}

export async function reorderFunnelStages(stages: { id: string; order: number }[]): Promise<ActionResult> {
  const supabase = await createClient()
  for (const s of stages) {
    await supabase.from('pipeline_stages').update({ order: s.order }).eq('id', s.id)
  }
  revalidatePath('/leads')
  return { success: 'Ordem salva.' }
}

// ── Convert Lead to Client ────────────────────────────────────────

export async function convertLeadToClient(leadId: string): Promise<{ clientId?: string; error?: string }> {
  const orgId = await getOrgId()
  if (!orgId) return { error: 'Sem organização ativa.' }
  const supabase = await createClient()

  // Buscar dados do lead
  const { data: lead } = await supabase
    .from('leads')
    .select('name, phone, city')
    .eq('id', leadId)
    .single()

  if (!lead) return { error: 'Lead não encontrado.' }

  // Criar cliente básico
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      organization_id: orgId,
      name: lead.name,
      phone: lead.phone,
      city: lead.city,
    })
    .select('id')
    .single()

  if (clientError || !client) return { error: clientError?.message ?? 'Erro ao criar cliente.' }

  // Marcar lead como convertido
  await (supabase as any).from('leads').update({
    converted: true,
    converted_to_client_id: client.id,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)

  revalidatePath('/leads')
  redirect(`/clientes/${client.id}`)
}
