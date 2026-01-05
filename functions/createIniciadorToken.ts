import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const clientId = Deno.env.get("INICIADOR_CLIENT_ID");
        const clientSecret = Deno.env.get("INICIADOR_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            return Response.json({
                success: false,
                error: 'Credenciais do Iniciador não configuradas. Adicione INICIADOR_CLIENT_ID e INICIADOR_CLIENT_SECRET nos secrets.'
            }, { status: 400 });
        }

        console.log('🔑 Gerando token de acesso do Iniciador...');

        // Autenticação no Iniciador para obter access token
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
            const errorText = await authResponse.text();
            console.error('❌ Erro na autenticação:', errorText);
            return Response.json({
                success: false,
                error: 'Erro ao autenticar com Iniciador. Verifique suas credenciais.'
            }, { status: 400 });
        }

        const authData = await authResponse.json();
        console.log('✅ Token obtido com sucesso');

        // Criar connect token para o widget
        const connectResponse = await fetch('https://api.iniciador.com.br/connect/tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.access_token}`
            },
            body: JSON.stringify({
                user_id: user.id,
                user_email: user.email,
            })
        });

        if (!connectResponse.ok) {
            const errorText = await connectResponse.text();
            console.error('❌ Erro ao criar connect token:', errorText);
            return Response.json({
                success: false,
                error: 'Erro ao criar token de conexão'
            }, { status: 400 });
        }

        const connectData = await connectResponse.json();

        return Response.json({
            success: true,
            connectToken: connectData.token,
            accessToken: authData.access_token
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});