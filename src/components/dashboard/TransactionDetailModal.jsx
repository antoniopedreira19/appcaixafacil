import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Calendar, Receipt, DollarSign, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

const CATEGORY_NAMES = {
  // Receitas
  vendas: 'Vendas',
  servicos: 'Serviços',
  investimentos: 'Investimentos',
  emprestimos_recebidos: 'Empréstimos Recebidos',
  outras_receitas: 'Outras Receitas',
  // Despesas
  salarios_funcionarios: 'Salários',
  fornecedores: 'Fornecedores',
  aluguel: 'Aluguel',
  contas_servicos: 'Contas/Serviços',
  impostos_taxas: 'Impostos/Taxas',
  marketing_publicidade: 'Marketing',
  equipamentos_materiais: 'Equipamentos',
  manutencao: 'Manutenção',
  combustivel_transporte: 'Combustível',
  emprestimos_pagos: 'Empréstimos Pagos',
  outras_despesas: 'Outras Despesas',
};

export default function TransactionDetailModal({ transaction, allTransactions, open, onClose }) {
  if (!transaction) return null;

  // Busca histórico de transações similares (mesmo favorecido/descrição) nos últimos 6 meses
  const history = useMemo(() => {
    if (!transaction || !allTransactions) return [];

    const currentDate = new Date(transaction.date);
    const historyData = [];

    // Normaliza a descrição para comparação (remove números, valores, datas)
    const normalizeDescription = (desc) => {
      return desc
        .toLowerCase()
        .replace(/\d+/g, '') // Remove números
        .replace(/r\$\s*[\d.,]+/gi, '') // Remove valores
        .replace(/\b(pix|ted|doc|transferencia)\b/gi, '') // Remove palavras chave
        .trim();
    };

    const currentDescNormalized = normalizeDescription(transaction.description);

    // Busca nos últimos 6 meses (do mais recente ao mais antigo)
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Filtra transações do mesmo favorecido no mês
      const monthTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        const descMatch = normalizeDescription(t.description) === currentDescNormalized;
        const dateMatch = tDate >= monthStart && tDate <= monthEnd;
        const typeMatch = t.type === transaction.type;
        
        return descMatch && dateMatch && typeMatch;
      });

      const total = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const count = monthTransactions.length;

      historyData.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        fullMonth: format(monthDate, 'MMMM/yyyy', { locale: ptBR }),
        total: total,
        count: count,
        isCurrent: isSameMonth(monthDate, currentDate)
      });
    }

    return historyData; // Já está do mais recente (i=0) ao mais antigo (i=5)
  }, [transaction, allTransactions]);

  // Calcula variação vs mês anterior
  const variation = useMemo(() => {
    if (history.length < 2) return null;

    const current = history[0]; // Mês atual (mais recente)
    const previous = history[1]; // Mês anterior

    if (!current || !previous || previous.total === 0) return null;

    const change = current.total - previous.total;
    const percentChange = (change / previous.total) * 100;

    return {
      amount: change,
      percent: percentChange,
      isIncrease: change > 0
    };
  }, [history]);

  // Calcula média SOMENTE dos meses que tiveram gastos (total > 0)
  const average = useMemo(() => {
    const monthsWithExpenses = history.filter(h => h.total > 0);
    
    if (monthsWithExpenses.length === 0) return 0;
    
    const sum = monthsWithExpenses.reduce((acc, h) => acc + h.total, 0);
    return sum / monthsWithExpenses.length;
  }, [history]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        {/* Header fixo */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-600" />
            Detalhes da Transação
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Dados da transação atual */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data
                  </p>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Valor
                  </p>
                  <p className={`font-bold text-lg ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Receipt className="w-3 h-3" />
                    Descrição
                  </p>
                  <p className="font-medium text-slate-900">
                    {transaction.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Categoria
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {CATEGORY_NAMES[transaction.category] || transaction.category}
                  </Badge>
                </div>

                {transaction.payment_method && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Forma de Pagamento</p>
                    <p className="font-medium text-slate-700 text-sm capitalize">
                      {transaction.payment_method.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}

                {transaction.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Observações</p>
                    <p className="text-sm text-slate-600 italic">
                      {transaction.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  📊 Histórico deste Favorecido
                </h3>
                {variation && (
                  <Badge className={variation.isIncrease ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}>
                    {variation.isIncrease ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {variation.isIncrease ? '+' : ''}{variation.percent.toFixed(1)}% vs mês anterior
                  </Badge>
                )}
              </div>

              {history.length > 0 ? (
                <>
                  {/* Linha do tempo visual */}
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          item.isCurrent
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <div className="w-20 text-sm font-semibold text-slate-700">
                          {item.month}
                          {item.isCurrent && (
                            <span className="block text-xs text-blue-600 font-medium">atual</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                              style={{
                                width: `${history.length > 0 ? (item.total / Math.max(...history.map(h => h.total))) * 100 : 0}%`,
                                minWidth: item.total > 0 ? '20px' : '0px'
                              }}
                            />
                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                          {item.count > 1 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {item.count} transações
                            </p>
                          )}
                        </div>

                        {index < history.length - 1 && (
                          <div className="text-xs text-slate-400">
                            {(() => {
                              const current = history[index];
                              const previous = history[index + 1];
                              if (!current || !previous || previous.total === 0) return null;

                              const change = current.total - previous.total;
                              const percent = (change / previous.total) * 100;

                              if (Math.abs(percent) < 1) return '→';

                              return change > 0 ? (
                                <span className="text-rose-600 flex items-center gap-0.5">
                                  <ArrowUpCircle className="w-3 h-3" />
                                  +{percent.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-emerald-600 flex items-center gap-0.5">
                                  <ArrowDownCircle className="w-3 h-3" />
                                  {percent.toFixed(0)}%
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Resumo */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700 mb-1">Média (meses com gasto)</p>
                        <p className="font-bold text-blue-900 text-lg">
                          {formatCurrency(average)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {history.filter(h => h.total > 0).length} meses considerados
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 mb-1">Total (6 meses)</p>
                        <p className="font-bold text-blue-900 text-lg">
                          {formatCurrency(history.reduce((sum, h) => sum + h.total, 0))}
                        </p>
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">💡 Insight:</p>
                      <p className="text-xs text-blue-800">
                        {(() => {
                          if (!variation) return 'Primeira transação com este favorecido.';
                          
                          if (Math.abs(variation.percent) < 5) {
                            return 'Valor estável nos últimos meses.';
                          } else if (variation.isIncrease) {
                            return `${transaction.type === 'expense' ? 'Despesa' : 'Receita'} aumentou ${variation.percent.toFixed(0)}% vs mês passado. ${transaction.type === 'expense' ? 'Considere renegociar.' : 'Ótimo crescimento!'}`;
                          } else {
                            return `${transaction.type === 'expense' ? 'Despesa' : 'Receita'} diminuiu ${Math.abs(variation.percent).toFixed(0)}% vs mês passado. ${transaction.type === 'expense' ? 'Boa economia!' : 'Atenção à queda.'}`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">Nenhum histórico encontrado para este favorecido.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}