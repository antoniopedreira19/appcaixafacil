import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SpendingTrends({ transactions }) {
  const trendsData = useMemo(() => {
    const monthsToShow = 6;
    const data = [];
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      data.push({
        month: format(date, 'MMM/yy', { locale: ptBR }),
        receitas: income,
        despesas: expense,
        saldo: income - expense
      });
    }
    
    return data;
  }, [transactions]);

  const comparison = useMemo(() => {
    if (trendsData.length < 2) return null;
    
    const current = trendsData[trendsData.length - 1];
    const previous = trendsData[trendsData.length - 2];
    
    const incomeChange = previous.receitas > 0 
      ? ((current.receitas - previous.receitas) / previous.receitas * 100)
      : 0;
    
    const expenseChange = previous.despesas > 0
      ? ((current.despesas - previous.despesas) / previous.despesas * 100)
      : 0;
    
    return {
      income: {
        value: incomeChange,
        direction: incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'neutral'
      },
      expense: {
        value: expenseChange,
        direction: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'neutral'
      }
    };
  }, [trendsData]);

  const getTrendIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className="w-4 h-4" />;
    if (direction === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (direction, isExpense = false) => {
    if (direction === 'neutral') return 'text-slate-600 bg-slate-100';
    if (isExpense) {
      // Para despesas: subir é ruim, descer é bom
      return direction === 'up' ? 'text-rose-700 bg-rose-100' : 'text-green-700 bg-green-100';
    } else {
      // Para receitas: subir é bom, descer é ruim
      return direction === 'up' ? 'text-green-700 bg-green-100' : 'text-rose-700 bg-rose-100';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tendência dos Últimos 6 Meses</CardTitle>
          {comparison && (
            <div className="flex items-center gap-3">
              <Badge className={getTrendColor(comparison.income.direction, false)}>
                {getTrendIcon(comparison.income.direction)}
                <span className="ml-1">
                  Receitas {Math.abs(comparison.income.value).toFixed(0)}%
                </span>
              </Badge>
              <Badge className={getTrendColor(comparison.expense.direction, true)}>
                {getTrendIcon(comparison.expense.direction)}
                <span className="ml-1">
                  Despesas {Math.abs(comparison.expense.value).toFixed(0)}%
                </span>
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Receitas"
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Despesas"
              dot={{ fill: '#ef4444' }}
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Saldo"
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}