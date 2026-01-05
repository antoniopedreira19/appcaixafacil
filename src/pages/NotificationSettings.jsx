import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Mail, Calendar, CheckCircle2, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => base44.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  });

  const [preferences, setPreferences] = useState({
    email_reports: true,
    report_frequency: 'monthly',
    report_day_of_week: 1,
    report_day_of_month: 1,
    expense_reminders: true,
    ...user?.notification_preferences
  });

  React.useEffect(() => {
    if (user?.notification_preferences) {
      setPreferences({
        email_reports: true,
        report_frequency: 'monthly',
        report_day_of_week: 1,
        report_day_of_month: 1,
        expense_reminders: true,
        ...user.notification_preferences
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserMutation.mutateAsync({
        notification_preferences: preferences
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erro ao salvar preferências. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Configurações de Notificações
        </h1>
        <p className="text-slate-600 mt-1">
          Configure como e quando você quer receber lembretes e relatórios
        </p>
      </div>

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-900">
            Preferências salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Relatórios Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Relatórios por Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="email-reports" className="text-base font-medium cursor-pointer">
                Receber relatórios automáticos
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                Enviaremos análises financeiras detalhadas para seu email
              </p>
            </div>
            <Switch
              id="email-reports"
              checked={preferences.email_reports}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_reports: checked })
              }
            />
          </div>

          {preferences.email_reports && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Frequência dos relatórios
                </Label>
                <Select
                  value={preferences.report_frequency}
                  onValueChange={(value) => 
                    setPreferences({ ...preferences, report_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">
                      📅 Semanal
                    </SelectItem>
                    <SelectItem value="monthly">
                      📆 Mensal
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {preferences.report_frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Dia da semana
                  </Label>
                  <Select
                    value={preferences.report_day_of_week?.toString()}
                    onValueChange={(value) => 
                      setPreferences({ ...preferences, report_day_of_week: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {preferences.report_frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Dia do mês
                  </Label>
                  <Select
                    value={preferences.report_day_of_month?.toString()}
                    onValueChange={(value) => 
                      setPreferences({ ...preferences, report_day_of_month: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Limitado até dia 28 para evitar problemas com meses menores
                  </p>
                </div>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>⚠️ Configuração Externa Necessária:</strong> Os relatórios automáticos requerem 
                  configuração de um webhook externo (Zapier, Make.com ou similar). Contate o suporte para assistência.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lembretes de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Lembretes de Despesas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="expense-reminders" className="text-base font-medium cursor-pointer">
                Receber lembretes de vencimento
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                Email com lembretes das suas despesas recorrentes próximas do vencimento
              </p>
            </div>
            <Switch
              id="expense-reminders"
              checked={preferences.expense_reminders}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, expense_reminders: checked })
              }
            />
          </div>

          {preferences.expense_reminders && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Configure os dias de antecedência em cada despesa recorrente na página 
                <strong> Despesas Recorrentes</strong>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info sobre implementação */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Como Funcionam os Lembretes Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>
            <strong>Relatórios por email</strong> e <strong>lembretes de despesas</strong> requerem 
            configuração de automação externa via webhook.
          </p>
          <p className="font-semibold mt-3">Opções de implementação:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Zapier:</strong> Serviço pago, fácil de configurar</li>
            <li><strong>Make.com:</strong> Tem plano gratuito limitado</li>
            <li><strong>n8n:</strong> Open source, self-hosted</li>
          </ul>
          <p className="mt-3">
            Essas ferramentas podem chamar automaticamente a função do CaixaFácil 
            em horários programados para enviar os emails.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Salvar Preferências
            </>
          )}
        </Button>
      </div>
    </div>
  );
}