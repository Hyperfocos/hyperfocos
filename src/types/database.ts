export type Plan = 'basic' | 'pro'
export type PlanStatus = 'active' | 'canceled' | 'past_due' | 'trial'
export type Category = 'produzir' | 'decidir' | 'resolver' | 'delegar'
export type EnergyLevel = 'high' | 'mid' | 'low'
export type TaskStatus = 'pending' | 'done' | 'snoozed' | 'waiting'
export type FocusOutcome = 'done' | 'continue' | 'snoozed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          plan: Plan
          plan_status: PlanStatus
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          locale: string
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          plan?: Plan
          plan_status?: PlanStatus
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          locale?: string
          created_at?: string
        }
        Update: {
          name?: string | null
          email?: string | null
          plan?: Plan
          plan_status?: PlanStatus
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          locale?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: Category
          priority: number
          energy_level: EnergyLevel
          status: TaskStatus
          estimated_minutes: number
          due_date: string | null
          waiting_until: string | null
          delegated_to: string | null
          is_mission_today: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: Category
          priority?: number
          energy_level?: EnergyLevel
          status?: TaskStatus
          estimated_minutes?: number
          due_date?: string | null
          waiting_until?: string | null
          delegated_to?: string | null
          is_mission_today?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: Category
          priority?: number
          energy_level?: EnergyLevel
          status?: TaskStatus
          estimated_minutes?: number
          due_date?: string | null
          waiting_until?: string | null
          delegated_to?: string | null
          is_mission_today?: boolean
          completed_at?: string | null
        }
      }
      next_actions: {
        Row: {
          id: string
          task_id: string
          text: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          text: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          text?: string
          completed?: boolean
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          duration_minutes: number | null
          outcome: FocusOutcome | null
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          duration_minutes?: number | null
          outcome?: FocusOutcome | null
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          duration_minutes?: number | null
          outcome?: FocusOutcome | null
          ended_at?: string | null
        }
      }
      energy_checkins: {
        Row: {
          id: string
          user_id: string
          level: EnergyLevel
          checked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level: EnergyLevel
          checked_at?: string
        }
        Update: never
      }
      daily_missions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          mission_date: string
          completed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          mission_date?: string
          completed?: boolean
        }
        Update: {
          completed?: boolean
        }
      }
      subscription_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          asaas_payment_id: string | null
          amount_cents: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          asaas_payment_id?: string | null
          amount_cents?: number | null
          created_at?: string
        }
        Update: never
      }
    }
  }
}

// Tipos auxiliares derivados
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type NextAction = Database['public']['Tables']['next_actions']['Row']
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
export type EnergyCheckin = Database['public']['Tables']['energy_checkins']['Row']
export type DailyMission = Database['public']['Tables']['daily_missions']['Row']
