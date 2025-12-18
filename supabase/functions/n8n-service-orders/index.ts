import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== N8N_API_KEY) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, table = 'service_orders', filters, data, id } = body;

    console.log(`n8n-service-orders: action=${action}, table=${table}, filters=${JSON.stringify(filters)}`);

    // Validate table name
    const allowedTables = ['service_orders', 'service_orders_informatica'];
    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: 'Invalid table name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'list': {
        let query = supabase
          .from(table)
          .select(`
            *,
            situation:situations(id, name, color),
            withdrawal_situation:withdrawal_situations(id, name, color),
            received_by:employees!service_orders_received_by_id_fkey(id, name),
            technician:employees!service_orders_technician_id_fkey(id, name)
          `)
          .eq('deleted', false)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters) {
          if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
          }
          if (filters.situation_id) {
            query = query.eq('situation_id', filters.situation_id);
          }
          if (filters.withdrawal_situation_id) {
            query = query.eq('withdrawal_situation_id', filters.withdrawal_situation_id);
          }
          if (filters.date_from) {
            query = query.gte('entry_date', filters.date_from);
          }
          if (filters.date_to) {
            query = query.lte('entry_date', filters.date_to);
          }
          if (filters.client_name) {
            query = query.ilike('client_name', `%${filters.client_name}%`);
          }
          if (filters.os_number) {
            query = query.eq('os_number', filters.os_number);
          }
          if (filters.limit) {
            query = query.limit(filters.limit);
          }
        }

        const { data: orders, error } = await query;
        if (error) throw error;
        result = { success: true, data: orders, count: orders?.length || 0 };
        break;
      }

      case 'get': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for get action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: order, error } = await supabase
          .from(table)
          .select(`
            *,
            situation:situations(id, name, color),
            withdrawal_situation:withdrawal_situations(id, name, color),
            received_by:employees!service_orders_received_by_id_fkey(id, name),
            technician:employees!service_orders_technician_id_fkey(id, name)
          `)
          .eq('id', id)
          .eq('deleted', false)
          .maybeSingle();

        if (error) throw error;
        result = { success: true, data: order };
        break;
      }

      case 'update': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for update action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!data || typeof data !== 'object') {
          return new Response(
            JSON.stringify({ error: 'Data object is required for update action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Remove fields that shouldn't be updated directly
        const { id: _id, created_at, user_id, ...updateData } = data;

        const { data: updated, error } = await supabase
          .from(table)
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data: updated };
        break;
      }

      case 'get_situations': {
        const situationTable = table === 'service_orders_informatica' ? 'situacao_informatica' : 'situations';
        
        let query = supabase
          .from(situationTable)
          .select('*')
          .eq('deleted', false);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }

        const { data: situations, error } = await query;
        if (error) throw error;
        result = { success: true, data: situations };
        break;
      }

      case 'get_withdrawal_situations': {
        const withdrawalTable = table === 'service_orders_informatica' ? 'retirada_informatica' : 'withdrawal_situations';
        
        let query = supabase
          .from(withdrawalTable)
          .select('*')
          .eq('deleted', false);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }

        const { data: situations, error } = await query;
        if (error) throw error;
        result = { success: true, data: situations };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: list, get, update, get_situations, get_withdrawal_situations' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`n8n-service-orders: completed successfully`);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('n8n-service-orders error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
