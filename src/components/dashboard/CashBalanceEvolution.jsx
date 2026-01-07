import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, AlertCircle, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-slate-900 mb-1">{data.fullMonth}</p>
        <p className={`text-lg font-bold ${data.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          R$ {formatCurrency(data.balance)}
        </p>
        {data.variation !== null && (
          <p className={`text-xs mt-1 ${data.variation >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {data.variation >= 0 ? "+" : ""}
            {data.variation.toFixed(1)}% vs mês anterior
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
        <circle cx={cx} cy={cy} r={8} fill="#3b82f6" stroke="#fff" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={4} fill="#fff" />
      </g>
    );
  }

  return (
    <circle cx={cx} cy={cy} r={5} fill={payload.balance >= 0 ? "#10b981" : "#ef4444"} stroke="#fff" strokeWidth={2} />
  );
};

// Adicionei 'accounts' nas props para pegar o saldo atual real
function CashBalanceEvolution({ transactions, accounts = [] }) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showTrendDialog, setShowTrendDialog] = useState(false);

  const chartData = useMemo(() => {
    // 1. Calcula o saldo TOTAL ATUAL somando todas as contas (Dado mais confiável)
    const currentTotalBalance = accounts.reduce((acc, account) => {
      return acc + (Number(account.balance) || 0);
    }, 0);

    const now = new Date();
    const data = [];

    // Vamos criar os pontos de corte (final de cada mês)
    const monthsPoints = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      monthsPoints.push({
        date: date,
        monthEnd: endOfMonth(date),
        isCurrentMonth: i === 0,
        label: format(date, "MMM", { locale: ptBR }),
        fullLabel: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
      });
    }
    // Ordena do mais antigo para o mais novo para o gráfico
    monthsPoints.reverse();

    // LÓGICA REVERSA:
    // Começamos com o saldo de hoje e vamos desfazendo as transações para achar o passado.
    let runningBalance = currentTotalBalance;

    // Primeiro, precisamos "voltar" do momento exato de "agora" até o fim do mês atual (se houver transações futuras)
    // ou simplesmente considerar o saldo atual como o saldo do mês corrente.

    // Vamos processar mês a mês, do mais recente (último do array) para o mais antigo
    const calculatedData = [...monthsPoints].reverse().map((point, index) => {
      const isLastPoint = index === 0; // Mês atual

      let balanceAtPoint = 0;

      if (isLastPoint) {
        // O saldo do mês atual é o saldo atual (simples assim)
        balanceAtPoint = currentTotalBalance;
      } else {
        // Para meses passados, o saldo é:
        // Saldo do Mês Seguinte - (Receitas do Mês Seguinte) + (Despesas do Mês Seguinte)
        // Basicamente: runningBalance já está no ponto certo do mês seguinte.
        // Precisamos desfazer as transações que ocorreram ENTRE o fim deste mês e o fim do mês seguinte.

        const nextPointDate = monthsPoints.reverse()[index - 1].monthEnd; // Data do ponto que acabamos de calcular
        const thisPointDate = point.monthEnd; // Data onde queremos chegar

        // Pega transações que aconteceram nesse intervalo
        const transactionsInInterval = transactions.filter((t) => {
          const tDate = new Date(t.date);
          return isAfter(tDate, thisPointDate) && tDate <= nextPointDate;
        });

        // Desfaz as transações para voltar no tempo
        // Se foi receita (+), subtrai. Se foi despesa (-), soma.
        const changeInInterval = transactionsInInterval.reduce((acc, t) => {
          return acc + (t.type === "income" ? t.amount : -Math.abs(t.amount));
        }, 0);

        runningBalance = runningBalance - changeInInterval;
        balanceAtPoint = runningBalance;
      }

      return {
        month: point.label,
        fullMonth: point.fullLabel,
        balance: balanceAtPoint,
        isCurrentMonth: point.isCurrentMonth,
        variation: null,
      };
    });

    // Inverte de volta para ordem cronológica (Jan -> Dez)
    const finalData = calculatedData.reverse();

    // Calcula variação percentual vs mês anterior
    for (let i = 1; i < finalData.length; i++) {
      const current = finalData[i].balance;
      const previous = finalData[i - 1].balance;

      if (previous !== 0) {
        finalData[i].variation = ((current - previous) / Math.abs(previous)) * 100;
      } else {
        finalData[i].variation = current > 0 ? 100 : current < 0 ? -100 : 0;
      }
    }

    return finalData;
  }, [transactions, accounts]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return "neutral";
    const lastMonth = chartData[chartData.length - 1].balance;
    const previousMonth = chartData[chartData.length - 2].balance;
    return lastMonth >= previousMonth ? "up" : "down";
  }, [chartData]);

  const currentBalance = chartData[chartData.length - 1]?.balance || 0;
  const currentDate = format(new Date(), "dd/MM/yyyy");

  const trendExplanation = useMemo(() => {
    if (chartData.length < 2) return { summary: "", details: "" };

    const lastMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];
    const firstMonth = chartData[0];

    const monthChange = lastMonth.balance - previousMonth.balance;
    const yearChange = lastMonth.balance - firstMonth.balance;
    const isGrowing = trend === "up";

    let summary = isGrowing ? "📈 Situação Positiva" : "📉 Atenção Necessária";
    let details = isGrowing ? `Seu caixa está crescendo! ` : `Seu caixa está em declínio. `;

    if (isGrowing) {
      if (monthChange > 0) details += `No último mês, aumentou R$ ${formatCurrency(monthChange)}. `;
      if (yearChange > 0) details += `Em 12 meses, cresceu R$ ${formatCurrency(yearChange)}. `;
    } else {
      if (monthChange < 0) details += `No último mês, reduziu R$ ${formatCurrency(Math.abs(monthChange))}. `;
      if (yearChange < 0) details += `Em 12 meses, diminuiu R$ ${formatCurrency(Math.abs(yearChange))}. `;
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
                  trend === "up"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
                onClick={() => setShowTrendDialog(true)}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                )}
                <span className="text-xs font-semibold">{trend === "up" ? "Crescimento" : "Declínio"}</span>
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
                Atualizado até {currentDate} (Baseado no saldo real das contas).
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "11px" }} tick={{ fill: "#64748b" }} />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: "11px" }}
                tickFormatter={(value) =>
                  Math.abs(value) >= 1000
                    ? `${value >= 0 ? "" : "-"}${(Math.abs(value) / 1000).toFixed(0)}k`
                    : value.toFixed(0)
                }
                tick={{ fill: "#64748b" }}
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
              <span>Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span>Negativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
              <span>Atual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />O que é a Evolução do Caixa?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Este gráfico mostra seu saldo histórico calculado de forma reversa: partimos do seu saldo real hoje e
              "desfazemos" as transações para descobrir quanto você tinha no passado.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {trend === "up" ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-rose-600 rotate-180" />
              )}
              {trendExplanation.summary}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700">{trendExplanation.details}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default React.memo(CashBalanceEvolution);
