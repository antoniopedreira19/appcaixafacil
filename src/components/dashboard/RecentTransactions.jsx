import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TransactionDetailModal from './TransactionDetailModal';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função aprimorada para formatar descrição - remove prefixos longos
const formatDescription = (description, maxWords = 4) => {
  if (!description) return '';
  
  const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => {
      if (['de', 'da', 'do', 'e', 'a', 'o', 'das', 'dos', 'para'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };
  
  // Remove frases longas e mantém apenas o essencial
  let cleaned = description
    // Remove "Pix recebido de" ou "Pix enviado para"
    .replace(/pix\s+(recebido\s+de|enviado\s+para)\s+/gi, 'Pix ')
    // Remove "TED recebido de" ou "TED enviado para"
    .replace(/ted\s+(recebido\s+de|enviado\s+para)\s+/gi, 'TED ')
    // Remove "Transferência recebida de" ou "Transferência enviada para"
    .replace(/transfer[eê]ncia\s+(recebida\s+de|enviada\s+para)\s+/gi, 'Transferência ')
    // Remove outros padrões comuns
    .replace(/recebido\s+de\s+/gi, '')
    .replace(/enviado\s+para\s+/gi, '')
    .replace(/pagamento\s+(de|para)\s+/gi, '')
    .replace(/recebido\s+/gi, '')
    .replace(/enviado\s+/gi, '')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const abbreviated = words.slice(0, maxWords).join(' ');
  
  return toTitleCase(abbreviated);
};

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

const getCategoryIcon = (category, type) => {
  const iconClass = type === 'income' 
    ? 'bg-emerald-100 text-emerald-600' 
    : 'bg-rose-100 text-rose-600';
  
  const Icon = type === 'income' ? TrendingUp : TrendingDown;
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

function RecentTransactions({ transactions }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Últimas transações</CardTitle>
            <Link to={createPageUrl('Transactions')}>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Nenhuma transação registrada ainda</p>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <button
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(transaction.category, transaction.type)}
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {formatDescription(transaction.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-600">
                        {format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_NAMES[transaction.category]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <TransactionDetailModal
        transaction={selectedTransaction}
        allTransactions={transactions}
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}

export default React.memo(RecentTransactions);