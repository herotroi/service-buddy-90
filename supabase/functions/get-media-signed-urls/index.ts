import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaFile {
  url: string;
  path: string;
  type: string;
  name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_token, paths, order_type = 'celular' } = await req.json();

    if (!paths || !Array.isArray(paths)) {
      return new Response(
        JSON.stringify({ error: 'Missing paths' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (tracking_token && !uuidRegex.test(tracking_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for server-side operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    let orderData;
    let orderError;

    // Validate based on order type
    if (order_type === 'informatica') {
      // For informatica orders, use the ID directly
      const result = await supabase
        .from('service_orders_informatica')
        .select('id, media_files')
        .eq('id', tracking_token)
        .eq('deleted', false)
        .single();
      
      orderData = result.data;
      orderError = result.error;
    } else {
      // For celular orders, use tracking_token
      const result = await supabase
        .from('service_orders')
        .select('id, media_files')
        .eq('tracking_token', tracking_token)
        .eq('deleted', false)
        .single();
      
      orderData = result.data;
      orderError = result.error;
    }

    if (orderError || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify that the requested paths belong to this order
    const orderMediaFiles = (orderData.media_files as MediaFile[]) || [];
    const validPaths = new Set(orderMediaFiles.map((f) => f.path));

    const invalidPaths = paths.filter((p: string) => !validPaths.has(p));
    if (invalidPaths.length > 0) {
      return new Response(
        JSON.stringify({ error: 'One or more paths do not belong to this order' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URLs for the valid paths (1 hour expiration)
    const signedUrls: Record<string, string> = {};

    for (const path of paths) {
      const { data, error } = await supabase.storage
        .from('service-orders-media')
        .createSignedUrl(path, 3600); // 1 hour

      if (!error && data) {
        signedUrls[path] = data.signedUrl;
      }
    }

    return new Response(
      JSON.stringify({ signedUrls }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-media-signed-urls:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
