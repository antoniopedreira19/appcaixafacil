import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

import PluggyConnectButton from "../components/bank/PluggyConnectButton";

const N8N_SYNC_WEBHOOK = 'https://grifoworkspace.app.n8n.cloud/webhook/sync-pluggy-data';

export default function BankConnectionsNew() {
  const queryClient = useQueryClient();

  const { data: connections, isLoading } = useQuery({
    queryKey: ['bank-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: [],
  });

  // Conectar e sincronizar após sucesso do widget (via n8n)
  const connectMutation = useMutation({
    mutationFn: async (itemData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const response = await fetch(N8N_SYNC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemData.item.id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar com n8n');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      alert('✅ Banco conectado e sincronizado!');
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    },
  });

  // Sincronizar transações (via n8n)
  const syncMutation = useMutation({
    mutationFn: async (connection) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const response = await fetch(N8N_SYNC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: connection.pluggy_item_id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar com n8n');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      alert('✅ Sincronização concluída!');
    },
    onError: (error) => {
      alert(`❌ Erro: ${error.message}`);
    },
  });

  // Deletar conexão
  const deleteMutation = useMutation({
    mutationFn: async (connection) => {
      if (connection?.pluggy_item_id) {
        try {
          await supabase.functions.invoke('deletePluggyItem', { 
            body: { itemId: connection.pluggy_item_id }
          });
        } catch (e) {
          console.warn('Erro ao deletar no Pluggy:', e);
        }
      }
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', connection.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });

  const handleSuccess = (itemData) => {
    console.log('📦 Dados recebidos:', itemData);
    connectMutation.mutate(itemData);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Conexões Bancárias
        </h1>
        <p className="text-slate-600">
          Conecte seus bancos via <strong>Pluggy</strong> para importar transações automaticamente
        </p>
      </div>

      {/* Instruções */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Pré-requisitos:</strong> seus workflows do n8n precisam estar ativos:
          <div className="mt-2 space-y-1">
            <div><code className="bg-blue-100 px-1 rounded">/webhook/get-pluggy-token</code></div>
            <div><code className="bg-blue-100 px-1 rounded">/webhook/sync-pluggy-data</code></div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Lista de conexões existentes */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Bancos Conectados</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((conn) => (
              <Card key={conn.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{conn.name || 'Banco'}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">Conectado</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate(conn)}
                      disabled={syncMutation.isPending}
                      className="flex-1"
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Remover esta conexão?')) {
                          deleteMutation.mutate(conn);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar nova conexão */}
      <Card className="border-2 border-dashed border-slate-300">
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {connections.length === 0 ? 'Conecte seu Banco' : 'Adicionar Outro Banco'}
          </h3>
          <p className="text-slate-600 mb-4 text-sm">
            Suas credenciais são criptografadas e seguras
          </p>
          
          <div className="max-w-xs mx-auto">
            <PluggyConnectButton onSuccess={handleSuccess} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
