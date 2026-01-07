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

    const { itemId, accountId } = await req.json();

    if (!itemId) {
      return new Response(JSON.stringify({ success: false, error: 'itemId é obrigatório' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ success: false, error: 'Credenciais Pluggy não configuradas' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Autentica com Pluggy
    console.log('🔐 Autenticando com Pluggy...');
    const authResponse = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });

    if (!authResponse.ok) {
      throw new Error('Falha na autenticação Pluggy');
    }

    const authData = await authResponse.json();
    const apiKey = authData.apiKey;

    // Busca contas do item
    console.log('📊 Buscando contas...');
    const accountsResponse = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: { 'X-API-KEY': apiKey }
    });

    if (!accountsResponse.ok) {
      throw new Error('Falha ao buscar contas');
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.results || [];

    let totalImported = 0;

    for (const account of accounts) {
      console.log(`📥 Buscando transações da conta ${account.name}...`);
      
      // Busca transações dos últimos 90 dias
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
      
      const txResponse = await fetch(
        `https://api.pluggy.ai/transactions?accountId=${account.id}&from=${fromDate.toISOString().split('T')[0]}`,
        { headers: { 'X-API-KEY': apiKey } }
      );

      if (!txResponse.ok) {
        console.warn(`Falha ao buscar transações da conta ${account.id}`);
        continue;
      }

      const txData = await txResponse.json();
      const transactions = txData.results || [];

      // Busca transações existentes para evitar duplicatas
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('pluggy_transaction_id')
        .eq('account_id', account.id);

      const existingIds = new Set((existingTx || []).map((t: { pluggy_transaction_id: string }) => t.pluggy_transaction_id));

      // Filtra novas transações
      const newTransactions = transactions.filter((t: { id: string }) => !existingIds.has(t.id));

      if (newTransactions.length === 0) {
        console.log(`Nenhuma nova transação para conta ${account.name}`);
        continue;
      }

      // Prepara transações para inserção
      const txToInsert = newTransactions.map((t: { id: string; description?: string; descriptionRaw?: string; amount: number; date?: string; paymentData?: { receiver?: { name?: string; documentNumber?: { value?: string } } } }) => ({
        account_id: account.id,
        pluggy_transaction_id: t.id,
        description: t.description || t.descriptionRaw || 'Sem descrição',
        amount: Math.abs(t.amount),
        type: t.amount >= 0 ? 'income' : 'expense',
        date: t.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        category: categorizeTransaction(t.description || '', t.amount),
        receiver_name: t.paymentData?.receiver?.name,
        receiver_doc: t.paymentData?.receiver?.documentNumber?.value,
        raw_data: t
      }));

      // Insere transações
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(txToInsert);

      if (insertError) {
        console.error('Erro ao inserir transações:', insertError);
        continue;
      }

      totalImported += txToInsert.length;
      console.log(`✅ ${txToInsert.length} transações importadas da conta ${account.name}`);

      // Atualiza ou cria conta no Supabase
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('pluggy_account_id', account.id)
        .single();

      if (!existingAccount) {
        await supabase.from('accounts').insert({
          pluggy_account_id: account.id,
          pluggy_item_id: itemId,
          name: account.name,
          balance: account.balance,
          user_id: user.id
        });
      } else {
        await supabase
          .from('accounts')
          .update({ balance: account.balance })
          .eq('pluggy_account_id', account.id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imported: totalImported,
      message: `${totalImported} transações importadas com sucesso!`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

function categorizeTransaction(description: string, amount: number): string {
  const desc = (description || '').toLowerCase();
  
  if (amount >= 0) {
    if (desc.includes('venda') || desc.includes('receb')) return 'vendas';
    if (desc.includes('serviço') || desc.includes('servico')) return 'servicos';
    return 'outras_receitas';
  }
  
  if (desc.includes('salario') || desc.includes('folha')) return 'salarios_funcionarios';
  if (desc.includes('fornecedor')) return 'fornecedores';
  if (desc.includes('aluguel')) return 'aluguel';
  if (desc.includes('luz') || desc.includes('energia') || desc.includes('agua') || desc.includes('internet')) return 'contas_servicos';
  if (desc.includes('imposto') || desc.includes('taxa') || desc.includes('darf')) return 'impostos_taxas';
  if (desc.includes('marketing') || desc.includes('propaganda')) return 'marketing_publicidade';
  if (desc.includes('combustivel') || desc.includes('uber') || desc.includes('99')) return 'combustivel_transporte';
  
  return 'outras_despesas';
}
