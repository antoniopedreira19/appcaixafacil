import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Calendar, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, isSameMonth, max } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORY_NAMES = {
  vendas: "Vendas",
  servicos: "Serviços",
  investimentos: "Investimentos",
  emprestimos_recebidos: "Empréstimos Recebidos",
  outras_receitas: "Outras Receitas",
  salarios_funcionarios: "Salários",
  fornecedores: "Fornecedores",
  aluguel: "Aluguel",
  contas_servicos: "Contas e Serviços",
  impostos_taxas: "Impostos e Taxas",
  marketing_publicidade: "Marketing",
  equipamentos_materiais: "Equipamentos",
  manutencao: "Manutenção",
  combustivel_transporte: "Transporte",
  emprestimos_pagos: "Empréstimos Pagos",
  outras_despesas: "Outras Despesas"
};

// Função para abreviar e formatar descrição - mais agressiva
const formatDescription = (description, maxChars = 20) => {
  if (!description) return '';
  
  const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => {
      if (['de', 'da', 'do', 'e', 'a', 'o', 'das', 'dos'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };
  
  let cleaned = description
    .replace(/recebido\s+de\s+/gi, '')
    .replace(/enviado\s+para\s+/gi, '')
    .replace(/recebido\s+/gi, '')
    .replace(/enviado\s+/gi, '')
    .replace(/pagamento\s+/gi, 'Pag ')
    .replace(/transferencia\s+/gi, 'Transf ')
    .trim();
  
  cleaned = toTitleCase(cleaned);
  
  if (cleaned.length > maxChars) {
    cleaned = cleaned.substring(0, maxChars) + '...';
  }
  
  return cleaned;
};

// Funções de formatação baseadas no modo selecionado
const formatCurrency = (value, displayMode) => {
  if (displayMode === 'k') {
    return (value / 1000).toFixed(1).replace('.', ',') + 'k';
  } else if (displayMode === 'M') {
    return (value / 1000000).toFixed(1).replace('.', ',') + 'M';
  }
  return Math.round(value).toLocaleString('pt-BR');
};

// Formata valor completo sem decimais (para análise e modal)
const formatCurrencyFull = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value));
};

// Função para gerar análise
const generateAnalysis = (data) => {
  if (data.length < 2) return null;
  
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const incomeVariation = previousMonth.income > 0
    ? ((currentMonth.income - previousMonth.income) / previousMonth.income * 100)
    : 0;
  
  const expenseVariation = previousMonth.expense > 0
    ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense * 100)
    : 0;
  
  const topExpenses = Object.entries(currentMonth.expenseByCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);
  
  return {
    incomeVariation,
    expenseVariation,
    topExpenses,
    currentMonth,
    previousMonth
  };
};

