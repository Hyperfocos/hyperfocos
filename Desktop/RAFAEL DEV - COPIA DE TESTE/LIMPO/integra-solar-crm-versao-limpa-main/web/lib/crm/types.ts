// web/lib/crm/types.ts

export type FunnelStage = {
  id: string
  organization_id: string
  name: string
  order: number
  color: string
  is_final_stage: boolean
}

export type LeadSource = {
  id: string
  name: string
}

export type LeadUser = {
  id: string
  full_name: string | null
  email: string
}

export type LeadNote = {
  id: string
  lead_id: string
  content: string
  created_at: string
  created_by: string | null
  author: { full_name: string | null; email: string } | null
}

export type LeadFollowUp = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  assigned_to_user_id: string | null
}

export type Lead = {
  id: string
  organization_id: string
  name: string
  phone: string
  city: string | null
  observations: string | null
  next_action_date: string | null
  system_type: string | null
  estimated_kwp: number | null
  estimated_value: number | null
  created_at: string
  updated_at: string
  current_stage_id: string
  assigned_to_user_id: string | null
  lead_source_id: string | null
  stage: FunnelStage | null
  assigned_user: LeadUser | null
  lead_source: LeadSource | null
  notes: LeadNote[]
  followups: LeadFollowUp[]
}

export type Supplier = {
  id: string
  name: string
}

export type Proposal = {
  id: string
  organization_id: string
  client_id: string
  lead_id: string | null
  version_number: number
  total_modules: number
  module_power_wp: number
  total_inverters: number
  inverter_power_w: number
  kit_value: number
  total_power_kwp: number
  monthly_generation_kwh: number
  final_value: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
  supplier_id: string | null
  supplier: Supplier | null
}

export type ActionResult = {
  error?: string
  success?: string
}
