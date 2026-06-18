// web/lib/financeiro/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export type ActionResult = { error?: string; success?: string }

export async function confirmInstallment(installmentId: string): Promise<ActionResult> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id ?? null
  if (!orgId) return { error: 'Sem organização ativa.' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('client_installments')
    .update({
      status: 'confirmada',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', installmentId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { success: 'Pagamento confirmado.' }
}

export async function advanceToProjects(clientId: string): Promise<ActionResult> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id ?? null
  if (!orgId) return { error: 'Sem organização ativa.' }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('clients')
    .update({ pipeline_stage: 'projetos', updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  revalidatePath(`/financeiro/${clientId}`)
  return { success: 'Cliente avançado para Projetos.' }
}
