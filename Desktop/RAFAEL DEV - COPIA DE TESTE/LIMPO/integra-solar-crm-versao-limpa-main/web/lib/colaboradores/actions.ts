// web/lib/colaboradores/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserData } from '@/lib/org/queries'
import type { ActionResult } from '@/lib/crm/types'

type CreateColaboradorData = {
  full_name: string
  email: string
  password: string
  role: string
  permissions: Record<string, unknown>
}

export async function createColaborador(data: CreateColaboradorData): Promise<ActionResult> {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return { error: 'Sem organização ativa.' }
  if (!data.email || !data.password || !data.full_name) {
    return { error: 'Nome, e-mail e senha são obrigatórios.' }
  }

  const adminClient = createAdminClient()
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  })

  if (authError) return { error: authError.message }

  const newUserId = authData.user.id
  const supabase = await createClient()

  await (supabase as any).from('profiles').upsert({
    id: newUserId,
    email: data.email,
    full_name: data.full_name,
  })

  const { error: memberError } = await (supabase as any).from('organization_members').insert({
    organization_id: orgId,
    user_id: newUserId,
    role: data.role,
    permissions: data.permissions,
  })

  if (memberError) {
    await adminClient.auth.admin.deleteUser(newUserId)
    return { error: memberError.message }
  }

  revalidatePath('/configuracoes')
  return { success: 'Colaborador criado com sucesso.' }
}

export async function updateColaboradorPermissions(
  memberId: string,
  permissions: Record<string, unknown>
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('organization_members')
    .update({ permissions })
    .eq('id', memberId)

  if (error) return { error: error.message }
  revalidatePath('/configuracoes')
  return { success: 'Permissões atualizadas.' }
}

export async function removeColaborador(memberId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('organization_members')
    .delete()
    .eq('id', memberId)

  if (error) return { error: error.message }

  const adminClient = createAdminClient()
  await adminClient.auth.admin.deleteUser(userId)

  revalidatePath('/configuracoes')
  return { success: 'Colaborador removido.' }
}
