
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, Filter, AlertCircle, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

// Função para formatar valor com ponto para milhares e vírgula para decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function Transactions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: "",
    amount: "",
    type: "expense",
    category: "",
    payment_method: "pix",
    notes: "",
    recurring: false
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  // Identifica a última importação de forma mais simples
  const lastImport = React.useMemo(() => {
    // Filtra todas as transações importadas (que têm "Importado" nas notas)
    const importedTransactions = transactions.filter(t => 
      t.notes && (
        t.notes.includes('Importado do extrato CSV em') ||
        t.notes.includes('Importado em') ||
        t.notes.includes('Importado via Pluggy')
      )
    );
    
    if (importedTransactions.length === 0) return null;
    
    // Agrupa por texto exato da nota
    const groups = {};
    importedTransactions.forEach(t => {
      const noteKey = t.notes;
      if (!groups[noteKey]) {
        groups[noteKey] = {
          note: noteKey,
          transactions: [],
          created_date: t.created_date
        };
      }
      groups[noteKey].transactions.push(t);
    });
    
    // Ordena grupos pela data de criação mais recente
    const sortedGroups = Object.values(groups).sort((a, b) => {
      // created_date is a string, convert to Date objects for comparison
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });
    
    if (sortedGroups.length === 0) return null;
    
    const latestGroup = sortedGroups[0];
    
    // Extrai data de forma mais flexível
    let displayDate = 'data desconhecida';
    const dateMatch = latestGroup.note.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      displayDate = dateMatch[1];
    }
    
    return {
      note: latestGroup.note,
      date: displayDate,
      count: latestGroup.transactions.length,
      transactions: latestGroup.transactions
    };
  }, [transactions]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOpen(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: "",
        amount: "",
        type: "expense",
        category: "",
        payment_method: "pix",
        notes: "",
        recurring: false
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const undoImportMutation = useMutation({
    mutationFn: async (transactionIds) => {
      console.log('Deletando transações:', transactionIds);
      
      // Deleta uma por uma para garantir que todas sejam deletadas
      for (const id of transactionIds) {
        try {
          await base44.entities.Transaction.delete(id);
          console.log('Deletada:', id);
        } catch (error) {
          console.error('Erro ao deletar transação:', id, error);
          // Decide whether to throw or continue. For undo, it's probably better to try to delete all.
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setUndoDialogOpen(false);
      alert('✅ Importação desfeita com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao desfazer importação:', error);
      alert('❌ Erro ao desfazer importação. Tente novamente.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    createMutation.mutate({
      ...formData,
      amount: formData.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
    });
  };

  const handleUndoImport = () => {
    if (lastImport) {
      const ids = lastImport.transactions.map(t => t.id);
      console.log('IDs para deletar:', ids);
      undoImportMutation.mutate(ids);
    }
  };

  const incomeCategories = [
    { value: "vendas", label: "Vendas" },
    { value: "servicos", label: "Serviços" },
    { value: "investimentos", label: "Investimentos" },
    { value: "emprestimos_recebidos", label: "Empréstimos Recebidos" },
    { value: "outras_receitas", label: "Outras Receitas" }
  ];

  const expenseCategories = [
    { value: "salarios_funcionarios", label: "Salários" },
    { value: "fornecedores", label: "Fornecedores" },
    { value: "aluguel", label: "Aluguel" },
    { value: "contas_servicos", label: "Contas e Serviços" },
    { value: "impostos_taxas", label: "Impostos e Taxas" },
    { value: "marketing_publicidade", label: "Marketing" },
    { value: "equipamentos_materiais", label: "Equipamentos" },
    { value: "manutencao", label: "Manutenção" },
    { value: "combustivel_transporte", label: "Transporte" },
    { value: "emprestimos_pagos", label: "Empréstimos Pagos" },
    { value: "outras_despesas", label: "Outras Despesas" }
  ];

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Transações</h1>
          <p className="text-slate-600">Gerencie todas as movimentações financeiras</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          {lastImport && (
            <Button 
              variant="outline" 
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => setUndoDialogOpen(true)}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Desfazer Última Importação
            </Button>
          )}
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value, category: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Venda de produto X"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar Transação"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerta sobre última importação */}
      {lastImport && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Última importação:</strong> {lastImport.count} transações importadas em {lastImport.date}. 
            Use o botão "Desfazer" acima se esta importação estiver incorreta.
            <br />
            <span className="text-xs text-orange-700 mt-1 block">
              Nota: "{lastImport.note.substring(0, 50)}{lastImport.note.length > 50 ? '...' : ''}"
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-900">Filtros</span>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="md:w-64">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(CATEGORY_NAMES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela de transações */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-28">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-40">Categoria</TableHead>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="text-right w-36">Valor</TableHead>
                <TableHead className="text-right w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-slate-50">
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(transaction.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_NAMES[transaction.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'income' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Receita
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                        Despesa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-semibold whitespace-nowrap ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <span className="inline-block">R$ {formatCurrency(Math.abs(transaction.amount))}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(transaction.id)}
                      className="hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </Card>

      {/* Dialog de confirmação para desfazer importação */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desfazer Última Importação?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Esta ação irá <strong>excluir permanentemente {lastImport?.count} transações</strong> importadas em {lastImport?.date}.
            </p>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 text-sm">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita!
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleUndoImport}
              disabled={undoImportMutation.isPending}
            >
              {undoImportMutation.isPending ? "Excluindo..." : "Sim, Excluir Todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
