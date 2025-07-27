export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      events: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          description: string | null
          duration_hours: number
          event_date: string
          expected_guests: number
          id: string
          organizer_id: string
          requirements: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description?: string | null
          duration_hours: number
          event_date: string
          expected_guests: number
          id?: string
          organizer_id: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          event_date?: string
          expected_guests?: number
          id?: string
          organizer_id?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maturity_diagnoses: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          overall_level: Database["public"]["Enums"]["maturity_level"]
          overall_score: number
          pillar_scores: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string | null
          id?: string
          overall_level: Database["public"]["Enums"]["maturity_level"]
          overall_score: number
          pillar_scores: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          overall_level?: Database["public"]["Enums"]["maturity_level"]
          overall_score?: number
          pillar_scores?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maturity_diagnoses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          restaurant_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          restaurant_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          restaurant_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
          service_booking_id: string | null
          service_provider_id: string | null
          venue_booking_id: string | null
          venue_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
          service_booking_id?: string | null
          service_provider_id?: string | null
          venue_booking_id?: string | null
          venue_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          service_booking_id?: string | null
          service_provider_id?: string | null
          venue_booking_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_booking_id_fkey"
            columns: ["service_booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_booking_id_fkey"
            columns: ["venue_booking_id"]
            isOneToOne: false
            referencedRelation: "venue_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          client_id: string
          created_at: string | null
          estimated_price: number | null
          event_id: string | null
          final_price: number | null
          id: string
          requirements: string | null
          service_date: string
          service_details: string
          service_provider_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          estimated_price?: number | null
          event_id?: string | null
          final_price?: number | null
          id?: string
          requirements?: string | null
          service_date: string
          service_details: string
          service_provider_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          estimated_price?: number | null
          event_id?: string | null
          final_price?: number | null
          id?: string
          requirements?: string | null
          service_date?: string
          service_details?: string
          service_provider_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          business_name: string
          category: Database["public"]["Enums"]["service_category"]
          coverage_areas: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          portfolio_images: string[] | null
          price_range: string | null
          provider_id: string
          rating: number | null
          services: string[]
          total_bookings: number | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          category: Database["public"]["Enums"]["service_category"]
          coverage_areas?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          portfolio_images?: string[] | null
          price_range?: string | null
          provider_id: string
          rating?: number | null
          services: string[]
          total_bookings?: number | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          category?: Database["public"]["Enums"]["service_category"]
          coverage_areas?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          portfolio_images?: string[] | null
          price_range?: string | null
          provider_id?: string
          rating?: number | null
          services?: string[]
          total_bookings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      venue_bookings: {
        Row: {
          booking_date: string
          client_id: string
          created_at: string | null
          end_time: string
          event_id: string | null
          id: string
          special_requests: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_hours: number
          total_price: number
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          booking_date: string
          client_id: string
          created_at?: string | null
          end_time: string
          event_id?: string | null
          id?: string
          special_requests?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_hours: number
          total_price: number
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          booking_date?: string
          client_id?: string
          created_at?: string | null
          end_time?: string
          event_id?: string | null
          id?: string
          special_requests?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_hours?: number
          total_price?: number
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          amenities: string[] | null
          capacity: number
          city: string
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          owner_id: string
          price_per_hour: number
          rating: number | null
          total_bookings: number | null
          updated_at: string | null
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity: number
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          owner_id: string
          price_per_hour: number
          rating?: number | null
          total_bookings?: number | null
          updated_at?: string | null
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity?: number
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          owner_id?: string
          price_per_hour?: number
          rating?: number | null
          total_bookings?: number | null
          updated_at?: string | null
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "user"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      event_status: "draft" | "published" | "cancelled" | "completed"
      maturity_level:
        | "inicial"
        | "basico"
        | "intermedio"
        | "avanzado"
        | "experto"
      service_category:
        | "catering"
        | "event_planning"
        | "photography"
        | "music"
        | "decoration"
        | "cleaning"
        | "security"
        | "transportation"
      venue_type:
        | "restaurant"
        | "bar"
        | "cafe"
        | "event_space"
        | "kitchen"
        | "dining_room"
        | "private_room"
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
      app_role: ["admin", "manager", "staff", "user"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      event_status: ["draft", "published", "cancelled", "completed"],
      maturity_level: [
        "inicial",
        "basico",
        "intermedio",
        "avanzado",
        "experto",
      ],
      service_category: [
        "catering",
        "event_planning",
        "photography",
        "music",
        "decoration",
        "cleaning",
        "security",
        "transportation",
      ],
      venue_type: [
        "restaurant",
        "bar",
        "cafe",
        "event_space",
        "kitchen",
        "dining_room",
        "private_room",
      ],
    },
  },
} as const
