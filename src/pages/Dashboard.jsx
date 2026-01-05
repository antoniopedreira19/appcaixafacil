import React, { useState, useMemo, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfYear, endOfYear, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import AccountBalance from "../components/dashboard/AccountBalance";
import MonthSummaryCards from "../components/dashboard/MonthSummaryCards";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import ExpandedTransactionList from "../components/dashboard/ExpandedTransactionList";
import CashBalanceEvolution from "../components/dashboard/CashBalanceEvolution";

// Lazy load componentes pesados
const MonthlyAnalysisTable = lazy(() => import("../components/dashboard/MonthlyAnalysisTable"));

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [showBalance, setShowBalance] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [customPeriod, setCustomPeriod] = useState(null);
  const [tempCustomPeriod, setTempCustomPeriod] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: recurringExpenses, isLoading: loadingRecurring } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => base44.entities.RecurringExpense.list('-due_day'),
    initialData: [],
  });

  const { data: bankConnections, isLoading: loadingConnections } = useQuery({
    queryKey: ['bank-connections'],
    queryFn: () => base44.entities.BankConnection.list('-created_date'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const isLoading = loadingTransactions || loadingRecurring || loadingConnections;

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
  };

  const monthOptions = useMemo(() => {
    const options = [];
    
    // Adiciona apenas ano atual e ano passado
    const currentYear = new Date().getFullYear();
    
    // Ano atual
    options.push({
      value: `year_${currentYear}`,
      label: `📅 Ano Completo ${currentYear}`,
      shortLabel: `${currentYear}`,
      date: null,
      isYear: true,
      year: currentYear
    });
    
    // Ano passado
    options.push({
      value: `year_${currentYear - 1}`,
      label: `📅 Ano Completo ${currentYear - 1}`,
      shortLabel: `${currentYear - 1}`,
      date: null,
      isYear: true,
      year: currentYear - 1
    });
    
    // Adiciona separador visual
    options.push({
      value: 'separator_1',
      label: '───────────────',
      shortLabel: '───',
      date: null,
      disabled: true
    });
    
    // Adiciona meses individuais
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: i.toString(),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        shortLabel: format(date, "MMMM", { locale: ptBR }),
        date: date
      });
    }
    
    // Adiciona separador visual
    options.push({
      value: 'separator_2',
      label: '───────────────',
      shortLabel: '───',
      date: null,
      disabled: true
    });
    
    // Adiciona opção personalizada
    options.push({
      value: 'custom',
      label: '🎯 Personalizar período...',
      shortLabel: 'Personalizado',
      date: null
    });
    
    return options;
  }, []);

  const accounts = useMemo(() => {
    const accountSet = new Set();
    transactions.forEach(t => {
      if (t.bank_account) {
        accountSet.add(t.bank_account);
      }
    });
    return Array.from(accountSet);
  }, [transactions]);

  const { filteredTransactions, periodStart, periodEnd } = useMemo(() => {
    let start, end;

    if (customPeriod) {
      start = startOfDay(new Date(customPeriod.startDate));
      end = endOfDay(new Date(customPeriod.endDate));
    } else if (selectedMonth.startsWith('year_')) {
      // Filtro de ano completo
      const year = parseInt(selectedMonth.replace('year_', ''));
      start = startOfYear(new Date(year, 0, 1));
      end = endOfYear(new Date(year, 11, 31));
    } else {
      // Filtro de mês individual
      const monthsBack = parseInt(selectedMonth);
      const selectedDate = subMonths(new Date(), monthsBack);
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    }

    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const dateMatch = date >= start && date <= end;
      const accountMatch = selectedAccount === "all" || t.bank_account === selectedAccount;
      return dateMatch && accountMatch;
    });

    return {
      filteredTransactions: filtered,
      periodStart: start,
      periodEnd: end
    };
  }, [transactions, selectedMonth, selectedAccount, customPeriod]);

  const totalBalance = useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    return filteredByAccount.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);
  }, [transactions, selectedAccount]);

  const { initialBalance, finalBalance, periodLabel } = useMemo(() => {
    const filteredByAccount = selectedAccount === "all" 
      ? transactions 
      : transactions.filter(t => t.bank_account === selectedAccount);
    
    const initial = filteredByAccount
      .filter(t => new Date(t.date) < periodStart)
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
      }, 0);
    
    const final = filteredByAccount
      .filter(t => new Date(t.date) <= periodEnd)
      .reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
      }, 0);
    
    let label;
    if (customPeriod) {
      const startFormatted = format(periodStart, "MMM/yy", { locale: ptBR });
      const endFormatted = format(periodEnd, "MMM/yy", { locale: ptBR });
      label = startFormatted === endFormatted ? startFormatted : `${startFormatted} a ${endFormatted}`;
    } else if (selectedMonth.startsWith('year_')) {
      // Label para ano completo
      const year = selectedMonth.replace('year_', '');
      label = `Ano ${year}`;
    } else {
      label = format(periodStart, "MMM/yy", { locale: ptBR });
    }
    
    return {
      initialBalance: initial,
      finalBalance: final,
      periodLabel: label
    };
  }, [transactions, selectedAccount, periodStart, periodEnd, customPeriod, selectedMonth]);

  const monthStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const handleToggleCard = (type) => {
    setExpandedCard(expandedCard === type ? null : type);
  };

  const handleMonthChange = (value) => {
    if (value === 'custom') {
      setCustomDialogOpen(true);
    } else if (value.startsWith('separator_')) {
      // Ignora cliques nos separadores
      return;
    } else {
      setCustomPeriod(null);
      setSelectedMonth(value);
    }
  };

  const handleApplyCustomPeriod = () => {
    setCustomPeriod(tempCustomPeriod);
    setSelectedMonth('custom');
    setCustomDialogOpen(false);
  };

  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'income');
  }, [filteredTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense');
  }, [filteredTransactions]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-3">
      <AccountBalance
        balance={totalBalance}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        accounts={accounts}
        showBalance={showBalance}
        onToggleBalance={() => setShowBalance(!showBalance)}
        transactions={transactions}
        bankConnections={bankConnections}
        userId={user?.id}
        onRefreshData={handleRefreshData}
      />

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid h-9">
          <TabsTrigger value="overview" className="gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2 text-sm">
            <BarChart3 className="w-4 h-4" />
            Análise Avançada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Resumo do Período
            </h2>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-56 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                    className={option.disabled ? 'text-slate-300 cursor-default' : ''}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MonthSummaryCards
            income={monthStats.income}
            expense={monthStats.expense}
            balance={monthStats.balance}
            initialBalance={initialBalance}
            finalBalance={finalBalance}
            periodLabel={periodLabel}
            onClickIncome={() => handleToggleCard('income')}
            onClickExpense={() => handleToggleCard('expense')}
            expandedCard={expandedCard}
          >
            {{
              income: incomeTransactions.length > 0 && (
                <ExpandedTransactionList
                  transactions={incomeTransactions}
                  type="income"
                  onClose={() => setExpandedCard(null)}
                  allTransactions={transactions}
                />
              ),
              expense: expenseTransactions.length > 0 && (
                <ExpandedTransactionList
                  transactions={expenseTransactions}
                  type="expense"
                  onClose={() => setExpandedCard(null)}
                  allTransactions={transactions}
                />
              )
            }}
          </MonthSummaryCards>

          {transactions.length === 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Comece agora!</strong> Importe um extrato bancário ou adicione transações manualmente para visualizar seus dados.
              </AlertDescription>
            </Alert>
          )}

          {transactions.length > 0 && (
            <CashBalanceEvolution transactions={transactions} />
          )}

          <RecentTransactions transactions={transactions} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Análise Avançada</h2>
          </div>
          
          {transactions.length === 0 ? (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>Adicione transações</strong> para visualizar análises e projeções financeiras avançadas.
              </AlertDescription>
            </Alert>
          ) : (
            <Suspense fallback={
              <div className="space-y-3">
                <Skeleton className="h-96 w-full" />
              </div>
            }>
              <MonthlyAnalysisTable transactions={transactions} />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para período personalizado */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Inicial</label>
              <Input
                type="date"
                value={tempCustomPeriod.startDate}
                onChange={(e) => setTempCustomPeriod({ ...tempCustomPeriod, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Final</label>
              <Input
                type="date"
                value={tempCustomPeriod.endDate}
                onChange={(e) => setTempCustomPeriod({ ...tempCustomPeriod, endDate: e.target.value })}
              />
            </div>
            <Button onClick={handleApplyCustomPeriod} className="w-full">
              Aplicar Período
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}