import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: expiredFiles, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (expiredFiles && expiredFiles.length > 0) {
      const filePaths = expiredFiles.map(file => file.file_path);
      
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove(filePaths);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (dbError) throw dbError;

      return new Response(
        JSON.stringify({ 
          message: `Deleted ${expiredFiles.length} expired files`,
          deletedCount: expiredFiles.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'No expired files found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});