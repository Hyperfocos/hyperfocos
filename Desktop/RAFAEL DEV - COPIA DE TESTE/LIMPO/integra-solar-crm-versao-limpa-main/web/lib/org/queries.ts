import { createClient } from '@/lib/supabase/server'

export type CurrentUserData = {
  profile: {
    id: string
    email: string
    full_name: string | null
  }
  membership: {
    role: 'owner' | 'admin' | 'manager' | 'user'
    organization: {
      id: string
      name: string
      plan: string
      status: string
    }
  } | null
}

export async function getCurrentUserData(): Promise<CurrentUserData | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations(id, name, plan, status)
    `)
    .eq('user_id', user.id)
    .single()

  type MembershipData = NonNullable<CurrentUserData['membership']>

  return {
    profile,
    membership: membership
      ? {
          role: membership.role as MembershipData['role'],
          organization: membership.organization as MembershipData['organization'],
        }
      : null,
  }
}
