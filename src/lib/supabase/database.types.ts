export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string
          football_data_id: number | null
          group_code: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string
          last_synced_at: string | null
          lock_at: string
          match_number: number | null
          minute: number | null
          raw_json: Json | null
          stadium_id: string | null
          stage: string | null
          status: string
          updated_at: string
          winner: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          football_data_id?: number | null
          group_code?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at: string
          last_synced_at?: string | null
          lock_at: string
          match_number?: number | null
          minute?: number | null
          raw_json?: Json | null
          stadium_id?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
          winner?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          football_data_id?: number | null
          group_code?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string
          last_synced_at?: string | null
          lock_at?: string
          match_number?: number | null
          minute?: number | null
          raw_json?: Json | null
          stadium_id?: string | null
          stage?: string | null
          status?: string
          updated_at?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_stadium_id_fkey"
            columns: ["stadium_id"]
            isOneToOne: false
            referencedRelation: "stadiums"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_memberships: {
        Row: {
          created_at: string
          pool_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          pool_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          pool_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_memberships_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          created_at: string
          id: string
          match_id: string
          points: number | null
          pool_id: string
          predicted_away_score: number
          predicted_home_score: number
          scored_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          points?: number | null
          pool_id: string
          predicted_away_score: number
          predicted_home_score: number
          scored_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          points?: number | null
          pool_id?: string
          predicted_away_score?: number
          predicted_home_score?: number
          scored_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_pool_membership_fk"
            columns: ["pool_id", "user_id"]
            isOneToOne: false
            referencedRelation: "pool_memberships"
            referencedColumns: ["pool_id", "user_id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_kind: string
          avatar_value: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          favorite_team: string | null
          first_name: string | null
          full_name: string | null
          google_avatar_url: string | null
          graduation_year_or_category: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean
          prode_subgroup: string | null
          prode_subgroups: string[]
          province: string | null
          school_group: string | null
          updated_at: string
          uploaded_avatar_path: string | null
        }
        Insert: {
          age?: number | null
          avatar_kind?: string
          avatar_value?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_team?: string | null
          first_name?: string | null
          full_name?: string | null
          google_avatar_url?: string | null
          graduation_year_or_category?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean
          prode_subgroup?: string | null
          prode_subgroups?: string[]
          province?: string | null
          school_group?: string | null
          updated_at?: string
          uploaded_avatar_path?: string | null
        }
        Update: {
          age?: number | null
          avatar_kind?: string
          avatar_value?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          favorite_team?: string | null
          first_name?: string | null
          full_name?: string | null
          google_avatar_url?: string | null
          graduation_year_or_category?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean
          prode_subgroup?: string | null
          prode_subgroups?: string[]
          province?: string | null
          school_group?: string | null
          updated_at?: string
          uploaded_avatar_path?: string | null
        }
        Relationships: []
      }
      provider_errors: {
        Row: {
          context: string | null
          created_at: string
          details: Json | null
          id: string
          message: string
          provider: string
          sync_run_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          provider: string
          sync_run_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          provider?: string
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_errors_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stadiums: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          raw_json: Json | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          raw_json?: Json | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          raw_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          provider: string
          started_at: string
          status: string
          summary: Json | null
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          provider: string
          started_at?: string
          status: string
          summary?: Json | null
          sync_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          provider?: string
          started_at?: string
          status?: string
          summary?: Json | null
          sync_type?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          assets_last_synced_at: string | null
          badge_url: string | null
          created_at: string
          fanart_url: string | null
          flag_url: string | null
          football_data_id: number | null
          id: string
          jersey_url: string | null
          logo_url: string | null
          name_en: string | null
          name_es: string
          raw_json: Json | null
          short_name: string | null
          sportsdb_id: string | null
          team_aliases: string[]
          thesportsdb_raw_json: Json | null
          tla: string | null
          updated_at: string
        }
        Insert: {
          assets_last_synced_at?: string | null
          badge_url?: string | null
          created_at?: string
          fanart_url?: string | null
          flag_url?: string | null
          football_data_id?: number | null
          id?: string
          jersey_url?: string | null
          logo_url?: string | null
          name_en?: string | null
          name_es: string
          raw_json?: Json | null
          short_name?: string | null
          sportsdb_id?: string | null
          team_aliases?: string[]
          thesportsdb_raw_json?: Json | null
          tla?: string | null
          updated_at?: string
        }
        Update: {
          assets_last_synced_at?: string | null
          badge_url?: string | null
          created_at?: string
          fanart_url?: string | null
          flag_url?: string | null
          football_data_id?: number | null
          id?: string
          jersey_url?: string | null
          logo_url?: string | null
          name_en?: string | null
          name_es?: string
          raw_json?: Json | null
          short_name?: string | null
          sportsdb_id?: string | null
          team_aliases?: string[]
          thesportsdb_raw_json?: Json | null
          tla?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tournament_predictions: {
        Row: {
          bonus_points: number
          bracket_json: Json
          champion_team_id: string
          created_at: string
          fourth_place_team_id: string
          id: string
          locked_at: string
          pool_id: string
          quarterfinal_team_ids: string[]
          round_of_16_team_ids: string[]
          runner_up_team_id: string
          scored_at: string | null
          semifinal_team_ids: string[]
          third_place_team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_points?: number
          bracket_json: Json
          champion_team_id: string
          created_at?: string
          fourth_place_team_id: string
          id?: string
          locked_at?: string
          pool_id: string
          quarterfinal_team_ids?: string[]
          round_of_16_team_ids?: string[]
          runner_up_team_id: string
          scored_at?: string | null
          semifinal_team_ids?: string[]
          third_place_team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_points?: number
          bracket_json?: Json
          champion_team_id?: string
          created_at?: string
          fourth_place_team_id?: string
          id?: string
          locked_at?: string
          pool_id?: string
          quarterfinal_team_ids?: string[]
          round_of_16_team_ids?: string[]
          runner_up_team_id?: string
          scored_at?: string | null
          semifinal_team_ids?: string[]
          third_place_team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_fourth_place_team_id_fkey"
            columns: ["fourth_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_pool_membership_fk"
            columns: ["pool_id", "user_id"]
            isOneToOne: true
            referencedRelation: "pool_memberships"
            referencedColumns: ["pool_id", "user_id"]
          },
          {
            foreignKeyName: "tournament_predictions_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_prediction_points: {
        Args: {
          actual_away: number
          actual_home: number
          pred_away: number
          pred_home: number
        }
        Returns: number
      }
      compute_match_lock_at: {
        Args: { match_kickoff_at: string }
        Returns: string
      }
      get_lock_minutes_before_kickoff: { Args: never; Returns: number }
      get_match_outcome: {
        Args: { away_score: number; home_score: number }
        Returns: string
      }
      get_pool_leaderboard: {
        Args: { target_pool_id: string }
        Returns: {
          avatar_kind: string
          avatar_value: string
          display_name: string
          exact_hits: number
          outcome_hits: number
          predicted_matches_count: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      get_tournament_lock_at: { Args: never; Returns: string }
      is_match_locked: { Args: { target_match_id: string }; Returns: boolean }
      is_pool_admin: {
        Args: { target_pool_id: string; target_user_id?: string }
        Returns: boolean
      }
      is_pool_member: {
        Args: { target_pool_id: string; target_user_id?: string }
        Returns: boolean
      }
      is_prediction_visible: {
        Args: { target_prediction_id: string; viewer_id: string }
        Returns: boolean
      }
      score_match_predictions: {
        Args: { target_match_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

