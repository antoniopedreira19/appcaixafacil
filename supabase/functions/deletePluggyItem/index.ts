import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return new Response(JSON.stringify({ success: false, error: 'itemId é obrigatório' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (clientId && clientSecret) {
      // Autentica com Pluggy
      const authResponse = await fetch('https://api.pluggy.ai/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        
        // Deleta item no Pluggy
        await fetch(`https://api.pluggy.ai/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'X-API-KEY': authData.apiKey }
        });
      }
    }

    // Deleta conta e transações do Supabase
    const { data: account } = await supabase
      .from('accounts')
      .select('pluggy_account_id')
      .eq('pluggy_item_id', itemId)
      .single();

    if (account) {
      await supabase
        .from('transactions')
        .delete()
        .eq('account_id', account.pluggy_account_id);
    }

    await supabase
      .from('accounts')
      .delete()
      .eq('pluggy_item_id', itemId);

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
