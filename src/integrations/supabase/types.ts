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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      applicant_profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          currency: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          experience_years: number | null
          headline: string | null
          id: string
          is_open_to_remote: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_categories:
            | Database["public"]["Enums"]["job_category"][]
            | null
          preferred_job_types: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations: string[] | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          currency?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          experience_years?: number | null
          headline?: string | null
          id?: string
          is_open_to_remote?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_categories?:
            | Database["public"]["Enums"]["job_category"][]
            | null
          preferred_job_types?: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          currency?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          experience_years?: number | null
          headline?: string | null
          id?: string
          is_open_to_remote?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_categories?:
            | Database["public"]["Enums"]["job_category"][]
            | null
          preferred_job_types?: Database["public"]["Enums"]["job_type"][] | null
          preferred_locations?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          amount_paid: number | null
          certificate_url: string | null
          completion_date: string | null
          course_id: string
          enrollment_date: string | null
          final_grade: number | null
          id: string
          payment_status: string | null
          progress_percentage: number | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Insert: {
          amount_paid?: number | null
          certificate_url?: string | null
          completion_date?: string | null
          course_id: string
          enrollment_date?: string | null
          final_grade?: number | null
          id?: string
          payment_status?: string | null
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Update: {
          amount_paid?: number | null
          certificate_url?: string | null
          completion_date?: string | null
          course_id?: string
          enrollment_date?: string | null
          final_grade?: number | null
          id?: string
          payment_status?: string | null
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string | null
          enrollment_id: string
          id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string | null
          enrollment_id: string
          id?: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string | null
          enrollment_id?: string
          id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      job_applications: {
        Row: {
          applicant_id: string
          applied_at: string | null
          cover_letter: string | null
          id: string
          interview_date: string | null
          job_id: string
          notes: string | null
          resume_url: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          applicant_id: string
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          interview_date?: string | null
          job_id: string
          notes?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          applicant_id?: string
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string
          notes?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          application_deadline: string | null
          applications_count: number | null
          benefits: string[] | null
          created_at: string | null
          currency: string | null
          description: string
          employer_id: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_category: Database["public"]["Enums"]["job_category"]
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          requirements: string | null
          responsibilities: string | null
          restaurant_name: string
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          start_date: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          created_at?: string | null
          currency?: string | null
          description: string
          employer_id: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_category: Database["public"]["Enums"]["job_category"]
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          requirements?: string | null
          responsibilities?: string | null
          restaurant_name: string
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string
          employer_id?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_category?: Database["public"]["Enums"]["job_category"]
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string
          requirements?: string | null
          responsibilities?: string | null
          restaurant_name?: string
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
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
      menu_items: {
        Row: {
          allergens: string[] | null
          category: Database["public"]["Enums"]["menu_category_type"]
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          menu_id: string
          name: string
          price: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category: Database["public"]["Enums"]["menu_category_type"]
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          menu_id: string
          name: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category?: Database["public"]["Enums"]["menu_category_type"]
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          menu_id?: string
          name?: string
          price?: number | null
          sort_order?: number | null
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
          categories: Json
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"]
          description: string | null
          id: string
          is_active: boolean
          name: string
          structure: Json
          updated_at: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"]
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          structure?: Json
          updated_at?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"]
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          ai_alerts: boolean | null
          created_at: string
          id: string
          kpi_alerts: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          system_updates: boolean | null
          training_reminders: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_alerts?: boolean | null
          created_at?: string
          id?: string
          kpi_alerts?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_updates?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_alerts?: boolean | null
          created_at?: string
          id?: string
          kpi_alerts?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_updates?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          action_url: string | null
          body: string
          clicked_at: string | null
          data: Json | null
          delivery_status: string | null
          icon: string | null
          id: string
          notification_type: string | null
          sent_at: string
          title: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          clicked_at?: string | null
          data?: Json | null
          delivery_status?: string | null
          icon?: string | null
          id?: string
          notification_type?: string | null
          sent_at?: string
          title: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          clicked_at?: string | null
          data?: Json | null
          delivery_status?: string | null
          icon?: string | null
          id?: string
          notification_type?: string | null
          sent_at?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
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
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      restaurant_menus: {
        Row: {
          brand_colors: Json | null
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"]
          description: string | null
          id: string
          logo_url: string | null
          menu_data: Json
          name: string
          public_url_slug: string | null
          qr_code_url: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["menu_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"]
          description?: string | null
          id?: string
          logo_url?: string | null
          menu_data?: Json
          name: string
          public_url_slug?: string | null
          qr_code_url?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"]
          description?: string | null
          id?: string
          logo_url?: string | null
          menu_data?: Json
          name?: string
          public_url_slug?: string | null
          qr_code_url?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          updated_at?: string
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
      training_courses: {
        Row: {
          certification_provided: boolean | null
          content_outline: string | null
          course_image: string | null
          course_level: Database["public"]["Enums"]["course_level"]
          created_at: string | null
          currency: string | null
          description: string
          duration_hours: number
          id: string
          instructor_id: string
          is_featured: boolean | null
          job_category: Database["public"]["Enums"]["job_category"]
          max_participants: number | null
          objectives: string | null
          prerequisites: string | null
          price: number
          rating: number | null
          skills_covered: string[] | null
          status: Database["public"]["Enums"]["course_status"] | null
          title: string
          total_enrollments: number | null
          updated_at: string | null
        }
        Insert: {
          certification_provided?: boolean | null
          content_outline?: string | null
          course_image?: string | null
          course_level: Database["public"]["Enums"]["course_level"]
          created_at?: string | null
          currency?: string | null
          description: string
          duration_hours: number
          id?: string
          instructor_id: string
          is_featured?: boolean | null
          job_category: Database["public"]["Enums"]["job_category"]
          max_participants?: number | null
          objectives?: string | null
          prerequisites?: string | null
          price: number
          rating?: number | null
          skills_covered?: string[] | null
          status?: Database["public"]["Enums"]["course_status"] | null
          title: string
          total_enrollments?: number | null
          updated_at?: string | null
        }
        Update: {
          certification_provided?: boolean | null
          content_outline?: string | null
          course_image?: string | null
          course_level?: Database["public"]["Enums"]["course_level"]
          created_at?: string | null
          currency?: string | null
          description?: string
          duration_hours?: number
          id?: string
          instructor_id?: string
          is_featured?: boolean | null
          job_category?: Database["public"]["Enums"]["job_category"]
          max_participants?: number | null
          objectives?: string | null
          prerequisites?: string | null
          price?: number
          rating?: number | null
          skills_covered?: string[] | null
          status?: Database["public"]["Enums"]["course_status"] | null
          title?: string
          total_enrollments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_instructor_id_fkey"
            columns: ["instructor_id"]
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
      generate_menu_slug: {
        Args: { restaurant_name: string }
        Returns: string
      }
      get_vapid_public_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_job_views: {
        Args: { job_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "user"
      application_status:
        | "pending"
        | "reviewed"
        | "interview"
        | "accepted"
        | "rejected"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      course_level: "beginner" | "intermediate" | "advanced" | "expert"
      course_status: "draft" | "published" | "archived"
      cuisine_type:
        | "italian"
        | "mexican"
        | "chinese"
        | "japanese"
        | "indian"
        | "french"
        | "spanish"
        | "american"
        | "mediterranean"
        | "thai"
        | "korean"
        | "vietnamese"
        | "greek"
        | "middle_eastern"
        | "fusion"
        | "seafood"
        | "steakhouse"
        | "vegetarian"
        | "vegan"
      enrollment_status: "enrolled" | "completed" | "dropped" | "certified"
      event_status: "draft" | "published" | "cancelled" | "completed"
      experience_level: "entry" | "junior" | "mid" | "senior" | "lead"
      job_category:
        | "kitchen"
        | "service"
        | "management"
        | "administration"
        | "marketing"
        | "finance"
        | "maintenance"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
      maturity_level:
        | "inicial"
        | "basico"
        | "intermedio"
        | "avanzado"
        | "experto"
      menu_category_type:
        | "appetizers"
        | "salads"
        | "soups"
        | "main_courses"
        | "pasta"
        | "pizza"
        | "seafood"
        | "meat"
        | "poultry"
        | "vegetarian"
        | "desserts"
        | "beverages"
        | "wine"
        | "cocktails"
        | "kids"
        | "specials"
      menu_status: "draft" | "published" | "archived"
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
      application_status: [
        "pending",
        "reviewed",
        "interview",
        "accepted",
        "rejected",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      course_level: ["beginner", "intermediate", "advanced", "expert"],
      course_status: ["draft", "published", "archived"],
      cuisine_type: [
        "italian",
        "mexican",
        "chinese",
        "japanese",
        "indian",
        "french",
        "spanish",
        "american",
        "mediterranean",
        "thai",
        "korean",
        "vietnamese",
        "greek",
        "middle_eastern",
        "fusion",
        "seafood",
        "steakhouse",
        "vegetarian",
        "vegan",
      ],
      enrollment_status: ["enrolled", "completed", "dropped", "certified"],
      event_status: ["draft", "published", "cancelled", "completed"],
      experience_level: ["entry", "junior", "mid", "senior", "lead"],
      job_category: [
        "kitchen",
        "service",
        "management",
        "administration",
        "marketing",
        "finance",
        "maintenance",
      ],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
      ],
      maturity_level: [
        "inicial",
        "basico",
        "intermedio",
        "avanzado",
        "experto",
      ],
      menu_category_type: [
        "appetizers",
        "salads",
        "soups",
        "main_courses",
        "pasta",
        "pizza",
        "seafood",
        "meat",
        "poultry",
        "vegetarian",
        "desserts",
        "beverages",
        "wine",
        "cocktails",
        "kids",
        "specials",
      ],
      menu_status: ["draft", "published", "archived"],
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
