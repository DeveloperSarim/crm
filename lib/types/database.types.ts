// Auto-generated types — run: npx supabase gen types typescript --project-id YOUR_ID > lib/types/database.types.ts
// This is a manual placeholder matching our schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'head' | 'sales_member' | 'external'
          company_name: string | null
          is_active: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          location: string | null
          city: string | null
          status: 'active' | 'presale' | 'paused' | 'completed' | 'archived'
          pricing_details: Json
          amenities: string[]
          rera_number: string | null
          total_units: number | null
          is_published: boolean
          cover_image_url: string | null
          color_hue: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_media: {
        Row: {
          id: string
          project_id: string
          type: 'image' | 'video' | 'brochure'
          url: string
          display_order: number
          is_cover: boolean
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_media']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['project_media']['Insert']>
      }
      lead_sources: {
        Row: {
          id: string
          name: string
          type: 'digital' | 'offline' | 'external' | 'import' | 'crm'
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['lead_sources']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['lead_sources']['Insert']>
      }
      leads: {
        Row: {
          id: string
          reference_id: string | null
          project_id: string
          full_name: string
          phone: string
          email: string | null
          address: string | null
          query: string | null
          intent: 'buy' | 'rent' | null
          property_type: 'apartment' | 'villa' | 'building' | 'land' | 'office' | 'commercial' | 'retail' | 'warehouse' | null
          budget_min: number | null
          budget_max: number | null
          budget_display: string | null
          timeline: string | null
          lead_source_id: string | null
          assigned_to: string | null
          submitted_by: string | null
          external_realtor_id: string | null
          is_external_lead: boolean
          status: 'new' | 'contacted' | 'interested' | 'site_visit' | 'negotiation' | 'closed_won' | 'closed_lost' | 'on_hold'
          score: number | null
          follow_up_date: string | null
          follow_up_notes: string | null
          commission_status: 'na' | 'pending' | 'approved' | 'paid'
          commission_amount: number | null
          lock_expires_at: string | null
          import_batch_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'reference_id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          author_id: string
          content: string
          note_type: 'general' | 'call' | 'meeting' | 'follow_up' | 'status_change'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lead_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lead_notes']['Insert']>
      }
      lead_status_history: {
        Row: {
          id: string
          lead_id: string
          changed_by: string
          old_status: string | null
          new_status: string
          changed_at: string
        }
        Insert: Omit<Database['public']['Tables']['lead_status_history']['Row'], 'id' | 'changed_at'>
        Update: never
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          type: 'new_external_lead' | 'lead_assigned' | 'follow_up_due' | 'commission_update'
          title: string
          body: string | null
          lead_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      commission_records: {
        Row: {
          id: string
          lead_id: string
          realtor_id: string
          project_id: string
          deal_value: number | null
          commission_rate: number
          commission_amount: number | null
          status: 'pending' | 'approved' | 'paid'
          approved_by: string | null
          approved_at: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['commission_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['commission_records']['Insert']>
      }
      user_pinned_projects: {
        Row: {
          user_id: string
          project_id: string
          pinned_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_pinned_projects']['Row'], 'pinned_at'>
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: { Args: Record<never, never>; Returns: Json }
      get_project_stats: { Args: { p_project_id: string }; Returns: Json }
      bulk_assign_leads: { Args: { p_lead_ids: string[]; p_assignee_id: string }; Returns: number }
      distribute_leads: { Args: { p_lead_ids: string[]; p_assignee_ids: string[] }; Returns: number }
      is_head: { Args: Record<never, never>; Returns: boolean }
      current_user_role: { Args: Record<never, never>; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectMedia = Database['public']['Tables']['project_media']['Row']
export type LeadSource = Database['public']['Tables']['lead_sources']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadNote = Database['public']['Tables']['lead_notes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type CommissionRecord = Database['public']['Tables']['commission_records']['Row']

export type UserRole = Profile['role']
export type LeadStatus = Lead['status']
export type ProjectStatus = Project['status']
