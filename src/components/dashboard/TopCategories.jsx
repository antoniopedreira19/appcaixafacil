import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

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

const CATEGORY_COLORS = {
  salarios_funcionarios: "#8b5cf6",
  fornecedores: "#ec4899",
  aluguel: "#f59e0b",
  contas_servicos: "#3b82f6",
  impostos_taxas: "#ef4444",
  marketing_publicidade: "#10b981",
  equipamentos_materiais: "#6366f1",
  manutencao: "#f97316",
  combustivel_transporte: "#14b8a6",
  emprestimos_pagos: "#78716c",
  outras_despesas: "#64748b"
};

export default function TopCategories({ transactions, type = 'expense' }) {
  const topCategories = useMemo(() => {
    const categoryTotals = {};
    
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        const amount = Math.abs(t.amount);
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      });
    
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        name: CATEGORY_NAMES[category] || category,
        amount,
        percentage: total > 0 ? (amount / total * 100) : 0,
        color: CATEGORY_COLORS[category] || '#64748b'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, type]);

  const totalAmount = topCategories.reduce((sum, cat) => sum + cat.amount, 0);

  if (topCategories.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">
            {type === 'expense' ? 'Principais Despesas' : 'Principais Receitas'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-slate-500">
          <p className="text-sm">Nenhuma transação registrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {type === 'expense' ? 'Principais Despesas' : 'Principais Receitas'}
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            Top 5
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCategories.map((category, index) => (
          <div key={category.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {index + 1}.
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {category.name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  R$ {category.amount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <Progress 
              value={category.percentage} 
              className="h-2"
              style={{
                '--progress-background': category.color
              }}
            />
          </div>
        ))}
        
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className={`text-lg font-bold ${
              type === 'income' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              R$ {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}