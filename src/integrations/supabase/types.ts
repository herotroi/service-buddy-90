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
      employees: {
        Row: {
          contact: string | null
          created_at: string
          deleted: boolean
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      local_equipamento: {
        Row: {
          color: string
          created_at: string
          deleted: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          cnpj: string | null
          complement: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          logo_url: string | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          state: string | null
          street: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          logo_url?: string | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          logo_url?: string | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      retirada_informatica: {
        Row: {
          color: string
          created_at: string
          deleted: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          checklist_acompanha_capa: boolean | null
          checklist_acompanha_chip: boolean | null
          checklist_acompanha_sd: boolean | null
          checklist_carcaca_torta: boolean | null
          checklist_carrega: boolean | null
          checklist_esta_ligado: boolean | null
          checklist_face_id: boolean | null
          checklist_houve_queda: boolean | null
          checklist_manchas_tela: boolean | null
          checklist_riscos_laterais: boolean | null
          checklist_riscos_tampa: boolean | null
          checklist_tela_quebrada: boolean | null
          checklist_vidro_camera: boolean | null
          checklist_vidro_trincado: boolean | null
          client_address: string | null
          client_cpf: string | null
          client_message: string | null
          client_name: string
          contact: string | null
          created_at: string
          deleted: boolean
          device_brand: string | null
          device_chip: string | null
          device_model: string
          device_password: string | null
          device_pattern: string | null
          entry_date: string
          exit_date: string | null
          id: string
          media_files: Json | null
          memory_card_size: string | null
          mensagem_entregue: boolean
          mensagem_finalizada: boolean
          os_number: number
          other_contacts: string | null
          part_order_date: string | null
          received_by_id: string | null
          reported_defect: string
          service_date: string | null
          situation_id: string | null
          technical_info: string | null
          technician_id: string | null
          tracking_token: string | null
          updated_at: string
          user_id: string | null
          value: number | null
          withdrawal_situation_id: string | null
          withdrawn_by: string | null
        }
        Insert: {
          checklist_acompanha_capa?: boolean | null
          checklist_acompanha_chip?: boolean | null
          checklist_acompanha_sd?: boolean | null
          checklist_carcaca_torta?: boolean | null
          checklist_carrega?: boolean | null
          checklist_esta_ligado?: boolean | null
          checklist_face_id?: boolean | null
          checklist_houve_queda?: boolean | null
          checklist_manchas_tela?: boolean | null
          checklist_riscos_laterais?: boolean | null
          checklist_riscos_tampa?: boolean | null
          checklist_tela_quebrada?: boolean | null
          checklist_vidro_camera?: boolean | null
          checklist_vidro_trincado?: boolean | null
          client_address?: string | null
          client_cpf?: string | null
          client_message?: string | null
          client_name: string
          contact?: string | null
          created_at?: string
          deleted?: boolean
          device_brand?: string | null
          device_chip?: string | null
          device_model: string
          device_password?: string | null
          device_pattern?: string | null
          entry_date?: string
          exit_date?: string | null
          id?: string
          media_files?: Json | null
          memory_card_size?: string | null
          mensagem_entregue?: boolean
          mensagem_finalizada?: boolean
          os_number?: number
          other_contacts?: string | null
          part_order_date?: string | null
          received_by_id?: string | null
          reported_defect: string
          service_date?: string | null
          situation_id?: string | null
          technical_info?: string | null
          technician_id?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number | null
          withdrawal_situation_id?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          checklist_acompanha_capa?: boolean | null
          checklist_acompanha_chip?: boolean | null
          checklist_acompanha_sd?: boolean | null
          checklist_carcaca_torta?: boolean | null
          checklist_carrega?: boolean | null
          checklist_esta_ligado?: boolean | null
          checklist_face_id?: boolean | null
          checklist_houve_queda?: boolean | null
          checklist_manchas_tela?: boolean | null
          checklist_riscos_laterais?: boolean | null
          checklist_riscos_tampa?: boolean | null
          checklist_tela_quebrada?: boolean | null
          checklist_vidro_camera?: boolean | null
          checklist_vidro_trincado?: boolean | null
          client_address?: string | null
          client_cpf?: string | null
          client_message?: string | null
          client_name?: string
          contact?: string | null
          created_at?: string
          deleted?: boolean
          device_brand?: string | null
          device_chip?: string | null
          device_model?: string
          device_password?: string | null
          device_pattern?: string | null
          entry_date?: string
          exit_date?: string | null
          id?: string
          media_files?: Json | null
          memory_card_size?: string | null
          mensagem_entregue?: boolean
          mensagem_finalizada?: boolean
          os_number?: number
          other_contacts?: string | null
          part_order_date?: string | null
          received_by_id?: string | null
          reported_defect?: string
          service_date?: string | null
          situation_id?: string | null
          technical_info?: string | null
          technician_id?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number | null
          withdrawal_situation_id?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_received_by_id_fkey"
            columns: ["received_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_withdrawal_situation_id_fkey"
            columns: ["withdrawal_situation_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_situations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders_informatica: {
        Row: {
          accessories: string | null
          client_name: string
          client_notified: boolean
          contact: string | null
          created_at: string
          defect: string
          deleted: boolean
          entry_date: string
          equipment: string
          equipment_location_id: string | null
          exit_date: string | null
          id: string
          media_files: Json | null
          more_details: string | null
          observations: string | null
          os_number: number
          other_contacts: string | null
          received_by_id: string | null
          senha: string | null
          service_date: string | null
          situation_id: string | null
          updated_at: string
          user_id: string | null
          value: number | null
          withdrawal_situation_id: string | null
          withdrawn_by: string | null
        }
        Insert: {
          accessories?: string | null
          client_name: string
          client_notified?: boolean
          contact?: string | null
          created_at?: string
          defect: string
          deleted?: boolean
          entry_date?: string
          equipment: string
          equipment_location_id?: string | null
          exit_date?: string | null
          id?: string
          media_files?: Json | null
          more_details?: string | null
          observations?: string | null
          os_number?: number
          other_contacts?: string | null
          received_by_id?: string | null
          senha?: string | null
          service_date?: string | null
          situation_id?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number | null
          withdrawal_situation_id?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          accessories?: string | null
          client_name?: string
          client_notified?: boolean
          contact?: string | null
          created_at?: string
          defect?: string
          deleted?: boolean
          entry_date?: string
          equipment?: string
          equipment_location_id?: string | null
          exit_date?: string | null
          id?: string
          media_files?: Json | null
          more_details?: string | null
          observations?: string | null
          os_number?: number
          other_contacts?: string | null
          received_by_id?: string | null
          senha?: string | null
          service_date?: string | null
          situation_id?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number | null
          withdrawal_situation_id?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_informatica_equipment_location_id_fkey"
            columns: ["equipment_location_id"]
            isOneToOne: false
            referencedRelation: "local_equipamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_informatica_received_by_id_fkey"
            columns: ["received_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_informatica_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situacao_informatica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_informatica_withdrawal_situation_id_fkey"
            columns: ["withdrawal_situation_id"]
            isOneToOne: false
            referencedRelation: "retirada_informatica"
            referencedColumns: ["id"]
          },
        ]
      }
      situacao_informatica: {
        Row: {
          color: string
          created_at: string
          deleted: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      situations: {
        Row: {
          color: string
          created_at: string
          deleted: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color: string
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string | null
          value?: string
        }
        Relationships: []
      }
      withdrawal_situations: {
        Row: {
          color: string
          created_at: string
          deleted: boolean
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tracking_order: {
        Args: { p_token: string }
        Returns: {
          checklist_acompanha_capa: boolean
          checklist_acompanha_chip: boolean
          checklist_acompanha_sd: boolean
          checklist_carcaca_torta: boolean
          checklist_carrega: boolean
          checklist_esta_ligado: boolean
          checklist_face_id: boolean
          checklist_houve_queda: boolean
          checklist_manchas_tela: boolean
          checklist_riscos_laterais: boolean
          checklist_riscos_tampa: boolean
          checklist_tela_quebrada: boolean
          checklist_vidro_camera: boolean
          checklist_vidro_trincado: boolean
          device_model: string
          entry_date: string
          exit_date: string
          media_files: Json
          os_number: number
          reported_defect: string
          situation_color: string
          situation_name: string
          withdrawal_color: string
          withdrawal_name: string
          withdrawn_by: string
        }[]
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
  public: {
    Enums: {},
  },
} as const
