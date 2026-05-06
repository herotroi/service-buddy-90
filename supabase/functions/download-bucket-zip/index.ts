import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { downloadZip } from 'https://esm.sh/client-zip@2.4.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Token via query param (para download nativo via <a href>) ou Authorization header
    const token = url.searchParams.get('token') || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Valida o usuário a partir do JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Lista todos os arquivos do bucket recursivamente
    const allFiles: { path: string }[] = [];
    const queue: string[] = [''];
    while (queue.length) {
      const prefix = queue.shift()!;
      let offset = 0;
      while (true) {
        const { data, error } = await admin.storage
          .from('service-orders-media')
          .list(prefix, { limit: 1000, offset });
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const entry of data as any[]) {
          const full = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.id === null || !entry.metadata) {
            queue.push(full);
          } else {
            allFiles.push({ path: full });
          }
        }
        if (data.length < 1000) break;
        offset += 1000;
      }
    }

    async function* fileIterator() {
      for (const f of allFiles) {
        try {
          const { data: signed, error } = await admin.storage
            .from('service-orders-media')
            .createSignedUrl(f.path, 3600);
          if (error || !signed?.signedUrl) continue;
          const resp = await fetch(signed.signedUrl);
          if (!resp.ok || !resp.body) continue;
          yield { name: f.path, input: resp, lastModified: new Date() };
        } catch (e) {
          console.error('skip', f.path, e);
        }
      }
    }

    const zipResponse = downloadZip(fileIterator());
    const fileName = `service-orders-media-${new Date().toISOString().slice(0, 10)}.zip`;

    return new Response(zipResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});