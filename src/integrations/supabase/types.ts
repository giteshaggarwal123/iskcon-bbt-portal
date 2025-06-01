export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          attendance_status: string
          attendance_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_verified: boolean | null
          join_time: string | null
          leave_time: string | null
          meeting_id: string
          notes: string | null
          updated_at: string
          user_id: string
          verified_by: string | null
        }
        Insert: {
          attendance_status: string
          attendance_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_verified?: boolean | null
          join_time?: string | null
          leave_time?: string | null
          meeting_id: string
          notes?: string | null
          updated_at?: string
          user_id: string
          verified_by?: string | null
        }
        Update: {
          attendance_status?: string
          attendance_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_verified?: boolean | null
          join_time?: string | null
          leave_time?: string | null
          meeting_id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      document_views: {
        Row: {
          completion_percentage: number | null
          document_id: string
          id: string
          last_page_viewed: number | null
          time_spent_seconds: number | null
          user_id: string
          view_ended_at: string | null
          view_started_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          document_id: string
          id?: string
          last_page_viewed?: number | null
          time_spent_seconds?: number | null
          user_id: string
          view_ended_at?: string | null
          view_started_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          document_id?: string
          id?: string
          last_page_viewed?: number | null
          time_spent_seconds?: number | null
          user_id?: string
          view_ended_at?: string | null
          view_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          folder: string | null
          id: string
          is_shared: boolean | null
          mime_type: string | null
          name: string
          sharepoint_drive_id: string | null
          sharepoint_file_id: string | null
          updated_at: string | null
          uploaded_by: string
          version: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          folder?: string | null
          id?: string
          is_shared?: boolean | null
          mime_type?: string | null
          name: string
          sharepoint_drive_id?: string | null
          sharepoint_file_id?: string | null
          updated_at?: string | null
          uploaded_by: string
          version?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          folder?: string | null
          id?: string
          is_shared?: boolean | null
          mime_type?: string | null
          name?: string
          sharepoint_drive_id?: string | null
          sharepoint_file_id?: string | null
          updated_at?: string | null
          uploaded_by?: string
          version?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          outlook_message_id: string | null
          recipients: string[]
          sender_id: string
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          outlook_message_id?: string | null
          recipients: string[]
          sender_id: string
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          outlook_message_id?: string | null
          recipients?: string[]
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      meeting_attendees: {
        Row: {
          id: string
          meeting_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          meeting_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          meeting_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          action_items: Json | null
          created_at: string
          id: string
          meeting_id: string
          participants: Json | null
          summary: string | null
          teams_transcript_id: string | null
          transcript_content: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          id?: string
          meeting_id: string
          participants?: Json | null
          summary?: string | null
          teams_transcript_id?: string | null
          transcript_content?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          id?: string
          meeting_id?: string
          participants?: Json | null
          summary?: string | null
          teams_transcript_id?: string | null
          transcript_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          meeting_type: string | null
          outlook_event_id: string | null
          start_time: string
          status: string | null
          teams_join_url: string | null
          teams_meeting_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          meeting_type?: string | null
          outlook_event_id?: string | null
          start_time: string
          status?: string | null
          teams_join_url?: string | null
          teams_meeting_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          meeting_type?: string | null
          outlook_event_id?: string | null
          start_time?: string
          status?: string | null
          teams_join_url?: string | null
          teams_meeting_id?: string | null
          title?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          vote: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          vote: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          vote?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          created_by: string
          deadline: string
          description: string | null
          id: string
          is_secret: boolean | null
          notify_members: boolean | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deadline: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          notify_members?: boolean | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deadline?: string
          description?: string | null
          id?: string
          is_secret?: boolean | null
          notify_members?: boolean | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          microsoft_access_token: string | null
          microsoft_refresh_token: string | null
          microsoft_user_id: string | null
          phone: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          microsoft_user_id?: string | null
          phone?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          microsoft_user_id?: string | null
          phone?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "secretary" | "treasurer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "secretary", "treasurer"],
    },
  },
} as const
