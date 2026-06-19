import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserData } from '@/lib/org/queries'

export async function GET() {
  const user = await getCurrentUserData()
  const orgId = user?.membership?.organization.id
  if (!orgId) return NextResponse.json({ followups: [] })

  const supabase = await createClient()

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const { data, error } = await (supabase as any)
    .from('lead_follow_ups')
    .select('id, title, description, due_date, lead_id, leads(name)')
    .eq('organization_id', orgId)
    .is('completed_at', null)
    .lte('due_date', sevenDaysFromNow.toISOString())
    .order('due_date', { ascending: true })

  if (error) {
    console.error('[followups-notifications]', error)
    return NextResponse.json({ followups: [] })
  }

  const followups = (data ?? []).map((f: any) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    due_date: f.due_date,
    lead_id: f.lead_id,
    lead_name: f.leads?.name ?? 'Lead',
  }))

  return NextResponse.json({ followups })
}
