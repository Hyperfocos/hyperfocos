// Este arquivo será substituído pelos types gerados pelo Supabase CLI (Task 6)
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          plan: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          status?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'manager' | 'user'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'admin' | 'manager' | 'user'
        }
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          document_number: string | null
          phone: string | null
          email: string | null
          street: string | null
          number: string | null
          complement: string | null
          neighborhood: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          current_project_stage_id: string | null
          system_type: string | null
          estimated_kwp: number | null
          contract_signed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
      }
      leads: {
        Row: {
          id: string
          organization_id: string
          name: string
          phone: string
          city: string | null
          lead_source_id: string | null
          observations: string | null
          next_action_date: string | null
          current_stage_id: string
          assigned_to_user_id: string | null
          system_type: string | null
          estimated_kwp: number | null
          estimated_value: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          phone: string
          current_stage_id: string
          [key: string]: unknown
        }
        Update: {
          [key: string]: unknown
        }
      }
      pipeline_stages: {
        Row: {
          id: string
          organization_id: string
          name: string
          order: number
          color: string
          is_final_stage: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          order: number
          color?: string
          is_final_stage?: boolean
        }
        Update: {
          [key: string]: unknown
        }
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          message: string
          is_read: boolean
          notification_type: string | null
          related_entity: string | null
          related_entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          message: string
          is_read?: boolean
          notification_type?: string | null
          related_entity?: string | null
          related_entity_id?: string | null
        }
        Update: {
          is_read?: boolean
        }
      }
      organization_settings: {
        Row: {
          id: string
          organization_id: string
          setting_key: string
          setting_value: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          setting_key: string
          setting_value?: unknown
        }
        Update: {
          setting_value?: unknown
        }
      }
    }
    Functions: {
      get_my_org_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_my_role: {
        Args: { org_id: string }
        Returns: string | null
      }
    }
    Enums: Record<string, never>
  }
}
