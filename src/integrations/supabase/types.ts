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
      asset_tags: {
        Row: {
          asset_id: string
          asset_type: string
          created_at: string
          custom_tags: string[] | null
          horse_name: string | null
          id: string
          project_name: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          asset_type?: string
          created_at?: string
          custom_tags?: string[] | null
          horse_name?: string | null
          id?: string
          project_name?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          asset_type?: string
          created_at?: string
          custom_tags?: string[] | null
          horse_name?: string | null
          id?: string
          project_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      chat_exports: {
        Row: {
          conversation_id: string | null
          exported_at: string
          file_url: string | null
          format: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          exported_at?: string
          file_url?: string | null
          format: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          exported_at?: string
          file_url?: string | null
          format?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_exports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_splits: {
        Row: {
          child_conversation_id: string
          created_at: string
          id: string
          parent_conversation_id: string
          split_message_id: string | null
        }
        Insert: {
          child_conversation_id: string
          created_at?: string
          id?: string
          parent_conversation_id: string
          split_message_id?: string | null
        }
        Update: {
          child_conversation_id?: string
          created_at?: string
          id?: string
          parent_conversation_id?: string
          split_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_splits_child_conversation_id_fkey"
            columns: ["child_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_splits_parent_conversation_id_fkey"
            columns: ["parent_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_splits_split_message_id_fkey"
            columns: ["split_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          ai_generated: boolean | null
          aspect_ratio: string | null
          content_type: string
          created_at: string
          description: string | null
          id: string
          planned_date: string
          platform: string
          prompt_suggestion: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          video_job_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          aspect_ratio?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          planned_date: string
          platform?: string
          prompt_suggestion?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_job_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          aspect_ratio?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          planned_date?: string
          platform?: string
          prompt_suggestion?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_video_job_id_fkey"
            columns: ["video_job_id"]
            isOneToOne: false
            referencedRelation: "video_jobs"
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
      content_templates: {
        Row: {
          aspect_ratio: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          is_system: boolean
          prompt_template: string | null
          style: string | null
          template_type: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          aspect_ratio?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_system?: boolean
          prompt_template?: string | null
          style?: string | null
          template_type?: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          aspect_ratio?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_system?: boolean
          prompt_template?: string | null
          style?: string | null
          template_type?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
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
      conversation_memory_links: {
        Row: {
          conversation_id: string
          memory_id: string
          relevance_score: number | null
        }
        Insert: {
          conversation_id: string
          memory_id: string
          relevance_score?: number | null
        }
        Update: {
          conversation_id?: string
          memory_id?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_memory_links_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_memory_links_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "user_memory"
            referencedColumns: ["id"]
          },
        ]
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
      design_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_system: boolean | null
          name: string
          preview_url: string | null
          template_data: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          preview_url?: string | null
          template_data?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          preview_url?: string | null
          template_data?: Json | null
        }
        Relationships: []
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
      ecosystem_links: {
        Row: {
          app_key: string
          connected_at: string | null
          created_at: string
          data_sharing_enabled: boolean
          external_id: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_key: string
          connected_at?: string | null
          created_at?: string
          data_sharing_enabled?: boolean
          external_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_key?: string
          connected_at?: string | null
          created_at?: string
          data_sharing_enabled?: boolean
          external_id?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extracted_content: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_content_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          created_at: string | null
          description: string | null
          dimensions: string | null
          file_size: number | null
          file_url: string | null
          format: string | null
          id: string
          is_favorite: boolean | null
          original_prompt: string | null
          preview_url: string | null
          social_platform: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          original_prompt?: string | null
          preview_url?: string | null
          social_platform?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          id?: string
          is_favorite?: boolean | null
          original_prompt?: string | null
          preview_url?: string | null
          social_platform?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          preset: string
          prompt: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          preset?: string
          prompt: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          preset?: string
          prompt?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
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
      instagram_connections: {
        Row: {
          access_token: string
          connected_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          instagram_user_id: string
          instagram_username: string | null
          page_access_token: string | null
          page_id: string | null
          scopes: string[] | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instagram_user_id: string
          instagram_username?: string | null
          page_access_token?: string | null
          page_id?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          instagram_user_id?: string
          instagram_username?: string | null
          page_access_token?: string | null
          page_id?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_snapshots: {
        Row: {
          facts_count: number | null
          id: string
          snapshot_date: string | null
          top_categories: string[] | null
          user_id: string
        }
        Insert: {
          facts_count?: number | null
          id?: string
          snapshot_date?: string | null
          top_categories?: string[] | null
          user_id: string
        }
        Update: {
          facts_count?: number | null
          id?: string
          snapshot_date?: string | null
          top_categories?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      message_versions: {
        Row: {
          content: string
          created_at: string
          id: string
          message_id: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_id: string
          version_number?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_versions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          edit_count: number | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          model: string | null
          parent_message_id: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          edit_count?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          model?: string | null
          parent_message_id?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          edit_count?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          model?: string | null
          parent_message_id?: string | null
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
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          ai_memory: string | null
          bio: string | null
          certificates: string[] | null
          company_address: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          ecosystem_id: string | null
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
          ai_memory?: string | null
          bio?: string | null
          certificates?: string[] | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          ecosystem_id?: string | null
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
          ai_memory?: string | null
          bio?: string | null
          certificates?: string[] | null
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          ecosystem_id?: string | null
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
      prompt_library: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_system: boolean | null
          title: string
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_system?: boolean | null
          title: string
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_system?: boolean | null
          title?: string
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean
          is_system: boolean
          prompt: string
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_system?: boolean
          prompt: string
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          is_system?: boolean
          prompt?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      prompt_usage_logs: {
        Row: {
          conversation_id: string | null
          id: string
          prompt_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          prompt_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          prompt_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_usage_logs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_library"
            referencedColumns: ["id"]
          },
        ]
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
      social_accounts: {
        Row: {
          account_name: string
          account_url: string | null
          avg_engagement: number | null
          avg_views: number | null
          created_at: string
          followers: number | null
          id: string
          last_synced_at: string | null
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_url?: string | null
          avg_engagement?: number | null
          avg_views?: number | null
          created_at?: string
          followers?: number | null
          id?: string
          last_synced_at?: string | null
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_url?: string | null
          avg_engagement?: number | null
          avg_views?: number | null
          created_at?: string
          followers?: number | null
          id?: string
          last_synced_at?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_metrics: {
        Row: {
          account_id: string | null
          created_at: string
          engagement_rate: number | null
          followers: number | null
          id: string
          impressions: number | null
          metric_date: string
          posts_count: number | null
          reach: number | null
          top_post_url: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          metric_date?: string
          posts_count?: number | null
          reach?: number | null
          top_post_url?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          impressions?: number | null
          metric_date?: string
          posts_count?: number | null
          reach?: number | null
          top_post_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          input_tokens: number | null
          model_used: string | null
          output_tokens: number | null
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
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
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
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
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
      user_favorite_prompts: {
        Row: {
          created_at: string | null
          custom_name: string | null
          id: string
          position: number | null
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          position?: number | null
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          id?: string
          position?: number | null
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_library"
            referencedColumns: ["id"]
          },
        ]
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
      user_memory: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string | null
          fact: string
          id: string
          importance: number | null
          last_used_at: string | null
          source_conversation_id: string | null
          source_message_id: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          fact: string
          id?: string
          importance?: number | null
          last_used_at?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          fact?: string
          id?: string
          importance?: number | null
          last_used_at?: string | null
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memory_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memory_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reminders: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          last_reminded_at: string | null
          reminded_count: number | null
          reminder_text: string
          trigger_condition: string | null
          trigger_topic: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          last_reminded_at?: string | null
          reminded_count?: number | null
          reminder_text: string
          trigger_condition?: string | null
          trigger_topic?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          last_reminded_at?: string | null
          reminded_count?: number | null
          reminder_text?: string
          trigger_condition?: string | null
          trigger_topic?: string | null
          type?: string | null
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
      user_system_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          system_prompt: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          system_prompt?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_export_analytics: {
        Row: {
          comments: number | null
          created_at: string
          engagement_rate: number | null
          export_format: string
          exported_at: string
          id: string
          likes: number | null
          metrics_updated_at: string | null
          notes: string | null
          platform: string
          shares: number | null
          updated_at: string
          user_id: string
          video_job_id: string | null
          views: number | null
          watch_time_seconds: number | null
        }
        Insert: {
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          export_format?: string
          exported_at?: string
          id?: string
          likes?: number | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform: string
          shares?: number | null
          updated_at?: string
          user_id: string
          video_job_id?: string | null
          views?: number | null
          watch_time_seconds?: number | null
        }
        Update: {
          comments?: number | null
          created_at?: string
          engagement_rate?: number | null
          export_format?: string
          exported_at?: string
          id?: string
          likes?: number | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform?: string
          shares?: number | null
          updated_at?: string
          user_id?: string
          video_job_id?: string | null
          views?: number | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_export_analytics_video_job_id_fkey"
            columns: ["video_job_id"]
            isOneToOne: false
            referencedRelation: "video_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      video_jobs: {
        Row: {
          aspect_ratio: string
          coherence: number
          created_at: string
          duration: number
          feedback: string | null
          format: string
          hd_upscaling: boolean
          id: string
          input_file_url: string | null
          input_type: string
          is_hufi_relevant: boolean
          model: string
          motion_intensity: number
          negative_prompt: string | null
          optimized_prompt: string | null
          preset: string | null
          prompt: string
          seed: number | null
          status: string
          stylization: number
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          aspect_ratio?: string
          coherence?: number
          created_at?: string
          duration?: number
          feedback?: string | null
          format?: string
          hd_upscaling?: boolean
          id?: string
          input_file_url?: string | null
          input_type?: string
          is_hufi_relevant?: boolean
          model?: string
          motion_intensity?: number
          negative_prompt?: string | null
          optimized_prompt?: string | null
          preset?: string | null
          prompt: string
          seed?: number | null
          status?: string
          stylization?: number
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          aspect_ratio?: string
          coherence?: number
          created_at?: string
          duration?: number
          feedback?: string | null
          format?: string
          hd_upscaling?: boolean
          id?: string
          input_file_url?: string | null
          input_type?: string
          is_hufi_relevant?: boolean
          model?: string
          motion_intensity?: number
          negative_prompt?: string | null
          optimized_prompt?: string | null
          preset?: string | null
          prompt?: string
          seed?: number | null
          status?: string
          stylization?: number
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
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
