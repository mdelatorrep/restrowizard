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
      applicant_profiles: {
        Row: {
          bio: string | null
          created_at: string
          experience_years: number | null
          headline: string | null
          id: string
          is_available: boolean
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_job_types: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations: string[] | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          headline?: string | null
          id?: string
          is_available?: boolean
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_job_types?: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          headline?: string | null
          id?: string
          is_available?: boolean
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_job_types?: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          budget: number | null
          category_id: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          guest_count: number | null
          id: string
          is_public: boolean
          organizer_id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          budget?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          guest_count?: number | null
          id?: string
          is_public?: boolean
          organizer_id: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          budget?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          guest_count?: number | null
          id?: string
          is_public?: boolean
          organizer_id?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number
          benefits: string | null
          category: Database["public"]["Enums"]["job_category"]
          created_at: string
          description: string
          employer_id: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          expires_at: string | null
          id: string
          is_active: boolean
          is_salary_visible: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          applications_count?: number
          benefits?: string | null
          category?: Database["public"]["Enums"]["job_category"]
          created_at?: string
          description: string
          employer_id: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_salary_visible?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          location: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          applications_count?: number
          benefits?: string | null
          category?: Database["public"]["Enums"]["job_category"]
          created_at?: string
          description?: string
          employer_id?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_salary_visible?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      maturity_diagnoses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          overall_level: Database["public"]["Enums"]["maturity_level"]
          overall_score: number
          pillar_scores: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          overall_level?: Database["public"]["Enums"]["maturity_level"]
          overall_score?: number
          pillar_scores?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          overall_level?: Database["public"]["Enums"]["maturity_level"]
          overall_score?: number
          pillar_scores?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          category: string
          created_at: string
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          menu_id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          menu_id: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          menu_id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_templates: {
        Row: {
          config: Json
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"] | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          preview_image: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          preview_image?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          event_reminders: boolean
          id: string
          job_alerts: boolean
          marketing: boolean
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          event_reminders?: boolean
          id?: string
          job_alerts?: boolean
          marketing?: boolean
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          event_reminders?: boolean
          id?: string
          job_alerts?: boolean
          marketing?: boolean
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          restaurant_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          restaurant_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          restaurant_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_menus: {
        Row: {
          config: Json
          cover_image: string | null
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"] | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          public_url_slug: string | null
          status: Database["public"]["Enums"]["menu_status"]
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          cover_image?: string | null
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          public_url_slug?: string | null
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          cover_image?: string | null
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          public_url_slug?: string | null
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menus_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "menu_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string
          id: string
          provider_id: string | null
          rating: number
          updated_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rating: number
          updated_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
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
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          provider_id: string
          service_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          provider_id: string
          service_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          provider_id?: string
          service_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          average_rating: number | null
          category: Database["public"]["Enums"]["service_category"]
          city: string
          country: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string
          portfolio_images: string[] | null
          price_max: number | null
          price_min: number | null
          reviews_count: number
          services_offered: string[] | null
          state: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          city: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          portfolio_images?: string[] | null
          price_max?: number | null
          price_min?: number | null
          reviews_count?: number
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          portfolio_images?: string[] | null
          price_max?: number | null
          price_min?: number | null
          reviews_count?: number
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          average_rating: number | null
          category: Database["public"]["Enums"]["job_category"]
          created_at: string
          description: string
          duration_hours: number | null
          enrollments_count: number
          id: string
          instructor_id: string | null
          is_free: boolean
          is_published: boolean
          level: Database["public"]["Enums"]["experience_level"]
          price: number
          short_description: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["job_category"]
          created_at?: string
          description: string
          duration_hours?: number | null
          enrollments_count?: number
          id?: string
          instructor_id?: string | null
          is_free?: boolean
          is_published?: boolean
          level?: Database["public"]["Enums"]["experience_level"]
          price?: number
          short_description?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["job_category"]
          created_at?: string
          description?: string
          duration_hours?: number | null
          enrollments_count?: number
          id?: string
          instructor_id?: string | null
          is_free?: boolean
          is_published?: boolean
          level?: Database["public"]["Enums"]["experience_level"]
          price?: number
          short_description?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      venue_bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_date: string | null
          event_id: string | null
          guest_count: number | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
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
          average_rating: number | null
          capacity_max: number | null
          capacity_min: number | null
          city: string
          country: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string
          price_per_event: number | null
          price_per_hour: number | null
          reviews_count: number
          state: string | null
          updated_at: string
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Insert: {
          address: string
          amenities?: string[] | null
          average_rating?: number | null
          capacity_max?: number | null
          capacity_min?: number | null
          city: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id: string
          price_per_event?: number | null
          price_per_hour?: number | null
          reviews_count?: number
          state?: string | null
          updated_at?: string
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Update: {
          address?: string
          amenities?: string[] | null
          average_rating?: number | null
          capacity_max?: number | null
          capacity_min?: number | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string
          price_per_event?: number | null
          price_per_hour?: number | null
          reviews_count?: number
          state?: string | null
          updated_at?: string
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_menu_slug: { Args: { menu_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_job_views: { Args: { job_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "user"
      application_status:
        | "pending"
        | "reviewing"
        | "interviewed"
        | "offered"
        | "hired"
        | "rejected"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      cuisine_type:
        | "mexican"
        | "italian"
        | "japanese"
        | "chinese"
        | "american"
        | "french"
        | "spanish"
        | "indian"
        | "thai"
        | "mediterranean"
        | "fusion"
        | "other"
      event_status: "draft" | "published" | "cancelled" | "completed"
      experience_level: "entry" | "junior" | "mid" | "senior" | "executive"
      job_category:
        | "kitchen"
        | "service"
        | "management"
        | "bartender"
        | "cleaning"
        | "delivery"
        | "other"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "temporary"
        | "internship"
      maturity_level:
        | "inicial"
        | "basico"
        | "intermedio"
        | "avanzado"
        | "experto"
      menu_status: "draft" | "published" | "archived"
      service_category:
        | "catering"
        | "photography"
        | "music"
        | "decoration"
        | "lighting"
        | "entertainment"
        | "flowers"
        | "other"
      venue_type:
        | "restaurant"
        | "banquet_hall"
        | "outdoor"
        | "rooftop"
        | "garden"
        | "beach"
        | "hotel"
        | "other"
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
      application_status: [
        "pending",
        "reviewing",
        "interviewed",
        "offered",
        "hired",
        "rejected",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      cuisine_type: [
        "mexican",
        "italian",
        "japanese",
        "chinese",
        "american",
        "french",
        "spanish",
        "indian",
        "thai",
        "mediterranean",
        "fusion",
        "other",
      ],
      event_status: ["draft", "published", "cancelled", "completed"],
      experience_level: ["entry", "junior", "mid", "senior", "executive"],
      job_category: [
        "kitchen",
        "service",
        "management",
        "bartender",
        "cleaning",
        "delivery",
        "other",
      ],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "temporary",
        "internship",
      ],
      maturity_level: [
        "inicial",
        "basico",
        "intermedio",
        "avanzado",
        "experto",
      ],
      menu_status: ["draft", "published", "archived"],
      service_category: [
        "catering",
        "photography",
        "music",
        "decoration",
        "lighting",
        "entertainment",
        "flowers",
        "other",
      ],
      venue_type: [
        "restaurant",
        "banquet_hall",
        "outdoor",
        "rooftop",
        "garden",
        "beach",
        "hotel",
        "other",
      ],
    },
  },
} as const
