import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { consentId } = await req.json();

        if (!consentId) {
            return Response.json({
                success: false,
                error: 'ID do consentimento não fornecido'
            }, { status: 400 });
        }

        console.log(`🗑️ Deletando consentimento ${consentId}...`);

        const clientId = Deno.env.get("INICIADOR_CLIENT_ID");
        const clientSecret = Deno.env.get("INICIADOR_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            console.warn('⚠️ Credenciais não configuradas, pulando deleção no Iniciador');
            return Response.json({ success: true });
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
            console.warn('⚠️ Erro ao autenticar, mas continuando...');
            return Response.json({ success: true });
        }

        const { access_token } = await authResponse.json();

        // Deleta o consentimento
        const deleteResponse = await fetch(`https://api.iniciador.com.br/consents/${consentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!deleteResponse.ok) {
            console.warn('⚠️ Erro ao deletar no Iniciador, mas continuando...');
        } else {
            console.log('✅ Consentimento deletado com sucesso');
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('❌ Erro ao deletar:', error);
        // Não retorna erro para não bloquear a deleção local
        return Response.json({ success: true });
    }
});