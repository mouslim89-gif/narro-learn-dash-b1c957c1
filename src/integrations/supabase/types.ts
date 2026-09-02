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
      admin_users: {
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
      book_audio_sync: {
        Row: {
          book_id: string
          created_at: string
          difficulty: string
          duration_sec: number
          sentences: Json
        }
        Insert: {
          book_id: string
          created_at?: string
          difficulty: string
          duration_sec: number
          sentences: Json
        }
        Update: {
          book_id?: string
          created_at?: string
          difficulty?: string
          duration_sec?: number
          sentences?: Json
        }
        Relationships: []
      }
      book_content_overrides: {
        Row: {
          book_id: string
          created_at: string
          difficulty: string
          id: string
          part_index: number | null
          text: string
          tokens: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          difficulty: string
          id?: string
          part_index?: number | null
          text: string
          tokens?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          difficulty?: string
          id?: string
          part_index?: number | null
          text?: string
          tokens?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      dictionary: {
        Row: {
          created_at: string
          entry: Json
          word: string
        }
        Insert: {
          created_at?: string
          entry: Json
          word: string
        }
        Update: {
          created_at?: string
          entry?: Json
          word?: string
        }
        Relationships: []
      }
      example_sentences: {
        Row: {
          created_at: string
          english: string
          japanese: string
          sentences: Json | null
          tokens: Json | null
          word: string
        }
        Insert: {
          created_at?: string
          english?: string
          japanese: string
          sentences?: Json | null
          tokens?: Json | null
          word: string
        }
        Update: {
          created_at?: string
          english?: string
          japanese?: string
          sentences?: Json | null
          tokens?: Json | null
          word?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          context_sentence: string | null
          context_tokens: Json | null
          created_at: string
          id: string
          jlpt: Json | null
          last_reviewed_at: string | null
          mastery: number
          meanings: Json
          next_review_at: string | null
          parts_of_speech: Json | null
          reading: string
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          context_sentence?: string | null
          context_tokens?: Json | null
          created_at?: string
          id: string
          jlpt?: Json | null
          last_reviewed_at?: string | null
          mastery?: number
          meanings?: Json
          next_review_at?: string | null
          parts_of_speech?: Json | null
          reading?: string
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          context_sentence?: string | null
          context_tokens?: Json | null
          created_at?: string
          id?: string
          jlpt?: Json | null
          last_reviewed_at?: string | null
          mastery?: number
          meanings?: Json
          next_review_at?: string | null
          parts_of_speech?: Json | null
          reading?: string
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      grammar_examples: {
        Row: {
          created_at: string | null
          examples: Json
          id: string
          pattern_slug: string
        }
        Insert: {
          created_at?: string | null
          examples: Json
          id?: string
          pattern_slug: string
        }
        Update: {
          created_at?: string | null
          examples?: Json
          id?: string
          pattern_slug?: string
        }
        Relationships: []
      }
      kanji_details: {
        Row: {
          character: string
          created_at: string
          grade: number | null
          jlpt: number | null
          kun_readings: Json
          meanings: Json
          on_readings: Json
          stroke_count: number | null
        }
        Insert: {
          character: string
          created_at?: string
          grade?: number | null
          jlpt?: number | null
          kun_readings?: Json
          meanings?: Json
          on_readings?: Json
          stroke_count?: number | null
        }
        Update: {
          character?: string
          created_at?: string
          grade?: number | null
          jlpt?: number | null
          kun_readings?: Json
          meanings?: Json
          on_readings?: Json
          stroke_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          chapter_id: string
          created_at: string
          difficulty: string
          last_read_at: string
          progress_percent: number
          sentence_idx: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_id?: string
          created_at?: string
          difficulty: string
          last_read_at?: string
          progress_percent?: number
          sentence_idx?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_id?: string
          created_at?: string
          difficulty?: string
          last_read_at?: string
          progress_percent?: number
          sentence_idx?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_grammar: {
        Row: {
          book_id: string | null
          created_at: string
          item_id: string
          payload: Json
          saved_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          item_id: string
          payload?: Json
          saved_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          item_id?: string
          payload?: Json
          saved_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sentence_translations: {
        Row: {
          created_at: string
          english: string
          hash: string
          id: string
          japanese: string
        }
        Insert: {
          created_at?: string
          english: string
          hash: string
          id?: string
          japanese: string
        }
        Update: {
          created_at?: string
          english?: string
          hash?: string
          id?: string
          japanese?: string
        }
        Relationships: []
      }
      shared_token_rules: {
        Row: {
          book_id: string
          created_at: string
          created_by: string | null
          id: string
          position: number
          rule: Json
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          rule: Json
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          rule?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          original_transaction_id: string | null
          plan: string | null
          platform: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          original_transaction_id?: string | null
          plan?: string | null
          platform?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          original_transaction_id?: string | null
          plan?: string | null
          platform?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          daily_goal_minutes: number | null
          dark_mode: boolean
          display_mode: string
          font_size: string
          has_completed_onboarding: boolean | null
          has_seen_long_press_hint: boolean
          highlight_known: boolean
          highlight_learning: boolean
          highlight_new: boolean
          japanese_font: string
          reader_dark_mode: boolean
          show_furigana: boolean
          show_known_highlights: boolean
          show_translations: boolean
          target_jlpt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_minutes?: number | null
          dark_mode?: boolean
          display_mode?: string
          font_size?: string
          has_completed_onboarding?: boolean | null
          has_seen_long_press_hint?: boolean
          highlight_known?: boolean
          highlight_learning?: boolean
          highlight_new?: boolean
          japanese_font?: string
          reader_dark_mode?: boolean
          show_furigana?: boolean
          show_known_highlights?: boolean
          show_translations?: boolean
          target_jlpt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_minutes?: number | null
          dark_mode?: boolean
          display_mode?: string
          font_size?: string
          has_completed_onboarding?: boolean | null
          has_seen_long_press_hint?: boolean
          highlight_known?: boolean
          highlight_learning?: boolean
          highlight_new?: boolean
          japanese_font?: string
          reader_dark_mode?: boolean
          show_furigana?: boolean
          show_known_highlights?: boolean
          show_translations?: boolean
          target_jlpt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_token_rules: {
        Row: {
          book_id: string
          created_at: string
          id: string
          position: number
          rule: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          position?: number
          rule: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          position?: number
          rule?: Json
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
      get_is_admin: { Args: never; Returns: boolean }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_premium: { Args: { _uid: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
