// web/lib/crm/types.ts

export type FunnelStage = {
  id: string
  organization_id: string
  name: string
  order: number
  color: string
  is_final_stage: boolean
  is_terminal_won: boolean
  is_terminal_lost: boolean
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
  phone: string | null
  city: string | null
  address: string | null
  avg_kwh: number | null
  installation_type: string | null
  // Pre-existing DB fields (kept for completeness)
  system_type: string | null
  estimated_kwp: number | null
  estimated_value: number | null
  observations: string | null
  next_action_date: string | null
  converted: boolean
  converted_to_client_id: string | null
  created_at: string
  updated_at: string
  current_stage_id: string
  assigned_to_user_id: string | null
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
  lead_id: string | null
  name: string
  panel_qty: number
  panel_power_w: number
  panel_brand_model: string | null
  inverter_qty: number
  inverter_power_w: number
  inverter_brand_model: string | null
  kit_value: number
  total_power_kwp: number
  monthly_generation_kwh: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
  supplier: Supplier | null
}

export type ActionResult = {
  error?: string
  success?: string
}
