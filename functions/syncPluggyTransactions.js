import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        const { connectionId } = await req.json();

        if (!connectionId) {
            return Response.json({
                success: false,
                error: 'ID da conexão não fornecido'
            }, { status: 400 });
        }

        // Busca a conexão
        const connection = await base44.entities.BankConnection.get(connectionId);
        
        if (!connection) {
            return Response.json({
                success: false,
                error: 'Conexão não encontrada'
            }, { status: 404 });
        }

        const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
        const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

        // Obtém API Key
        const authResponse = await fetch('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, clientSecret })
        });

        const authData = await authResponse.json();
        const apiKey = authData.apiKey;

        // Busca transações do Pluggy
        const transactionsResponse = await fetch(
            `https://api.pluggy.ai/transactions?itemId=${connection.pluggy_item_id}`,
            {
                headers: { 'X-API-KEY': apiKey }
            }
        );

        if (!transactionsResponse.ok) {
            throw new Error('Falha ao buscar transações do Pluggy');
        }

        const transactionsData = await transactionsResponse.json();
        const pluggyTransactions = transactionsData.results || [];

        // Busca transações existentes para evitar duplicatas
        const existingTransactions = await base44.asServiceRole.entities.Transaction.list();
        const existingDescriptions = new Set(
            existingTransactions.map(t => `${t.date}_${t.description}_${t.amount}`)
        );

        // Categoriza e importa transações
        let imported = 0;
        const transactionsToCreate = [];

        for (const transaction of pluggyTransactions) {
            const date = transaction.date?.split('T')[0];
            const description = transaction.description || 'Transação bancária';
            const amount = transaction.amount || 0;
            const uniqueKey = `${date}_${description}_${amount}`;

            // Evita duplicatas
            if (existingDescriptions.has(uniqueKey)) {
                continue;
            }

            // Categoriza usando IA
            const categorizationPrompt = `Você é um especialista em categorização financeira para empresas brasileiras.

Categorize a seguinte transação bancária em UMA das categorias abaixo:

RECEITAS (para valores positivos):
- vendas: Vendas de produtos/serviços
- servicos: Prestação de serviços
- outras_receitas: Outras receitas não especificadas

DESPESAS (para valores negativos):
- salarios_funcionarios: Pagamentos de salários
- fornecedores: Pagamentos a fornecedores
- aluguel: Aluguel comercial
- contas_servicos: Contas (luz, água, internet, telefone)
- impostos_taxas: Impostos e taxas
- marketing_publicidade: Marketing e publicidade
- equipamentos_materiais: Equipamentos e materiais
- manutencao: Manutenção
- combustivel_transporte: Combustível e transporte
- outras_despesas: Outras despesas

Transação:
- Descrição: ${description}
- Valor: R$ ${amount}

Responda APENAS com o nome da categoria (ex: vendas, fornecedores, etc).`;

            let category = 'outras_despesas';
            try {
                const categorizationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: categorizationPrompt,
                    add_context_from_internet: false
                });
                
                const suggestedCategory = categorizationResult.trim().toLowerCase();
                const validCategories = [
                    'vendas', 'servicos', 'outras_receitas',
                    'salarios_funcionarios', 'fornecedores', 'aluguel',
                    'contas_servicos', 'impostos_taxas', 'marketing_publicidade',
                    'equipamentos_materiais', 'manutencao', 'combustivel_transporte',
                    'outras_despesas'
                ];
                
                if (validCategories.includes(suggestedCategory)) {
                    category = suggestedCategory;
                }
            } catch (error) {
                console.error('Erro na categorização:', error);
            }

            const type = amount > 0 ? 'income' : 'expense';

            transactionsToCreate.push({
                date: date,
                description: description,
                amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
                type: type,
                category: category,
                payment_method: 'transferencia',
                bank_account: connection.bank_name,
                notes: 'Importado via Pluggy'
            });

            imported++;
        }

        // Cria transações em lote
        if (transactionsToCreate.length > 0) {
            await base44.asServiceRole.entities.Transaction.bulkCreate(transactionsToCreate);
        }

        // Atualiza última sincronização
        await base44.asServiceRole.entities.BankConnection.update(connectionId, {
            last_sync: new Date().toISOString(),
            status: 'active'
        });

        return Response.json({
            success: true,
            imported: imported,
            total: pluggyTransactions.length
        });

    } catch (error) {
        console.error('Erro na sincronização:', error);
        return Response.json({
            success: false,
            error: error.message || 'Erro ao sincronizar transações'
        }, { status: 500 });
    }
});