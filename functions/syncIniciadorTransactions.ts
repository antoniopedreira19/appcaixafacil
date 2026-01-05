import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { connectionId } = await req.json();

        if (!connectionId) {
            return Response.json({
                success: false,
                error: 'ID da conexão não fornecido'
            }, { status: 400 });
        }

        console.log(`🔄 Sincronizando conexão ${connectionId}...`);

        // Busca a conexão no banco
        const connection = await base44.entities.BankConnection.get(connectionId);

        if (!connection) {
            return Response.json({
                success: false,
                error: 'Conexão não encontrada'
            }, { status: 404 });
        }

        const clientId = Deno.env.get("INICIADOR_CLIENT_ID");
        const clientSecret = Deno.env.get("INICIADOR_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            return Response.json({
                success: false,
                error: 'Credenciais não configuradas'
            }, { status: 400 });
        }

        // Autenticação
        const authResponse = await fetch('https://api.iniciador.com.br/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            })
        });

        if (!authResponse.ok) {
            return Response.json({
                success: false,
                error: 'Erro ao autenticar'
            }, { status: 400 });
        }

        const { access_token } = await authResponse.json();

        // Busca as contas da conexão
        const accountsResponse = await fetch(`https://api.iniciador.com.br/accounts?consent_id=${connection.pluggy_item_id}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!accountsResponse.ok) {
            return Response.json({
                success: false,
                error: 'Erro ao buscar contas'
            }, { status: 400 });
        }

        const accounts = await accountsResponse.json();
        let totalImported = 0;

        // Para cada conta, busca transações
        for (const account of accounts.data || []) {
            console.log(`📊 Buscando transações da conta ${account.id}...`);

            const transactionsResponse = await fetch(
                `https://api.iniciador.com.br/accounts/${account.id}/transactions?page_size=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                }
            );

            if (!transactionsResponse.ok) {
                console.warn(`⚠️ Erro ao buscar transações da conta ${account.id}`);
                continue;
            }

            const transactionsData = await transactionsResponse.json();
            const transactions = transactionsData.data || [];

            console.log(`📝 ${transactions.length} transações encontradas`);

            // Busca transações existentes para evitar duplicatas
            const existingTransactions = await base44.entities.Transaction.filter({
                bank_account: account.number || account.id
            });

            const existingDescriptions = new Set(
                existingTransactions.map(t => `${t.date}_${t.description}_${t.amount}`)
            );

            // Categoriza e salva as transações
            for (const transaction of transactions) {
                const transactionKey = `${transaction.date}_${transaction.description}_${transaction.amount}`;
                
                if (existingDescriptions.has(transactionKey)) {
                    console.log(`⏭️ Transação já existe: ${transaction.description}`);
                    continue;
                }

                // Categoriza usando IA
                const categoryResult = await base44.integrations.Core.InvokeLLM({
                    prompt: `Você é um especialista em categorização de transações financeiras de empresas brasileiras.

Analise esta transação e retorne APENAS o nome da categoria mais apropriada:

Descrição: ${transaction.description}
Valor: ${transaction.amount}
Tipo: ${transaction.type === 'DEBIT' ? 'Despesa' : 'Receita'}

CATEGORIAS DISPONÍVEIS:
${transaction.type === 'DEBIT' 
    ? 'salarios_funcionarios, fornecedores, aluguel, contas_servicos, impostos_taxas, marketing_publicidade, equipamentos_materiais, manutencao, combustivel_transporte, emprestimos_pagos, outras_despesas'
    : 'vendas, servicos, investimentos, emprestimos_recebidos, outras_receitas'
}

Responda APENAS com o nome da categoria, sem explicações.`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            category: { type: "string" }
                        }
                    }
                });

                const category = categoryResult.category || (transaction.type === 'DEBIT' ? 'outras_despesas' : 'outras_receitas');

                // Salva a transação
                await base44.entities.Transaction.create({
                    date: transaction.date,
                    description: transaction.description,
                    amount: transaction.type === 'DEBIT' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                    type: transaction.type === 'DEBIT' ? 'expense' : 'income',
                    category: category,
                    payment_method: 'transferencia',
                    bank_account: account.number || account.id,
                    notes: `Importado via Iniciador em ${new Date().toLocaleDateString('pt-BR')}`
                });

                totalImported++;
            }
        }

        // Atualiza a data de sincronização
        await base44.entities.BankConnection.update(connectionId, {
            last_sync: new Date().toISOString(),
            status: 'active'
        });

        console.log(`✅ Sincronização concluída! ${totalImported} transações importadas`);

        return Response.json({
            success: true,
            imported: totalImported,
            message: `${totalImported} transações importadas com sucesso`
        });

    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});