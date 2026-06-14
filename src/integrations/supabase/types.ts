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
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          brand_id: string | null
          client_id: string | null
          client_secret_encrypted: string | null
          commission_percent: number | null
          config: Json | null
          created_at: string
          environment: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          store_id: string | null
          store_ids: string[] | null
          sync_status: Json | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          brand_id?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          commission_percent?: number | null
          config?: Json | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          store_id?: string | null
          store_ids?: string[] | null
          sync_status?: Json | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          brand_id?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          commission_percent?: number | null
          config?: Json | null
          created_at?: string
          environment?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: Database["public"]["Enums"]["delivery_platform"]
          store_id?: string | null
          store_ids?: string[] | null
          sync_status?: Json | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
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
          courier_info: Json | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          estimated_delivery: string | null
          external_order_id: string | null
          id: string
          items: Json
          net_total: number | null
          order_status: string | null
          pickup_code: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          raw_payload: Json | null
          rejection_reason: string | null
          status_history: Json | null
          subtotal: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          commission?: number | null
          completed_at?: string | null
          courier_info?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          estimated_delivery?: string | null
          external_order_id?: string | null
          id?: string
          items?: Json
          net_total?: number | null
          order_status?: string | null
          pickup_code?: string | null
          platform: Database["public"]["Enums"]["delivery_platform"]
          raw_payload?: Json | null
          rejection_reason?: string | null
          status_history?: Json | null
          subtotal?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          commission?: number | null
          completed_at?: string | null
          courier_info?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          estimated_delivery?: string | null
          external_order_id?: string | null
          id?: string
          items?: Json
          net_total?: number | null
          order_status?: string | null
          pickup_code?: string | null
          platform?: Database["public"]["Enums"]["delivery_platform"]
          raw_payload?: Json | null
          rejection_reason?: string | null
          status_history?: Json | null
          subtotal?: number | null
          updated_at?: string
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
      allergens: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          severity?: string | null
        }
        Relationships: []
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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          business_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          request_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          business_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          business_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          request_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      benefit_requests: {
        Row: {
          benefit_id: string
          created_at: string
          id: string
          message: string | null
          review_notes: string | null
          reviewed_at: string | null
          staff_member_id: string
          status: string
          user_id: string
        }
        Insert: {
          benefit_id: string
          created_at?: string
          id?: string
          message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          staff_member_id: string
          status?: string
          user_id?: string
        }
        Update: {
          benefit_id?: string
          created_at?: string
          id?: string
          message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          staff_member_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_requests_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "staff_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_requests_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          ai_generated: boolean | null
          asset_name: string | null
          asset_type: string
          asset_url: string | null
          brand_id: string | null
          created_at: string | null
          id: string
          prompt_used: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          asset_name?: string | null
          asset_type: string
          asset_url?: string | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          prompt_used?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          asset_name?: string | null
          asset_type?: string
          asset_url?: string | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          prompt_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "restaurant_brands"
            referencedColumns: ["id"]
          },
        ]
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
      business_opening_projects: {
        Row: {
          business_type: string
          city: string
          country: string
          created_at: string | null
          cuisine_type: string | null
          current_phase: string | null
          description: string | null
          estimated_budget: number | null
          id: string
          neighborhood: string | null
          progress_percentage: number | null
          project_name: string
          target_opening_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_type: string
          city: string
          country?: string
          created_at?: string | null
          cuisine_type?: string | null
          current_phase?: string | null
          description?: string | null
          estimated_budget?: number | null
          id?: string
          neighborhood?: string | null
          progress_percentage?: number | null
          project_name: string
          target_opening_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          business_type?: string
          city?: string
          country?: string
          created_at?: string | null
          cuisine_type?: string | null
          current_phase?: string | null
          description?: string | null
          estimated_budget?: number | null
          id?: string
          neighborhood?: string | null
          progress_percentage?: number | null
          project_name?: string
          target_opening_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      candidate_experience: {
        Row: {
          candidate_id: string
          city: string | null
          company_name: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          position: string
          start_date: string | null
        }
        Insert: {
          candidate_id: string
          city?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position: string
          start_date?: string | null
        }
        Update: {
          candidate_id?: string
          city?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          position?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          certifications: string[] | null
          city: string | null
          country: string | null
          created_at: string
          desired_categories: string[] | null
          desired_job_types: string[] | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          full_name: string
          headline: string | null
          id: string
          is_actively_looking: boolean | null
          languages: string[] | null
          phone: string | null
          photo_url: string | null
          profile_completeness: number | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          desired_categories?: string[] | null
          desired_job_types?: string[] | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          full_name: string
          headline?: string | null
          id?: string
          is_actively_looking?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo_url?: string | null
          profile_completeness?: number | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          desired_categories?: string[] | null
          desired_job_types?: string[] | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          full_name?: string
          headline?: string | null
          id?: string
          is_actively_looking?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo_url?: string | null
          profile_completeness?: number | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
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
      consultant_impersonation_log: {
        Row: {
          client_business_id: string | null
          client_user_id: string
          consultant_id: string
          ended_at: string | null
          id: string
          ip: string | null
          started_at: string
          user_agent: string | null
        }
        Insert: {
          client_business_id?: string | null
          client_user_id: string
          consultant_id: string
          ended_at?: string | null
          id?: string
          ip?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          client_business_id?: string | null
          client_user_id?: string
          consultant_id?: string
          ended_at?: string | null
          id?: string
          ip?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Relationships: []
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
      course_certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          course_id: string | null
          id: string
          issued_at: string
          metadata: Json | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          certificate_number?: string
          certificate_type?: string
          course_id?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          course_id?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_id: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_via: string
          id: string
          last_lesson_id: string | null
          lessons_completed: number
          progress_percent: number
          total_lessons: number
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_via?: string
          id?: string
          last_lesson_id?: string | null
          lessons_completed?: number
          progress_percent?: number
          total_lessons?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          certificate_id?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_via?: string
          id?: string
          last_lesson_id?: string | null
          lessons_completed?: number
          progress_percent?: number
          total_lessons?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "course_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          ai_generated: boolean
          content: string | null
          content_type: string
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_free_preview: boolean
          order_index: number
          quiz_data: Json | null
          title: string
          video_url: string | null
        }
        Insert: {
          ai_generated?: boolean
          content?: string | null
          content_type?: string
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free_preview?: boolean
          order_index?: number
          quiz_data?: Json | null
          title: string
          video_url?: string | null
        }
        Update: {
          ai_generated?: boolean
          content?: string | null
          content_type?: string
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_free_preview?: boolean
          order_index?: number
          quiz_data?: Json | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          rating: number
          user_id?: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          ai_response_suggestion: string | null
          ambiance_rating: number | null
          campaign_id: string | null
          comment: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          food_rating: number | null
          id: string
          key_topics: Json | null
          order_id: string | null
          rating: number | null
          responded: boolean | null
          responded_at: string | null
          response_text: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          service_rating: number | null
          source: string | null
          user_id: string
          value_rating: number | null
        }
        Insert: {
          ai_response_suggestion?: string | null
          ambiance_rating?: number | null
          campaign_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          food_rating?: number | null
          id?: string
          key_topics?: Json | null
          order_id?: string | null
          rating?: number | null
          responded?: boolean | null
          responded_at?: string | null
          response_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          service_rating?: number | null
          source?: string | null
          user_id?: string
          value_rating?: number | null
        }
        Update: {
          ai_response_suggestion?: string | null
          ambiance_rating?: number | null
          campaign_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          food_rating?: number | null
          id?: string
          key_topics?: Json | null
          order_id?: string | null
          rating?: number | null
          responded?: boolean | null
          responded_at?: string | null
          response_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          service_rating?: number | null
          source?: string | null
          user_id?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "feedback_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
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
          user_id?: string
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
      debug_events: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          id: string
          scope: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          id?: string
          scope: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          id?: string
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          delivery_fee: number | null
          estimated_time_minutes: number | null
          id: string
          is_active: boolean | null
          min_order: number | null
          polygon: Json | null
          user_id: string
          zone_name: string
        }
        Insert: {
          created_at?: string | null
          delivery_fee?: number | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          polygon?: Json | null
          user_id: string
          zone_name: string
        }
        Update: {
          created_at?: string | null
          delivery_fee?: number | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          polygon?: Json | null
          user_id?: string
          zone_name?: string
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
      feedback_campaigns: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          incentive: string | null
          name: string
          qr_code_url: string | null
          responses_count: number | null
          short_url: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          incentive?: string | null
          name: string
          qr_code_url?: string | null
          responses_count?: number | null
          short_url?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          incentive?: string | null
          name?: string
          qr_code_url?: string | null
          responses_count?: number | null
          short_url?: string | null
          user_id?: string
        }
        Relationships: []
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
      growth_preregistrations: {
        Row: {
          created_at: string
          email: string
          id: string
          interest_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interest_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interest_type?: string
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
      inventory_count_items: {
        Row: {
          count_id: string
          counted_at: string | null
          counted_quantity: number | null
          created_at: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          system_quantity: number
          unit_cost: number | null
          variance_percentage: number | null
          variance_quantity: number | null
          variance_value: number | null
        }
        Insert: {
          count_id: string
          counted_at?: string | null
          counted_quantity?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          system_quantity: number
          unit_cost?: number | null
          variance_percentage?: number | null
          variance_quantity?: number | null
          variance_value?: number | null
        }
        Update: {
          count_id?: string
          counted_at?: string | null
          counted_quantity?: number | null
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          system_quantity?: number
          unit_cost?: number | null
          variance_percentage?: number | null
          variance_quantity?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          completed_at: string | null
          count_name: string
          count_type: string | null
          counted_by: string | null
          created_at: string | null
          id: string
          items_counted: number | null
          notes: string | null
          scheduled_date: string | null
          started_at: string | null
          status: string | null
          storage_location_id: string | null
          total_items: number | null
          total_variance_value: number | null
          user_id: string
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          count_name: string
          count_type?: string | null
          counted_by?: string | null
          created_at?: string | null
          id?: string
          items_counted?: number | null
          notes?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: string | null
          storage_location_id?: string | null
          total_items?: number | null
          total_variance_value?: number | null
          user_id?: string
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          count_name?: string
          count_type?: string | null
          counted_by?: string | null
          created_at?: string | null
          id?: string
          items_counted?: number | null
          notes?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: string | null
          storage_location_id?: string | null
          total_items?: number | null
          total_variance_value?: number | null
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_deductions: {
        Row: {
          deducted_at: string
          id: string
          inventory_item_id: string | null
          order_id: string | null
          quantity_deducted: number
          recipe_id: string | null
          unit: string
          user_id: string
        }
        Insert: {
          deducted_at?: string
          id?: string
          inventory_item_id?: string | null
          order_id?: string | null
          quantity_deducted: number
          recipe_id?: string | null
          unit: string
          user_id: string
        }
        Update: {
          deducted_at?: string
          id?: string
          inventory_item_id?: string | null
          order_id?: string | null
          quantity_deducted?: number
          recipe_id?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_deductions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_deductions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_deductions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_deductions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_deductions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "inventory_deductions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_suppliers: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          is_preferred: boolean | null
          last_ordered_at: string | null
          min_order_quantity: number | null
          purchase_unit: string | null
          supplier_id: string
          supplier_sku: string | null
          unit_cost: number
          units_per_purchase: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          is_preferred?: boolean | null
          last_ordered_at?: string | null
          min_order_quantity?: number | null
          purchase_unit?: string | null
          supplier_id: string
          supplier_sku?: string | null
          unit_cost: number
          units_per_purchase?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          is_preferred?: boolean | null
          last_ordered_at?: string | null
          min_order_quantity?: number | null
          purchase_unit?: string | null
          supplier_id?: string
          supplier_sku?: string | null
          unit_cost?: number
          units_per_purchase?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_suppliers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_suppliers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_suppliers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          alert_when_low: boolean | null
          barcode: string | null
          category: string | null
          created_at: string
          current_stock: number
          expiration_date: string | null
          id: string
          is_perishable: boolean | null
          item_name: string
          last_restocked_at: string | null
          lead_time_days: number | null
          lot_number: string | null
          max_level: number | null
          min_order_quantity: number | null
          min_stock_level: number | null
          notes: string | null
          par_level: number | null
          preferred_supplier_id: string | null
          purchase_quantity: number | null
          purchase_unit: string | null
          reorder_point: number | null
          shelf_life_days: number | null
          sku: string | null
          storage_location_id: string | null
          supplier_name: string | null
          track_stock: boolean | null
          unit: string
          unit_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_when_low?: boolean | null
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_stock?: number
          expiration_date?: string | null
          id?: string
          is_perishable?: boolean | null
          item_name: string
          last_restocked_at?: string | null
          lead_time_days?: number | null
          lot_number?: string | null
          max_level?: number | null
          min_order_quantity?: number | null
          min_stock_level?: number | null
          notes?: string | null
          par_level?: number | null
          preferred_supplier_id?: string | null
          purchase_quantity?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          shelf_life_days?: number | null
          sku?: string | null
          storage_location_id?: string | null
          supplier_name?: string | null
          track_stock?: boolean | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          alert_when_low?: boolean | null
          barcode?: string | null
          category?: string | null
          created_at?: string
          current_stock?: number
          expiration_date?: string | null
          id?: string
          is_perishable?: boolean | null
          item_name?: string
          last_restocked_at?: string | null
          lead_time_days?: number | null
          lot_number?: string | null
          max_level?: number | null
          min_order_quantity?: number | null
          min_stock_level?: number | null
          notes?: string | null
          par_level?: number | null
          preferred_supplier_id?: string | null
          purchase_quantity?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          shelf_life_days?: number | null
          sku?: string | null
          storage_location_id?: string | null
          supplier_name?: string | null
          track_stock?: boolean | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          expiration_date: string | null
          from_location_id: string | null
          id: string
          inventory_item_id: string
          lot_number: string | null
          movement_type: string
          notes: string | null
          performed_by: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          to_location_id: string | null
          total_cost: number | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiration_date?: string | null
          from_location_id?: string | null
          id?: string
          inventory_item_id: string
          lot_number?: string | null
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiration_date?: string | null
          from_location_id?: string | null
          id?: string
          inventory_item_id?: string
          lot_number?: string | null
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          to_location_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_price_history: {
        Row: {
          change_percentage: number | null
          change_reason: string | null
          id: string
          inventory_item_id: string
          new_price: number
          old_price: number | null
          recorded_at: string | null
          recorded_by: string | null
          supplier_id: string | null
        }
        Insert: {
          change_percentage?: number | null
          change_reason?: string | null
          id?: string
          inventory_item_id: string
          new_price: number
          old_price?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          supplier_id?: string | null
        }
        Update: {
          change_percentage?: number | null
          change_reason?: string | null
          id?: string
          inventory_item_id?: string
          new_price?: number
          old_price?: number | null
          recorded_at?: string | null
          recorded_by?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_price_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_price_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_price_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_price_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          delivery_days: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          minimum_order: number | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          supplier_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_days?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          minimum_order?: number | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          supplier_name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_days?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          minimum_order?: number | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          supplier_name?: string
          updated_at?: string | null
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
      inventory_waste: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          is_preventable: boolean | null
          lot_number: string | null
          notes: string | null
          quantity: number
          reported_by: string | null
          storage_location_id: string | null
          total_cost: number | null
          unit: string
          unit_cost: number | null
          user_id: string
          waste_date: string | null
          waste_reason: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          is_preventable?: boolean | null
          lot_number?: string | null
          notes?: string | null
          quantity: number
          reported_by?: string | null
          storage_location_id?: string | null
          total_cost?: number | null
          unit: string
          unit_cost?: number | null
          user_id?: string
          waste_date?: string | null
          waste_reason: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          is_preventable?: boolean | null
          lot_number?: string | null
          notes?: string | null
          quantity?: number
          reported_by?: string | null
          storage_location_id?: string | null
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
          user_id?: string
          waste_date?: string | null
          waste_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_waste_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          ai_match_score: number | null
          ai_summary: string | null
          applicant_email: string | null
          applicant_id: string
          applicant_name: string | null
          applicant_phone: string | null
          candidate_profile_id: string | null
          cover_letter: string | null
          created_at: string
          employer_notes: string | null
          id: string
          interview_date: string | null
          job_id: string
          notes: string | null
          rejection_reason: string | null
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          ai_match_score?: number | null
          ai_summary?: string | null
          applicant_email?: string | null
          applicant_id: string
          applicant_name?: string | null
          applicant_phone?: string | null
          candidate_profile_id?: string | null
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          interview_date?: string | null
          job_id: string
          notes?: string | null
          rejection_reason?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          ai_match_score?: number | null
          ai_summary?: string | null
          applicant_email?: string | null
          applicant_id?: string
          applicant_name?: string | null
          applicant_phone?: string | null
          candidate_profile_id?: string | null
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          interview_date?: string | null
          job_id?: string
          notes?: string | null
          rejection_reason?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
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
      job_saved: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saved_job_id_fkey"
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
          company_logo_url: string | null
          company_name: string | null
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
          perks: string[] | null
          remote_option: string | null
          requirements: string | null
          responsibilities: string | null
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          title: string
          updated_at: string
          urgent: boolean | null
          views_count: number
        }
        Insert: {
          applications_count?: number
          benefits?: string | null
          category?: Database["public"]["Enums"]["job_category"]
          company_logo_url?: string | null
          company_name?: string | null
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
          perks?: string[] | null
          remote_option?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title: string
          updated_at?: string
          urgent?: boolean | null
          views_count?: number
        }
        Update: {
          applications_count?: number
          benefits?: string | null
          category?: Database["public"]["Enums"]["job_category"]
          company_logo_url?: string | null
          company_name?: string | null
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
          perks?: string[] | null
          remote_option?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string
          urgent?: boolean | null
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
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string
          user_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          business_id: string | null
          content: string
          created_at: string
          id: string
          indexed_at: string | null
          metadata: Json | null
          source_ref: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          indexed_at?: string | null
          metadata?: Json | null
          source_ref?: string | null
          source_type?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          indexed_at?: string | null
          metadata?: Json | null
          source_ref?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_track_courses: {
        Row: {
          course_id: string
          id: string
          is_mandatory: boolean
          order_index: number
          track_id: string
        }
        Insert: {
          course_id: string
          id?: string
          is_mandatory?: boolean
          order_index?: number
          track_id: string
        }
        Update: {
          course_id?: string
          id?: string
          is_mandatory?: boolean
          order_index?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          courses_count: number
          created_at: string
          description: string | null
          difficulty: string
          enrollments_count: number
          estimated_weeks: number | null
          icon_emoji: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          order_index: number
          short_description: string | null
          slug: string | null
          target_role: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          courses_count?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          enrollments_count?: number
          estimated_weeks?: number | null
          icon_emoji?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          order_index?: number
          short_description?: string | null
          slug?: string | null
          target_role?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          courses_count?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          enrollments_count?: number
          estimated_weeks?: number | null
          icon_emoji?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          order_index?: number
          short_description?: string | null
          slug?: string | null
          target_role?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          quiz_score: number | null
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          quiz_score?: number | null
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          quiz_score?: number | null
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_achievements: {
        Row: {
          achievement_type: string
          bonus_points: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          threshold: number
          user_id: string
        }
        Insert: {
          achievement_type: string
          bonus_points?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          threshold: number
          user_id?: string
        }
        Update: {
          achievement_type?: string
          bonus_points?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          threshold?: number
          user_id?: string
        }
        Relationships: []
      }
      loyalty_campaigns: {
        Row: {
          bonus_points: number | null
          budget_points: number | null
          campaign_type: string
          conditions: Json | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          name: string
          points_multiplier: number | null
          points_spent: number | null
          starts_at: string
          target_segment: string | null
          target_tier_ids: string[] | null
          updated_at: string
          user_id: string
          uses_count: number | null
        }
        Insert: {
          bonus_points?: number | null
          budget_points?: number | null
          campaign_type: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          name: string
          points_multiplier?: number | null
          points_spent?: number | null
          starts_at: string
          target_segment?: string | null
          target_tier_ids?: string[] | null
          updated_at?: string
          user_id?: string
          uses_count?: number | null
        }
        Update: {
          bonus_points?: number | null
          budget_points?: number | null
          campaign_type?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          name?: string
          points_multiplier?: number | null
          points_spent?: number | null
          starts_at?: string
          target_segment?: string | null
          target_tier_ids?: string[] | null
          updated_at?: string
          user_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      loyalty_customer_achievements: {
        Row: {
          achievement_id: string
          customer_id: string
          id: string
          points_awarded: number
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          customer_id: string
          id?: string
          points_awarded?: number
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          customer_id?: string
          id?: string
          points_awarded?: number
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_customer_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "loyalty_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_customer_achievements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_customers: {
        Row: {
          ai_insights: Json | null
          avg_order_value: number
          birthday: string | null
          churn_risk_score: number | null
          created_at: string
          current_points: number
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          first_order_at: string | null
          id: string
          is_active: boolean
          last_order_at: string | null
          lifetime_points: number
          loyalty_code: string | null
          notes: string | null
          predicted_ltv: number | null
          preferred_items: Json | null
          preferred_order_time: string | null
          restaurant_name: string | null
          tier_id: string | null
          total_orders: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          avg_order_value?: number
          birthday?: string | null
          churn_risk_score?: number | null
          created_at?: string
          current_points?: number
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          first_order_at?: string | null
          id?: string
          is_active?: boolean
          last_order_at?: string | null
          lifetime_points?: number
          loyalty_code?: string | null
          notes?: string | null
          predicted_ltv?: number | null
          preferred_items?: Json | null
          preferred_order_time?: string | null
          restaurant_name?: string | null
          tier_id?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_insights?: Json | null
          avg_order_value?: number
          birthday?: string | null
          churn_risk_score?: number | null
          created_at?: string
          current_points?: number
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          first_order_at?: string | null
          id?: string
          is_active?: boolean
          last_order_at?: string | null
          lifetime_points?: number
          loyalty_code?: string | null
          notes?: string | null
          predicted_ltv?: number | null
          preferred_items?: Json | null
          preferred_order_time?: string | null
          restaurant_name?: string | null
          tier_id?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_customers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points_transactions: {
        Row: {
          balance_after: number
          created_at: string
          customer_id: string
          description: string | null
          expires_at: string | null
          id: string
          points: number
          source: string
          source_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          customer_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points: number
          source: string
          source_id?: string | null
          transaction_type: string
          user_id?: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          source?: string
          source_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          catalog_item_id: string
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          order_id: string | null
          points_spent: number
          redeemed_at: string | null
          redemption_code: string
          status: string
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points_spent: number
          redeemed_at?: string | null
          redemption_code: string
          status?: string
          user_id?: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          points_spent?: number
          redeemed_at?: string | null
          redemption_code?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards_catalog: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_tier_id: string | null
          name: string
          points_required: number
          reward_type: string
          reward_value: number | null
          sort_order: number
          stock_limit: number | null
          stock_used: number | null
          terms: string | null
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_tier_id?: string | null
          name: string
          points_required: number
          reward_type: string
          reward_value?: number | null
          sort_order?: number
          stock_limit?: number | null
          stock_used?: number | null
          terms?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_tier_id?: string | null
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          sort_order?: number
          stock_limit?: number | null
          stock_used?: number | null
          terms?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_catalog_min_tier_id_fkey"
            columns: ["min_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          min_points: number
          name: string
          points_multiplier: number
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          min_points?: number
          name: string
          points_multiplier?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          min_points?: number
          name?: string
          points_multiplier?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      maturity_action_tracking: {
        Row: {
          action_id: string
          action_title: string
          completed_at: string | null
          created_at: string
          diagnosis_id: string
          id: string
          notes: string | null
          pillar_id: string
          priority: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          action_title: string
          completed_at?: string | null
          created_at?: string
          diagnosis_id: string
          id?: string
          notes?: string | null
          pillar_id: string
          priority: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          action_title?: string
          completed_at?: string | null
          created_at?: string
          diagnosis_id?: string
          id?: string
          notes?: string | null
          pillar_id?: string
          priority?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maturity_action_tracking_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "maturity_diagnoses"
            referencedColumns: ["id"]
          },
        ]
      }
      maturity_diagnoses: {
        Row: {
          ai_action_plan: Json | null
          ai_analysis: Json | null
          ai_benchmark: Json | null
          ai_generated_at: string | null
          answers: Json
          created_at: string
          id: string
          overall_level: Database["public"]["Enums"]["maturity_level"]
          overall_score: number
          pillar_scores: Json
          restaurant_context: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_action_plan?: Json | null
          ai_analysis?: Json | null
          ai_benchmark?: Json | null
          ai_generated_at?: string | null
          answers?: Json
          created_at?: string
          id?: string
          overall_level?: Database["public"]["Enums"]["maturity_level"]
          overall_score?: number
          pillar_scores?: Json
          restaurant_context?: Json | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_action_plan?: Json | null
          ai_analysis?: Json | null
          ai_benchmark?: Json | null
          ai_generated_at?: string | null
          answers?: Json
          created_at?: string
          id?: string
          overall_level?: Database["public"]["Enums"]["maturity_level"]
          overall_score?: number
          pillar_scores?: Json
          restaurant_context?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      measurement_units: {
        Row: {
          abbreviation: string
          base_unit_id: string | null
          category: string
          conversion_factor: number | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          base_unit_id?: string | null
          category?: string
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          base_unit_id?: string | null
          category?: string
          conversion_factor?: number | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_units_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_allergens: {
        Row: {
          code: string
          icon: string | null
          id: string
          name: string
          name_en: string
          sort_order: number
        }
        Insert: {
          code: string
          icon?: string | null
          id?: string
          name: string
          name_en: string
          sort_order?: number
        }
        Update: {
          code?: string
          icon?: string | null
          id?: string
          name?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          menu_id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          menu_id: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          menu_id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_links: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          menu_item_id: string
          modifier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          menu_item_id: string
          modifier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          menu_item_id?: string
          modifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_links_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_links_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_links_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifiers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_selections: number | null
          menu_id: string
          min_selections: number | null
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number | null
          menu_id: string
          min_selections?: number | null
          name: string
          sort_order?: number
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_selections?: number | null
          menu_id?: string
          min_selections?: number | null
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifiers_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          ai_description: string | null
          allergens: string[] | null
          bcg_category: string | null
          calories: number | null
          category: string
          category_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          is_available: boolean
          is_bestseller: boolean | null
          is_featured: boolean
          is_new: boolean | null
          menu_id: string
          name: string
          popularity_score: number | null
          preparation_time_minutes: number | null
          price: number
          profitability_score: number | null
          recipe_id: string | null
          sort_order: number
          spicy_level: number | null
          suggested_price: number | null
          updated_at: string
        }
        Insert: {
          ai_description?: string | null
          allergens?: string[] | null
          bcg_category?: string | null
          calories?: number | null
          category?: string
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_bestseller?: boolean | null
          is_featured?: boolean
          is_new?: boolean | null
          menu_id: string
          name: string
          popularity_score?: number | null
          preparation_time_minutes?: number | null
          price?: number
          profitability_score?: number | null
          recipe_id?: string | null
          sort_order?: number
          spicy_level?: number | null
          suggested_price?: number | null
          updated_at?: string
        }
        Update: {
          ai_description?: string | null
          allergens?: string[] | null
          bcg_category?: string | null
          calories?: number | null
          category?: string
          category_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_bestseller?: boolean | null
          is_featured?: boolean
          is_new?: boolean | null
          menu_id?: string
          name?: string
          popularity_score?: number | null
          preparation_time_minutes?: number | null
          price?: number
          profitability_score?: number | null
          recipe_id?: string | null
          sort_order?: number
          spicy_level?: number | null
          suggested_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_modifier_options: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          is_default: boolean
          modifier_id: string
          name: string
          price_adjustment: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          modifier_id: string
          name: string
          price_adjustment?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          is_default?: boolean
          modifier_id?: string
          name?: string
          price_adjustment?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_modifier_options_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifiers"
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
      opening_analysis_runs: {
        Row: {
          checklist_generated: boolean | null
          completed_at: string | null
          created_at: string
          current_phase: string | null
          error_message: string | null
          id: string
          include_checklist: boolean | null
          phases_completed: string[] | null
          phases_failed: string[] | null
          project_id: string
          started_at: string | null
          status: string
          total_phases: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_phase?: string | null
          error_message?: string | null
          id?: string
          include_checklist?: boolean | null
          phases_completed?: string[] | null
          phases_failed?: string[] | null
          project_id: string
          started_at?: string | null
          status?: string
          total_phases?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          checklist_generated?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_phase?: string | null
          error_message?: string | null
          id?: string
          include_checklist?: boolean | null
          phases_completed?: string[] | null
          phases_failed?: string[] | null
          project_id?: string
          started_at?: string | null
          status?: string
          total_phases?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_opening_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          phase: string
          project_id: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          phase: string
          project_id?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          phase?: string
          project_id?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_opening_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_phase_analyses: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          estimated_cost: number | null
          estimated_time_days: number | null
          id: string
          phase: string
          project_id: string | null
          recommendations: Json | null
          sources: Json | null
          status: string | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_time_days?: number | null
          id?: string
          phase: string
          project_id?: string | null
          recommendations?: Json | null
          sources?: Json | null
          status?: string | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_time_days?: number | null
          id?: string
          phase?: string
          project_id?: string | null
          recommendations?: Json | null
          sources?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_phase_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_opening_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_credentials: {
        Row: {
          created_at: string
          gateway: string
          id: string
          is_active: boolean
          is_sandbox: boolean
          private_key: string | null
          public_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gateway: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          private_key?: string | null
          public_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          gateway?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          private_key?: string | null
          public_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string | null
          external_event_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          provider: string
          signature_valid: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider: string
          signature_valid?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          signature_valid?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      pos_cash_movements: {
        Row: {
          amount: number
          authorized_by: string | null
          created_at: string
          id: string
          movement_type: string
          reason: string | null
          session_id: string
        }
        Insert: {
          amount: number
          authorized_by?: string | null
          created_at?: string
          id?: string
          movement_type: string
          reason?: string | null
          session_id: string
        }
        Update: {
          amount?: number
          authorized_by?: string | null
          created_at?: string
          id?: string
          movement_type?: string
          reason?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_discounts: {
        Row: {
          authorization_code: string | null
          created_at: string
          discount_type: string
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_value: number | null
          name: string
          requires_authorization: boolean | null
          updated_at: string
          usage_count: number | null
          user_id: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          authorization_code?: string | null
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_value?: number | null
          name: string
          requires_authorization?: boolean | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          authorization_code?: string | null
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_value?: number | null
          name?: string
          requires_authorization?: boolean | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      pos_payment_methods: {
        Row: {
          commission_percent: number | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          method_name: string
          method_type: string
          provider: string | null
          requires_reference: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_percent?: number | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          method_name: string
          method_type: string
          provider?: string | null
          requires_reference?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          commission_percent?: number | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          method_name?: string
          method_type?: string
          provider?: string | null
          requires_reference?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_sessions: {
        Row: {
          actual_cash: number | null
          cashier_name: string
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          difference: number | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_cash: number
          sales_count: number | null
          status: string
          terminal_id: string | null
          total_sales: number | null
          total_tips: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cash?: number | null
          cashier_name: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          sales_count?: number | null
          status?: string
          terminal_id?: string | null
          total_sales?: number | null
          total_tips?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cash?: number | null
          cashier_name?: string
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          difference?: number | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_cash?: number
          sales_count?: number | null
          status?: string
          terminal_id?: string | null
          total_sales?: number | null
          total_tips?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pos_transactions: {
        Row: {
          amount: number
          authorization_code: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          payment_method_id: string | null
          payment_method_name: string | null
          processed_at: string
          processed_by: string | null
          processor_response: Json | null
          reference_number: string | null
          session_id: string | null
          status: string
          tip_amount: number | null
          transaction_type: string
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          payment_method_name?: string | null
          processed_at?: string
          processed_by?: string | null
          processor_response?: Json | null
          reference_number?: string | null
          session_id?: string | null
          status?: string
          tip_amount?: number | null
          transaction_type: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          payment_method_name?: string | null
          processed_at?: string
          processed_by?: string | null
          processor_response?: Json | null
          reference_number?: string | null
          session_id?: string | null
          status?: string
          tip_amount?: number | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "pos_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_opening_tasks: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          days_before_opening: number
          description: string | null
          id: string
          is_completed: boolean
          project_id: string | null
          task_key: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string
          days_before_opening?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          project_id?: string | null
          task_key: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          days_before_opening?: number
          description?: string | null
          id?: string
          is_completed?: boolean
          project_id?: string | null
          task_key?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_opening_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "business_opening_projects"
            referencedColumns: ["id"]
          },
        ]
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
      provider_portfolio: {
        Row: {
          category: Database["public"]["Enums"]["service_category"] | null
          client_name: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          project_date: string | null
          provider_id: string
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["service_category"] | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_date?: string | null
          provider_id: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"] | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_date?: string | null
          provider_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolio_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reviews: {
        Row: {
          comment: string | null
          communication_rating: number | null
          created_at: string
          id: string
          provider_id: string
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          request_id: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          provider_id: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          request_id?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          provider_id?: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          request_id?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          expiration_date: string | null
          id: string
          inventory_item_id: string
          lot_number: string | null
          notes: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number | null
          total_cost: number
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          inventory_item_id: string
          lot_number?: string | null
          notes?: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          total_cost: number
          unit: string
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          inventory_item_id?: string
          lot_number?: string | null
          notes?: string | null
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          total_cost?: number
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_delivery: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_date: string | null
          order_number: string
          received_by: string | null
          received_date: string | null
          shipping_cost: number | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_date?: string | null
          order_number: string
          received_by?: string | null
          received_date?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          received_by?: string | null
          received_date?: string | null
          shipping_cost?: number | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "quotation_menu_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
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
      rappi_menu_sync: {
        Row: {
          created_at: string
          external_item_id: string | null
          id: string
          integration_id: string
          last_error: string | null
          last_synced_at: string | null
          menu_item_id: string | null
          status: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_item_id?: string | null
          id?: string
          integration_id: string
          last_error?: string | null
          last_synced_at?: string | null
          menu_item_id?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_item_id?: string | null
          id?: string
          integration_id?: string
          last_error?: string | null
          last_synced_at?: string | null
          menu_item_id?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappi_menu_sync_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "aggregator_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rappi_menu_sync_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rappi_menu_sync_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      rappi_settlements: {
        Row: {
          commission_amount: number
          created_at: string
          currency: string | null
          gross_amount: number
          id: string
          integration_id: string
          net_amount: number
          orders_count: number
          raw_payload: Json | null
          settlement_date: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          currency?: string | null
          gross_amount?: number
          id?: string
          integration_id: string
          net_amount?: number
          orders_count?: number
          raw_payload?: Json | null
          settlement_date: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          currency?: string | null
          gross_amount?: number
          id?: string
          integration_id?: string
          net_amount?: number
          orders_count?: number
          raw_payload?: Json | null
          settlement_date?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappi_settlements_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "aggregator_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rappi_store_status: {
        Row: {
          changed_at: string
          id: string
          integration_id: string
          pause_until: string | null
          reason: string | null
          status: string
          store_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          integration_id: string
          pause_until?: string | null
          reason?: string | null
          status: string
          store_id: string
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          integration_id?: string
          pause_until?: string | null
          reason?: string | null
          status?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappi_store_status_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "aggregator_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rappi_webhook_events: {
        Row: {
          event_id: string | null
          event_type: string | null
          id: string
          integration_id: string | null
          payload: Json
          process_error: string | null
          processed: boolean
          received_at: string
          signature: string | null
        }
        Insert: {
          event_id?: string | null
          event_type?: string | null
          id?: string
          integration_id?: string | null
          payload: Json
          process_error?: string | null
          processed?: boolean
          received_at?: string
          signature?: string | null
        }
        Update: {
          event_id?: string | null
          event_type?: string | null
          id?: string
          integration_id?: string | null
          payload?: Json
          process_error?: string | null
          processed?: boolean
          received_at?: string
          signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rappi_webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "aggregator_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          allergen_ids: string[] | null
          calories_per_unit: number | null
          carbs_per_unit: number | null
          cost_per_unit: number | null
          fat_per_unit: number | null
          gross_quantity: number | null
          id: string
          ingredient_name: string
          inventory_item_id: string | null
          is_optional: boolean | null
          notes: string | null
          preparation_method: string | null
          protein_per_unit: number | null
          quantity: number
          recipe_id: string | null
          sort_order: number | null
          unit: string
          unit_id: string | null
          yield_percentage: number | null
        }
        Insert: {
          allergen_ids?: string[] | null
          calories_per_unit?: number | null
          carbs_per_unit?: number | null
          cost_per_unit?: number | null
          fat_per_unit?: number | null
          gross_quantity?: number | null
          id?: string
          ingredient_name: string
          inventory_item_id?: string | null
          is_optional?: boolean | null
          notes?: string | null
          preparation_method?: string | null
          protein_per_unit?: number | null
          quantity: number
          recipe_id?: string | null
          sort_order?: number | null
          unit: string
          unit_id?: string | null
          yield_percentage?: number | null
        }
        Update: {
          allergen_ids?: string[] | null
          calories_per_unit?: number | null
          carbs_per_unit?: number | null
          cost_per_unit?: number | null
          fat_per_unit?: number | null
          gross_quantity?: number | null
          id?: string
          ingredient_name?: string
          inventory_item_id?: string | null
          is_optional?: boolean | null
          notes?: string | null
          preparation_method?: string | null
          protein_per_unit?: number | null
          quantity?: number
          recipe_id?: string | null
          sort_order?: number | null
          unit?: string
          unit_id?: string | null
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_nutrition: {
        Row: {
          calories: number | null
          carbs_grams: number | null
          cholesterol_mg: number | null
          created_at: string | null
          fat_grams: number | null
          fiber_grams: number | null
          id: string
          is_estimated: boolean | null
          notes: string | null
          protein_grams: number | null
          recipe_id: string
          saturated_fat_grams: number | null
          sodium_mg: number | null
          sugar_grams: number | null
          updated_at: string | null
        }
        Insert: {
          calories?: number | null
          carbs_grams?: number | null
          cholesterol_mg?: number | null
          created_at?: string | null
          fat_grams?: number | null
          fiber_grams?: number | null
          id?: string
          is_estimated?: boolean | null
          notes?: string | null
          protein_grams?: number | null
          recipe_id: string
          saturated_fat_grams?: number | null
          sodium_mg?: number | null
          sugar_grams?: number | null
          updated_at?: string | null
        }
        Update: {
          calories?: number | null
          carbs_grams?: number | null
          cholesterol_mg?: number | null
          created_at?: string | null
          fat_grams?: number | null
          fiber_grams?: number | null
          id?: string
          is_estimated?: boolean | null
          notes?: string | null
          protein_grams?: number | null
          recipe_id?: string
          saturated_fat_grams?: number | null
          sodium_mg?: number | null
          sugar_grams?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_nutrition_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_nutrition_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string | null
          critical_point: boolean | null
          duration_minutes: number | null
          equipment: string | null
          id: string
          instruction: string
          photo_url: string | null
          recipe_id: string
          step_number: number
          technique: string | null
          temperature_celsius: number | null
          tips: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          critical_point?: boolean | null
          duration_minutes?: number | null
          equipment?: string | null
          id?: string
          instruction: string
          photo_url?: string | null
          recipe_id: string
          step_number: number
          technique?: string | null
          temperature_celsius?: number | null
          tips?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          critical_point?: boolean | null
          duration_minutes?: number | null
          equipment?: string | null
          id?: string
          instruction?: string
          photo_url?: string | null
          recipe_id?: string
          step_number?: number
          technique?: string | null
          temperature_celsius?: number | null
          tips?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_sub_recipes: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          parent_recipe_id: string
          quantity: number
          sort_order: number | null
          sub_recipe_id: string
          unit: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_recipe_id: string
          quantity?: number
          sort_order?: number | null
          sub_recipe_id: string
          unit?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          parent_recipe_id?: string
          quantity?: number
          sort_order?: number | null
          sub_recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_sub_recipes_parent_recipe_id_fkey"
            columns: ["parent_recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_sub_recipes_parent_recipe_id_fkey"
            columns: ["parent_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_sub_recipes_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_sub_recipes_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_versions: {
        Row: {
          changes_description: string | null
          created_at: string | null
          created_by: string | null
          id: string
          ingredients_snapshot: Json | null
          instructions_snapshot: string | null
          recipe_id: string | null
          version_number: number
        }
        Insert: {
          changes_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          ingredients_snapshot?: Json | null
          instructions_snapshot?: string | null
          recipe_id?: string | null
          version_number: number
        }
        Update: {
          changes_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          ingredients_snapshot?: Json | null
          instructions_snapshot?: string | null
          recipe_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["recipe_id"]
          },
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergen_ids: string[] | null
          category: string | null
          cost_per_portion: number | null
          created_at: string | null
          difficulty: string | null
          equipment_needed: string[] | null
          id: string
          instructions: string | null
          is_secret: boolean | null
          is_sub_recipe: boolean | null
          labor_cost_per_hour: number | null
          labor_time_minutes: number | null
          menu_item_id: string | null
          name: string
          overhead_percentage: number | null
          parent_recipe_ids: string[] | null
          photo_url: string | null
          plating_instructions: string | null
          portions: number | null
          preparation_time_minutes: number | null
          serving_size_grams: number | null
          shelf_life_hours: number | null
          storage_instructions: string | null
          tags: string[] | null
          tips: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
          waste_percentage: number | null
          yield_quantity: number | null
          yield_unit: string | null
          yield_weight_grams: number | null
        }
        Insert: {
          allergen_ids?: string[] | null
          category?: string | null
          cost_per_portion?: number | null
          created_at?: string | null
          difficulty?: string | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: string | null
          is_secret?: boolean | null
          is_sub_recipe?: boolean | null
          labor_cost_per_hour?: number | null
          labor_time_minutes?: number | null
          menu_item_id?: string | null
          name: string
          overhead_percentage?: number | null
          parent_recipe_ids?: string[] | null
          photo_url?: string | null
          plating_instructions?: string | null
          portions?: number | null
          preparation_time_minutes?: number | null
          serving_size_grams?: number | null
          shelf_life_hours?: number | null
          storage_instructions?: string | null
          tags?: string[] | null
          tips?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          waste_percentage?: number | null
          yield_quantity?: number | null
          yield_unit?: string | null
          yield_weight_grams?: number | null
        }
        Update: {
          allergen_ids?: string[] | null
          category?: string | null
          cost_per_portion?: number | null
          created_at?: string | null
          difficulty?: string | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: string | null
          is_secret?: boolean | null
          is_sub_recipe?: boolean | null
          labor_cost_per_hour?: number | null
          labor_time_minutes?: number | null
          menu_item_id?: string | null
          name?: string
          overhead_percentage?: number | null
          parent_recipe_ids?: string[] | null
          photo_url?: string | null
          plating_instructions?: string | null
          portions?: number | null
          preparation_time_minutes?: number | null
          serving_size_grams?: number | null
          shelf_life_hours?: number | null
          storage_instructions?: string | null
          tags?: string[] | null
          tips?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          waste_percentage?: number | null
          yield_quantity?: number | null
          yield_unit?: string | null
          yield_weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_brands: {
        Row: {
          accent_color: string | null
          brand_manual_url: string | null
          brand_name: string
          brand_values: Json | null
          brand_voice: string | null
          created_at: string | null
          differentiators: Json | null
          favicon_url: string | null
          font_primary: string | null
          font_secondary: string | null
          gallery_photos: Json | null
          id: string
          logo_dark_url: string | null
          logo_square_url: string | null
          logo_url: string | null
          logo_white_url: string | null
          mission: string | null
          primary_color: string | null
          secondary_color: string | null
          social_links: Json | null
          story: string | null
          tagline: string | null
          target_audience: string | null
          updated_at: string | null
          user_id: string
          vision: string | null
        }
        Insert: {
          accent_color?: string | null
          brand_manual_url?: string | null
          brand_name: string
          brand_values?: Json | null
          brand_voice?: string | null
          created_at?: string | null
          differentiators?: Json | null
          favicon_url?: string | null
          font_primary?: string | null
          font_secondary?: string | null
          gallery_photos?: Json | null
          id?: string
          logo_dark_url?: string | null
          logo_square_url?: string | null
          logo_url?: string | null
          logo_white_url?: string | null
          mission?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_links?: Json | null
          story?: string | null
          tagline?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
          vision?: string | null
        }
        Update: {
          accent_color?: string | null
          brand_manual_url?: string | null
          brand_name?: string
          brand_values?: Json | null
          brand_voice?: string | null
          created_at?: string | null
          differentiators?: Json | null
          favicon_url?: string | null
          font_primary?: string | null
          font_secondary?: string | null
          gallery_photos?: Json | null
          id?: string
          logo_dark_url?: string | null
          logo_square_url?: string | null
          logo_url?: string | null
          logo_white_url?: string | null
          mission?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_links?: Json | null
          story?: string | null
          tagline?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
          vision?: string | null
        }
        Relationships: []
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
          opening_date: string | null
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
          opening_date?: string | null
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
          opening_date?: string | null
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
          ai_recommendations: Json | null
          brand_id: string | null
          config: Json
          cover_image: string | null
          created_at: string
          cuisine_type: Database["public"]["Enums"]["cuisine_type"] | null
          description: string | null
          id: string
          last_viewed_at: string | null
          logo_url: string | null
          name: string
          public_url_slug: string | null
          status: Database["public"]["Enums"]["menu_status"]
          template_id: string | null
          theme_config: Json | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          ai_recommendations?: Json | null
          brand_id?: string | null
          config?: Json
          cover_image?: string | null
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          last_viewed_at?: string | null
          logo_url?: string | null
          name: string
          public_url_slug?: string | null
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          theme_config?: Json | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Update: {
          ai_recommendations?: Json | null
          brand_id?: string | null
          config?: Json
          cover_image?: string | null
          created_at?: string
          cuisine_type?: Database["public"]["Enums"]["cuisine_type"] | null
          description?: string | null
          id?: string
          last_viewed_at?: string | null
          logo_url?: string | null
          name?: string
          public_url_slug?: string | null
          status?: Database["public"]["Enums"]["menu_status"]
          template_id?: string | null
          theme_config?: Json | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menus_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "restaurant_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menus_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "menu_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_orders: {
        Row: {
          assigned_driver: string | null
          completed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_notes: string | null
          discount: number | null
          discount_amount: number | null
          discount_id: string | null
          driver_phone: string | null
          estimated_time_minutes: number | null
          guests_count: number | null
          id: string
          is_pos_order: boolean | null
          items: Json
          kitchen_notes: string | null
          kitchen_ready_at: string | null
          kitchen_started_at: string | null
          kitchen_status: string | null
          order_number: number
          order_type: string | null
          payment_method: string | null
          payment_status: string | null
          session_id: string | null
          source: string | null
          split_from_order_id: string | null
          status: string | null
          subtotal: number
          table_id: string | null
          tax: number | null
          tax_amount: number | null
          tip_amount: number | null
          tip_percent: number | null
          total: number
          updated_at: string | null
          user_id: string
          waiter_id: string | null
          waiter_name: string | null
        }
        Insert: {
          assigned_driver?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_notes?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_id?: string | null
          driver_phone?: string | null
          estimated_time_minutes?: number | null
          guests_count?: number | null
          id?: string
          is_pos_order?: boolean | null
          items?: Json
          kitchen_notes?: string | null
          kitchen_ready_at?: string | null
          kitchen_started_at?: string | null
          kitchen_status?: string | null
          order_number?: number
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          session_id?: string | null
          source?: string | null
          split_from_order_id?: string | null
          status?: string | null
          subtotal?: number
          table_id?: string | null
          tax?: number | null
          tax_amount?: number | null
          tip_amount?: number | null
          tip_percent?: number | null
          total?: number
          updated_at?: string | null
          user_id: string
          waiter_id?: string | null
          waiter_name?: string | null
        }
        Update: {
          assigned_driver?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_notes?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_id?: string | null
          driver_phone?: string | null
          estimated_time_minutes?: number | null
          guests_count?: number | null
          id?: string
          is_pos_order?: boolean | null
          items?: Json
          kitchen_notes?: string | null
          kitchen_ready_at?: string | null
          kitchen_started_at?: string | null
          kitchen_status?: string | null
          order_number?: number
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          session_id?: string | null
          source?: string | null
          split_from_order_id?: string | null
          status?: string | null
          subtotal?: number
          table_id?: string | null
          tax?: number | null
          tax_amount?: number | null
          tip_amount?: number | null
          tip_percent?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string
          waiter_id?: string | null
          waiter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_orders_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "pos_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_split_from_order_id_fkey"
            columns: ["split_from_order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string
          current_order_id: string | null
          id: string
          position_x: number | null
          position_y: number | null
          shape: string | null
          status: string
          table_number: string
          updated_at: string
          user_id: string
          waiter_id: string | null
          zone_id: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          shape?: string | null
          status?: string
          table_number: string
          updated_at?: string
          user_id?: string
          waiter_id?: string | null
          zone_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          id?: string
          position_x?: number | null
          position_y?: number | null
          shape?: string | null
          status?: string
          table_number?: string
          updated_at?: string
          user_id?: string
          waiter_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "restaurant_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_team_members: {
        Row: {
          business_id: string
          claimed_at: string | null
          created_at: string
          id: string
          invitation_sent_at: string | null
          invitation_token: string | null
          invited_email: string | null
          permissions: Json
          role: Database["public"]["Enums"]["team_member_role"]
          staff_member_id: string | null
          status: Database["public"]["Enums"]["team_member_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_email?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["team_member_role"]
          staff_member_id?: string | null
          status?: Database["public"]["Enums"]["team_member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          claimed_at?: string | null
          created_at?: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_email?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["team_member_role"]
          staff_member_id?: string | null
          status?: Database["public"]["Enums"]["team_member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurant_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_team_members_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_websites: {
        Row: {
          about_description: string | null
          about_image_url: string | null
          about_title: string | null
          announcement_bar_enabled: boolean | null
          announcement_bar_text: string | null
          business_hours: Json | null
          color_scheme: string | null
          created_at: string | null
          custom_scripts: string | null
          custom_sections: Json | null
          delivery_message: string | null
          delivery_min_order: number | null
          facebook_pixel_id: string | null
          favicon_url: string | null
          featured_items: Json | null
          footer_text: string | null
          gallery_images: Json | null
          google_analytics_id: string | null
          google_maps_embed_url: string | null
          gtm_id: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_style: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hero_video_url: string | null
          id: string
          instagram_feed_enabled: boolean | null
          instagram_handle: string | null
          is_published: boolean | null
          layout_variant: string | null
          meta_description: string | null
          newsletter_enabled: boolean | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          ordering_platforms: Json | null
          popup_content: string | null
          popup_cta_link: string | null
          popup_cta_text: string | null
          popup_enabled: boolean | null
          popup_image_url: string | null
          popup_title: string | null
          promo_banner_bg_color: string | null
          promo_banner_enabled: boolean | null
          promo_banner_link: string | null
          promo_banner_text: string | null
          reservation_advance_days: number | null
          reservation_available_times: Json | null
          reservation_max_party_size: number | null
          reservation_platforms: Json | null
          reservation_slot_duration: number | null
          schema_type: string | null
          show_about: boolean | null
          show_contact: boolean | null
          show_delivery: boolean | null
          show_feedback: boolean
          show_gallery: boolean | null
          show_loyalty: boolean | null
          show_menu: boolean | null
          show_powered_by: boolean | null
          show_reservations: boolean | null
          show_reviews: boolean | null
          site_title: string | null
          slug: string
          template_id: string | null
          testimonials: Json | null
          theme_overrides: Json | null
          tiktok_pixel_id: string | null
          updated_at: string | null
          user_id: string
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          about_description?: string | null
          about_image_url?: string | null
          about_title?: string | null
          announcement_bar_enabled?: boolean | null
          announcement_bar_text?: string | null
          business_hours?: Json | null
          color_scheme?: string | null
          created_at?: string | null
          custom_scripts?: string | null
          custom_sections?: Json | null
          delivery_message?: string | null
          delivery_min_order?: number | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          featured_items?: Json | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_maps_embed_url?: string | null
          gtm_id?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_style?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: string
          instagram_feed_enabled?: boolean | null
          instagram_handle?: string | null
          is_published?: boolean | null
          layout_variant?: string | null
          meta_description?: string | null
          newsletter_enabled?: boolean | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordering_platforms?: Json | null
          popup_content?: string | null
          popup_cta_link?: string | null
          popup_cta_text?: string | null
          popup_enabled?: boolean | null
          popup_image_url?: string | null
          popup_title?: string | null
          promo_banner_bg_color?: string | null
          promo_banner_enabled?: boolean | null
          promo_banner_link?: string | null
          promo_banner_text?: string | null
          reservation_advance_days?: number | null
          reservation_available_times?: Json | null
          reservation_max_party_size?: number | null
          reservation_platforms?: Json | null
          reservation_slot_duration?: number | null
          schema_type?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
          show_delivery?: boolean | null
          show_feedback?: boolean
          show_gallery?: boolean | null
          show_loyalty?: boolean | null
          show_menu?: boolean | null
          show_powered_by?: boolean | null
          show_reservations?: boolean | null
          show_reviews?: boolean | null
          site_title?: string | null
          slug: string
          template_id?: string | null
          testimonials?: Json | null
          theme_overrides?: Json | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          about_description?: string | null
          about_image_url?: string | null
          about_title?: string | null
          announcement_bar_enabled?: boolean | null
          announcement_bar_text?: string | null
          business_hours?: Json | null
          color_scheme?: string | null
          created_at?: string | null
          custom_scripts?: string | null
          custom_sections?: Json | null
          delivery_message?: string | null
          delivery_min_order?: number | null
          facebook_pixel_id?: string | null
          favicon_url?: string | null
          featured_items?: Json | null
          footer_text?: string | null
          gallery_images?: Json | null
          google_analytics_id?: string | null
          google_maps_embed_url?: string | null
          gtm_id?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_style?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: string
          instagram_feed_enabled?: boolean | null
          instagram_handle?: string | null
          is_published?: boolean | null
          layout_variant?: string | null
          meta_description?: string | null
          newsletter_enabled?: boolean | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          ordering_platforms?: Json | null
          popup_content?: string | null
          popup_cta_link?: string | null
          popup_cta_text?: string | null
          popup_enabled?: boolean | null
          popup_image_url?: string | null
          popup_title?: string | null
          promo_banner_bg_color?: string | null
          promo_banner_enabled?: boolean | null
          promo_banner_link?: string | null
          promo_banner_text?: string | null
          reservation_advance_days?: number | null
          reservation_available_times?: Json | null
          reservation_max_party_size?: number | null
          reservation_platforms?: Json | null
          reservation_slot_duration?: number | null
          schema_type?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
          show_delivery?: boolean | null
          show_feedback?: boolean
          show_gallery?: boolean | null
          show_loyalty?: boolean | null
          show_menu?: boolean | null
          show_powered_by?: boolean | null
          show_reservations?: boolean | null
          show_reviews?: boolean | null
          site_title?: string | null
          slug?: string
          template_id?: string | null
          testimonials?: Json | null
          theme_overrides?: Json | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_websites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "website_templates"
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
          user_id?: string
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
      sales_goals: {
        Row: {
          avg_ticket_goal: number | null
          category_goals: Json | null
          covers_goal: number | null
          created_at: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          period_type: string | null
          revenue_goal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_ticket_goal?: number | null
          category_goals?: Json | null
          covers_goal?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          period_type?: string | null
          revenue_goal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          avg_ticket_goal?: number | null
          category_goals?: Json | null
          covers_goal?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string | null
          revenue_goal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales_projections: {
        Row: {
          ai_reasoning: string | null
          confidence_level: number | null
          created_at: string | null
          factors: Json | null
          id: string
          projected_covers: number | null
          projected_revenue: number | null
          projection_date: string
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          projected_covers?: number | null
          projected_revenue?: number | null
          projection_date: string
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          id?: string
          projected_covers?: number | null
          projected_revenue?: number | null
          projection_date?: string
          user_id?: string
        }
        Relationships: []
      }
      sentiment_reports: {
        Row: {
          ai_summary: string | null
          avg_sentiment: number | null
          created_at: string | null
          id: string
          negative_count: number | null
          neutral_count: number | null
          positive_count: number | null
          report_date: string
          total_mentions: number | null
          trending_topics: Json | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          avg_sentiment?: number | null
          created_at?: string | null
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          report_date: string
          total_mentions?: number | null
          trending_topics?: Json | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          avg_sentiment?: number | null
          created_at?: string | null
          id?: string
          negative_count?: number | null
          neutral_count?: number | null
          positive_count?: number | null
          report_date?: string
          total_mentions?: number | null
          trending_topics?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          notes: string | null
          proposal_id: string | null
          provider_id: string
          request_id: string | null
          review_id: string | null
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
          proposal_id?: string | null
          provider_id: string
          request_id?: string | null
          review_id?: string | null
          service_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          proposal_id?: string | null
          provider_id?: string
          request_id?: string | null
          review_id?: string | null
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
            foreignKeyName: "service_bookings_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "service_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "provider_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      service_proposals: {
        Row: {
          attachments: string[] | null
          created_at: string
          estimated_delivery_days: number | null
          id: string
          message: string
          price: number | null
          provider_id: string
          request_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          estimated_delivery_days?: number | null
          id?: string
          message: string
          price?: number | null
          provider_id: string
          request_id: string
          status?: string | null
          user_id?: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          estimated_delivery_days?: number | null
          id?: string
          message?: string
          price?: number | null
          provider_id?: string
          request_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_proposals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          average_rating: number | null
          category: Database["public"]["Enums"]["service_category"]
          certifications: string[] | null
          city: string
          completed_projects: number | null
          contact_email: string | null
          contact_phone: string | null
          country: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          headline: string | null
          id: string
          is_active: boolean
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_id: string | null
          portfolio_images: string[] | null
          price_max: number | null
          price_min: number | null
          rating: number | null
          response_time_hours: number | null
          reviews_count: number
          service_areas: string[] | null
          services_offered: string[] | null
          social_links: Json | null
          specialty: string | null
          state: string | null
          tags: string[] | null
          team_size: string | null
          updated_at: string
          website_url: string | null
          years_in_business: number | null
        }
        Insert: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          certifications?: string[] | null
          city: string
          completed_projects?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          portfolio_images?: string[] | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          response_time_hours?: number | null
          reviews_count?: number
          service_areas?: string[] | null
          services_offered?: string[] | null
          social_links?: Json | null
          specialty?: string | null
          state?: string | null
          tags?: string[] | null
          team_size?: string | null
          updated_at?: string
          website_url?: string | null
          years_in_business?: number | null
        }
        Update: {
          average_rating?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          certifications?: string[] | null
          city?: string
          completed_projects?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          portfolio_images?: string[] | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          response_time_hours?: number | null
          reviews_count?: number
          service_areas?: string[] | null
          services_offered?: string[] | null
          social_links?: Json | null
          specialty?: string | null
          state?: string | null
          tags?: string[] | null
          team_size?: string | null
          updated_at?: string
          website_url?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          attachments: string[] | null
          budget_max: number | null
          budget_min: number | null
          category: Database["public"]["Enums"]["service_category"] | null
          city: string | null
          country: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          proposals_count: number | null
          requirements: string[] | null
          selected_proposal_id: string | null
          status: string | null
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["service_category"] | null
          city?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          proposals_count?: number | null
          requirements?: string[] | null
          selected_proposal_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Update: {
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["service_category"] | null
          city?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          proposals_count?: number | null
          requirements?: string[] | null
          selected_proposal_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shift_swap_requests: {
        Row: {
          created_at: string
          id: string
          original_shift_id: string
          reason: string | null
          requesting_staff_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          swap_type: string
          target_shift_id: string | null
          target_staff_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_shift_id: string
          reason?: string | null
          requesting_staff_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          swap_type?: string
          target_shift_id?: string | null
          target_staff_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_shift_id?: string
          reason?: string | null
          requesting_staff_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          swap_type?: string
          target_shift_id?: string | null
          target_staff_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_original_shift_id_fkey"
            columns: ["original_shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requesting_staff_id_fkey"
            columns: ["requesting_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_shift_id_fkey"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "staff_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_staff_id_fkey"
            columns: ["target_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          break_minutes: number
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_active: boolean
          position: string | null
          start_time: string
          template_name: string
          user_id: string
        }
        Insert: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          position?: string | null
          start_time: string
          template_name: string
          user_id: string
        }
        Update: {
          break_minutes?: number
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          position?: string | null
          start_time?: string
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_name: string | null
          account_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_name?: string | null
          account_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_name?: string | null
          account_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      social_mentions: {
        Row: {
          author_name: string | null
          author_url: string | null
          content: string | null
          created_at: string | null
          engagement_comments: number | null
          engagement_likes: number | null
          engagement_shares: number | null
          external_id: string | null
          fetched_at: string | null
          id: string
          key_topics: Json | null
          platform: string
          published_at: string | null
          rating: number | null
          responded: boolean | null
          response_text: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          author_name?: string | null
          author_url?: string | null
          content?: string | null
          created_at?: string | null
          engagement_comments?: number | null
          engagement_likes?: number | null
          engagement_shares?: number | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          key_topics?: Json | null
          platform: string
          published_at?: string | null
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          author_name?: string | null
          author_url?: string | null
          content?: string | null
          created_at?: string | null
          engagement_comments?: number | null
          engagement_likes?: number | null
          engagement_shares?: number | null
          external_id?: string | null
          fetched_at?: string | null
          id?: string
          key_topics?: Json | null
          platform?: string
          published_at?: string | null
          rating?: number | null
          responded?: boolean | null
          response_text?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_until: string | null
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          staff_member_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_until?: string | null
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          staff_member_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_until?: string | null
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          staff_member_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_benefit_assignments: {
        Row: {
          benefit_id: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          staff_member_id: string
          start_date: string
          status: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          benefit_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          staff_member_id: string
          start_date?: string
          status?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          benefit_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          staff_member_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_benefit_assignments_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "staff_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_benefit_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_benefits: {
        Row: {
          applicable_positions: string[] | null
          benefit_name: string
          benefit_type: string
          created_at: string
          description: string | null
          eligibility_months: number | null
          id: string
          is_active: boolean
          user_id: string
          value: number | null
          value_type: string
        }
        Insert: {
          applicable_positions?: string[] | null
          benefit_name: string
          benefit_type?: string
          created_at?: string
          description?: string | null
          eligibility_months?: number | null
          id?: string
          is_active?: boolean
          user_id?: string
          value?: number | null
          value_type?: string
        }
        Update: {
          applicable_positions?: string[] | null
          benefit_name?: string
          benefit_type?: string
          created_at?: string
          description?: string | null
          eligibility_months?: number | null
          id?: string
          is_active?: boolean
          user_id?: string
          value?: number | null
          value_type?: string
        }
        Relationships: []
      }
      staff_certifications: {
        Row: {
          certification_name: string
          certification_type: string | null
          created_at: string
          document_url: string | null
          expiration_date: string | null
          id: string
          issued_date: string | null
          issuing_authority: string | null
          notes: string | null
          staff_member_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certification_name: string
          certification_type?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          staff_member_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certification_name?: string
          certification_type?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          staff_member_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          linked_user_id: string | null
          max_hours_per_week: number | null
          name: string
          performance_score: number | null
          phone: string | null
          position: string
          preferred_shifts: string[] | null
          skills: string[] | null
          training_progress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          linked_user_id?: string | null
          max_hours_per_week?: number | null
          name: string
          performance_score?: number | null
          phone?: string | null
          position: string
          preferred_shifts?: string[] | null
          skills?: string[] | null
          training_progress?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          linked_user_id?: string | null
          max_hours_per_week?: number | null
          name?: string
          performance_score?: number | null
          phone?: string | null
          position?: string
          preferred_shifts?: string[] | null
          skills?: string[] | null
          training_progress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          break_minutes: number | null
          color: string | null
          created_at: string | null
          department: string | null
          end_time: string
          hourly_rate_override: number | null
          id: string
          is_published: boolean | null
          notes: string | null
          published_at: string | null
          shift_date: string
          staff_member_id: string | null
          start_time: string
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          color?: string | null
          created_at?: string | null
          department?: string | null
          end_time: string
          hourly_rate_override?: number | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          published_at?: string | null
          shift_date: string
          staff_member_id?: string | null
          start_time: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          color?: string | null
          created_at?: string | null
          department?: string | null
          end_time?: string
          hourly_rate_override?: number | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          published_at?: string | null
          shift_date?: string
          staff_member_id?: string | null
          start_time?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          modules_completed: Json | null
          notes: string | null
          progress_percent: number
          score: number | null
          staff_member_id: string
          started_at: string | null
          status: string
          training_program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          modules_completed?: Json | null
          notes?: string | null
          progress_percent?: number
          score?: number | null
          staff_member_id: string
          started_at?: string | null
          status?: string
          training_program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          modules_completed?: Json | null
          notes?: string | null
          progress_percent?: number
          score?: number | null
          staff_member_id?: string
          started_at?: string | null
          status?: string
          training_program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_progress_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_progress_training_program_id_fkey"
            columns: ["training_program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location_name: string
          location_type: string | null
          sort_order: number | null
          temperature_range: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_name: string
          location_type?: string | null
          sort_order?: number | null
          temperature_range?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location_name?: string
          location_type?: string | null
          sort_order?: number | null
          temperature_range?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplier_analysis: {
        Row: {
          alternatives: Json | null
          analysis_date: string | null
          city: string
          country: string | null
          created_at: string | null
          current_cost: number | null
          current_supplier: string | null
          error_message: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          market_insights: string | null
          potential_savings: number | null
          recommendations: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternatives?: Json | null
          analysis_date?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          current_cost?: number | null
          current_supplier?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          market_insights?: string | null
          potential_savings?: number | null
          recommendations?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternatives?: Json | null
          analysis_date?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          current_cost?: number | null
          current_supplier?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          market_insights?: string | null
          potential_savings?: number | null
          recommendations?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_analysis_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_below_par"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_analysis_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_expiring_soon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_analysis_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          ai_confidence: number | null
          ai_model: string | null
          business_id: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          image_url: string | null
          invoice_date: string | null
          invoice_number: string | null
          items: Json | null
          notes: string | null
          raw_text: string | null
          status: string
          storage_path: string | null
          subtotal: number | null
          supplier_id: string | null
          supplier_name: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_model?: string | null
          business_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          raw_text?: string | null
          status?: string
          storage_path?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_model?: string | null
          business_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          raw_text?: string | null
          status?: string
          storage_path?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          lead_time_days: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string | null
          category?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_templates: {
        Row: {
          body_template: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject_template: string | null
          user_id: string
        }
        Insert: {
          body_template?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject_template?: string | null
          user_id: string
        }
        Update: {
          body_template?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          ai_category: string | null
          ai_priority_suggestion: string | null
          ai_response_draft: string | null
          assigned_to: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string
          first_response_at: string | null
          id: string
          order_id: string | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string | null
          subject: string
          ticket_number: number
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_priority_suggestion?: string | null
          ai_response_draft?: string | null
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject: string
          ticket_number?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          ai_category?: string | null
          ai_priority_suggestion?: string | null
          ai_response_draft?: string | null
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string
          ticket_number?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
        ]
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
      table_reservations: {
        Row: {
          confirmation_code: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          loyalty_customer_id: string | null
          notes: string | null
          party_size: number
          reminder_sent: boolean | null
          reservation_date: string
          reservation_time: string
          source: string | null
          special_requests: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmation_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          loyalty_customer_id?: string | null
          notes?: string | null
          party_size: number
          reminder_sent?: boolean | null
          reservation_date: string
          reservation_time: string
          source?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmation_code?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          loyalty_customer_id?: string | null
          notes?: string | null
          party_size?: number
          reminder_sent?: boolean | null
          reservation_date?: string
          reservation_time?: string
          source?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_reservations_loyalty_customer_id_fkey"
            columns: ["loyalty_customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      team_permissions_history: {
        Row: {
          business_id: string | null
          changed_by: string | null
          created_at: string
          id: string
          new_permissions: Json | null
          new_role: string | null
          new_status: string | null
          old_permissions: Json | null
          old_role: string | null
          old_status: string | null
          team_member_id: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_permissions?: Json | null
          new_role?: string | null
          new_status?: string | null
          old_permissions?: Json | null
          old_role?: string | null
          old_status?: string | null
          team_member_id: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_permissions?: Json | null
          new_role?: string | null
          new_status?: string | null
          old_permissions?: Json | null
          old_role?: string | null
          old_status?: string | null
          team_member_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_permissions_history_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "restaurant_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          message: string
          sender_type: string
          ticket_id: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message: string
          sender_type?: string
          ticket_id?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          sender_type?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          created_at: string
          end_date: string
          end_time: string | null
          id: string
          is_full_day: boolean
          reason: string | null
          request_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_member_id: string
          start_date: string
          start_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean
          reason?: string | null
          request_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_member_id: string
          start_date: string
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string | null
          id?: string
          is_full_day?: boolean
          reason?: string | null
          request_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_member_id?: string
          start_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          ai_generated_content: boolean
          average_rating: number | null
          category: Database["public"]["Enums"]["job_category"]
          completion_certificate: boolean
          created_at: string
          description: string
          duration_hours: number | null
          enrollments_count: number
          id: string
          instructor_bio: string | null
          instructor_id: string | null
          instructor_name: string | null
          instructor_photo_url: string | null
          is_free: boolean
          is_published: boolean
          lessons_count: number
          level: Database["public"]["Enums"]["experience_level"]
          price: number
          requirements: string[] | null
          short_description: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_duration_minutes: number
          updated_at: string
          video_url: string | null
          what_you_learn: string[] | null
        }
        Insert: {
          ai_generated_content?: boolean
          average_rating?: number | null
          category?: Database["public"]["Enums"]["job_category"]
          completion_certificate?: boolean
          created_at?: string
          description: string
          duration_hours?: number | null
          enrollments_count?: number
          id?: string
          instructor_bio?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          is_free?: boolean
          is_published?: boolean
          lessons_count?: number
          level?: Database["public"]["Enums"]["experience_level"]
          price?: number
          requirements?: string[] | null
          short_description?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_duration_minutes?: number
          updated_at?: string
          video_url?: string | null
          what_you_learn?: string[] | null
        }
        Update: {
          ai_generated_content?: boolean
          average_rating?: number | null
          category?: Database["public"]["Enums"]["job_category"]
          completion_certificate?: boolean
          created_at?: string
          description?: string
          duration_hours?: number | null
          enrollments_count?: number
          id?: string
          instructor_bio?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          is_free?: boolean
          is_published?: boolean
          lessons_count?: number
          level?: Database["public"]["Enums"]["experience_level"]
          price?: number
          requirements?: string[] | null
          short_description?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_duration_minutes?: number
          updated_at?: string
          video_url?: string | null
          what_you_learn?: string[] | null
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          category: string
          content: Json | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          passing_score: number | null
          position: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: Json | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          passing_score?: number | null
          position?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: Json | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          passing_score?: number | null
          position?: string | null
          title?: string
          user_id?: string
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
      website_templates: {
        Row: {
          created_at: string | null
          default_config: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          layout_type: string
          name: string
          preview_image: string | null
        }
        Insert: {
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_type?: string
          name: string
          preview_image?: string | null
        }
        Update: {
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_type?: string
          name?: string
          preview_image?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      inventory_below_par: {
        Row: {
          current_stock: number | null
          estimated_order_cost: number | null
          id: string | null
          item_name: string | null
          lead_time_days: number | null
          par_level: number | null
          preferred_supplier: string | null
          quantity_to_order: number | null
          reorder_point: number | null
          unit: string | null
          unit_cost: number | null
          user_id: string | null
        }
        Relationships: []
      }
      inventory_expiring_soon: {
        Row: {
          current_stock: number | null
          days_until_expiry: number | null
          expiration_date: string | null
          expiration_status: string | null
          id: string | null
          item_name: string | null
          lot_number: string | null
          storage_location: string | null
          unit: string | null
          user_id: string | null
        }
        Relationships: []
      }
      menu_items_with_costs: {
        Row: {
          allergens: string[] | null
          bcg_category: string | null
          category: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string | null
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          margin_percent: number | null
          menu_id: string | null
          name: string | null
          popularity_score: number | null
          price: number | null
          profitability_score: number | null
          recipe_cost: number | null
          recipe_id: string | null
          recipe_name: string | null
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
      unified_orders_view: {
        Row: {
          brand_id: string | null
          channel: string | null
          commission: number | null
          completed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_fee: number | null
          discount: number | null
          external_order_id: string | null
          gross_total: number | null
          id: string | null
          items: Json | null
          net_total: number | null
          order_type: string | null
          payment_status: string | null
          session_id: string | null
          source: string | null
          status: string | null
          subtotal: number | null
          table_id: string | null
          tax: number | null
          tip_amount: number | null
          updated_at: string | null
          user_id: string | null
          waiter_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_menu_item_scores: {
        Args: { p_days?: number; p_user_id: string }
        Returns: undefined
      }
      claim_consultant_client: {
        Args: { p_invitation_token: string }
        Returns: Json
      }
      claim_team_invitation: { Args: { p_token: string }; Returns: Json }
      generate_menu_slug: { Args: { menu_name: string }; Returns: string }
      generate_redemption_code: { Args: never; Returns: string }
      get_aggregated_daily_sales: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          avg_ticket: number
          covers_count: number
          food_cost: number
          labor_cost: number
          order_count: number
          total_revenue: number
        }[]
      }
      get_customer_profile: {
        Args: { p_email: string; p_user_id: string }
        Returns: {
          avg_rating: number
          avg_ticket: number
          customer_email: string
          customer_name: string
          customer_phone: string
          feedback_count: number
          last_visit: string
          loyalty_points: number
          loyalty_tier: string
          total_orders: number
          total_reservations: number
          total_spent: number
        }[]
      }
      get_default_permissions_for_role: {
        Args: { p_role: Database["public"]["Enums"]["team_member_role"] }
        Returns: Json
      }
      get_platform_stats: { Args: never; Returns: Json }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      has_module_access: {
        Args: {
          _business_id: string
          _level?: string
          _module: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: {
          _business_id: string
          _role: Database["public"]["Enums"]["team_member_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_responses: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      increment_job_views: { Args: { job_id: string }; Returns: undefined }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_consultant_of: {
        Args: { _client_user: string; _consultant_user: string }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_lead: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      log_consultant_impersonation_end: {
        Args: { p_log_id: string }
        Returns: undefined
      }
      log_consultant_impersonation_start: {
        Args: {
          p_client_business_id: string
          p_client_user_id: string
          p_user_agent?: string
        }
        Returns: string
      }
      match_knowledge: {
        Args: {
          match_count?: number
          match_user_id: string
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          similarity: number
          source_id: string
          source_title: string
          source_type: string
        }[]
      }
      seed_platform_admin: { Args: { p_email: string }; Returns: Json }
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
        | "marketing"
        | "finance"
        | "administration"
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
        | "equipment"
        | "technology"
        | "food_supplies"
        | "consulting"
        | "design"
      team_member_role:
        | "owner"
        | "admin"
        | "manager"
        | "cashier"
        | "kitchen"
        | "staff"
      team_member_status: "invited" | "active" | "suspended" | "removed"
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
        "marketing",
        "finance",
        "administration",
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
        "equipment",
        "technology",
        "food_supplies",
        "consulting",
        "design",
      ],
      team_member_role: [
        "owner",
        "admin",
        "manager",
        "cashier",
        "kitchen",
        "staff",
      ],
      team_member_status: ["invited", "active", "suspended", "removed"],
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
