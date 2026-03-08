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
      age_verifications: {
        Row: {
          created_at: string
          date_of_birth: string
          id: string
          jurisdiction: string | null
          min_age_required: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          id?: string
          jurisdiction?: string | null
          min_age_required?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          id?: string
          jurisdiction?: string | null
          min_age_required?: number
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          streamer_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          streamer_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          streamer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget: number | null
          casino_program_id: string | null
          created_at: string
          created_by: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          description: string | null
          duration: string | null
          id: string
          min_avg_viewers: number | null
          min_followers: number | null
          organization_id: string
          requirements: string | null
          restricted_countries: string[]
          status: Database["public"]["Enums"]["campaign_status"]
          target_geo: string[]
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          casino_program_id?: string | null
          created_at?: string
          created_by: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          duration?: string | null
          id?: string
          min_avg_viewers?: number | null
          min_followers?: number | null
          organization_id: string
          requirements?: string | null
          restricted_countries?: string[]
          status?: Database["public"]["Enums"]["campaign_status"]
          target_geo?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          casino_program_id?: string | null
          created_at?: string
          created_by?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          description?: string | null
          duration?: string | null
          id?: string
          min_avg_viewers?: number | null
          min_followers?: number | null
          organization_id?: string
          requirements?: string | null
          restricted_countries?: string[]
          status?: Database["public"]["Enums"]["campaign_status"]
          target_geo?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_casino_program_id_fkey"
            columns: ["casino_program_id"]
            isOneToOne: false
            referencedRelation: "casino_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      casino_programs: {
        Row: {
          accepted_countries: string[]
          affiliate_terms: Database["public"]["Enums"]["deal_type"]
          brand_name: string
          created_at: string
          id: string
          license_jurisdiction: string | null
          logo_url: string | null
          marketing_guidelines: string | null
          organization_id: string
          payment_terms: string | null
          restricted_territories: string[]
          updated_at: string
          verified: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          accepted_countries?: string[]
          affiliate_terms?: Database["public"]["Enums"]["deal_type"]
          brand_name: string
          created_at?: string
          id?: string
          license_jurisdiction?: string | null
          logo_url?: string | null
          marketing_guidelines?: string | null
          organization_id: string
          payment_terms?: string | null
          restricted_territories?: string[]
          updated_at?: string
          verified?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          accepted_countries?: string[]
          affiliate_terms?: Database["public"]["Enums"]["deal_type"]
          brand_name?: string
          created_at?: string
          id?: string
          license_jurisdiction?: string | null
          logo_url?: string | null
          marketing_guidelines?: string | null
          organization_id?: string
          payment_terms?: string | null
          restricted_territories?: string[]
          updated_at?: string
          verified?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "casino_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          applies_to: Database["public"]["Enums"]["conversion_event_type"][]
          cpa_amount: number | null
          created_at: string
          deal_id: string
          id: string
          min_deposit: number | null
          revshare_pct: number | null
          rule_type: Database["public"]["Enums"]["deal_type"]
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["conversion_event_type"][]
          cpa_amount?: number | null
          created_at?: string
          deal_id: string
          id?: string
          min_deposit?: number | null
          revshare_pct?: number | null
          rule_type: Database["public"]["Enums"]["deal_type"]
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["conversion_event_type"][]
          cpa_amount?: number | null
          created_at?: string
          deal_id?: string
          id?: string
          min_deposit?: number | null
          revshare_pct?: number | null
          rule_type?: Database["public"]["Enums"]["deal_type"]
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          conversion_event_id: string | null
          created_at: string
          currency: string | null
          deal_id: string
          id: string
          period_end: string | null
          period_start: string | null
          platform_fee: number
          status: Database["public"]["Enums"]["commission_status"]
          streamer_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          conversion_event_id?: string | null
          created_at?: string
          currency?: string | null
          deal_id: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          status?: Database["public"]["Enums"]["commission_status"]
          streamer_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          conversion_event_id?: string | null
          created_at?: string
          currency?: string | null
          deal_id?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          status?: Database["public"]["Enums"]["commission_status"]
          streamer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_conversion_event_id_fkey"
            columns: ["conversion_event_id"]
            isOneToOne: false
            referencedRelation: "conversion_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_events: {
        Row: {
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          pdf_url: string | null
          signed_at: string | null
          signer_casino_id: string | null
          signer_streamer_id: string | null
          status: Database["public"]["Enums"]["contract_status"]
          terms_json: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          signer_casino_id?: string | null
          signer_streamer_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_json?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          signer_casino_id?: string | null
          signer_streamer_id?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms_json?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          deal_id: string
          event_date: string
          event_type: Database["public"]["Enums"]["conversion_event_type"]
          id: string
          metadata: Json | null
          player_id: string | null
          report_upload_id: string | null
          tracking_link_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          deal_id: string
          event_date: string
          event_type: Database["public"]["Enums"]["conversion_event_type"]
          id?: string
          metadata?: Json | null
          player_id?: string | null
          report_upload_id?: string | null
          tracking_link_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          deal_id?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["conversion_event_type"]
          id?: string
          metadata?: Json | null
          player_id?: string | null
          report_upload_id?: string | null
          tracking_link_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_report_upload_id_fkey"
            columns: ["report_upload_id"]
            isOneToOne: false
            referencedRelation: "report_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_tracking_link_id_fkey"
            columns: ["tracking_link_id"]
            isOneToOne: false
            referencedRelation: "tracking_links"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_messages: {
        Row: {
          content: string
          created_at: string
          deal_id: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deal_id: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_state_log: {
        Row: {
          changed_by: string
          created_at: string
          deal_id: string
          from_state: string | null
          id: string
          reason: string | null
          to_state: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          deal_id: string
          from_state?: string | null
          id?: string
          reason?: string | null
          to_state: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          deal_id?: string
          from_state?: string | null
          id?: string
          reason?: string | null
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_state_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_state_transitions: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][]
          from_state: string
          id: string
          to_state: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          from_state: string
          id?: string
          to_state: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          from_state?: string
          id?: string
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_state_transitions_from_state_fkey"
            columns: ["from_state"]
            isOneToOne: false
            referencedRelation: "deal_states"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "deal_state_transitions_to_state_fkey"
            columns: ["to_state"]
            isOneToOne: false
            referencedRelation: "deal_states"
            referencedColumns: ["name"]
          },
        ]
      }
      deal_states: {
        Row: {
          description: string | null
          id: string
          is_terminal: boolean
          name: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          is_terminal?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          is_terminal?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          application_id: string | null
          campaign_id: string | null
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          end_date: string | null
          id: string
          organization_id: string
          platform_fee_pct: number
          start_date: string | null
          state: string
          streamer_id: string
          updated_at: string
          value: number
        }
        Insert: {
          application_id?: string | null
          campaign_id?: string | null
          created_at?: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          end_date?: string | null
          id?: string
          organization_id: string
          platform_fee_pct?: number
          start_date?: string | null
          state?: string
          streamer_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          application_id?: string | null
          campaign_id?: string | null
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          end_date?: string | null
          id?: string
          organization_id?: string
          platform_fee_pct?: number
          start_date?: string | null
          state?: string
          streamer_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_state_fkey"
            columns: ["state"]
            isOneToOne: false
            referencedRelation: "deal_states"
            referencedColumns: ["name"]
          },
        ]
      }
      disclaimer_acceptances: {
        Row: {
          created_at: string
          disclaimer_type: string
          disclaimer_version: string
          id: string
          ip_address: unknown
          user_id: string
        }
        Insert: {
          created_at?: string
          disclaimer_type: string
          disclaimer_version?: string
          id?: string
          ip_address?: unknown
          user_id: string
        }
        Update: {
          created_at?: string
          disclaimer_type?: string
          disclaimer_version?: string
          id?: string
          ip_address?: unknown
          user_id?: string
        }
        Relationships: []
      }
      geo_restrictions: {
        Row: {
          blocked_country: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_country: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_country?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payout_batches: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
        }
        Relationships: []
      }
      payout_items: {
        Row: {
          amount: number
          batch_id: string
          commission_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["payout_status"]
          streamer_id: string
        }
        Insert: {
          amount: number
          batch_id: string
          commission_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          streamer_id: string
        }
        Update: {
          amount?: number
          batch_id?: string
          commission_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          streamer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          kyc_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          kyc_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          kyc_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_url: string | null
          id: string
          organization_id: string
          row_count: number | null
          status: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          organization_id: string
          row_count?: number | null
          status?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          organization_id?: string
          row_count?: number | null
          status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_listings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          min_streams: number | null
          package_details: string | null
          platforms: string[]
          price_amount: number | null
          price_currency: string
          pricing_type: Database["public"]["Enums"]["listing_pricing_type"]
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          min_streams?: number | null
          package_details?: string | null
          platforms?: string[]
          price_amount?: number | null
          price_currency?: string
          pricing_type?: Database["public"]["Enums"]["listing_pricing_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          min_streams?: number | null
          package_details?: string | null
          platforms?: string[]
          price_amount?: number | null
          price_currency?: string
          pricing_type?: Database["public"]["Enums"]["listing_pricing_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streamer_profiles: {
        Row: {
          audience_geo: string[]
          avg_live_viewers: number
          bio: string | null
          created_at: string
          discord_url: string | null
          engagement_rate: number
          follower_count: number
          id: string
          instagram_url: string | null
          kick_url: string | null
          monthly_impressions: number
          niche_type: string | null
          past_deals: number
          payment_preference: string | null
          platforms: string[]
          preferred_crypto: string | null
          restricted_countries: string[]
          tiktok_url: string | null
          twitch_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          verified: Database["public"]["Enums"]["verification_status"]
          wallet_address: string | null
          youtube_url: string | null
        }
        Insert: {
          audience_geo?: string[]
          avg_live_viewers?: number
          bio?: string | null
          created_at?: string
          discord_url?: string | null
          engagement_rate?: number
          follower_count?: number
          id?: string
          instagram_url?: string | null
          kick_url?: string | null
          monthly_impressions?: number
          niche_type?: string | null
          past_deals?: number
          payment_preference?: string | null
          platforms?: string[]
          preferred_crypto?: string | null
          restricted_countries?: string[]
          tiktok_url?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          verified?: Database["public"]["Enums"]["verification_status"]
          wallet_address?: string | null
          youtube_url?: string | null
        }
        Update: {
          audience_geo?: string[]
          avg_live_viewers?: number
          bio?: string | null
          created_at?: string
          discord_url?: string | null
          engagement_rate?: number
          follower_count?: number
          id?: string
          instagram_url?: string | null
          kick_url?: string | null
          monthly_impressions?: number
          niche_type?: string | null
          past_deals?: number
          payment_preference?: string | null
          platforms?: string[]
          preferred_crypto?: string | null
          restricted_countries?: string[]
          tiktok_url?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          verified?: Database["public"]["Enums"]["verification_status"]
          wallet_address?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      tracking_links: {
        Row: {
          clicks: number
          code: string
          created_at: string
          deal_id: string
          id: string
          url: string
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          deal_id: string
          id?: string
          url: string
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          deal_id?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      verification_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          organization_id: string
          secret: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          organization_id: string
          secret?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          organization_id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_compliance: { Args: { _user_id: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: string
      }
      log_compliance_event: {
        Args: {
          _details?: Json
          _entity_id?: string
          _entity_type?: string
          _event_type: string
          _severity?: string
        }
        Returns: string
      }
      setup_new_user: {
        Args: {
          _display_name: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      validate_deal_transition: {
        Args: { _deal_id: string; _to_state: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "casino_manager" | "streamer" | "admin"
      application_status:
        | "pending"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "withdrawn"
      campaign_status:
        | "draft"
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
      commission_status:
        | "pending"
        | "approved"
        | "paid"
        | "disputed"
        | "cancelled"
      contract_status:
        | "draft"
        | "pending_signature"
        | "signed"
        | "expired"
        | "cancelled"
      conversion_event_type:
        | "click"
        | "signup"
        | "ftd"
        | "deposit"
        | "net_revenue"
        | "chargeback"
      deal_type: "revshare" | "cpa" | "hybrid" | "flat_fee"
      listing_pricing_type:
        | "fixed_per_stream"
        | "fixed_package"
        | "hourly"
        | "negotiable"
      listing_status: "active" | "paused" | "closed"
      payout_status: "pending" | "processing" | "completed" | "failed"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["casino_manager", "streamer", "admin"],
      application_status: [
        "pending",
        "shortlisted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      campaign_status: [
        "draft",
        "open",
        "in_progress",
        "completed",
        "cancelled",
      ],
      commission_status: [
        "pending",
        "approved",
        "paid",
        "disputed",
        "cancelled",
      ],
      contract_status: [
        "draft",
        "pending_signature",
        "signed",
        "expired",
        "cancelled",
      ],
      conversion_event_type: [
        "click",
        "signup",
        "ftd",
        "deposit",
        "net_revenue",
        "chargeback",
      ],
      deal_type: ["revshare", "cpa", "hybrid", "flat_fee"],
      listing_pricing_type: [
        "fixed_per_stream",
        "fixed_package",
        "hourly",
        "negotiable",
      ],
      listing_status: ["active", "paused", "closed"],
      payout_status: ["pending", "processing", "completed", "failed"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
