// web/lib/financeiro/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export type ActionResult = { error?: string; success?: string }

export async function confirmInstallment(installmentId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Fetch the installment to check position and client_id
  const { data: installment, error: fetchError } = await (supabase as any)
    .from('client_installments')
    .select('id, position, client_id')
    .eq('id', installmentId)
    .single()

  if (fetchError || !installment) return { error: 'Parcela não encontrada.' }

  // Confirm the installment
  const { error } = await (supabase as any)
    .from('client_installments')
    .update({ status: 'confirmada', confirmed_at: new Date().toISOString() })
    .eq('id', installmentId)

  if (error) return { error: error.message }

  // If this is position 1, activate Projetos and Compras pipeline flags
  if (installment.position === 1) {
    // Fetch current flags to avoid overwriting other flags
    const { data: client } = await (supabase as any)
      .from('clients')
      .select('pipeline_flags')
      .eq('id', installment.client_id)
      .single()

    const currentFlags = (client?.pipeline_flags as Record<string, string>) ?? {}

    await (supabase as any)
      .from('clients')
      .update({
        pipeline_flags: {
          ...currentFlags,
          projetos: 'pendente',
          compras: 'aguardando',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', installment.client_id)
  }

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
