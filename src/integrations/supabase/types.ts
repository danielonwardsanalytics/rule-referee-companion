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
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          recipient_email: string | null
          recipient_id: string | null
          requester_id: string
          status: Database["public"]["Enums"]["friend_request_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["friend_request_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_requests: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["game_request_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["game_request_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["game_request_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          recorded_by: string
          tournament_id: string
          winner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by: string
          tournament_id: string
          winner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string
          tournament_id?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          game_name: string
          id: string
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          game_name: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          game_name?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          accent_color: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          rules_summary: string | null
          slug: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rules_summary?: string | null
          slug: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rules_summary?: string | null
          slug?: string
        }
        Relationships: []
      }
      house_rule_set_editors: {
        Row: {
          added_at: string | null
          added_by: string
          id: string
          rule_set_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          id?: string
          rule_set_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          id?: string
          rule_set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_rule_set_editors_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "house_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      house_rule_sets: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          save_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          save_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          save_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_rule_sets_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      house_rules: {
        Row: {
          created_at: string | null
          id: string
          rule_set_id: string
          rule_text: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rule_set_id: string
          rule_text: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rule_set_id?: string
          rule_text?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "house_rules_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "house_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          friend_requests: boolean
          game_requests: boolean
          game_results: boolean
          id: string
          tournament_invites: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_requests?: boolean
          game_requests?: boolean
          game_results?: boolean
          id?: string
          tournament_invites?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_requests?: boolean
          game_requests?: boolean
          game_results?: boolean
          id?: string
          tournament_invites?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_premium: boolean | null
          qr_code_data: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          is_premium?: boolean | null
          qr_code_data?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_premium?: boolean | null
          qr_code_data?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_house_rule_sets: {
        Row: {
          id: string
          rule_set_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          rule_set_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          rule_set_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_house_rule_sets_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "house_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_players: {
        Row: {
          display_name: string
          email: string | null
          id: string
          invite_expires_at: string | null
          invited_at: string | null
          joined_at: string | null
          losses: number | null
          points: number | null
          position: number | null
          status: Database["public"]["Enums"]["tournament_player_status"] | null
          tournament_id: string
          user_id: string | null
          wins: number | null
        }
        Insert: {
          display_name: string
          email?: string | null
          id?: string
          invite_expires_at?: string | null
          invited_at?: string | null
          joined_at?: string | null
          losses?: number | null
          points?: number | null
          position?: number | null
          status?:
            | Database["public"]["Enums"]["tournament_player_status"]
            | null
          tournament_id: string
          user_id?: string | null
          wins?: number | null
        }
        Update: {
          display_name?: string
          email?: string | null
          id?: string
          invite_expires_at?: string | null
          invited_at?: string | null
          joined_at?: string | null
          losses?: number | null
          points?: number | null
          position?: number | null
          status?:
            | Database["public"]["Enums"]["tournament_player_status"]
            | null
          tournament_id?: string
          user_id?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          admin_id: string
          created_at: string | null
          game_id: string
          house_rule_set_id: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          game_id: string
          house_rule_set_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          game_id?: string
          house_rule_set_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_house_rule_set_id_fkey"
            columns: ["house_rule_set_id"]
            isOneToOne: false
            referencedRelation: "house_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_games: {
        Row: {
          added_at: string | null
          game_id: string
          id: string
          is_visible: boolean | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          game_id: string
          id?: string
          is_visible?: boolean | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          game_id?: string
          id?: string
          is_visible?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      auto_accept_tournament_invitations: {
        Args: { _email: string; _user_id: string }
        Returns: undefined
      }
      cleanup_expired_tournament_invitations: {
        Args: never
        Returns: undefined
      }
      create_notification: {
        Args: {
          _action_url?: string
          _message: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_pending_invitations_for_email: {
        Args: { _email: string }
        Returns: {
          expires_at: string
          game_name: string
          invited_at: string
          tournament_id: string
          tournament_name: string
        }[]
      }
      get_premium_status: {
        Args: { _user_id: string }
        Returns: {
          has_access: boolean
          is_trial: boolean
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
        }[]
      }
      has_premium_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      friend_request_status: "pending" | "accepted" | "rejected"
      game_request_status: "pending" | "accepted" | "declined"
      subscription_status: "trial" | "free" | "premium" | "cancelled"
      tournament_player_status: "active" | "pending_invite" | "inactive"
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
      friend_request_status: ["pending", "accepted", "rejected"],
      game_request_status: ["pending", "accepted", "declined"],
      subscription_status: ["trial", "free", "premium", "cancelled"],
      tournament_player_status: ["active", "pending_invite", "inactive"],
    },
  },
} as const
