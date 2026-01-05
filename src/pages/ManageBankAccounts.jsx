import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Edit2, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react";

export default function ManageBankAccounts() {
  const queryClient = useQueryClient();
  const [editingAccount, setEditingAccount] = useState(null);
  const [newName, setNewName] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  // Agrupa transações por conta bancária
  const accountGroups = useMemo(() => {
    const groups = {};
    
    transactions.forEach(t => {
      const account = t.bank_account || 'Sem conta';
      if (!groups[account]) {
        groups[account] = {
          name: account,
          count: 0,
          transactions: []
        };
      }
      groups[account].count++;
      groups[account].transactions.push(t);
    });
    
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [transactions]);

  const handleRename = async (oldName, newNameValue) => {
    if (!newNameValue.trim()) {
      alert('Digite um nome válido para a conta');
      return;
    }

    setProcessing(true);
    
    try {
      const account = accountGroups.find(a => a.name === oldName);
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      // Atualiza todas as transações dessa conta
      for (const transaction of account.transactions) {
        await base44.entities.Transaction.update(transaction.id, {
          ...transaction,
          bank_account: newNameValue.trim()
        });
      }

      // Invalida cache e limpa estados
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setEditingAccount(null);
      setNewName("");
      
      alert(`✅ ${account.count} transações renomeadas de "${oldName}" para "${newNameValue.trim()}"!`);
      
    } catch (error) {
      console.error('Erro ao renomear conta:', error);
      alert('❌ Erro ao renomear conta. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const suggestBankNames = (currentName, index) => {
    // Se já está no formato "Banco X", mantém
    if (currentName.match(/^Banco \d+$/i)) {
      return currentName;
    }
    
    // Sugere baseado no índice
    return `Banco ${index + 1}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Gerenciar Contas Bancárias
        </h1>
        <p className="text-slate-600">
          Renomeie suas contas bancárias para melhor organização
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Dica:</strong> Use nomes claros como "Banco 1", "Banco 2" ou o nome real do banco (ex: "Nubank", "C6 Bank").
          Todas as transações dessa conta serão atualizadas automaticamente.
        </AlertDescription>
      </Alert>

      {accountGroups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600">Nenhuma transação encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accountGroups.map((account, index) => (
            <Card key={account.name} className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <p className="text-sm text-slate-600">
                        {account.count} transações
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Conta #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {editingAccount === account.name ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Novo nome da conta</Label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Banco 1, Nubank, C6 Bank..."
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRename(account.name, newName)}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Renomeando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingAccount(null);
                          setNewName("");
                        }}
                        disabled={processing}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-1">Nome sugerido:</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {suggestBankNames(account.name, index)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setEditingAccount(account.name);
                        setNewName(suggestBankNames(account.name, index));
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Renomear Conta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {accountGroups.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Organize suas contas!</strong> Renomeie cada grupo de transações para facilitar 
            o acompanhamento no Dashboard e Relatórios. O saldo total será calculado separadamente para cada conta.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}