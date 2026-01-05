import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb, DollarSign, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export default function QuickInsights({ transactions, recurringExpenses }) {
  const analysis = useMemo(() => {
    if (transactions.length === 0) {
      return {
        currentMoney: 0,
        status: 'sem_dados',
        statusColor: 'slate',
        statusIcon: AlertCircle,
        statusLabel: 'Sem dados',
        statusDescription: 'Adicione transações para visualizar insights',
        improvements: []
      };
    }

    // 1. QUAL MEU DINHEIRO ATUAL?
    const currentMoney = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);

    // Calcula dados do último mês para análise
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= oneMonthAgo;
    });

    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const lastMonthBalance = lastMonthIncome - lastMonthExpense;

    // Despesas recorrentes ativas
    const activeRecurringExpenses = recurringExpenses
      ?.filter(e => e.status === 'active')
      .reduce((sum, e) => sum + e.amount, 0) || 0;

    // 2. ISSO É BOM OU RUIM?
    let status, statusColor, statusIcon, statusLabel, statusDescription;

    if (currentMoney < 0) {
      status = 'critico';
      statusColor = 'rose';
      statusIcon = XCircle;
      statusLabel = 'Situação Crítica';
      statusDescription = 'Seu caixa está negativo. Ação urgente necessária!';
    } else if (currentMoney < activeRecurringExpenses) {
      status = 'alerta';
      statusColor = 'orange';
      statusIcon = AlertCircle;
      statusLabel = 'Atenção';
      statusDescription = `Caixa cobre apenas ${Math.floor((currentMoney / activeRecurringExpenses) * 30)} dias de despesas fixas`;
    } else if (lastMonthBalance < 0) {
      status = 'alerta';
      statusColor = 'orange';
      statusIcon = AlertCircle;
      statusLabel = 'Atenção';
      statusDescription = 'Último mês teve prejuízo. Revise suas despesas.';
    } else if (currentMoney > activeRecurringExpenses * 3) {
      status = 'otimo';
      statusColor = 'emerald';
      statusIcon = CheckCircle;
      statusLabel = 'Excelente!';
      statusDescription = 'Caixa saudável com boa reserva financeira';
    } else {
      status = 'bom';
      statusColor = 'blue';
      statusIcon = CheckCircle;
      statusLabel = 'Situação Estável';
      statusDescription = 'Caixa positivo, mas pode melhorar a reserva';
    }

    // 3. COMO FAÇO PRA MELHORAR MEU CAIXA?
    const improvements = [];

    // Análise de despesas vs receitas
    if (lastMonthBalance < 0) {
      improvements.push({
        priority: 'alta',
        icon: AlertCircle,
        title: 'Corte despesas urgentemente',
        description: 'Você gastou mais do que ganhou no último mês',
        action: 'Ver onde cortar',
        actionUrl: createPageUrl('Transactions')
      });
    }

    // Análise de despesas crescentes
    if (lastMonthExpense > lastMonthIncome * 0.8) {
      improvements.push({
        priority: 'media',
        icon: TrendingDown,
        title: 'Reduza custos variáveis',
        description: `Despesas representam ${Math.round((lastMonthExpense/lastMonthIncome)*100)}% da receita`,
        action: 'Analisar despesas',
        actionUrl: createPageUrl('Transactions')
      });
    }

    // Análise de receita
    if (lastMonthIncome < activeRecurringExpenses * 2) {
      improvements.push({
        priority: 'alta',
        icon: TrendingUp,
        title: 'Aumente suas receitas',
        description: 'Foco em vendas e novos clientes',
        action: 'Falar com Flávio (IA)',
        actionUrl: createPageUrl('AIAssistant')
      });
    }

    // Reserva de emergência
    if (currentMoney > 0 && currentMoney < activeRecurringExpenses * 3) {
      improvements.push({
        priority: 'media',
        icon: DollarSign,
        title: 'Construa reserva de emergência',
        description: 'Meta: 3 meses de despesas fixas',
        action: 'Fazer planejamento',
        actionUrl: createPageUrl('AIAssistant')
      });
    }

    // Despesas recorrentes não cadastradas
    const hasRecurringExpenses = recurringExpenses?.length > 0;
    if (!hasRecurringExpenses) {
      improvements.push({
        priority: 'baixa',
        icon: Lightbulb,
        title: 'Configure despesas recorrentes',
        description: 'Receba lembretes automáticos de pagamentos',
        action: 'Configurar agora',
        actionUrl: createPageUrl('RecurringExpenses')
      });
    }

    // Se está tudo bem, dá dicas de otimização
    if (status === 'otimo' && improvements.length === 0) {
      improvements.push({
        priority: 'baixa',
        icon: Lightbulb,
        title: 'Otimize ainda mais',
        description: 'Peça dicas ao Flávio sobre investimentos',
        action: 'Falar com Flávio',
        actionUrl: createPageUrl('AIAssistant')
      });
    }

    // Limita a 3 melhorias principais
    improvements.sort((a, b) => {
      const priority = { alta: 0, media: 1, baixa: 2 };
      return priority[a.priority] - priority[b.priority];
    });

    return {
      currentMoney,
      status,
      statusColor,
      statusIcon,
      statusLabel,
      statusDescription,
      improvements: improvements.slice(0, 3)
    };
  }, [transactions, recurringExpenses]);

  const StatusIcon = analysis.statusIcon;

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r from-${analysis.statusColor}-50 to-${analysis.statusColor}-100 p-4`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Resumo Rápido
            </h3>
            
            {/* 1. QUAL MEU DINHEIRO ATUAL? */}
            <div className="mb-3">
              <p className="text-xs text-slate-600 mb-1">💰 Seu caixa atual:</p>
              <p className={`text-2xl font-bold ${
                analysis.currentMoney >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {formatCurrency(analysis.currentMoney)}
              </p>
            </div>

            {/* 2. ISSO É BOM OU RUIM? */}
            <div className={`flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-${analysis.statusColor}-200`}>
              <StatusIcon className={`w-5 h-5 text-${analysis.statusColor}-600 flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`text-sm font-semibold text-${analysis.statusColor}-900`}>
                  {analysis.statusLabel}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {analysis.statusDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMO FAÇO PRA MELHORAR MEU CAIXA? */}
      {analysis.improvements.length > 0 && (
        <CardContent className="p-4 pt-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Como melhorar seu caixa:
          </h4>
          <div className="space-y-2">
            {analysis.improvements.map((improvement, idx) => {
              const Icon = improvement.icon;
              const priorityColors = {
                alta: 'rose',
                media: 'orange',
                baixa: 'blue'
              };
              const color = priorityColors[improvement.priority];
              
              return (
                <Link
                  key={idx}
                  to={improvement.actionUrl}
                  className={`flex items-start gap-3 p-3 rounded-lg border border-${color}-200 bg-${color}-50/50 hover:bg-${color}-100/80 transition-colors group`}
                >
                  <Icon className={`w-4 h-4 text-${color}-600 flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {improvement.title}
                      </p>
                      {improvement.priority === 'alta' && (
                        <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                          URGENTE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {improvement.description}
                    </p>
                    <p className={`text-xs font-medium text-${color}-700 mt-1 flex items-center gap-1 group-hover:gap-2 transition-all`}>
                      {improvement.action}
                      <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}