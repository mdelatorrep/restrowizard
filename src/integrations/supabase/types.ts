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
      aggregator_integrations: {
        Row: {
          api_key_encrypted: string | null
          brand_id: string | null
          commission_percent: number | null
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          brand_id?: string | null
          commission_percent?: number | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          brand_id?: string | null
          commission_percent?: number | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: Database["public"]["Enums"]["delivery_platform"]
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregator_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "virtual_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregator_orders: {
        Row: {
          brand_id: string | null
          commission: number | null
          completed_at: string | null
          created_at: string
          customer_name: string | null
          delivery_address: string | null
          estimated_delivery: string | null
          external_order_id: string | null
          id: string
          items: Json
          net_total: number | null
          order_status: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          subtotal: number | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          commission?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_address?: string | null
          estimated_delivery?: string | null
          external_order_id?: string | null
          id?: string
          items?: Json
          net_total?: number | null
          order_status?: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          subtotal?: number | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          commission?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_address?: string | null
          estimated_delivery?: string | null
          external_order_id?: string | null
          id?: string
          items?: Json
          net_total?: number | null
          order_status?: string | null
          platform?: Database["public"]["Enums"]["delivery_platform"]
          subtotal?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aggregator_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "virtual_brands"
            referencedColumns: ["id"]
          },
        ]
      }
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
      brand_menus: {
        Row: {
          brand_id: string
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          item_name: string
          preparation_time: number | null
          price: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_name: string
          preparation_time?: number | null
          price?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          item_name?: string
          preparation_time?: number | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_menus_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "virtual_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      carbon_footprint_items: {
        Row: {
          category: string
          co2_per_kg: number
          created_at: string
          distance_km: number | null
          id: string
          is_local: boolean | null
          item_name: string
          notes: string | null
          supplier_name: string | null
          updated_at: string
          user_id: string
          water_usage_liters: number | null
        }
        Insert: {
          category?: string
          co2_per_kg?: number
          created_at?: string
          distance_km?: number | null
          id?: string
          is_local?: boolean | null
          item_name: string
          notes?: string | null
          supplier_name?: string | null
          updated_at?: string
          user_id: string
          water_usage_liters?: number | null
        }
        Update: {
          category?: string
          co2_per_kg?: number
          created_at?: string
          distance_km?: number | null
          id?: string
          is_local?: boolean | null
          item_name?: string
          notes?: string | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
          water_usage_liters?: number | null
        }
        Relationships: []
      }
      chain_locations: {
        Row: {
          address: string
          chain_id: string
          city: string
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          latitude: number | null
          local_user_id: string | null
          location_name: string
          location_type:
            | Database["public"]["Enums"]["chain_location_type"]
            | null
          longitude: number | null
          manager_email: string | null
          manager_name: string | null
          opening_date: string | null
          phone: string | null
          seating_capacity: number | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address: string
          chain_id: string
          city: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          local_user_id?: string | null
          location_name: string
          location_type?:
            | Database["public"]["Enums"]["chain_location_type"]
            | null
          longitude?: number | null
          manager_email?: string | null
          manager_name?: string | null
          opening_date?: string | null
          phone?: string | null
          seating_capacity?: number | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          chain_id?: string
          city?: string
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          local_user_id?: string | null
          location_name?: string
          location_type?:
            | Database["public"]["Enums"]["chain_location_type"]
            | null
          longitude?: number | null
          manager_email?: string | null
          manager_name?: string | null
          opening_date?: string | null
          phone?: string | null
          seating_capacity?: number | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_locations_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "restaurant_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_master_menus: {
        Row: {
          allergens: string[] | null
          allow_local_pricing: boolean | null
          allow_local_removal: boolean | null
          base_price: number
          category: string | null
          chain_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_core_item: boolean | null
          item_name: string
          nutritional_info: Json | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          allow_local_pricing?: boolean | null
          allow_local_removal?: boolean | null
          base_price: number
          category?: string | null
          chain_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_core_item?: boolean | null
          item_name: string
          nutritional_info?: Json | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          allow_local_pricing?: boolean | null
          allow_local_removal?: boolean | null
          base_price?: number
          category?: string | null
          chain_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_core_item?: boolean | null
          item_name?: string
          nutritional_info?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_master_menus_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "restaurant_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checklists: {
        Row: {
          category: string | null
          chain_id: string
          checklist_name: string
          created_at: string
          frequency: string | null
          id: string
          is_mandatory: boolean | null
          items: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          chain_id: string
          checklist_name: string
          created_at?: string
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          items?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          chain_id?: string
          checklist_name?: string
          created_at?: string
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          items?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checklists_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "restaurant_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_records: {
        Row: {
          checklist_id: string
          completed_by: string | null
          completion_date: string
          created_at: string
          id: string
          location_id: string
          notes: string | null
          responses: Json
          score: number | null
        }
        Insert: {
          checklist_id: string
          completed_by?: string | null
          completion_date?: string
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
          responses?: Json
          score?: number | null
        }
        Update: {
          checklist_id?: string
          completed_by?: string | null
          completion_date?: string
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          responses?: Json
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "compliance_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_records_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "chain_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_clients: {
        Row: {
          claimed_at: string | null
          client_user_id: string | null
          consultant_id: string
          created_at: string
          end_date: string | null
          id: string
          invitation_sent_at: string | null
          invitation_token: string | null
          monthly_fee: number | null
          notes: string | null
          restaurant_city: string | null
          restaurant_cuisine_type: string | null
          restaurant_email: string | null
          restaurant_name: string | null
          restaurant_phone: string | null
          services_included: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["consultant_client_status"] | null
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          client_user_id?: string | null
          consultant_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          monthly_fee?: number | null
          notes?: string | null
          restaurant_city?: string | null
          restaurant_cuisine_type?: string | null
          restaurant_email?: string | null
          restaurant_name?: string | null
          restaurant_phone?: string | null
          services_included?: string[] | null
          start_date?: string | null
          status?:
            | Database["public"]["Enums"]["consultant_client_status"]
            | null
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          client_user_id?: string | null
          consultant_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          monthly_fee?: number | null
          notes?: string | null
          restaurant_city?: string | null
          restaurant_cuisine_type?: string | null
          restaurant_email?: string | null
          restaurant_name?: string | null
          restaurant_phone?: string | null
          services_included?: string[] | null
          start_date?: string | null
          status?:
            | Database["public"]["Enums"]["consultant_client_status"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_clients_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_profiles: {
        Row: {
          bio: string | null
          brand_colors: Json | null
          certifications: string[] | null
          company_name: string | null
          consultant_type: Database["public"]["Enums"]["consultant_type"] | null
          created_at: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          specializations: string[] | null
          updated_at: string
          user_id: string
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          brand_colors?: Json | null
          certifications?: string[] | null
          company_name?: string | null
          consultant_type?:
            | Database["public"]["Enums"]["consultant_type"]
            | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          brand_colors?: Json | null
          certifications?: string[] | null
          company_name?: string | null
          consultant_type?:
            | Database["public"]["Enums"]["consultant_type"]
            | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      consultant_reports: {
        Row: {
          client_id: string | null
          consultant_id: string
          content: Json | null
          created_at: string
          id: string
          is_shared_with_client: boolean | null
          recommendations: Json | null
          report_title: string
          report_type: string | null
        }
        Insert: {
          client_id?: string | null
          consultant_id: string
          content?: Json | null
          created_at?: string
          id?: string
          is_shared_with_client?: boolean | null
          recommendations?: Json | null
          report_title: string
          report_type?: string | null
        }
        Update: {
          client_id?: string | null
          consultant_id?: string
          content?: Json | null
          created_at?: string
          id?: string
          is_shared_with_client?: boolean | null
          recommendations?: Json | null
          report_title?: string
          report_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consultant_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_reports_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_invoices: {
        Row: {
          amount: number
          client_id: string
          consultant_id: string
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          client_id: string
          consultant_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          consultant_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulting_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "consultant_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulting_invoices_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_alerts: {
        Row: {
          action_url: string | null
          alert_type: string
          created_at: string
          data: Json | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          priority: Database["public"]["Enums"]["copilot_alert_priority"] | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          alert_type: string
          created_at?: string
          data?: Json | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          priority?:
            | Database["public"]["Enums"]["copilot_alert_priority"]
            | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          alert_type?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          priority?:
            | Database["public"]["Enums"]["copilot_alert_priority"]
            | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_message_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      daily_briefings: {
        Row: {
          alerts_count: number | null
          briefing_date: string
          content: Json
          created_at: string
          highlights: string[] | null
          id: string
          is_read: boolean | null
          recommendations: string[] | null
          user_id: string
        }
        Insert: {
          alerts_count?: number | null
          briefing_date?: string
          content?: Json
          created_at?: string
          highlights?: string[] | null
          id?: string
          is_read?: boolean | null
          recommendations?: string[] | null
          user_id: string
        }
        Update: {
          alerts_count?: number | null
          briefing_date?: string
          content?: Json
          created_at?: string
          highlights?: string[] | null
          id?: string
          is_read?: boolean | null
          recommendations?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      daily_sales: {
        Row: {
          average_ticket: number | null
          covers_count: number | null
          created_at: string
          food_cost: number | null
          id: string
          labor_cost: number | null
          notes: string | null
          other_costs: number | null
          sale_date: string
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_ticket?: number | null
          covers_count?: number | null
          created_at?: string
          food_cost?: number | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          other_costs?: number | null
          sale_date?: string
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_ticket?: number | null
          covers_count?: number | null
          created_at?: string
          food_cost?: number | null
          id?: string
          labor_cost?: number | null
          notes?: string | null
          other_costs?: number | null
          sale_date?: string
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      event_quotations: {
        Row: {
          accepted_at: string | null
          additional_costs: number | null
          client_company: string | null
          client_contact_name: string
          client_email: string | null
          client_phone: string | null
          client_type: string | null
          consultant_id: string
          created_at: string | null
          discount_percentage: number | null
          event_date: string | null
          event_description: string | null
          event_duration_hours: number | null
          event_end_date: string | null
          event_name: string
          event_type: string
          guest_count: number | null
          id: string
          internal_notes: string | null
          menu_cost_per_person: number | null
          notes: string | null
          profit_margin_percentage: number | null
          public_slug: string | null
          responded_at: string | null
          restaurant_id: string | null
          sent_at: string | null
          services_cost: number | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          venue_cost: number | null
          viewed_at: string | null
          zone_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          additional_costs?: number | null
          client_company?: string | null
          client_contact_name: string
          client_email?: string | null
          client_phone?: string | null
          client_type?: string | null
          consultant_id: string
          created_at?: string | null
          discount_percentage?: number | null
          event_date?: string | null
          event_description?: string | null
          event_duration_hours?: number | null
          event_end_date?: string | null
          event_name: string
          event_type: string
          guest_count?: number | null
          id?: string
          internal_notes?: string | null
          menu_cost_per_person?: number | null
          notes?: string | null
          profit_margin_percentage?: number | null
          public_slug?: string | null
          responded_at?: string | null
          restaurant_id?: string | null
          sent_at?: string | null
          services_cost?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          venue_cost?: number | null
          viewed_at?: string | null
          zone_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          additional_costs?: number | null
          client_company?: string | null
          client_contact_name?: string
          client_email?: string | null
          client_phone?: string | null
          client_type?: string | null
          consultant_id?: string
          created_at?: string | null
          discount_percentage?: number | null
          event_date?: string | null
          event_description?: string | null
          event_duration_hours?: number | null
          event_end_date?: string | null
          event_name?: string
          event_type?: string
          guest_count?: number | null
          id?: string
          internal_notes?: string | null
          menu_cost_per_person?: number | null
          notes?: string | null
          profit_margin_percentage?: number | null
          public_slug?: string | null
          responded_at?: string | null
          restaurant_id?: string | null
          sent_at?: string | null
          services_cost?: number | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          venue_cost?: number | null
          viewed_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_quotations_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quotations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quotations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "restaurant_zones"
            referencedColumns: ["id"]
          },
        ]
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
      food_waste_logs: {
        Row: {
          category: Database["public"]["Enums"]["waste_category"]
          created_at: string
          estimated_cost: number | null
          id: string
          item_name: string
          preventable: boolean | null
          quantity_kg: number
          reason: string | null
          user_id: string
          waste_date: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["waste_category"]
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name: string
          preventable?: boolean | null
          quantity_kg?: number
          reason?: string | null
          user_id: string
          waste_date?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["waste_category"]
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name?: string
          preventable?: boolean | null
          quantity_kg?: number
          reason?: string | null
          user_id?: string
          waste_date?: string
        }
        Relationships: []
      }
      industry_benchmarks: {
        Row: {
          avg_value: number
          id: string
          metric_category: string
          metric_name: string
          percentile_25: number | null
          percentile_75: number | null
          region: string | null
          restaurant_type: string | null
          sample_size: number | null
          updated_at: string
        }
        Insert: {
          avg_value: number
          id?: string
          metric_category: string
          metric_name: string
          percentile_25?: number | null
          percentile_75?: number | null
          region?: string | null
          restaurant_type?: string | null
          sample_size?: number | null
          updated_at?: string
        }
        Update: {
          avg_value?: number
          id?: string
          metric_category?: string
          metric_name?: string
          percentile_25?: number | null
          percentile_75?: number | null
          region?: string | null
          restaurant_type?: string | null
          sample_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number
          id: string
          item_name: string
          last_restocked_at: string | null
          reorder_point: number | null
          supplier_name: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          item_name: string
          last_restocked_at?: string | null
          reorder_point?: number | null
          supplier_name?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          item_name?: string
          last_restocked_at?: string | null
          reorder_point?: number | null
          supplier_name?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_transfers: {
        Row: {
          approved_by: string | null
          chain_id: string
          created_at: string
          from_location_id: string
          id: string
          items: Json
          notes: string | null
          received_at: string | null
          requested_by: string | null
          shipped_at: string | null
          status: string | null
          to_location_id: string
          total_value: number | null
        }
        Insert: {
          approved_by?: string | null
          chain_id: string
          created_at?: string
          from_location_id: string
          id?: string
          items?: Json
          notes?: string | null
          received_at?: string | null
          requested_by?: string | null
          shipped_at?: string | null
          status?: string | null
          to_location_id: string
          total_value?: number | null
        }
        Update: {
          approved_by?: string | null
          chain_id?: string
          created_at?: string
          from_location_id?: string
          id?: string
          items?: Json
          notes?: string | null
          received_at?: string | null
          requested_by?: string | null
          shipped_at?: string | null
          status?: string | null
          to_location_id?: string
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "restaurant_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "chain_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "chain_locations"
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
      kitchen_production_queue: {
        Row: {
          assigned_to: string | null
          brand_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          item_name: string
          order_id: string | null
          priority: number | null
          quantity: number | null
          started_at: string | null
          station: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          item_name: string
          order_id?: string | null
          priority?: number | null
          quantity?: number | null
          started_at?: string | null
          station?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          item_name?: string
          order_id?: string | null
          priority?: number | null
          quantity?: number | null
          started_at?: string | null
          station?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_production_queue_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "virtual_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_production_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "aggregator_orders"
            referencedColumns: ["id"]
          },
        ]
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
          user_type: string | null
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
          user_type?: string | null
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
          user_type?: string | null
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
      quotation_gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          quotation_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          quotation_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          quotation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_gallery_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "event_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_menu_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_included: boolean | null
          item_description: string | null
          item_name: string
          menu_item_id: string | null
          notes: string | null
          price_per_person: number | null
          quantity: number | null
          quotation_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_included?: boolean | null
          item_description?: string | null
          item_name: string
          menu_item_id?: string | null
          notes?: string | null
          price_per_person?: number | null
          quantity?: number | null
          quotation_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_included?: boolean | null
          item_description?: string | null
          item_name?: string
          menu_item_id?: string | null
          notes?: string | null
          price_per_person?: number | null
          quantity?: number | null
          quotation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_menu_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_menu_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "event_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_services: {
        Row: {
          created_at: string | null
          duration_hours: number | null
          id: string
          notes: string | null
          price: number | null
          provider_contact: string | null
          provider_name: string | null
          quotation_id: string
          service_description: string | null
          service_name: string
          service_provider_id: string | null
          service_type: string
        }
        Insert: {
          created_at?: string | null
          duration_hours?: number | null
          id?: string
          notes?: string | null
          price?: number | null
          provider_contact?: string | null
          provider_name?: string | null
          quotation_id: string
          service_description?: string | null
          service_name: string
          service_provider_id?: string | null
          service_type: string
        }
        Update: {
          created_at?: string | null
          duration_hours?: number | null
          id?: string
          notes?: string | null
          price?: number | null
          provider_contact?: string | null
          provider_name?: string | null
          quotation_id?: string
          service_description?: string | null
          service_name?: string
          service_provider_id?: string | null
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_services_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "event_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_services_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_businesses: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          cuisine_type: string | null
          employee_count: number | null
          id: string
          monthly_revenue_range: string | null
          name: string
          owner_id: string
          phone: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          employee_count?: number | null
          id?: string
          monthly_revenue_range?: string | null
          name: string
          owner_id: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          employee_count?: number | null
          id?: string
          monthly_revenue_range?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      restaurant_chains: {
        Row: {
          chain_name: string
          created_at: string
          description: string | null
          founded_year: number | null
          headquarters_city: string | null
          headquarters_country: string | null
          id: string
          is_franchise: boolean | null
          logo_url: string | null
          owner_id: string
          total_locations: number | null
          updated_at: string
        }
        Insert: {
          chain_name: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          is_franchise?: boolean | null
          logo_url?: string | null
          owner_id: string
          total_locations?: number | null
          updated_at?: string
        }
        Update: {
          chain_name?: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          id?: string
          is_franchise?: boolean | null
          logo_url?: string | null
          owner_id?: string
          total_locations?: number | null
          updated_at?: string
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
      restaurant_zones: {
        Row: {
          amenities: Json | null
          capacity_max: number | null
          capacity_min: number | null
          consultant_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          price_per_event: number | null
          price_per_hour: number | null
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          capacity_max?: number | null
          capacity_min?: number | null
          consultant_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          price_per_event?: number | null
          price_per_hour?: number | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          capacity_max?: number | null
          capacity_min?: number | null
          consultant_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          price_per_event?: number | null
          price_per_hour?: number | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_zones_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_businesses"
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
      staff_members: {
        Row: {
          created_at: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          performance_score: number | null
          position: string
          training_progress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          performance_score?: number | null
          position: string
          training_progress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          performance_score?: number | null
          position?: string
          training_progress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sustainability_goals: {
        Row: {
          created_at: string
          current_value: number | null
          end_date: string | null
          goal_type: string
          id: string
          is_achieved: boolean | null
          start_date: string
          target_value: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          end_date?: string | null
          goal_type: string
          id?: string
          is_achieved?: boolean | null
          start_date?: string
          target_value: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          end_date?: string | null
          goal_type?: string
          id?: string
          is_achieved?: boolean | null
          start_date?: string
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sustainability_reports: {
        Row: {
          cost_savings: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          recommendations: Json | null
          report_data: Json | null
          report_type: string
          total_co2_kg: number | null
          total_waste_kg: number | null
          user_id: string
        }
        Insert: {
          cost_savings?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          recommendations?: Json | null
          report_data?: Json | null
          report_type?: string
          total_co2_kg?: number | null
          total_waste_kg?: number | null
          user_id: string
        }
        Update: {
          cost_savings?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          recommendations?: Json | null
          report_data?: Json | null
          report_type?: string
          total_co2_kg?: number | null
          total_waste_kg?: number | null
          user_id?: string
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
      virtual_brands: {
        Row: {
          avg_preparation_time: number | null
          brand_logo: string | null
          brand_name: string
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"] | null
          description: string | null
          id: string
          is_active: boolean | null
          primary_platform:
            | Database["public"]["Enums"]["delivery_platform"]
            | null
          status: Database["public"]["Enums"]["brand_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_preparation_time?: number | null
          brand_logo?: string | null
          brand_name: string
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          primary_platform?:
            | Database["public"]["Enums"]["delivery_platform"]
            | null
          status?: Database["public"]["Enums"]["brand_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_preparation_time?: number | null
          brand_logo?: string | null
          brand_name?: string
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          primary_platform?:
            | Database["public"]["Enums"]["delivery_platform"]
            | null
          status?: Database["public"]["Enums"]["brand_status"] | null
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
      claim_consultant_client: {
        Args: { p_invitation_token: string }
        Returns: Json
      }
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
      app_role: "admin" | "manager" | "staff" | "user" | "consultant"
      application_status:
        | "pending"
        | "reviewing"
        | "interviewed"
        | "offered"
        | "hired"
        | "rejected"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      brand_status: "active" | "paused" | "archived"
      chain_location_type:
        | "flagship"
        | "standard"
        | "express"
        | "ghost_kitchen"
        | "franchise"
      consultant_client_status: "active" | "paused" | "completed" | "prospect"
      consultant_type:
        | "independent"
        | "agency"
        | "franchise_advisor"
        | "chain_consultant"
      copilot_alert_priority: "low" | "medium" | "high" | "critical"
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
      delivery_platform:
        | "rappi"
        | "uber_eats"
        | "didi_food"
        | "doordash"
        | "grubhub"
        | "direct"
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
      waste_category:
        | "preparation"
        | "overproduction"
        | "spoilage"
        | "plate_waste"
        | "storage"
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
      app_role: ["admin", "manager", "staff", "user", "consultant"],
      application_status: [
        "pending",
        "reviewing",
        "interviewed",
        "offered",
        "hired",
        "rejected",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      brand_status: ["active", "paused", "archived"],
      chain_location_type: [
        "flagship",
        "standard",
        "express",
        "ghost_kitchen",
        "franchise",
      ],
      consultant_client_status: ["active", "paused", "completed", "prospect"],
      consultant_type: [
        "independent",
        "agency",
        "franchise_advisor",
        "chain_consultant",
      ],
      copilot_alert_priority: ["low", "medium", "high", "critical"],
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
      delivery_platform: [
        "rappi",
        "uber_eats",
        "didi_food",
        "doordash",
        "grubhub",
        "direct",
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
      waste_category: [
        "preparation",
        "overproduction",
        "spoilage",
        "plate_waste",
        "storage",
        "other",
      ],
    },
  },
} as const
