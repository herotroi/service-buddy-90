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
    const { action, table = 'service_orders', filters, order_id, notification_type } = body;

    console.log(`n8n-notifications: action=${action}, table=${table}`);

    switch (action) {
      case 'get_pending_notifications': {
        // Get orders that are finalized but haven't sent notification
        const messageField = table === 'service_orders_informatica' ? 'client_notified' : 'mensagem_finalizada';
        
        let query = supabase
          .from(table)
          .select(`
            id,
            os_number,
            client_name,
            contact,
            other_contacts,
            ${table === 'service_orders' ? 'device_model, reported_defect' : 'equipment, defect'},
            situation_id,
            exit_date,
            value,
            ${messageField}
          `)
          .eq('deleted', false)
          .eq(messageField, false)
          .not('exit_date', 'is', null);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }

        if (filters?.situation_id) {
          query = query.eq('situation_id', filters.situation_id);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        console.log(`Found ${orders?.length || 0} pending notifications`);
        return new Response(
          JSON.stringify({ success: true, data: orders, count: orders?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'mark_notified': {
        if (!order_id) {
          return new Response(
            JSON.stringify({ error: 'order_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const messageField = table === 'service_orders_informatica' ? 'client_notified' : 'mensagem_finalizada';
        const updateData: Record<string, any> = {
          [messageField]: true,
          updated_at: new Date().toISOString()
        };

        // For service_orders, also update mensagem_entregue if specified
        if (table === 'service_orders' && notification_type === 'delivered') {
          updateData.mensagem_entregue = true;
        }

        const { data: updated, error } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', order_id)
          .select()
          .single();

        if (error) throw error;

        console.log(`Marked order ${order_id} as notified`);
        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_order_for_notification': {
        if (!order_id) {
          return new Response(
            JSON.stringify({ error: 'order_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const situationTable = table === 'service_orders_informatica' ? 'situacao_informatica' : 'situations';
        
        const { data: order, error } = await supabase
          .from(table)
          .select(`
            *,
            situation:${situationTable}(id, name, color)
          `)
          .eq('id', order_id)
          .eq('deleted', false)
          .maybeSingle();

        if (error) throw error;

        // Get profile info for the user
        if (order?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, street, number, neighborhood, city, state')
            .eq('id', order.user_id)
            .maybeSingle();

          return new Response(
            JSON.stringify({ success: true, data: { ...order, profile } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: order }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'webhook_trigger': {
        // This endpoint can be called by n8n to trigger actions
        // or to receive data from external systems
        const { event, payload } = body;
        
        console.log(`Webhook received: event=${event}, payload=${JSON.stringify(payload)}`);

        // Process based on event type
        switch (event) {
          case 'order_status_changed':
            // Handle status change notification
            return new Response(
              JSON.stringify({ success: true, message: 'Status change processed', event, payload }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

          case 'notification_sent':
            // Confirm notification was sent
            if (payload?.order_id) {
              const messageField = table === 'service_orders_informatica' ? 'client_notified' : 'mensagem_finalizada';
              await supabase
                .from(table)
                .update({ [messageField]: true, updated_at: new Date().toISOString() })
                .eq('id', payload.order_id);
            }
            return new Response(
              JSON.stringify({ success: true, message: 'Notification confirmed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

          default:
            return new Response(
              JSON.stringify({ success: true, message: 'Webhook received', event, payload }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action', 
            available_actions: ['get_pending_notifications', 'mark_notified', 'get_order_for_notification', 'webhook_trigger'] 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('n8n-notifications error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
