import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const REMINDER_OPTIONS = [
  { value: "0", label: "No dia" },
  { value: "1", label: "1 dia anterior" },
  { value: "2", label: "2 dias anteriores" },
  { value: "3", label: "3 dias anteriores" },
  { value: "5", label: "5 dias anteriores" },
  { value: "7", label: "7 dias anteriores" },
];

export default function RecurringExpenses() {
  const queryClient = useQueryClient();
  const [newExpense, setNewExpense] = useState({
    name: "",
    due_day: "5",
    reminder_days_before: "3"
  });
  const [editingName, setEditingName] = useState({});

  const { data: recurringExpenses, isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('due_day', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    initialData: [],
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    initialData: [],
  });

  // Sugere despesas recorrentes baseadas em transações COM O DIA MAIS FREQUENTE
  const suggestedExpenses = useMemo(() => {
    const descriptionData = {};

    // Função para limpar e extrair apenas o nome do fornecedor/despesa
    const cleanDescription = (description) => {
      if (!description) return '';

      let cleaned = description.toLowerCase().trim();

      // Remove prefixos comuns mais agressivamente
      cleaned = cleaned
        .replace(/^pagamento\s+(de|para|a|pix|via|por)?\s*/gi, '')
        .replace(/^pix\s+(de|para|a|enviado|recebido)?\s*/gi, '')
        .replace(/^transferencia\s+(de|para|a|bancaria|enviado|recebido)?\s*/gi, '')
        .replace(/^compra\s+(de|em|na|no)?\s*/gi, '')
        .replace(/^debito\s+(de|em|automatico|na|no)?\s*/gi, '')
        .replace(/^credito\s+(de|em|na|no)?\s*/gi, '')
        .replace(/^fatura\s+(de|do|da)?\s*/gi, '')
        .replace(/^recebimento\s+(de|do|da)?\s*/gi, '')
        .replace(/^enviado\s+(para|a)?\s*/gi, '')
        .replace(/^recebido\s+(de|do|da)?\s*/gi, '')
        .replace(/^pagto\s+(de|para|a)?\s*/gi, '')
        .replace(/^pag\s+(de|para|a)?\s*/gi, '')
        .replace(/^taxa\s+(de|do|da)?\s*/gi, '')
        .replace(/^ted\s+/gi, '')
        .replace(/^doc\s+/gi, '')
        .trim();

      // Remove datas e horários
      cleaned = cleaned.replace(/\s*\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?\s*/g, ' ').trim();
      cleaned = cleaned.replace(/\s*\d{2}:\d{2}(:\d{2})?\s*/g, ' ').trim();

      // Remove números de referência, protocolo, CPF/CNPJ
      cleaned = cleaned.replace(/ref[:\s]+[\w\d]+/gi, '').trim();
      cleaned = cleaned.replace(/protocolo[:\s]+[\w\d]+/gi, '').trim();
      cleaned = cleaned.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '').trim();
      cleaned = cleaned.replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '').trim();
      cleaned = cleaned.replace(/cpf[:\s]+[\d\.\-\/]+/gi, '').trim();
      cleaned = cleaned.replace(/cnpj[:\s]+[\d\.\-\/]+/gi, '').trim();

      // Remove números de conta, agência
      cleaned = cleaned.replace(/ag[:\s]+\d+/gi, '').trim();
      cleaned = cleaned.replace(/cc[:\s]+\d+/gi, '').trim();
      cleaned = cleaned.replace(/conta[:\s]+\d+/gi, '').trim();

      // Remove preposições e artigos isolados no início
      cleaned = cleaned.replace(/^(de|da|do|das|dos|a|o|as|os|em|na|no|nas|nos|para|por|via)\s+/gi, '').trim();

      // Remove múltiplos espaços
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      // Pega APENAS A PRIMEIRA palavra significativa (mais de 2 letras)
      const words = cleaned.split(' ').filter(w => w.length > 2);
      let selectedText = '';

      if (words.length > 0) {
        selectedText = words[0];
        if (selectedText.length <= 4 && words.length > 1) {
          selectedText = words.slice(0, 2).join(' ');
        }
      } else {
        const allWords = cleaned.split(' ');
        if (allWords.length > 0) {
          selectedText = allWords[0];
          if (selectedText.length <= 4 && allWords.length > 1) {
            selectedText = allWords.slice(0, 2).join(' ');
          }
        }
      }

      if (!selectedText) return '';
      return selectedText.split(' ').map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
    };

    // Agrupa transações por descrição similar
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cleanedDesc = cleanDescription(t.description);
        if (!cleanedDesc) return;

        const date = new Date(t.date);
        const day = date.getDate();

        if (!descriptionData[cleanedDesc]) {
          descriptionData[cleanedDesc] = {
            count: 0,
            days: []
          };
        }
        descriptionData[cleanedDesc].count += 1;
        descriptionData[cleanedDesc].days.push(day);
      });

    // Filtra descrições que aparecem pelo menos 2 vezes
    const recurring = Object.entries(descriptionData)
      .filter(([desc, data]) => data.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([desc, data]) => {
        const dayFrequency = {};
        data.days.forEach(day => {
          dayFrequency[day] = (dayFrequency[day] || 0) + 1;
        });

        const mostFrequentDay = Object.entries(dayFrequency)
          .sort((a, b) => b[1] - a[1])[0][0];

        return {
          name: desc,
          suggestedDay: parseInt(mostFrequentDay)
        };
      });

    const existingNames = recurringExpenses.map(e => e.name.toLowerCase());
    return recurring.filter(item => !existingNames.includes(item.name.toLowerCase()));
  }, [transactions, recurringExpenses]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('recurring_expenses')
        .insert({
          ...data,
          category: 'outras_despesas',
          amount: 0,
          status: 'active',
          notify_email: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setNewExpense({ name: "", due_day: "5", reminder_days_before: "3" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setEditingName({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });

  const handleAddExpense = () => {
    if (!newExpense.name.trim()) return;

    createMutation.mutate({
      name: newExpense.name.trim(),
      due_day: parseInt(newExpense.due_day),
      reminder_days_before: parseInt(newExpense.reminder_days_before)
    });
  };

  const handleAddSuggestion = (suggestion) => {
    createMutation.mutate({
      name: suggestion.name,
      due_day: suggestion.suggestedDay,
      reminder_days_before: 3
    });
  };

  const handleNameChange = (id, newName) => {
    setEditingName({ ...editingName, [id]: newName });
  };

  const handleNameBlur = (id) => {
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;

    const newName = editingName[id];
    if (newName !== undefined && newName.trim() !== expense.name) {
      updateMutation.mutate({ id, data: { name: newName.trim() } });
    } else {
      const newEditingState = { ...editingName };
      delete newEditingState[id];
      setEditingName(newEditingState);
    }
  };

  const handleUpdateExpense = (id, field, value) => {
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;

    const updateData = {};

    if (field === 'due_day') {
      updateData.due_day = parseInt(value);
    } else if (field === 'reminder_days_before') {
      updateData.reminder_days_before = parseInt(value);
    }

    updateMutation.mutate({ id, data: updateData });
  };

  const getDisplayName = (expense) => {
    return editingName[expense.id] !== undefined ? editingName[expense.id] : expense.name;
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Despesas Recorrentes
        </h1>
        <p className="text-slate-600">
          Configure lembretes automáticos para suas despesas fixas
        </p>
      </div>

      {/* Sugestões baseadas em IA */}
      {suggestedExpenses.length > 0 && (
        <Alert className="border-purple-200 bg-purple-50">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-purple-900">
                💡 Detectamos possíveis despesas recorrentes:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedExpenses.map((suggestion, index) => (
                  <Badge
                    key={index}
                    className="bg-white text-purple-700 border-purple-300 hover:bg-purple-100 cursor-pointer"
                    onClick={() => handleAddSuggestion(suggestion)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {suggestion.name} (dia {suggestion.suggestedDay})
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Clique para adicionar à lista (já com o dia de vencimento detectado)
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Despesas */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header da tabela - responsivo */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 pb-2 border-b-2 border-slate-200">
              <div className="col-span-5 font-semibold text-slate-700 text-sm">
                Despesa
              </div>
              <div className="col-span-3 font-semibold text-slate-700 text-sm text-center">
                Dia Vencimento
              </div>
              <div className="col-span-3 font-semibold text-slate-700 text-sm text-center">
                Lembrete
              </div>
              <div className="col-span-1"></div>
            </div>

            {/* Lista de despesas existentes */}
            {recurringExpenses.map((expense) => (
              <div key={expense.id} className="bg-slate-50 p-3 rounded-lg space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-center hover:bg-slate-100 transition-colors">
                {/* Nome da despesa - full width em mobile */}
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                    Despesa:
                  </label>
                  <Input
                    value={getDisplayName(expense)}
                    onChange={(e) => handleNameChange(expense.id, e.target.value)}
                    onBlur={() => handleNameBlur(expense.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNameBlur(expense.id);
                      }
                    }}
                    className="border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-colors w-full"
                  />
                </div>

                {/* Dia Vencimento */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                    Dia de Vencimento:
                  </label>
                  <Select
                    value={expense.due_day.toString()}
                    onValueChange={(value) => handleUpdateExpense(expense.id, 'due_day', value)}
                  >
                    <SelectTrigger className="border-slate-200 hover:border-blue-400 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lembrete */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                    Lembrete:
                  </label>
                  <Select
                    value={expense.reminder_days_before.toString()}
                    onValueChange={(value) => handleUpdateExpense(expense.id, 'reminder_days_before', value)}
                  >
                    <SelectTrigger className="border-slate-200 hover:border-blue-400 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão deletar */}
                <div className="md:col-span-1 flex justify-end md:justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(expense.id)}
                    className="hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Linha para adicionar nova despesa */}
            <div className="pt-3 border-t-2 border-dashed border-slate-200 bg-blue-50 p-3 rounded-lg space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-center">
              {/* Nome da despesa */}
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                  Nova Despesa:
                </label>
                <Input
                  placeholder="Nome da despesa..."
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                  className="border-blue-200 focus:border-blue-500 w-full"
                />
              </div>

              {/* Dia vencimento */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                  Dia de Vencimento:
                </label>
                <Select
                  value={newExpense.due_day}
                  onValueChange={(value) => setNewExpense({ ...newExpense, due_day: value })}
                >
                  <SelectTrigger className="border-blue-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lembrete */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1 md:hidden">
                  Lembrete:
                </label>
                <Select
                  value={newExpense.reminder_days_before}
                  onValueChange={(value) => setNewExpense({ ...newExpense, reminder_days_before: value })}
                >
                  <SelectTrigger className="border-blue-200 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botão adicionar */}
              <div className="md:col-span-1 flex justify-end md:justify-center">
                <Button
                  size="icon"
                  onClick={handleAddExpense}
                  disabled={!newExpense.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica final */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>Dica:</strong> Configure suas despesas fixas aqui para receber lembretes 
          automáticos antes do vencimento e nunca mais esquecer de pagar uma conta!
        </AlertDescription>
      </Alert>
    </div>
  );
}
