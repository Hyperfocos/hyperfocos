'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'
import type { ActionResult } from '@/lib/crm/types'

type UpsertDeliveryData = {
  data_entrega?: string | null
  termo_url?: string | null
  checklist: {
    limpeza: boolean
    manuais: boolean
    orientacao_uso: boolean
  }
  status: string
}

export async function upsertDelivery(
  clientId: string,
  data: UpsertDeliveryData
): Promise<ActionResult> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id ?? null
  if (!orgId) return { error: 'Sem organização ativa.' }

  const supabase = await createClient()

  const { data: existing } = await (supabase as any)
    .from('client_deliveries')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle()

  const deliveryData = {
    client_id: clientId,
    organization_id: orgId,
    data_entrega: data.data_entrega ?? null,
    termo_url: data.termo_url ?? null,
    checklist: data.checklist,
    status: data.status,
    updated_at: new Date().toISOString(),
  }

  let error: any
  if (existing) {
    ;({ error } = await (supabase as any)
      .from('client_deliveries')
      .update(deliveryData)
      .eq('id', existing.id))
  } else {
    ;({ error } = await (supabase as any)
      .from('client_deliveries')
      .insert(deliveryData))
  }

  if (error) return { error: error.message }

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('pipeline_flags')
    .eq('id', clientId)
    .single()

  const currentFlags = (client?.pipeline_flags as Record<string, string>) ?? {}
  const newFlags: Record<string, string> = { ...currentFlags, entrega_material: data.status }

  // Activate obra on save
  if (!currentFlags.obra) {
    newFlags.obra = 'pendente'

    const { data: existingObra } = await (supabase as any)
      .from('client_obras')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    if (!existingObra) {
      await (supabase as any).from('client_obras').insert({
        client_id: clientId,
        organization_id: orgId,
        status: 'aguardando',
      })
    }
  }

  await (supabase as any)
    .from('clients')
    .update({ pipeline_flags: newFlags, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidatePath('/entrega-material')
  return { success: 'Entrega salva.' }
}
