import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, TrendingUp, TrendingDown, HelpCircle, RefreshCw, Loader2, Building2 } from "lucide-react";
import { subMonths, isAfter, format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function AccountBalance({
  balance,
  selectedAccount,
  onAccountChange,
  accounts = [],
  showBalance,
  onToggleBalance,
  transactions = [],
  bankConnections = [],
  userId,
  onRefreshData,
}) {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // Helper para pegar o nome da conta selecionada
  const getSelectedAccountName = () => {
    if (selectedAccount === "all") return accounts.length === 1 ? accounts[0]?.name : "Todas as contas";
    const account = accounts.find((a) => a.pluggy_account_id === selectedAccount || a.id === selectedAccount);
    return account ? account.name : "Conta Selecionada";
  };

  const handleRefreshData = async () => {
    const connection = bankConnections?.[0];
    const itemId = connection?.pluggy_item_id;

    if (!itemId) {
      toast.error("Conecte uma conta bancária primeiro.");
      return;
    }

    setIsRefreshing(true);
    setIsDisabled(true);

    try {
      const response = await fetch("https://grifoworkspace.app.n8n.cloud/webhook/sync-pluggy-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: itemId, userId: userId }),
      });

      if (!response.ok) throw new Error("Falha na sincronização");

      toast.success("Dados atualizados com sucesso!");
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error(error.message || "Erro ao atualizar.");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setIsDisabled(false), 15000);
    }
  };

  const previousMonthComparison = useMemo(() => {
    const now = new Date();
    const previousMonthDate = subMonths(now, 1);

    // Filtra transações: Se "all", pega tudo. Se não, filtra pelo ID da conta.
    // IMPORTANTE: Verifique se sua transação usa 'account_id' ou 'bank_account' para guardar o ID
    const filteredTransactions =
      selectedAccount === "all"
        ? transactions
        : transactions.filter((t) => (t.account_id || t.bank_account) === selectedAccount);

    const transactionsSinceThen = filteredTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return isAfter(tDate, previousMonthDate) && tDate <= now;
    });

    const changeInPeriod = transactionsSinceThen.reduce((acc, t) => {
      return acc + (t.type === "income" ? t.amount : -Math.abs(t.amount));
    }, 0);

    const previousBalance = balance - changeInPeriod;
    const variation =
      previousBalance !== 0 ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100 : balance > 0 ? 100 : 0;

    return {
      previousBalance,
      variation,
      isPositive: variation >= 0,
      previousDate: previousMonthDate,
    };
  }, [transactions, selectedAccount, balance]);

  const handleInfoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInfoDialogOpen(true);
  };

  const hasBankConnections = bankConnections && bankConnections.length > 0;

  return (
    <>
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl text-white">
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-emerald-100 text-xs font-medium">Saldo bancário</span>
            </div>
            <div className="flex items-center gap-1">
              {hasBankConnections ? (
                <Button
                  onClick={handleRefreshData}
                  disabled={isRefreshing || isDisabled}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-white hover:bg-emerald-400/30 text-xs gap-1"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Atualizar
                    </>
                  )}
                </Button>
              ) : (
                <Link to={createPageUrl("BankConnectionsNew")}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-white hover:bg-emerald-400/30 text-xs gap-1"
                  >
                    <Building2 className="w-3 h-3" />
                    Conectar Banco
                  </Button>
                </Link>
              )}
              <button onClick={onToggleBalance} className="p-1 hover:bg-emerald-400/30 rounded-lg transition-colors">
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mb-1.5">
            {showBalance ? (
              <>
                <h2 className="text-2xl font-bold">R$ {formatCurrency(balance)}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${previousMonthComparison.isPositive ? "bg-emerald-400/30" : "bg-rose-400/30"}`}
                  >
                    {previousMonthComparison.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-[10px] font-semibold">
                      {Math.abs(previousMonthComparison.variation).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-100 text-[10px]">
                      vs mês anterior R$ {formatCurrency(previousMonthComparison.previousBalance)}
                    </span>
                    <div
                      onClick={handleInfoClick}
                      onTouchStart={handleInfoClick}
                      className="flex items-center justify-center w-7 h-7 hover:bg-emerald-400/30 active:bg-emerald-400/40 rounded-full transition-colors cursor-pointer"
                      style={{ zIndex: 10 }}
                    >
                      <HelpCircle className="w-5 h-5 text-emerald-100" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <h2 className="text-2xl font-bold">R$ ••••••</h2>
            )}
          </div>

          <Select value={selectedAccount} onValueChange={onAccountChange}>
            <SelectTrigger className="bg-emerald-400/30 border-0 text-white hover:bg-emerald-400/40 h-8 text-sm">
              <SelectValue>{getSelectedAccountName()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem
                  key={account.id || account.pluggy_account_id}
                  value={account.pluggy_account_id || account.id}
                >
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Comparação com Mês Anterior
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700">
            <p>Saldo calculado reversamente: partindo de hoje e descontando as movimentações dos últimos 30 dias.</p>
            <p>
              Saldo 30 dias atrás: <strong>R$ {formatCurrency(previousMonthComparison.previousBalance)}</strong>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
