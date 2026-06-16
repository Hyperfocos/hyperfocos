import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
      plan: 'basic',
      plan_status: 'active',
      locale,
    })
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, next_actions(*)')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckin } = await supabase
    .from('energy_checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('checked_at', `${today}T00:00:00`)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <DashboardClient
      initialTasks={tasks ?? []}
      profile={profile ?? {
        id: user.id,
        plan: 'basic',
        plan_status: 'active',
        name: user.user_metadata?.name ?? null,
        email: user.email ?? null,
        asaas_customer_id: null,
        asaas_subscription_id: null,
        locale,
        created_at: new Date().toISOString(),
      }}
      userId={user.id}
      locale={locale}
      todayEnergy={(todayCheckin?.level as 'high' | 'mid' | 'low') ?? null}
    />
  )
}
