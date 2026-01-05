import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FinancialProjection({ currentBalance, transactions, recurringExpenses }) {
  const projection = useMemo(() => {
    const now = new Date();
    const projections = [];
    
    // Calcula média de receitas dos últimos 3 meses
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const recentIncomes = transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= threeMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    const avgMonthlyIncome = recentIncomes / 3;
    
    // Soma despesas recorrentes ativas
    const monthlyRecurringExpenses = recurringExpenses
      .filter(e => e.status === 'active')
      .reduce((sum, e) => sum + e.amount, 0);
    
    let balance = currentBalance;
    
    // Projeta os próximos 3 meses
    for (let i = 1; i <= 3; i++) {
      const monthDate = addMonths(now, i);
      
      // Adiciona receita média
      balance += avgMonthlyIncome;
      
      // Subtrai despesas recorrentes
      balance -= monthlyRecurringExpenses;
      
      projections.push({
        month: format(monthDate, "MMM 'de' yyyy", { locale: ptBR }),
        balance,
        income: avgMonthlyIncome,
        expense: monthlyRecurringExpenses,
        isPositive: balance >= 0
      });
    }
    
    return {
      projections,
      avgMonthlyIncome,
      monthlyRecurringExpenses,
      trend: projections[2].balance > currentBalance ? 'up' : 'down'
    };
  }, [currentBalance, transactions, recurringExpenses]);

  const hasNegativeProjection = projection.projections.some(p => !p.isPositive);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Projeção Financeira (3 Meses)</CardTitle>
          <Badge className={
            projection.trend === 'up' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-rose-100 text-rose-700'
          }>
            {projection.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {projection.trend === 'up' ? 'Crescimento' : 'Declínio'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Premissas */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900 mb-2">Premissas da Projeção:</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Receita média mensal:</span>
            <span className="font-bold text-blue-900">
              R$ {projection.avgMonthlyIncome.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Despesas recorrentes:</span>
            <span className="font-bold text-blue-900">
              R$ {projection.monthlyRecurringExpenses.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Alertas */}
        {hasNegativeProjection && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Atenção!</strong> Projeção indica saldo negativo em algum mês. 
              Considere reduzir despesas ou aumentar receitas.
            </AlertDescription>
          </Alert>
        )}

        {/* Projeções mensais */}
        <div className="space-y-3">
          {projection.projections.map((proj, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 ${
                proj.isPositive 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${
                    proj.isPositive ? 'text-green-600' : 'text-rose-600'
                  }`} />
                  <span className="text-sm font-semibold text-slate-900">
                    {proj.month}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  +{index + 1} {index === 0 ? 'mês' : 'meses'}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Receita prevista:</span>
                  <span className="text-emerald-600 font-semibold">
                    +R$ {proj.income.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Despesas previstas:</span>
                  <span className="text-rose-600 font-semibold">
                    -R$ {proj.expense.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">
                    Saldo projetado:
                  </span>
                  <div className="flex items-center gap-1">
                    <DollarSign className={`w-4 h-4 ${
                      proj.isPositive ? 'text-green-600' : 'text-rose-600'
                    }`} />
                    <span className={`text-lg font-bold ${
                      proj.isPositive ? 'text-green-600' : 'text-rose-600'
                    }`}>
                      R$ {proj.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recomendações */}
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">
            💡 Recomendação:
          </p>
          <p className="text-sm text-slate-700">
            {projection.trend === 'up' ? (
              hasNegativeProjection ? (
                'Apesar do crescimento, atenção aos meses com saldo negativo. Mantenha uma reserva de emergência.'
              ) : (
                'Excelente! Sua empresa está em crescimento sustentável. Continue monitorando seus gastos.'
              )
            ) : (
              'Seu saldo está em declínio. Analise formas de reduzir custos ou aumentar receitas para evitar problemas de caixa.'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}