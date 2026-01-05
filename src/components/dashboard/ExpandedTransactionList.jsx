import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';

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

function normalizeDescription(text) {
  if (!text) return 'Sem descrição';
  
  // Remove frases longas e mantém apenas o essencial
  let cleaned = text
    .replace(/pix\s+(recebido\s+de|enviado\s+para)\s+/gi, 'Pix ')
    .replace(/ted\s+(recebido\s+de|enviado\s+para)\s+/gi, 'TED ')
    .replace(/transfer[eê]ncia\s+(recebida\s+de|enviada\s+para)\s+/gi, 'Transferência ')
    .replace(/recebido\s+de\s+/gi, '')
    .replace(/enviado\s+para\s+/gi, '')
    .replace(/pagamento\s+(de|para)\s+/gi, '')
    .replace(/recebido\s+/gi, '')
    .replace(/enviado\s+/gi, '')
    .trim();
  
  // Remove números, valores monetários e datas para melhor agrupamento
  cleaned = cleaned
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove datas
    .replace(/r\$\s*[\d.,]+/gi, '') // Remove valores
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
  
  return cleaned || 'Sem descrição';
}

function formatDescription(text, maxWords = 4) {
  if (!text) return '';
  
  const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => {
      if (['de', 'da', 'do', 'e', 'a', 'o', 'das', 'dos', 'para'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };
  
  // Remove prefixos longos primeiro
  let cleaned = text
    .replace(/pix\s+(recebido\s+de|enviado\s+para)\s+/gi, 'Pix ')
    .replace(/ted\s+(recebido\s+de|enviado\s+para)\s+/gi, 'TED ')
    .replace(/transfer[eê]ncia\s+(recebida\s+de|enviada\s+para)\s+/gi, 'Transferência ')
    .replace(/recebido\s+de\s+/gi, '')
    .replace(/enviado\s+para\s+/gi, '')
    .replace(/pagamento\s+(de|para)\s+/gi, '')
    .replace(/recebido\s+/gi, '')
    .replace(/enviado\s+/gi, '')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const abbreviated = words.slice(0, maxWords).join(' ');
  
  return toTitleCase(abbreviated);
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

function ExpandedTransactionList({ transactions, type, onClose, allTransactions }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedPayee, setExpandedPayee] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Agrupa transações por categoria
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'outros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
    });

    // Ordena por total de cada categoria (maior primeiro)
    const sortedGroups = Object.entries(groups)
      .map(([category, items]) => {
        const total = items.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Agrupa por favorecido dentro da categoria
        const payeeGroups = {};
        items.forEach(item => {
          const payeeKey = normalizeDescription(item.description);
          if (!payeeGroups[payeeKey]) {
            payeeGroups[payeeKey] = {
              payee: payeeKey,
              displayName: formatDescription(item.description, 6),
              transactions: [],
              total: 0
            };
          }
          payeeGroups[payeeKey].transactions.push(item);
          payeeGroups[payeeKey].total += Math.abs(item.amount);
        });
        
        // Ordena favorecidos por valor total (maior primeiro)
        const sortedPayees = Object.values(payeeGroups)
          .sort((a, b) => b.total - a.total)
          .map(payeeGroup => ({
            ...payeeGroup,
            transactions: payeeGroup.transactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
          }));
        
        return { category, payees: sortedPayees, total };
      })
      .sort((a, b) => b.total - a.total);

    return sortedGroups;
  }, [transactions]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const togglePayee = (categoryKey, payeeKey) => {
    const key = `${categoryKey}_${payeeKey}`;
    setExpandedPayee(expandedPayee === key ? null : key);
  };

  return (
    <>
      <div className="mt-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-slate-200">
            {groupedTransactions.map(({ category, payees, total }) => (
              <div key={category}>
                {/* Header da categoria */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {expandedCategory === category ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900 text-sm">
                      {CATEGORY_NAMES[category] || category}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({payees.reduce((sum, p) => sum + p.transactions.length, 0)})
                    </span>
                  </div>
                  <span className={`font-bold text-sm ml-4 flex-shrink-0 ${
                    type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    R$ {formatCurrency(total)}
                  </span>
                </button>

                {/* Lista de favorecidos da categoria */}
                {expandedCategory === category && (
                  <div className="bg-slate-50">
                    {payees.map((payeeGroup, payeeIdx) => {
                      const isPayeeExpanded = expandedPayee === `${category}_${payeeGroup.payee}`;
                      const hasMultipleTransactions = payeeGroup.transactions.length > 1;
                      
                      return (
                        <div key={payeeIdx} className="border-t border-slate-200">
                          {/* Linha do favorecido consolidado */}
                          <button
                            onClick={() => {
                              if (hasMultipleTransactions) {
                                togglePayee(category, payeeGroup.payee);
                              } else {
                                handleTransactionClick(payeeGroup.transactions[0]);
                              }
                            }}
                            className="w-full px-4 py-2.5 pl-10 flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {hasMultipleTransactions && (
                                isPayeeExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                )
                              )}
                              {!hasMultipleTransactions && <div className="w-3 flex-shrink-0"></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-900 font-medium truncate">
                                  {payeeGroup.displayName}
                                </p>
                                {hasMultipleTransactions && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {payeeGroup.transactions.length} transações
                                  </p>
                                )}
                                {!hasMultipleTransactions && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {format(new Date(payeeGroup.transactions[0].date), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`font-semibold text-sm ml-4 whitespace-nowrap flex-shrink-0 ${
                              type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              R$ {formatCurrency(payeeGroup.total)}
                            </span>
                          </button>

                          {/* Lista de transações individuais do favorecido (se expandido) */}
                          {hasMultipleTransactions && isPayeeExpanded && (
                            <div className="bg-white">
                              {payeeGroup.transactions.map((transaction, txIdx) => (
                                <button
                                  key={txIdx}
                                  onClick={() => handleTransactionClick(transaction)}
                                  className="w-full px-4 py-2 pl-16 flex items-center justify-between hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-700">
                                      {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                    {transaction.notes && (
                                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        {transaction.notes}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`font-medium text-xs ml-4 whitespace-nowrap flex-shrink-0 ${
                                    type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                  }`}>
                                    R$ {formatCurrency(Math.abs(transaction.amount))}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <TransactionDetailModal
        transaction={selectedTransaction}
        allTransactions={allTransactions || transactions}
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}

// Memoized for performance
export default React.memo(ExpandedTransactionList);