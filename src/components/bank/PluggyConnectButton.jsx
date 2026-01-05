import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Building2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function PluggyConnectButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);

  // Carrega o script ao montar o componente
  useEffect(() => {
    loadPluggyScript();
  }, []);

  const loadPluggyScript = async () => {
    setLoadingScript(true);
    setError(null);

    try {
      // Se já existe, está pronto
      if (window.PluggyConnect) {
        console.log('✅ PluggyConnect já disponível');
        setScriptReady(true);
        setLoadingScript(false);
        return;
      }

      // Remove scripts antigos do Pluggy
      document.querySelectorAll('script[src*="pluggy"]').forEach(s => s.remove());

      console.log('📦 Carregando script Pluggy...');

      // Tenta múltiplas URLs
      const urls = [
        'https://cdn.pluggy.ai/connect/v3/pluggy-connect.js',
        'https://cdn.pluggy.ai/pluggy-connect/pluggy-connect.js'
      ];

      let loaded = false;

      for (const url of urls) {
        if (loaded) break;
        
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
              reject(new Error('Timeout'));
            }, 8000);

            script.onload = () => {
              clearTimeout(timeout);
              let attempts = 0;
              const check = setInterval(() => {
                attempts++;
                if (window.PluggyConnect) {
                  clearInterval(check);
                  loaded = true;
                  resolve();
                } else if (attempts > 30) {
                  clearInterval(check);
                  reject(new Error('Objeto não disponível'));
                }
              }, 100);
            };

            script.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Erro de rede'));
            };

            document.head.appendChild(script);
          });
          
          console.log('✅ Script carregado de:', url);
          loaded = true;
        } catch (e) {
          console.warn('❌ Falha em:', url, e.message);
        }
      }

      if (!loaded) {
        throw new Error('Não foi possível carregar o Pluggy. Desative bloqueadores de anúncios ou use aba anônima.');
      }

      setScriptReady(true);
    } catch (err) {
      console.error('Erro ao carregar Pluggy:', err);
      setError(err.message || 'Falha ao carregar script');
    } finally {
      setLoadingScript(false);
    }
  };

  const handleConnect = async () => {
    if (!scriptReady) {
      await loadPluggyScript();
      if (!window.PluggyConnect) return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔑 Buscando token...');
      const response = await base44.functions.invoke('createPluggyConnectToken', {});

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao criar token');
      }

      const connectToken = response.data.connectToken;
      console.log('✅ Token obtido');

      const pluggy = new window.PluggyConnect({
        connectToken: connectToken,
        includeSandbox: false,
        onSuccess: (data) => {
          console.log('✅ Conexão realizada!', data);
          setLoading(false);
          if (onSuccess) onSuccess(data);
        },
        onError: (err) => {
          console.error('❌ Erro no widget:', err);
          setError('Erro ao conectar banco');
          setLoading(false);
        },
        onClose: () => {
          console.log('🚪 Widget fechado');
          setLoading(false);
        }
      });

      pluggy.init();

    } catch (err) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleConnect}
        disabled={loading || loadingScript}
        className="bg-blue-600 hover:bg-blue-700 w-full"
        size="lg"
      >
        {loadingScript ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Carregando...
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5 mr-2" />
            Conectar Banco
          </>
        )}
      </Button>

      {error && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPluggyScript}
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