function MonthlyAnalysisTable({ transactions }) {
  const [showMonths, setShowMonths] = useState(6);
  const [displayMode, setDisplayMode] = useState('normal');
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedMonthTransactions, setSelectedMonthTransactions] = useState(null);

  const { monthsData, lastUpdateDate, analysis, allCategories } = useMemo(() => {
    const now = new Date();
    const data = [];
    
    const lastTransactionDate = transactions.length > 0
      ? max(transactions.map(t => new Date(t.date)))
      : now;
    
    const monthsToShow = Math.min(showMonths, 12);
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      const incomeByCategory = {};
      const expenseByCategory = {};
      
      monthTransactions.forEach(t => {
        if (t.type === 'income') {
          incomeByCategory[t.category] = incomeByCategory[t.category] || { total: 0, transactions: [] };
          incomeByCategory[t.category].total += t.amount;
          incomeByCategory[t.category].transactions.push(t);
        } else {
          expenseByCategory[t.category] = expenseByCategory[t.category] || { total: 0, transactions: [] };
          expenseByCategory[t.category].total += Math.abs(t.amount);
          expenseByCategory[t.category].transactions.push(t);
        }
      });
      
      const totalIncome = Object.values(incomeByCategory).reduce((sum, cat) => sum + cat.total, 0);
      const totalExpense = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.total, 0);
      
      data.push({
        date,
        month: format(date, "MMM/yy", { locale: ptBR }),
        fullMonth: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
        isCurrentMonth: isSameMonth(date, now),
        incomeByCategory,
        expenseByCategory,
        transactionCount: monthTransactions.length
      });
    }
    
    const incomeCategoriesTotal = {};
    const expenseCategoriesTotal = {};
    
    data.forEach(month => {
      Object.entries(month.incomeByCategory).forEach(([cat, categoryData]) => {
        incomeCategoriesTotal[cat] = (incomeCategoriesTotal[cat] || 0) + categoryData.total;
      });
      Object.entries(month.expenseByCategory).forEach(([cat, categoryData]) => {
        expenseCategoriesTotal[cat] = (expenseCategoriesTotal[cat] || 0) + categoryData.total;
      });
    });
    
    const sortedIncomeCategories = Object.entries(incomeCategoriesTotal)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
    
    const sortedExpenseCategories = Object.entries(expenseCategoriesTotal)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
    
    const analysisText = generateAnalysis(data);
    
    return {
      monthsData: data,
      lastUpdateDate: lastTransactionDate,
      analysis: analysisText,
      allCategories: {
        income: sortedIncomeCategories,
        expense: sortedExpenseCategories
      }
    };
  }, [transactions, showMonths]);

  const groupedTransactionsByDescription = useMemo(() => {
    const grouped = {};
    
    monthsData.forEach((month, monthIdx) => {
      Object.entries(month.incomeByCategory).forEach(([category, data]) => {
        data.transactions.forEach(transaction => {
          const formattedDesc = formatDescription(transaction.description, 20);
          const key = `income-${category}-${formattedDesc}`;
          
          if (!grouped[key]) {
            grouped[key] = {
              type: 'income',
              category,
              description: formattedDesc,
              byMonth: {},
              totalAmount: 0
            };
          }
          
          if (!grouped[key].byMonth[monthIdx]) {
            grouped[key].byMonth[monthIdx] = {
              amount: 0,
              transactions: []
            };
          }
          
          grouped[key].byMonth[monthIdx].amount += Math.abs(transaction.amount);
          grouped[key].byMonth[monthIdx].transactions.push(transaction);
          grouped[key].totalAmount += Math.abs(transaction.amount);
        });
      });
      
      Object.entries(month.expenseByCategory).forEach(([category, data]) => {
        data.transactions.forEach(transaction => {
          const formattedDesc = formatDescription(transaction.description, 20);
          const key = `expense-${category}-${formattedDesc}`;
          
          if (!grouped[key]) {
            grouped[key] = {
              type: 'expense',
              category,
              description: formattedDesc,
              byMonth: {},
              totalAmount: 0
            };
          }
          
          if (!grouped[key].byMonth[monthIdx]) {
            grouped[key].byMonth[monthIdx] = {
              amount: 0,
              transactions: []
            };
          }
          
          grouped[key].byMonth[monthIdx].amount += Math.abs(transaction.amount);
          grouped[key].byMonth[monthIdx].transactions.push(transaction);
          grouped[key].totalAmount += Math.abs(transaction.amount);
        });
      });
    });
    
    return grouped;
  }, [monthsData]);

  const toggleRow = (rowType) => {
    if (expandedRow === rowType) {
      setExpandedRow(null);
      setExpandedCategory(null);
    } else {
      setExpandedRow(rowType);
      setExpandedCategory(null);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleClickValue = (transactions, monthData) => {
    setSelectedMonthTransactions({
      transactions,
      month: monthData.fullMonth
    });
  };

  const getColumnWidth = () => {
    if (displayMode === 'normal') return 'w-24';
    if (displayMode === 'k') return 'w-20';
    if (displayMode === 'M') return 'w-20';
    return 'w-24';
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center justify-between w-full md:w-auto">
              <CardTitle className="text-base">Análise Mensal Comparativa</CardTitle>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 md:hidden">
                <Info className="w-3 h-3" />
                <span>Atualizado: {format(lastUpdateDate, "dd/MM/yyyy")}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 mr-2">
                <Info className="w-3 h-3" />
                <span>Atualizado: {format(lastUpdateDate, "dd/MM/yy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">Visualização:</span>
                <Select value={displayMode} onValueChange={setDisplayMode}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="k">Em mil (k)</SelectItem>
                    <SelectItem value="M">Em milhão (M)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showMonths === 6 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMonths(6)}
                  className="h-8 text-xs"
                >
                  6 meses
                </Button>
                <Button
                  variant={showMonths === 12 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMonths(12)}
                  className="h-8 text-xs"
                >
                  12 meses
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="overflow-x-auto" style={{ minHeight: '500px', maxHeight: '70vh' }}>
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-white z-30">
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-1.5 font-semibold text-slate-900 sticky left-0 bg-white z-20 w-20">
                    
                  </th>
                  {monthsData.map((month, index) => (
                    <th key={index} className={`p-1 text-center ${getColumnWidth()}`}>
                      <div className={`${
                        month.isCurrentMonth 
                          ? 'bg-blue-100 text-blue-900 font-bold rounded p-1' 
                          : 'text-slate-700'
                      }`}>
                        <div className="text-[10px] leading-tight">{month.month}</div>
                        {month.isCurrentMonth && (
                          <Badge className="bg-blue-600 text-white text-[8px] mt-0.5 px-1 py-0 h-3">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b border-slate-100 hover:bg-emerald-50 cursor-pointer transition-colors ${
                  expandedRow === 'income' ? 'bg-emerald-50' : ''
                }`}>
                  <td 
                    className="p-1.5 font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100"
                    onClick={() => toggleRow('income')}
                  >
                    <div className="flex items-center gap-1">
                      {expandedRow === 'income' ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="text-emerald-700 text-xs">Entradas</span>
                    </div>
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-1 text-center">
                      <div className="font-bold text-emerald-600 text-xs whitespace-nowrap">
                        R$ {formatCurrency(month.income, displayMode)}
                      </div>
                    </td>
                  ))}
                </tr>

                {expandedRow === 'income' && allCategories.income.map((category) => {
                  const categoryTransactions = Object.entries(groupedTransactionsByDescription)
                    .filter(([key, data]) => data.type === 'income' && data.category === category)
                    .sort((a, b) => b[1].totalAmount - a[1].totalAmount);
                  
                  if (categoryTransactions.length === 0) return null;
                  
                  return (
                    <React.Fragment key={category}>
                      <tr 
                        className="border-b border-slate-50 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer"
                        onClick={() => toggleCategory(`income-${category}`)}
                      >
                        <td className="p-1 pl-4 sticky left-0 bg-emerald-50/80 z-10 border-r border-slate-100">
                          <div className="flex items-center gap-1">
                            {expandedCategory === `income-${category}` ? (
                              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                            )}
                            <span className="text-[10px] font-medium text-slate-900">
                              {CATEGORY_NAMES[category] || category}
                            </span>
                          </div>
                        </td>
                        {monthsData.map((month, idx) => (
                          <td key={idx} className="p-1 text-center bg-emerald-50/50">
                            {month.incomeByCategory[category] ? (
                              <span className="text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                                R$ {formatCurrency(month.incomeByCategory[category].total, displayMode)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {expandedCategory === `income-${category}` && categoryTransactions.map(([key, data]) => (
                        <tr key={key} className="border-b border-slate-50 hover:bg-emerald-100/30">
                          <td className="p-1 pl-7 sticky left-0 bg-white z-10 border-r border-slate-100">
                            <span className="text-[9px] text-slate-900 block truncate max-w-[75px]" title={data.description}>
                              {data.description}
                            </span>
                          </td>
                          {monthsData.map((_, monthIdx) => (
                            <td key={monthIdx} className="p-1 text-center bg-white">
                              {data.byMonth[monthIdx] ? (
                                <button
                                  onClick={() => handleClickValue(
                                    data.byMonth[monthIdx].transactions,
                                    monthsData[monthIdx]
                                  )}
                                  className="text-[9px] font-semibold text-emerald-600 whitespace-nowrap hover:underline cursor-pointer"
                                >
                                  R$ {formatCurrency(data.byMonth[monthIdx].amount, displayMode)}
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-300">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                <tr className={`border-b border-slate-100 hover:bg-rose-50 cursor-pointer transition-colors ${
                  expandedRow === 'expense' ? 'bg-rose-50' : ''
                }`}>
                  <td 
                    className="p-1.5 font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100"
                    onClick={() => toggleRow('expense')}
                  >
                    <div className="flex items-center gap-1">
                      {expandedRow === 'expense' ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="text-rose-700 text-xs">Saídas</span>
                    </div>
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-1 text-center">
                      <div className="font-bold text-rose-600 text-xs whitespace-nowrap">
                        R$ {formatCurrency(month.expense, displayMode)}
                      </div>
                    </td>
                  ))}
                </tr>

                {expandedRow === 'expense' && allCategories.expense.map((category) => {
                  const categoryTransactions = Object.entries(groupedTransactionsByDescription)
                    .filter(([key, data]) => data.type === 'expense' && data.category === category)
                    .sort((a, b) => b[1].totalAmount - a[1].totalAmount);
                  
                  if (categoryTransactions.length === 0) return null;
                  
                  return (
                    <React.Fragment key={category}>
                      <tr 
                        className="border-b border-slate-50 bg-rose-50/50 hover:bg-rose-50 cursor-pointer"
                        onClick={() => toggleCategory(`expense-${category}`)}
                      >
                        <td className="p-1 pl-4 sticky left-0 bg-rose-50/80 z-10 border-r border-slate-100">
                          <div className="flex items-center gap-1">
                            {expandedCategory === `expense-${category}` ? (
                              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                            )}
                            <span className="text-[10px] font-medium text-slate-900">
                              {CATEGORY_NAMES[category] || category}
                            </span>
                          </div>
                        </td>
                        {monthsData.map((month, idx) => (
                          <td key={idx} className="p-1 text-center bg-rose-50/50">
                            {month.expenseByCategory[category] ? (
                              <span className="text-[10px] font-semibold text-rose-700 whitespace-nowrap">
                                R$ {formatCurrency(month.expenseByCategory[category].total, displayMode)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {expandedCategory === `expense-${category}` && categoryTransactions.map(([key, data]) => (
                        <tr key={key} className="border-b border-slate-50 hover:bg-rose-100/30">
                          <td className="p-1 pl-7 sticky left-0 bg-white z-10 border-r border-slate-100">
                            <span className="text-[9px] text-slate-900 block truncate max-w-[75px]" title={data.description}>
                              {data.description}
                            </span>
                          </td>
                          {monthsData.map((_, monthIdx) => (
                            <td key={monthIdx} className="p-1 text-center bg-white">
                              {data.byMonth[monthIdx] ? (
                                <button
                                  onClick={() => handleClickValue(
                                    data.byMonth[monthIdx].transactions,
                                    monthsData[monthIdx]
                                  )}
                                  className="text-[9px] font-semibold text-rose-600 whitespace-nowrap hover:underline cursor-pointer"
                                >
                                  R$ {formatCurrency(data.byMonth[monthIdx].amount, displayMode)}
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-300">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="p-1.5 font-bold text-slate-900 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 text-xs">
                    Resultado
                  </td>
                  {monthsData.map((month, index) => (
                    <td key={index} className="p-1 text-center">
                      <div className={`font-bold text-xs whitespace-nowrap ${
                        month.balance >= 0 ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        R$ {formatCurrency(month.balance, displayMode)}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Análise do Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-slate-600 mb-2">Variação das Entradas</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.abs(analysis.incomeVariation).toFixed(1)}%
                  </p>
                  <Badge className={
                    analysis.incomeVariation >= 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }>
                    {analysis.incomeVariation >= 0 ? '↑' : '↓'} vs mês anterior
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  De R$ {formatCurrencyFull(analysis.previousMonth.income)} para R$ {formatCurrencyFull(analysis.currentMonth.income)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-rose-200">
                <p className="text-sm text-slate-600 mb-2">Variação das Saídas</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.abs(analysis.expenseVariation).toFixed(1)}%
                  </p>
                  <Badge className={
                    analysis.expenseVariation >= 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }>
                    {analysis.expenseVariation >= 0 ? '↑' : '↓'} vs mês anterior
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  De R$ {formatCurrencyFull(analysis.previousMonth.expense)} para R$ {formatCurrencyFull(analysis.currentMonth.expense)}
                </p>
              </div>
            </div>

            {analysis.topExpenses.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  💰 Principais Gastos do Mês Atual
                </p>
                <div className="space-y-2">
                  {analysis.topExpenses.map(([category, data], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-900">
                          {CATEGORY_NAMES[category] || category}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-rose-600">
                        R$ {formatCurrencyFull(data.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysis.incomeVariation >= 0 ? (
                  <span className="font-semibold text-emerald-600">
                    Ótima notícia! Suas receitas cresceram {Math.abs(analysis.incomeVariation).toFixed(1)}% em relação ao mês anterior.
                  </span>
                ) : (
                  <span className="font-semibold text-rose-600">
                    Atenção: Suas receitas caíram {Math.abs(analysis.incomeVariation).toFixed(1)}% em relação ao mês anterior.
                  </span>
                )}
                {' '}
                {analysis.expenseVariation >= 0 ? (
                  <span>
                    Suas despesas aumentaram {Math.abs(analysis.expenseVariation).toFixed(1)}%, 
                    sendo que os maiores gastos foram em {CATEGORY_NAMES[analysis.topExpenses[0][0]] || analysis.topExpenses[0][0]}.
                  </span>
                ) : (
                  <span className="text-emerald-600">
                    Parabéns! Você conseguiu reduzir suas despesas em {Math.abs(analysis.expenseVariation).toFixed(1)}%.
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedMonthTransactions} onOpenChange={() => setSelectedMonthTransactions(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transações - {selectedMonthTransactions?.month}</DialogTitle>
          </DialogHeader>
          {selectedMonthTransactions && (
            <div className="space-y-3">
              {selectedMonthTransactions.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-slate-600">
                          {format(new Date(transaction.date), "dd/MM/yyyy")}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_NAMES[transaction.category] || transaction.category}
                        </Badge>
                        {transaction.payment_method && (
                          <span className="text-xs text-slate-500 capitalize">
                            {transaction.payment_method.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        R$ {formatCurrencyFull(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default React.memo(MonthlyAnalysisTable);