import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function ConnectBankButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);

  useEffect(() => {
    loadScript();
  }, []);

  const loadScript = () => {
    console.log('🔄 Carregando Pluggy Connect...');
    
    if (window.PluggyConnect) {
      console.log('✅ PluggyConnect já disponível');
      setScriptLoaded(true);
      setLoadingScript(false);
      return;
    }

    // Remove scripts antigos
    const oldScripts = document.querySelectorAll('script[src*="pluggy"]');
    oldScripts.forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/connect/v3/pluggy-connect.js';
    script.async = true;
    
    script.onload = () => {
      console.log('📦 Script carregado');
      
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.PluggyConnect) {
          console.log('✅ PluggyConnect pronto!');
          clearInterval(checkInterval);
          setScriptLoaded(true);
          setLoadingScript(false);
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          setError('Componente não carregou. Tente recarregar (F5) ou desative bloqueadores.');
          setLoadingScript(false);
        }
      }, 200);
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar CDN');
      setError(`⚠️ Não foi possível carregar o Pluggy Connect.

SOLUÇÕES:
1. Desative bloqueadores de anúncios
2. Teste no modo anônimo (Ctrl+Shift+N)
3. Use outro navegador (Chrome/Edge)
4. Tente recarregar a página (F5)`);
      setLoadingScript(false);
    };

    document.head.appendChild(script);
  };

  const connectBank = async () => {
    console.log('🚀 Conectando banco via Pluggy...');
    setLoading(true);
    setError(null);

    try {
      if (!window.PluggyConnect) {
        throw new Error('Pluggy não está carregado. Recarregue a página (F5).');
      }

      console.log('🔑 Solicitando token...');
      const response = await base44.functions.invoke('createPluggyConnectToken', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      if (!response.data.connectToken) {
        throw new Error('Token não foi retornado');
      }

      console.log('✅ Token obtido');

      const pluggyConnect = new window.PluggyConnect({
        connectToken: response.data.connectToken,
        includeSandbox: false,
        onSuccess: async (itemData) => {
          console.log('✅ Banco conectado!', itemData);
          if (onSuccess) await onSuccess(itemData);
          setLoading(false);
        },
        onError: (error) => {
          console.error('❌ Erro:', error);
          setError('Erro ao conectar: ' + (error?.message || 'Tente novamente'));
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget fechado');
          setLoading(false);
        },
      });

      pluggyConnect.init();
      
    } catch (err) {
      console.error('❌ Erro:', err);
      
      let errorMsg = err.message || 'Erro desconhecido';
      
      if (errorMsg.includes('Credenciais') || errorMsg.includes('não configuradas')) {
        errorMsg = `⚠️ CONFIGURE AS CREDENCIAIS DO PLUGGY

1. Acesse: https://dashboard.pluggy.ai
2. Faça login e vá em "API Keys"
3. Copie seu Client ID e Client Secret
4. No CaixaFácil: Dashboard → Settings → Secrets
5. Adicione:
   • PLUGGY_CLIENT_ID
   • PLUGGY_CLIENT_SECRET
6. Volte aqui e tente novamente!`;
      }
      
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loadingScript && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-900 flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando componente do Pluggy...
          </AlertDescription>
        </Alert>
      )}

      {scriptLoaded && !loadingScript && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 text-sm">
            ✅ Pluggy Connect carregado! Pronto para conectar.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={connectBank}
        disabled={loading || !scriptLoaded || loadingScript}
        className="bg-blue-600 hover:bg-blue-700 w-full text-base"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <LinkIcon className="w-5 h-5 mr-2" />
            {loadingScript ? 'Carregando...' : 'Conectar Banco'}
          </>
        )}
      </Button>

      {error && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm whitespace-pre-line">
              {error}
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={loadScript}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}