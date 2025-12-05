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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audio_entries: {
        Row: {
          accent: string | null
          audio_url: string
          created_at: string | null
          duration_seconds: number | null
          entry_id: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          accent?: string | null
          audio_url: string
          created_at?: string | null
          duration_seconds?: number | null
          entry_id: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          accent?: string | null
          audio_url?: string
          created_at?: string | null
          duration_seconds?: number | null
          entry_id?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_entries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_entries_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: number
          name: string
          points_reward: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          description: string
          icon: string
          id?: number
          name: string
          points_reward?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: number
          name?: string
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      dialects: {
        Row: {
          created_at: string | null
          id: number
          iso_code: string | null
          language_id: number | null
          name: string
          region: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          iso_code?: string | null
          language_id?: number | null
          name: string
          region?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          iso_code?: string | null
          language_id?: number | null
          name?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dialects_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          dialect_id: number
          example_sentence: string | null
          id: string
          meaning_en: string
          meaning_ur: string
          script: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dialect_id: number
          example_sentence?: string | null
          id?: string
          meaning_en: string
          meaning_ur: string
          script?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dialect_id?: number
          example_sentence?: string | null
          id?: string
          meaning_en?: string
          meaning_ur?: string
          script?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_dialect_id_fkey"
            columns: ["dialect_id"]
            isOneToOne: false
            referencedRelation: "dialects"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          created_at: string | null
          id: number
          iso_code: string | null
          name: string
          native_name: string
          region: string
          speakers_estimate: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          iso_code?: string | null
          name: string
          native_name: string
          region: string
          speakers_estimate?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          iso_code?: string | null
          name?: string
          native_name?: string
          region?: string
          speakers_estimate?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audio_uploaded: number | null
          created_at: string | null
          email: string
          id: string
          last_contribution_date: string | null
          name: string
          points: number | null
          streak_days: number | null
          votes_cast: number | null
          words_added: number | null
        }
        Insert: {
          audio_uploaded?: number | null
          created_at?: string | null
          email: string
          id: string
          last_contribution_date?: string | null
          name: string
          points?: number | null
          streak_days?: number | null
          votes_cast?: number | null
          words_added?: number | null
        }
        Update: {
          audio_uploaded?: number | null
          created_at?: string | null
          email?: string
          id?: string
          last_contribution_date?: string | null
          name?: string
          points?: number | null
          streak_days?: number | null
          votes_cast?: number | null
          words_added?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: number
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: number
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: number
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_links: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entry1_id: string
          entry2_id: string
          id: string
          votes_down: number | null
          votes_up: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entry1_id: string
          entry2_id: string
          id?: string
          votes_down?: number | null
          votes_up?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entry1_id?: string
          entry2_id?: string
          id?: string
          votes_down?: number | null
          votes_up?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_links_entry1_id_fkey"
            columns: ["entry1_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_links_entry2_id_fkey"
            columns: ["entry2_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string | null
          entry_id: string | null
          id: string
          user_id: string
          variant_link_id: string | null
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          user_id: string
          variant_link_id?: string | null
          vote_type: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          user_id?: string
          variant_link_id?: string | null
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_variant_link_id_fkey"
            columns: ["variant_link_id"]
            isOneToOne: false
            referencedRelation: "variant_links"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_points: {
        Args: { points_to_add: number; user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "normal"
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
      app_role: ["admin", "normal"],
    },
  },
} as const
