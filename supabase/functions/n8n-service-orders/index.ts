import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getClientIP, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit,
  createRateLimitResponse 
} from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FUNCTION_NAME = 'n8n-service-orders';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  try {
    // Check rate limit before authentication
    const rateLimitResult = checkRateLimit(clientIP, FUNCTION_NAME);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${clientIP} on ${FUNCTION_NAME}`);
      return createRateLimitResponse(rateLimitResult);
    }

    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== N8N_API_KEY) {
      // Record failed authentication attempt
      recordFailedAttempt(clientIP, FUNCTION_NAME);
      console.error(`Invalid or missing API key from ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limit on successful authentication
    resetRateLimit(clientIP, FUNCTION_NAME);

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
        // Build select query based on table type
        const selectQuery = table === 'service_orders_informatica' 
          ? `
            *,
            situation:situacao_informatica(id, name, color),
            withdrawal_situation:retirada_informatica(id, name, color),
            received_by:employees!service_orders_informatica_received_by_id_fkey(id, name),
            equipment_location:local_equipamento(id, name, color)
          `
          : `
            *,
            situation:situations(id, name, color),
            withdrawal_situation:withdrawal_situations(id, name, color),
            received_by:employees!service_orders_received_by_id_fkey(id, name),
            technician:employees!service_orders_technician_id_fkey(id, name)
          `;

        let query = supabase
          .from(table)
          .select(selectQuery)
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

        const getSelectQuery = table === 'service_orders_informatica'
          ? `
            *,
            situation:situacao_informatica(id, name, color),
            withdrawal_situation:retirada_informatica(id, name, color),
            received_by:employees!service_orders_informatica_received_by_id_fkey(id, name),
            equipment_location:local_equipamento(id, name, color)
          `
          : `
            *,
            situation:situations(id, name, color),
            withdrawal_situation:withdrawal_situations(id, name, color),
            received_by:employees!service_orders_received_by_id_fkey(id, name),
            technician:employees!service_orders_technician_id_fkey(id, name)
          `;

        const { data: order, error } = await supabase
          .from(table)
          .select(getSelectQuery)
          .eq('id', id)
          .eq('deleted', false)
          .maybeSingle();

        if (error) throw error;
        result = { success: true, data: order };
        break;
      }

      case 'create': {
        if (!data || typeof data !== 'object') {
          return new Response(
            JSON.stringify({ error: 'Data object is required for create action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate required fields based on table type
        if (table === 'service_orders') {
          if (!data.client_name || !data.device_model || !data.reported_defect || !data.user_id) {
            return new Response(
              JSON.stringify({ 
                error: 'Required fields missing: client_name, device_model, reported_defect, user_id' 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (table === 'service_orders_informatica') {
          if (!data.client_name || !data.equipment || !data.defect || !data.user_id) {
            return new Response(
              JSON.stringify({ 
                error: 'Required fields missing: client_name, equipment, defect, user_id' 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Remove fields that are auto-generated
        const { id: _id, os_number, created_at, updated_at, tracking_token, ...insertData } = data;

        const { data: created, error } = await supabase
          .from(table)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        console.log(`n8n-service-orders: created new order with id=${created.id}, os_number=${created.os_number}`);
        result = { success: true, data: created };
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
        const { id: _id, created_at, user_id, os_number, ...updateData } = data;

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

      case 'delete': {
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for delete action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Soft delete
        const { data: deleted, error } = await supabase
          .from(table)
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data: deleted };
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

      case 'get_employees': {
        let query = supabase
          .from('employees')
          .select('*')
          .eq('deleted', false);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }

        const { data: employees, error } = await query;
        if (error) throw error;
        result = { success: true, data: employees };
        break;
      }

      case 'get_equipment_locations': {
        let query = supabase
          .from('local_equipamento')
          .select('*')
          .eq('deleted', false);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }

        const { data: locations, error } = await query;
        if (error) throw error;
        result = { success: true, data: locations };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action. Use: list, get, create, update, delete, get_situations, get_withdrawal_situations, get_employees, get_equipment_locations' 
          }),
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
