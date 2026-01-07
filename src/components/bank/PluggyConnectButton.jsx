import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const N8N_TOKEN_WEBHOOK = "https://grifoworkspace.app.n8n.cloud/webhook/get-pluggy-token";

const isInIframe = () => {
  try {
    // Verifica se está em iframe E se é o preview do Lovable
    const inIframe = window.self !== window.top;
    const isLovablePreview = window.location.hostname.includes("lovableproject.com");
    return inIframe && isLovablePreview;
  } catch {
    return true;
  }
};

const openInNewTab = () => {
  window.open(window.location.href, "_blank", "noopener,noreferrer");
};

export default function PluggyConnectButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);

  // Carrega o script ao montar o componente (fora do preview/iframe)
  useEffect(() => {
    if (isInIframe()) {
      setLoadingScript(false);
      return;
    }
    loadPluggyScript();
  }, []);

  const loadPluggyScript = async () => {
    setLoadingScript(true);
    setError(null);

    try {
      if (isInIframe()) {
        throw new Error("O Pluggy não carrega no preview (iframe). Abra em nova aba ou publique o app.");
      }

      // Se já existe, está pronto
      if (window.PluggyConnect) {
        console.log("✅ PluggyConnect já disponível");
        setScriptReady(true);
        setLoadingScript(false);
        return;
      }

      // Remove scripts antigos do Pluggy para evitar conflitos
      document.querySelectorAll('script[src*="pluggy"]').forEach((s) => s.remove());

      console.log("📦 Carregando script Pluggy...");

      // URL CORRETA (Documentação Oficial)
      const url = "https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js";

      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;

        const timeout = setTimeout(() => {
          reject(new Error("Timeout ao carregar script do Pluggy"));
        }, 10000); // 10 segundos de timeout

        script.onload = () => {
          clearTimeout(timeout);
          // Verifica se o objeto foi realmente injetado na janela
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            if (window.PluggyConnect) {
              clearInterval(check);
              console.log("✅ Script do Pluggy carregado com sucesso!");
              resolve();
            } else if (attempts > 50) {
              // 5 segundos tentando achar o objeto
              clearInterval(check);
              reject(new Error("Script carregou mas objeto PluggyConnect não está disponível"));
            }
          }, 100);
        };

        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Erro de rede ao baixar o script do Pluggy"));
        };

        document.head.appendChild(script);
      });

      setScriptReady(true);
    } catch (err) {
      console.error("Erro ao carregar Pluggy:", err);
      setError(err.message || "Falha ao carregar script");
    } finally {
      setLoadingScript(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔑 Buscando token via n8n...");
      const response = await fetch(N8N_TOKEN_WEBHOOK, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Erro ao obter token do n8n");
      }

      const data = await response.json();
      const connectToken = data.accessToken; // Certifique-se que seu n8n retorna { "accessToken": "..." }

      if (!connectToken) {
        throw new Error("Token não retornado pelo n8n");
      }
      console.log("✅ Token obtido via n8n");

      if (!scriptReady) {
        await loadPluggyScript();
      }

      // Verificação final antes de instanciar
      if (!window.PluggyConnect) {
        throw new Error(
          isInIframe()
            ? "O Pluggy não abre no preview (iframe). Abra em nova aba ou publique o app."
            : "Pluggy não carregou corretamente. Tente recarregar a página.",
        );
      }

      const pluggy = new window.PluggyConnect({
        connectToken,
        includeSandbox: true, // Mude para false em produção se desejar
        onSuccess: (itemData) => {
          console.log("✅ Conexão realizada!", itemData);
          setLoading(false);
          if (onSuccess) onSuccess(itemData);
        },
        onError: (err) => {
          console.error("❌ Erro no widget:", err);
          setError("Erro ao conectar banco. Tente novamente.");
          setLoading(false);
        },
        onClose: () => {
          console.log("🚪 Widget fechado");
          setLoading(false);
        },
      });

      pluggy.init();
    } catch (err) {
      console.error("❌ Erro:", err);
      setError(err?.message || "Erro desconhecido");
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
            Carregando Script...
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

          {isInIframe() && (
            <Button variant="outline" size="sm" onClick={openInNewTab} className="w-full">
              Abrir em nova aba
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={loadPluggyScript} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}
