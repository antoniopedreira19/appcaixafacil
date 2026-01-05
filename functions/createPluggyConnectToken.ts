import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica autenticação
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        console.log('Usuário autenticado:', user.email);

        const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
        const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

        console.log('Client ID:', clientId);
        console.log('Client ID existe:', !!clientId);
        console.log('Client Secret existe:', !!clientSecret);

        if (!clientId || !clientSecret) {
            return Response.json({
                success: false,
                error: 'Credenciais do Pluggy não configuradas'
            }, { status: 500 });
        }

        // Obtém API Key do Pluggy
        console.log('1. Autenticando no Pluggy...');
        const authResponse = await fetch('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientId: clientId,
                clientSecret: clientSecret
            })
        });

        console.log('2. Status da autenticação:', authResponse.status);

        if (!authResponse.ok) {
            const errorText = await authResponse.text();
            console.error('ERRO na autenticação Pluggy:', errorText);
            
            return Response.json({
                success: false,
                error: 'Credenciais do Pluggy inválidas',
                details: errorText
            }, { status: 500 });
        }

        const authData = await authResponse.json();
        console.log('3. Autenticação OK, API Key obtida');

        // Cria Connect Token com clientUserId sendo o email do usuário
        const clientUserId = user.id || user.email;
        console.log('4. Criando connect token para user:', clientUserId);

        const connectTokenResponse = await fetch('https://api.pluggy.ai/connect_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': authData.apiKey
            },
            body: JSON.stringify({
                clientUserId: clientUserId
            })
        });

        console.log('5. Status do connect token:', connectTokenResponse.status);

        if (!connectTokenResponse.ok) {
            const errorText = await connectTokenResponse.text();
            console.error('ERRO ao criar connect token:', errorText);
            console.error('Status:', connectTokenResponse.status);
            
            return Response.json({
                success: false,
                error: 'Falha ao criar token de conexão',
                details: errorText,
                status: connectTokenResponse.status
            }, { status: 500 });
        }

        const connectTokenData = await connectTokenResponse.json();
        console.log('6. Connect token criado com sucesso!');
        console.log('Access Token existe:', !!connectTokenData.accessToken);

        if (!connectTokenData.accessToken) {
            console.error('ERRO: accessToken não encontrado na resposta');
            console.error('Resposta completa:', JSON.stringify(connectTokenData));
            
            return Response.json({
                success: false,
                error: 'Token de acesso não foi retornado pelo Pluggy'
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            connectToken: connectTokenData.accessToken
        });

    } catch (error) {
        console.error('ERRO GERAL:', error);
        console.error('Stack:', error.stack);
        
        return Response.json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            details: error.stack
        }, { status: 500 });
    }
});