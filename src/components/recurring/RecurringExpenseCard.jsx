
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Bell, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { format, addMonths, setDate, differenceInDays, isPast, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORY_NAMES = {
  salarios_funcionarios: "Salários",
  fornecedores: "Fornecedores",
  aluguel: "Aluguel",
  contas_servicos: "Contas e Serviços",
  impostos_taxas: "Impostos e Taxas",
  marketing_publicidade: "Marketing",
  equipamentos_materiais: "Equipamentos",
  manutencao: "Manutenção",
  combustivel_transporte: "Transporte",
  emprestimos_pagos: "Empréstimos",
  outras_despesas: "Outras Despesas"
};

// Função para formatar valor com ponto para milhares e vírgula para decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function RecurringExpenseCard({ expense, onEdit, onDelete, onMarkAsPaid }) {
  // Calcula a próxima data de vencimento
  const getNextDueDate = () => {
    const now = new Date();
    let dueDate = setDate(now, expense.due_day);
    
    // Se a data já passou este mês, pega o próximo mês
    if (isPast(dueDate) && !isSameMonth(dueDate, now)) {
      dueDate = setDate(addMonths(now, 1), expense.due_day);
    }
    
    // Se o último pagamento foi este mês, próximo vencimento é mês que vem
    if (expense.last_paid_date) {
      const lastPaid = new Date(expense.last_paid_date);
      if (isSameMonth(lastPaid, now)) {
        dueDate = setDate(addMonths(now, 1), expense.due_day);
      }
    }
    
    return dueDate;
  };

  const nextDueDate = getNextDueDate();
  const daysUntilDue = differenceInDays(nextDueDate, new Date());
  
  // Define o status visual
  const getStatusConfig = () => {
    if (expense.status === 'inactive') {
      return {
        color: 'bg-slate-100 text-slate-700',
        icon: Clock,
        label: 'Inativa',
        badgeColor: 'border-slate-300'
      };
    }
    
    if (daysUntilDue < 0) {
      return {
        color: 'bg-rose-100 text-rose-700',
        icon: AlertTriangle,
        label: 'Vencida',
        badgeColor: 'border-rose-300'
      };
    }
    
    if (daysUntilDue <= expense.reminder_days_before) {
      return {
        color: 'bg-orange-100 text-orange-700',
        icon: Bell,
        label: 'Vence em breve',
        badgeColor: 'border-orange-300'
      };
    }
    
    return {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle2,
      label: 'Em dia',
      badgeColor: 'border-green-300'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 text-lg">{expense.name}</h3>
              <Badge variant="outline" className="text-xs">
                {CATEGORY_NAMES[expense.category]}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              R$ {formatCurrency(expense.amount)}
            </p>
          </div>
          
          <Badge className={`${statusConfig.color} ${statusConfig.badgeColor} border`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Informações de vencimento */}
        <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>
              Vence todo dia <strong>{expense.due_day}</strong> do mês
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Bell className="w-4 h-4" />
            <span>
              Lembrete <strong>{expense.reminder_days_before} dias</strong> antes
            </span>
          </div>

          {expense.last_paid_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>
                Último pagamento: {format(new Date(expense.last_paid_date), "dd/MM/yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Próximo vencimento */}
        <div className={`p-3 rounded-lg mb-4 ${
          daysUntilDue < 0 
            ? 'bg-rose-50 border border-rose-200' 
            : daysUntilDue <= expense.reminder_days_before
            ? 'bg-orange-50 border border-orange-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className="text-sm font-medium mb-1">
            {daysUntilDue < 0 ? '⚠️ Vencimento atrasado!' : '📅 Próximo vencimento:'}
          </p>
          <p className="text-lg font-bold">
            {format(nextDueDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p className="text-sm text-slate-600">
            {daysUntilDue < 0 
              ? `${Math.abs(daysUntilDue)} dias de atraso`
              : daysUntilDue === 0
              ? 'Vence hoje!'
              : `Faltam ${daysUntilDue} dias`
            }
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={() => onMarkAsPaid(expense.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marcar como Pago
          </Button>
          
          <Button
            onClick={() => onEdit(expense)}
            variant="outline"
            size="sm"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => onDelete(expense.id)}
            variant="outline"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {expense.notes && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">{expense.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
