import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock
} from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BankConnectionCard({ connection, onSync, onDelete }) {
  const [syncing, setSyncing] = useState(false);

  const statusConfig = {
    active: {
      color: 'bg-emerald-100 text-emerald-700',
      icon: CheckCircle2,
      label: 'Ativa'
    },
    inactive: {
      color: 'bg-slate-100 text-slate-700',
      icon: Clock,
      label: 'Inativa'
    },
    error: {
      color: 'bg-rose-100 text-rose-700',
      icon: AlertCircle,
      label: 'Erro'
    },
    updating: {
      color: 'bg-blue-100 text-blue-700',
      icon: Loader2,
      label: 'Sincronizando'
    }
  };

  const status = statusConfig[connection.status] || statusConfig.inactive;
  const StatusIcon = status.icon;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {connection.bank_logo ? (
              <img 
                src={connection.bank_logo} 
                alt={connection.bank_name}
                className="w-12 h-12 rounded-lg object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{connection.bank_name}</CardTitle>
              {connection.last_sync && (
                <p className="text-xs text-slate-500 mt-1">
                  Última sinc: {format(new Date(connection.last_sync), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <Badge className={status.color}>
            <StatusIcon className={`w-3 h-3 mr-1 ${connection.status === 'updating' ? 'animate-spin' : ''}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contas */}
        {connection.accounts && connection.accounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Contas Conectadas:</p>
            {connection.accounts.map((account, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{account.name}</p>
                  {account.number && (
                    <p className="text-xs text-slate-500">Conta: {account.number}</p>
                  )}
                </div>
                {account.balance !== undefined && (
                  <p className="text-sm font-semibold text-slate-900">
                    R$ {account.balance.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mensagem de erro */}
        {connection.status === 'error' && connection.error_message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {connection.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || connection.status === 'updating'}
            className="flex-1"
          >
            {syncing || connection.status === 'updating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar Banco</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja desconectar {connection.bank_name}? 
                  As transações já importadas não serão removidas, mas a sincronização automática será interrompida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(connection.id)}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}