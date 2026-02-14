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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          conversation_id: string | null
          created_at: string
          extracted_text: string | null
          extraction_status: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          hashtags: string[] | null
          hook: string | null
          id: string
          published_at: string | null
          scheduled_at: string | null
          source_conversation_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          visual_ideas: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          source_conversation_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          visual_ideas?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          source_conversation_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          visual_ideas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_usage: {
        Row: {
          created_at: string
          id: string
          month_year: string
          posts_this_month: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year?: string
          posts_this_month?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          posts_this_month?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          folder: string | null
          horse_id: string | null
          id: string
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder?: string | null
          horse_id?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder?: string | null
          horse_id?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "user_horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      horse_shares: {
        Row: {
          created_at: string
          expert_email: string
          expert_id: string | null
          horse_id: string
          id: string
          owner_id: string
          permissions: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expert_email: string
          expert_id?: string | null
          horse_id: string
          id?: string
          owner_id: string
          permissions?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expert_email?: string
          expert_id?: string | null
          horse_id?: string
          id?: string
          owner_id?: string
          permissions?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horse_shares_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "user_horses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          model: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          model?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          model?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_global: boolean
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_global?: boolean
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_global?: boolean
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          certificates: string[] | null
          company_address: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          exclude_from_training: boolean
          id: string
          is_blocked: boolean | null
          is_data_contribution_active: boolean
          latitude: number | null
          longitude: number | null
          onboarding_completed: boolean | null
          phone: string | null
          public_profile: boolean
          service_area: string | null
          sub_role: Database["public"]["Enums"]["sub_role"] | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          certificates?: string[] | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          exclude_from_training?: boolean
          id?: string
          is_blocked?: boolean | null
          is_data_contribution_active?: boolean
          latitude?: number | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          public_profile?: boolean
          service_area?: string | null
          sub_role?: Database["public"]["Enums"]["sub_role"] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          certificates?: string[] | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          exclude_from_training?: boolean
          id?: string
          is_blocked?: boolean | null
          is_data_contribution_active?: boolean
          latitude?: number | null
          longitude?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          public_profile?: boolean
          service_area?: string | null
          sub_role?: Database["public"]["Enums"]["sub_role"] | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roadmap_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_documentation: {
        Row: {
          ai_summary: string | null
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_public: boolean
          module_name: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by: string
          id?: string
          is_public?: boolean
          module_name?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_public?: boolean
          module_name?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_data_logs: {
        Row: {
          ai_output: string | null
          category: string | null
          conversation_id: string | null
          created_at: string
          file_context: string | null
          id: string
          model_used: string | null
          source: string | null
          tone: string | null
          user_id: string
          user_input: string | null
        }
        Insert: {
          ai_output?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          file_context?: string | null
          id?: string
          model_used?: string | null
          source?: string | null
          tone?: string | null
          user_id: string
          user_input?: string | null
        }
        Update: {
          ai_output?: string | null
          category?: string | null
          conversation_id?: string | null
          created_at?: string
          file_context?: string | null
          id?: string
          model_used?: string | null
          source?: string | null
          tone?: string | null
          user_id?: string
          user_input?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_data_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_usage: {
        Row: {
          created_at: string
          id: string
          month_year: string
          updated_at: string
          upload_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
          upload_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
          upload_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_horses: {
        Row: {
          age: number | null
          ai_summary: string | null
          breed: string | null
          color: string | null
          created_at: string
          hoof_type: string | null
          horse_id: string | null
          id: string
          is_primary: boolean
          keeping_type: string | null
          known_issues: string | null
          last_trim_date: string | null
          name: string
          notes: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          ai_summary?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          hoof_type?: string | null
          horse_id?: string | null
          id?: string
          is_primary?: boolean
          keeping_type?: string | null
          known_issues?: string | null
          last_trim_date?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          ai_summary?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          hoof_type?: string | null
          horse_id?: string | null
          id?: string
          is_primary?: boolean
          keeping_type?: string | null
          known_issues?: string | null
          last_trim_date?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          founder_flow_active: boolean
          founder_flow_expires_at: string | null
          founder_flow_started_at: string | null
          grant_reason: string | null
          granted_by: string | null
          id: string
          plan: string
          social_media_addon: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          founder_flow_active?: boolean
          founder_flow_expires_at?: string | null
          founder_flow_started_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          plan?: string
          social_media_addon?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          founder_flow_active?: boolean
          founder_flow_expires_at?: string | null
          founder_flow_started_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          plan?: string
          social_media_addon?: boolean
          updated_at?: string
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
      setup_initial_admin: { Args: { admin_email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      sub_role:
        | "reiter"
        | "pferdebesitzer"
        | "reitbeteiligung"
        | "hufbearbeiter"
        | "tierarzt"
        | "stallbetreiber"
      user_type: "privat" | "gewerbe"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      sub_role: [
        "reiter",
        "pferdebesitzer",
        "reitbeteiligung",
        "hufbearbeiter",
        "tierarzt",
        "stallbetreiber",
      ],
      user_type: ["privat", "gewerbe"],
    },
  },
} as const
