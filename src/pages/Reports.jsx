import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Settings,
  Clock,
  CheckCircle2,
  Info,
  Sparkles
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const queryClient = useQueryClient();
  
  // Estado para geração manual
  const [manualReportType, setManualReportType] = useState('monthly');
  const [manualActionType, setManualActionType] = useState('download');
  const [customDates, setCustomDates] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Estado para configuração automática
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoSuccess, setAutoSuccess] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => base44.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setAutoSuccess(true);
      setTimeout(() => setAutoSuccess(false), 3000);
    }
  });

  const [autoPreferences, setAutoPreferences] = useState({
    email_reports: true,
    report_frequency: 'monthly',
    report_day_of_week: 1,
    report_day_of_month: 1,
    ...user?.notification_preferences
  });

  React.useEffect(() => {
    if (user?.notification_preferences) {
      setAutoPreferences({
        email_reports: true,
        report_frequency: 'monthly',
        report_day_of_week: 1,
        report_day_of_month: 1,
        ...user.notification_preferences
      });
    }
  }, [user]);

  const handleGenerateManual = async () => {
    setManualLoading(true);
    setManualSuccess(false);
    
    try {
      let payload = {
        reportType: manualReportType,
        sendEmail: manualActionType === 'email'
      };

      if (manualReportType === 'custom') {
        payload.startDate = customDates.startDate;
        payload.endDate = customDates.endDate;
      }

      const response = await base44.functions.invoke('generateFinancialReport', payload);

      if (manualActionType === 'email') {
        setManualSuccess(true);
        setTimeout(() => setManualSuccess(false), 3000);
      } else {
        // Download PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleSaveAutoConfig = async () => {
    setAutoLoading(true);
    try {
      await updateUserMutation.mutateAsync({
        notification_preferences: autoPreferences
      });
    } catch (error) {
      console.error('Error saving auto config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setAutoLoading(false);
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

  if (loadingUser) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Gestão de Relatórios
        </h1>
        <p className="text-slate-600 mt-1">
          Gere relatórios sob demanda ou configure recebimento automático por email
        </p>
      </div>

      {/* Card 1: Gerar Relatório Agora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Gerar Relatório Agora
          </CardTitle>
          <CardDescription>
            Crie um relatório financeiro detalhado com análise do Flávio (IA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Período */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Período do Relatório</Label>
            <RadioGroup value={manualReportType} onValueChange={setManualReportType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="weekly" id="manual-weekly" />
                <div className="flex-1">
                  <Label htmlFor="manual-weekly" className="cursor-pointer font-medium">
                    📅 Últimos 7 dias
                  </Label>
                  <p className="text-xs text-slate-500">Relatório da última semana</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="monthly" id="manual-monthly" />
                <div className="flex-1">
                  <Label htmlFor="manual-monthly" className="cursor-pointer font-medium">
                    📆 Mês Atual
                  </Label>
                  <p className="text-xs text-slate-500">
                    {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="custom" id="manual-custom" />
                <div className="flex-1">
                  <Label htmlFor="manual-custom" className="cursor-pointer font-medium">
                    🎯 Período Personalizado
                  </Label>
                  <p className="text-xs text-slate-500">Escolha as datas</p>
                </div>
              </div>
            </RadioGroup>

            {manualReportType === 'custom' && (
              <div className="pl-6 space-y-3 border-l-2 border-blue-200 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Data Inicial</Label>
                  <Input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">Data Final</Label>
                  <Input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ação */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Como receber o relatório?</Label>
            <RadioGroup value={manualActionType} onValueChange={setManualActionType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="download" id="action-download" />
                <div className="flex-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="action-download" className="cursor-pointer font-medium">
                    Baixar PDF
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="email" id="action-email" />
                <div className="flex-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="action-email" className="cursor-pointer font-medium">
                    Enviar por Email
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {manualSuccess && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900 text-sm">
                ✅ Relatório enviado por email com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-2">
                <p className="font-semibold">O relatório incluirá:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Resumo financeiro completo do período</li>
                  <li>Análise de receitas e despesas</li>
                  <li>Top 5 maiores categorias de despesas</li>
                  <li>Análise personalizada do Flávio (IA) 🤖</li>
                  <li>Recomendações práticas e acionáveis</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerateManual} 
            disabled={manualLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {manualLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Gerando relatório...
              </>
            ) : (
              <>
                {manualActionType === 'email' ? (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Gerar e Enviar por Email
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Gerar e Baixar PDF
                  </>
                )}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card 2: Recebimento Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Relatórios Automáticos por Email
          </CardTitle>
          <CardDescription>
            Configure para receber relatórios periodicamente sem precisar gerar manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="auto-reports" className="text-base font-medium cursor-pointer">
                Ativar envio automático
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                Receba relatórios detalhados diretamente no seu email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="auto-reports"
                checked={autoPreferences.email_reports}
                onChange={(e) => 
                  setAutoPreferences({ ...autoPreferences, email_reports: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {autoPreferences.email_reports && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-200">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Frequência dos relatórios
                </Label>
                <Select
                  value={autoPreferences.report_frequency}
                  onValueChange={(value) => 
                    setAutoPreferences({ ...autoPreferences, report_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">
                      📅 Semanal (toda semana)
                    </SelectItem>
                    <SelectItem value="monthly">
                      📆 Mensal (todo mês)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {autoPreferences.report_frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Dia da semana
                  </Label>
                  <Select
                    value={autoPreferences.report_day_of_week?.toString()}
                    onValueChange={(value) => 
                      setAutoPreferences({ ...autoPreferences, report_day_of_week: parseInt(value) })
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
                  <p className="text-xs text-slate-500">
                    Ex: Toda segunda-feira você recebe o relatório da semana anterior
                  </p>
                </div>
              )}

              {autoPreferences.report_frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Dia do mês
                  </Label>
                  <Select
                    value={autoPreferences.report_day_of_month?.toString()}
                    onValueChange={(value) => 
                      setAutoPreferences({ ...autoPreferences, report_day_of_month: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Ex: Todo dia 1 você recebe o relatório do mês anterior
                  </p>
                  <p className="text-xs text-slate-500">
                    (Limitado até dia 28 para evitar problemas com meses menores)
                  </p>
                </div>
              )}

              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  <strong>⚠️ Configuração Externa Necessária:</strong> Envios automáticos requerem 
                  configuração de webhook externo (Zapier, Make.com ou similar). 
                  <a href="#" className="underline font-semibold ml-1">Ver instruções</a>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {autoSuccess && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                Configuração salva com sucesso!
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSaveAutoConfig}
            disabled={autoLoading}
            size="lg"
            className="w-full"
          >
            {autoLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: Como Funciona */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Como Configurar Envios Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-3">
          <p>
            Para receber relatórios automaticamente, é necessário configurar uma automação externa 
            que chame a função do CaixaFácil em horários programados.
          </p>
          
          <div className="space-y-2">
            <p className="font-semibold">📋 Opções recomendadas:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Zapier:</strong> Serviço pago (~$20/mês), muito fácil de usar</li>
              <li><strong>Make.com:</strong> Tem plano gratuito com 1000 operações/mês</li>
              <li><strong>n8n:</strong> Open source, gratuito (self-hosted)</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="font-semibold mb-2">🔧 Configuração básica (Zapier/Make):</p>
            <ol className="list-decimal ml-5 space-y-1 text-xs">
              <li>Criar trigger baseado em horário (Schedule)</li>
              <li>Configurar frequência (toda segunda, todo dia 1, etc)</li>
              <li>Adicionar ação: Webhook HTTP POST</li>
              <li>URL: [URL da função generateFinancialReport]</li>
              <li>Body: {`{"reportType": "weekly", "sendEmail": true}`}</li>
            </ol>
          </div>

          <p className="text-xs pt-2">
            💡 Entre em contato com o suporte se precisar de ajuda detalhada na configuração.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}