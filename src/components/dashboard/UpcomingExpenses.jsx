
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { format, setDate, differenceInDays, isPast, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para formatar valor com ponto para milhares e vírgula para decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export default function UpcomingExpenses({ recurringExpenses }) {
  const upcomingExpenses = useMemo(() => {
    const now = new Date();
    
    return recurringExpenses
      .filter(expense => expense.status === 'active')
      .map(expense => {
        let dueDate = setDate(now, expense.due_day);
        
        // Se já passou este mês ou foi pago este mês, mostrar próximo mês
        if (isPast(dueDate) || (expense.last_paid_date && isSameMonth(new Date(expense.last_paid_date), now))) {
          dueDate = setDate(new Date(now.getFullYear(), now.getMonth() + 1, expense.due_day), expense.due_day);
        }
        
        const daysUntil = differenceInDays(dueDate, now);
        
        return {
          ...expense,
          dueDate,
          daysUntil
        };
      })
      .filter(expense => expense.daysUntil >= 0 && expense.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [recurringExpenses]);

  if (upcomingExpenses.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Próximos lançamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingExpenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                expense.daysUntil === 0 
                  ? 'bg-rose-100' 
                  : expense.daysUntil <= 3 
                  ? 'bg-orange-100' 
                  : 'bg-blue-100'
              }`}>
                {expense.daysUntil === 0 ? (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                ) : (
                  <Calendar className={`w-5 h-5 ${
                    expense.daysUntil <= 3 ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{expense.name}</p>
                <p className="text-xs text-slate-600">
                  {expense.daysUntil === 0 
                    ? 'Vence hoje' 
                    : `Vence em ${expense.daysUntil} ${expense.daysUntil === 1 ? 'dia' : 'dias'}`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">
                R$ {formatCurrency(expense.amount)}
              </p>
              <Badge variant="outline" className="text-xs">
                {format(expense.dueDate, 'dd/MM')}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
