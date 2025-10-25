export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          cohort: string
          cohort_start_date: string
          cohort_end_date: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          cohort?: string
          cohort_start_date?: string
          cohort_end_date?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          cohort?: string
          cohort_start_date?: string
          cohort_end_date?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visions: {
        Row: {
          id: string
          user_id: string
          ten_year_vision: string | null
          three_year_vision: string | null
          one_year_vision: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ten_year_vision?: string | null
          three_year_vision?: string | null
          one_year_vision?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ten_year_vision?: string | null
          three_year_vision?: string | null
          one_year_vision?: string | null
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          order_index: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tactics: {
        Row: {
          id: string
          goal_id: string
          description: string
          frequency_per_week: number
          start_date: string | null
          end_date: string | null
          order_index: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          description: string
          frequency_per_week?: number
          start_date?: string | null
          end_date?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          description?: string
          frequency_per_week?: number
          start_date?: string | null
          end_date?: string | null
          order_index?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tactic_completions: {
        Row: {
          id: string
          tactic_id: string
          user_id: string
          week_number: number
          year: number
          completion_count: number
          completed_dates: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tactic_id: string
          user_id: string
          week_number: number
          year: number
          completion_count?: number
          completed_dates?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tactic_id?: string
          user_id?: string
          week_number?: number
          year?: number
          completion_count?: number
          completed_dates?: Json
          created_at?: string
          updated_at?: string
        }
      }
      weekly_scorecards: {
        Row: {
          id: string
          user_id: string
          week_number: number
          year: number
          goal_scores: Json
          overall_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          year: number
          goal_scores: Json
          overall_score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_number?: number
          year?: number
          goal_scores?: Json
          overall_score?: number
          created_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          week_number: number
          year: number
          plan_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          week_number: number
          year: number
          plan_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          week_number?: number
          year?: number
          plan_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wam_responses: {
        Row: {
          id: string
          user_id: string
          week_number: number
          year: number
          what_went_well: string | null
          what_didnt_go_well: string | null
          what_will_do_differently: string | null
          what_support_needed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          year: number
          what_went_well?: string | null
          what_didnt_go_well?: string | null
          what_will_do_differently?: string | null
          what_support_needed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_number?: number
          year?: number
          what_went_well?: string | null
          what_didnt_go_well?: string | null
          what_will_do_differently?: string | null
          what_support_needed?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
