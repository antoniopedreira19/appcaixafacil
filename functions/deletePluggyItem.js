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

        const { itemId } = await req.json();

        if (!itemId) {
            return Response.json({
                success: false,
                error: 'ID do item não fornecido'
            }, { status: 400 });
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

        // Deleta item no Pluggy
        const deleteResponse = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'X-API-KEY': authData.apiKey
            }
        });

        if (!deleteResponse.ok) {
            console.warn('Erro ao deletar item no Pluggy:', await deleteResponse.text());
        }

        return Response.json({
            success: true,
            message: 'Item deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar:', error);
        return Response.json({
            success: false,
            error: error.message || 'Erro ao deletar item'
        }, { status: 500 });
    }
});