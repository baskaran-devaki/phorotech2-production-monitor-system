export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          revoked_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          revoked_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      downtime_attendance: {
        Row: {
          created_at: string
          created_by: string
          designation_snapshot: string
          downtime_id: string
          employee_id_snapshot: string | null
          employee_name_snapshot: string
          id: string
          maintenance_member_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          designation_snapshot: string
          downtime_id: string
          employee_id_snapshot?: string | null
          employee_name_snapshot: string
          id?: string
          maintenance_member_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          designation_snapshot?: string
          downtime_id?: string
          employee_id_snapshot?: string | null
          employee_name_snapshot?: string
          id?: string
          maintenance_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downtime_attendance_downtime_id_fkey"
            columns: ["downtime_id"]
            isOneToOne: false
            referencedRelation: "downtime_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_attendance_maintenance_member_id_fkey"
            columns: ["maintenance_member_id"]
            isOneToOne: false
            referencedRelation: "maintenance_team"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_records: {
        Row: {
          action_taken: string | null
          after_photo_path: string | null
          before_photo_path: string | null
          business_date: string
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          id: string
          machine_process: string
          parts_material_used: string | null
          reason: string
          reason_category: Database["public"]["Enums"]["downtime_reason_category"]
          shift: number
          start_time: string
          status: Database["public"]["Enums"]["downtime_status"]
          updated_at: string
          updated_by: string
        }
        Insert: {
          action_taken?: string | null
          after_photo_path?: string | null
          before_photo_path?: string | null
          business_date: string
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          id?: string
          machine_process: string
          parts_material_used?: string | null
          reason: string
          reason_category: Database["public"]["Enums"]["downtime_reason_category"]
          shift: number
          start_time: string
          status?: Database["public"]["Enums"]["downtime_status"]
          updated_at?: string
          updated_by: string
        }
        Update: {
          action_taken?: string | null
          after_photo_path?: string | null
          before_photo_path?: string | null
          business_date?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          id?: string
          machine_process?: string
          parts_material_used?: string | null
          reason?: string
          reason_category?: Database["public"]["Enums"]["downtime_reason_category"]
          shift?: number
          start_time?: string
          status?: Database["public"]["Enums"]["downtime_status"]
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      maintenance_team: {
        Row: {
          created_at: string
          created_by: string | null
          designation: string
          employee_id: string | null
          employee_name: string
          id: string
          is_active: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          designation: string
          employee_id?: string | null
          employee_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          designation?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      plant_head: {
        Row: {
          created_at: string
          department: string | null
          designation: string
          employee_id: string
          full_name: string
          id: string
          mobile_alternate: string | null
          mobile_primary: string
          official_email: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          designation?: string
          employee_id?: string
          full_name?: string
          id?: string
          mobile_alternate?: string | null
          mobile_primary?: string
          official_email?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          designation?: string
          employee_id?: string
          full_name?: string
          id?: string
          mobile_alternate?: string | null
          mobile_primary?: string
          official_email?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      production_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          load_count: number
          remarks: string | null
          shift: number
          slot_index: number
          time_slot: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date: string
          id?: string
          load_count?: number
          remarks?: string | null
          shift: number
          slot_index: number
          time_slot: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          load_count?: number
          remarks?: string | null
          shift?: number
          slot_index?: number
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_settings: {
        Row: {
          created_at: string
          id: boolean
          mode: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: boolean
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: boolean
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["user_department"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["user_department"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["user_department"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      retention_archive_runs: {
        Row: {
          affected_year: number
          archive_location: string | null
          archive_status: string
          completed_at: string | null
          created_at: string
          downtime_record_count: number
          executed_by: string
          id: string
          operation_result: string
          production_record_count: number
          verified_at: string | null
        }
        Insert: {
          affected_year: number
          archive_location?: string | null
          archive_status?: string
          completed_at?: string | null
          created_at?: string
          downtime_record_count?: number
          executed_by: string
          id?: string
          operation_result?: string
          production_record_count?: number
          verified_at?: string | null
        }
        Update: {
          affected_year?: number
          archive_location?: string | null
          archive_status?: string
          completed_at?: string | null
          created_at?: string
          downtime_record_count?: number
          executed_by?: string
          id?: string
          operation_result?: string
          production_record_count?: number
          verified_at?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          pending_new_email: string | null
          recovery_email: string | null
          recovery_email_verified: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pending_new_email?: string | null
          recovery_email?: string | null
          recovery_email_verified?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          pending_new_email?: string | null
          recovery_email?: string | null
          recovery_email_verified?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_key"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_key"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_key"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_production_load: {
        Args: {
          _entry_date: string
          _shift: number
          _slot_index: number
          _time_slot: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          load_count: number
          remarks: string | null
          shift: number
          slot_index: number
          time_slot: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "production_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      production_mode: { Args: never; Returns: string }
      user_has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["permission_key"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      downtime_reason_category:
        | "mechanical"
        | "electrical"
        | "automation"
        | "material"
        | "process"
        | "other"
      downtime_status:
        | "open"
        | "under_maintenance"
        | "testing"
        | "resolved"
        | "closed"
      permission_key:
        | "dashboard_view"
        | "production_view"
        | "production_entry"
        | "downtime_view"
        | "downtime_entry"
        | "downtime_close"
        | "reports"
        | "analytics"
        | "tv_mode"
        | "notifications"
      user_department: "production" | "maintenance" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      downtime_reason_category: [
        "mechanical",
        "electrical",
        "automation",
        "material",
        "process",
        "other",
      ],
      downtime_status: [
        "open",
        "under_maintenance",
        "testing",
        "resolved",
        "closed",
      ],
      permission_key: [
        "dashboard_view",
        "production_view",
        "production_entry",
        "downtime_view",
        "downtime_entry",
        "downtime_close",
        "reports",
        "analytics",
        "tv_mode",
        "notifications",
      ],
      user_department: ["production", "maintenance", "admin"],
    },
  },
} as const
