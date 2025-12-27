import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getClientIP, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit,
  createRateLimitResponse 
} from "../_shared/rate-limiter.ts";
import { getSafeErrorMessage } from "../_shared/security-utils.ts";

// Server-to-server only - no CORS needed for browser requests
const corsHeaders = {
  'Content-Type': 'application/json',
};

const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FUNCTION_NAME = 'n8n-reports';

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
    const { action, table = 'service_orders', filters } = body;

    console.log(`n8n-reports: action=${action}, table=${table}, filters=${JSON.stringify(filters)}`);

    switch (action) {
      case 'summary': {
        // Get summary statistics
        let query = supabase
          .from(table)
          .select('id, situation_id, withdrawal_situation_id, value, entry_date, exit_date, created_at')
          .eq('deleted', false);

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters?.date_from) {
          query = query.gte('entry_date', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('entry_date', filters.date_to);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        const totalOrders = orders?.length || 0;
        const totalValue = orders?.reduce((sum, o) => sum + (Number(o.value) || 0), 0) || 0;
        const completedOrders = orders?.filter(o => o.exit_date !== null).length || 0;
        const pendingOrders = totalOrders - completedOrders;

        // Group by situation
        const situationCounts: Record<string, number> = {};
        orders?.forEach(o => {
          const key = o.situation_id || 'sem_situacao';
          situationCounts[key] = (situationCounts[key] || 0) + 1;
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              total_orders: totalOrders,
              completed_orders: completedOrders,
              pending_orders: pendingOrders,
              total_value: totalValue,
              average_value: totalOrders > 0 ? totalValue / totalOrders : 0,
              by_situation: situationCounts
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'daily_report': {
        // Get orders grouped by day
        let query = supabase
          .from(table)
          .select('id, entry_date, exit_date, value, situation_id')
          .eq('deleted', false)
          .order('entry_date', { ascending: false });

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters?.date_from) {
          query = query.gte('entry_date', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('entry_date', filters.date_to);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        // Group by day
        const dailyData: Record<string, { count: number; value: number; completed: number }> = {};
        orders?.forEach(o => {
          const day = o.entry_date ? o.entry_date.split('T')[0] : 'unknown';
          if (!dailyData[day]) {
            dailyData[day] = { count: 0, value: 0, completed: 0 };
          }
          dailyData[day].count++;
          dailyData[day].value += Number(o.value) || 0;
          if (o.exit_date) {
            dailyData[day].completed++;
          }
        });

        return new Response(
          JSON.stringify({ success: true, data: dailyData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'export': {
        // Export full data for external processing
        let query = supabase
          .from(table)
          .select('*')
          .eq('deleted', false)
          .order('created_at', { ascending: false });

        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters?.date_from) {
          query = query.gte('entry_date', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('entry_date', filters.date_to);
        }
        if (filters?.situation_id) {
          query = query.eq('situation_id', filters.situation_id);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.limit(1000); // Default limit
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data: orders, count: orders?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'employees_summary': {
        // Get employee performance data
        let ordersQuery = supabase
          .from(table)
          .select('technician_id, received_by_id, value, exit_date')
          .eq('deleted', false);

        if (filters?.user_id) {
          ordersQuery = ordersQuery.eq('user_id', filters.user_id);
        }
        if (filters?.date_from) {
          ordersQuery = ordersQuery.gte('entry_date', filters.date_from);
        }
        if (filters?.date_to) {
          ordersQuery = ordersQuery.lte('entry_date', filters.date_to);
        }

        const { data: orders, error: ordersError } = await ordersQuery;
        if (ordersError) throw ordersError;

        // Get employees
        let employeesQuery = supabase
          .from('employees')
          .select('id, name, type')
          .eq('deleted', false);

        if (filters?.user_id) {
          employeesQuery = employeesQuery.eq('user_id', filters.user_id);
        }

        const { data: employees, error: employeesError } = await employeesQuery;
        if (employeesError) throw employeesError;

        // Calculate stats per employee
        const employeeStats: Record<string, { name: string; type: string; orders_received: number; orders_completed: number; total_value: number }> = {};

        employees?.forEach(emp => {
          employeeStats[emp.id] = {
            name: emp.name,
            type: emp.type,
            orders_received: 0,
            orders_completed: 0,
            total_value: 0
          };
        });

        orders?.forEach(o => {
          if (o.received_by_id && employeeStats[o.received_by_id]) {
            employeeStats[o.received_by_id].orders_received++;
          }
          if (o.technician_id && employeeStats[o.technician_id]) {
            if (o.exit_date) {
              employeeStats[o.technician_id].orders_completed++;
              employeeStats[o.technician_id].total_value += Number(o.value) || 0;
            }
          }
        });

        return new Response(
          JSON.stringify({ success: true, data: Object.values(employeeStats) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action', 
            available_actions: ['summary', 'daily_report', 'export', 'employees_summary'] 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('n8n-reports error:', error);
    const safeMessage = getSafeErrorMessage(error);
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
