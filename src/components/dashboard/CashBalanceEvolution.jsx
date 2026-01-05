import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-slate-900 mb-1">
          {data.fullMonth}
        </p>
        <p className={`text-lg font-bold ${
          data.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          R$ {formatCurrency(data.balance)}
        </p>
        {data.variation !== null && (
          <p className={`text-xs mt-1 ${
            data.variation >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {data.variation >= 0 ? '+' : ''}{data.variation.toFixed(1)}% vs mês anterior
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  
  if (payload.isCurrentMonth) {
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={8} 
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth={3}
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill="#fff"
        />
      </g>
    );
  }
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      fill={payload.balance >= 0 ? '#10b981' : '#ef4444'}
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

function CashBalanceEvolution({ transactions }) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showTrendDialog, setShowTrendDialog] = useState(false);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const isCurrentMonth = isSameMonth(date, now);
      
      // Calcula saldo final do mês (todas as transações até o fim do mês)
      const balance = transactions
        .filter(t => new Date(t.date) <= monthEnd)
        .reduce((sum, t) => {
          return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
        }, 0);
      
      data.push({
        month: format(date, 'MMM', { locale: ptBR }),
        fullMonth: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
        balance: balance,
        isCurrentMonth: isCurrentMonth,
        variation: null // Será calculado depois
      });
    }
    
    // Calcula variação percentual vs mês anterior
    for (let i = 1; i < data.length; i++) {
      const current = data[i].balance;
      const previous = data[i - 1].balance;
      
      if (previous !== 0) {
        data[i].variation = ((current - previous) / Math.abs(previous)) * 100;
      } else {
        data[i].variation = current > 0 ? 100 : (current < 0 ? -100 : 0); // Handle division by zero previous balance
      }
    }
    
    return data;
  }, [transactions]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'neutral';
    const lastMonth = chartData[chartData.length - 1].balance;
    const previousMonth = chartData[chartData.length - 2].balance;
    return lastMonth >= previousMonth ? 'up' : 'down';
  }, [chartData]);

  const currentBalance = chartData[chartData.length - 1]?.balance || 0;
  const currentDate = format(new Date(), "dd/MM/yyyy");

  // Gera explicação detalhada da tendência
  const trendExplanation = useMemo(() => {
    if (chartData.length < 2) return '';
    
    const lastMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];
    const firstMonth = chartData[0];
    
    const monthChange = lastMonth.balance - previousMonth.balance;
    const yearChange = lastMonth.balance - firstMonth.balance;
    
    const isGrowing = trend === 'up';
    
    let summary = '';
    let details = '';
    
    if (isGrowing) {
      summary = '📈 Situação Positiva';
      details = `Seu caixa está crescendo! `;
      
      if (monthChange > 0) {
        details += `No último mês, você aumentou seu saldo em R$ ${formatCurrency(monthChange)}. `;
      }
      
      if (yearChange > 0) {
        details += `Em 12 meses, seu caixa cresceu R$ ${formatCurrency(yearChange)}. `;
      }
      
      details += `Isso indica que suas receitas estão superando suas despesas. Continue assim! 💪`;
    } else {
      summary = '📉 Atenção Necessária';
      details = `Seu caixa está em declínio. `;
      
      if (monthChange < 0) {
        details += `No último mês, você teve uma redução de R$ ${formatCurrency(Math.abs(monthChange))}. `;
      }
      
      if (yearChange < 0) {
        details += `Em 12 meses, seu caixa diminuiu R$ ${formatCurrency(Math.abs(yearChange))}. `;
      }
      
      details += `Isso pode indicar que as despesas estão superando as receitas. Recomendamos revisar seus custos e buscar formas de aumentar a receita. 🎯`;
    }
    
    return { summary, details };
  }, [chartData, trend]);

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Evolução do seu caixa</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                onClick={() => setShowInfoDialog(true)}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <p className="text-xs text-slate-500">(12 meses)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`px-2 py-1 h-auto ${
                  trend === 'up' 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                }`}
                onClick={() => setShowTrendDialog(true)}
              >
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                )}
                <span className="text-xs font-semibold">
                  {trend === 'up' ? 'Crescimento' : 'Declínio'}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-3 bg-blue-50 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">
                <strong>Saldo atual:</strong> R$ {formatCurrency(currentBalance)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Atualizado até {currentDate}. Clique nos pontos para ver detalhes de cada mês.
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                style={{ fontSize: '11px' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '11px' }}
                tickFormatter={(value) => {
                  const absValue = Math.abs(value);
                  if (absValue >= 1000) {
                    return `${value >= 0 ? '' : '-'}${(absValue / 1000).toFixed(0)}k`;
                  }
                  return value.toFixed(0);
                }}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Saldo Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span>Saldo Negativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
              <span>Mês Atual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Informação - O que é este gráfico */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              O que é a Evolução do Caixa?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                Este gráfico mostra a <strong>posição do seu caixa no final de cada mês</strong> durante os últimos 12 meses.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">
                    Saldo Final do Mês
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cada ponto no gráfico representa o valor total que você tinha em caixa no último dia do mês.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">
                    Como é calculado?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Soma todas as receitas e subtrai todas as despesas até o último dia do mês, mostrando quanto você tinha disponível.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 mb-1">
                    Para que serve?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ver se seu caixa está crescendo (guardando dinheiro) ou diminuindo (gastando reservas) ao longo do tempo.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Dica:</strong> Um caixa crescente indica que você está guardando dinheiro. Um caixa em queda pode indicar que está gastando mais do que ganha.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowInfoDialog(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Tendência - Explicação do crescimento/declínio */}
      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-rose-600 rotate-180" />
              )}
              {trendExplanation.summary}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={`rounded-lg p-4 border ${
              trend === 'up' 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-rose-50 border-rose-200'
            }`}>
              <p className="text-sm text-slate-700 leading-relaxed">
                {trendExplanation.details}
              </p>
            </div>

            {trend === 'up' ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-900">
                  🎯 Continue fazendo:
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Mantendo o controle das despesas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Buscando aumentar suas receitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Construindo uma reserva financeira sólida</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-900">
                  💡 Ações recomendadas:
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 mt-0.5">•</span>
                    <span>Revise e reduza despesas desnecessárias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 mt-0.5">•</span>
                    <span>Busque formas de aumentar suas receitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 mt-0.5">•</span>
                    <span>Analise onde seu dinheiro está sendo gasto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 mt-0.5">•</span>
                    <span>Converse com o Flávio (Assistente IA) para dicas personalizadas</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Lembre-se:</strong> A evolução do caixa é apenas um indicador. Analise também suas receitas, despesas e fluxo de caixa mensal para ter uma visão completa.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowTrendDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default React.memo(CashBalanceEvolution);