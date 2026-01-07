import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Mail, 
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const [manualReportType, setManualReportType] = useState('monthly');
  const [manualActionType, setManualActionType] = useState('download');
  const [customDates, setCustomDates] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

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

      const { data, error } = await supabase.functions.invoke('generateFinancialReport', {
        body: payload
      });

      if (error) throw error;

      if (manualActionType === 'email') {
        setManualSuccess(true);
        setTimeout(() => setManualSuccess(false), 3000);
      } else {
        // Download PDF
        const blob = new Blob([data], { type: 'application/pdf' });
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

  if (loadingUser) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Gestão de Relatórios
        </h1>
        <p className="text-slate-600 mt-1">
          Gere relatórios financeiros detalhados com análise do Flávio (IA)
        </p>
      </div>

      {/* Card: Gerar Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Gerar Relatório
          </CardTitle>
          <CardDescription>
            Crie um relatório financeiro detalhado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Período */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Período do Relatório</Label>
            <RadioGroup value={manualReportType} onValueChange={setManualReportType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">
                  📅 Últimos 7 dias
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  📆 Mês Atual ({format(new Date(), "MMMM", { locale: ptBR })})
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">
                  🎯 Período Personalizado
                </Label>
              </div>
            </RadioGroup>

            {manualReportType === 'custom' && (
              <div className="pl-6 space-y-3 border-l-2 border-blue-200 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Data Inicial</Label>
                  <Input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Data Final</Label>
                  <Input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ação */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Como receber?</Label>
            <RadioGroup value={manualActionType} onValueChange={setManualActionType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="download" id="download" />
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="download" className="cursor-pointer">Baixar PDF</Label>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="email" id="email" />
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="email" className="cursor-pointer">Enviar por Email</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {manualSuccess && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                ✅ Relatório enviado por email!
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">O relatório incluirá:</p>
                <ul className="space-y-1 ml-4 list-disc mt-2">
                  <li>Resumo financeiro completo</li>
                  <li>Top 5 categorias de despesas</li>
                  <li>Análise personalizada do Flávio (IA)</li>
                  <li>Recomendações práticas</li>
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
                Gerando...
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
    </div>
  );
}
