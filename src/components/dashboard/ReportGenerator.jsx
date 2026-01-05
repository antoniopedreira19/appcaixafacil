import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { FileText, Download, Mail, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportGenerator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [actionType, setActionType] = useState('download');
  const [customDates, setCustomDates] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSuccess(false);
    
    try {
      let payload = {
        reportType: reportType,
        sendEmail: actionType === 'email'
      };

      if (reportType === 'custom') {
        payload.startDate = customDates.startDate;
        payload.endDate = customDates.endDate;
      }

      const response = await base44.functions.invoke('generateFinancialReport', payload);

      if (actionType === 'email') {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
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
        setOpen(false);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
        >
          <FileText className="w-4 h-4" />
          Gerar Relatório PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Gerar Relatório Financeiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Relatório */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Período do Relatório</Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="weekly" id="weekly" />
                <div className="flex-1">
                  <Label htmlFor="weekly" className="cursor-pointer font-medium">
                    📅 Últimos 7 dias
                  </Label>
                  <p className="text-xs text-slate-500">Relatório da última semana</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="monthly" id="monthly" />
                <div className="flex-1">
                  <Label htmlFor="monthly" className="cursor-pointer font-medium">
                    📆 Mês Atual
                  </Label>
                  <p className="text-xs text-slate-500">
                    {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="custom" id="custom" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="cursor-pointer font-medium">
                    🎯 Período Personalizado
                  </Label>
                  <p className="text-xs text-slate-500">Escolha as datas</p>
                </div>
              </div>
            </RadioGroup>

            {reportType === 'custom' && (
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
            <Label className="text-sm font-semibold">O que fazer com o relatório?</Label>
            <RadioGroup value={actionType} onValueChange={setActionType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="download" id="download" />
                <div className="flex-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="download" className="cursor-pointer font-medium">
                    Baixar PDF
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                <RadioGroupItem value="email" id="email" />
                <div className="flex-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="email" className="cursor-pointer font-medium">
                    Enviar por Email
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {success && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <AlertDescription className="text-emerald-900 text-sm">
                ✅ Relatório enviado por email com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-semibold">O relatório incluirá:</p>
                <ul className="space-y-0.5 ml-4 list-disc">
                  <li>Resumo financeiro do período</li>
                  <li>Análise de receitas e despesas</li>
                  <li>Top 5 maiores despesas</li>
                  <li>Análise personalizada do Flávio (IA)</li>
                  <li>Recomendações práticas</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Gerando relatório...
              </>
            ) : (
              <>
                {actionType === 'email' ? (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Gerar e Enviar por Email
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar e Baixar PDF
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}