import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function TransactionListModal({ open, onClose, transactions, type }) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const filteredAndSorted = React.useMemo(() => {
    let filtered = [...transactions];

    // Filtrar por categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === "amount-desc") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      } else if (sortBy === "amount-asc") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      return 0;
    });

    return filtered;
  }, [transactions, filterCategory, sortBy]);

  const categories = React.useMemo(() => {
    const categorySet = new Set(transactions.map(t => t.category));
    return Array.from(categorySet);
  }, [transactions]);

  const total = filteredAndSorted.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type === 'income' ? '💰 Entradas do Mês' : '💸 Saídas do Mês'}
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="md:w-64">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_NAMES[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="md:w-52">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Data (mais recente)</SelectItem>
              <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
              <SelectItem value="amount-desc">Valor (maior)</SelectItem>
              <SelectItem value="amount-asc">Valor (menor)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Total */}
        <div className={`p-4 rounded-lg ${
          type === 'income' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">
              Total de {filteredAndSorted.length} transação(ões)
            </span>
            <span className={`text-xl font-bold ${
              type === 'income' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 z-10">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_NAMES[transaction.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    R$ {Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAndSorted.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}