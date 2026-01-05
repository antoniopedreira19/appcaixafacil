import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CashFlowChart({ transactions }) {
  // Agrupar transações por mês
  const monthlyData = React.useMemo(() => {
    const dataMap = {};
    
    transactions.forEach(transaction => {
      const monthKey = format(new Date(transaction.date), 'MMM yyyy', { locale: ptBR });
      
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = {
          month: monthKey,
          receitas: 0,
          despesas: 0,
          saldo: 0
        };
      }
      
      if (transaction.type === 'income') {
        dataMap[monthKey].receitas += transaction.amount;
      } else {
        dataMap[monthKey].despesas += Math.abs(transaction.amount);
      }
      dataMap[monthKey].saldo = dataMap[monthKey].receitas - dataMap[monthKey].despesas;
    });
    
    return Object.values(dataMap).slice(-6); // últimos 6 meses
  }, [transactions]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Fluxo de Caixa Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
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
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Receitas"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="Despesas"
              dot={{ fill: '#ef4444', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Saldo"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}