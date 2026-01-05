import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, TrendingUp, DollarSign, PiggyBank, CreditCard, Target, AlertCircle, Lightbulb } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  {
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    text: "Analise minha situação financeira atual e dê um diagnóstico completo",
    category: "Análise"
  },
  {
    icon: AlertCircle,
    color: "bg-rose-100 text-rose-700 hover:bg-rose-200",
    text: "Identifique os principais problemas nas minhas finanças e me dê soluções prioritárias",
    category: "Diagnóstico"
  },
  {
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    text: "Como posso aumentar minha margem de lucro?",
    category: "Rentabilidade"
  },
  {
    icon: PiggyBank,
    color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    text: "Onde posso reduzir custos sem comprometer a qualidade?",
    category: "Redução de Custos"
  },
  {
    icon: Target,
    color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    text: "Crie um plano de ação de 90 dias para melhorar meu fluxo de caixa",
    category: "Planejamento"
  },
  {
    icon: CreditCard,
    color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    text: "Devo pegar um empréstimo? Quando faz sentido?",
    category: "Crédito"
  },
  {
    icon: Lightbulb,
    color: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    text: "Quais as melhores estratégias para meu segmento crescer com segurança?",
    category: "Crescimento"
  },
  {
    icon: TrendingUp,
    color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
    text: "Analise meu histórico e faça uma projeção financeira para os próximos 3 meses",
    category: "Projeção"
  }
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-700">Perguntas Sugeridas</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUGGESTED_QUESTIONS.map((question, index) => {
          const Icon = question.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className={`${question.color} border-0 justify-start text-left h-auto py-3 px-4 transition-all hover:shadow-md`}
              onClick={() => onSelectQuestion(question.text)}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-1 opacity-70">{question.category}</p>
                <p className="text-sm font-medium leading-snug whitespace-normal">{question.text}</p>
              </div>
            </Button>
          );
        })}
      </div>
      
      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          💡 <strong>Dica:</strong> Quanto mais específica sua pergunta, melhor será a consultoria que posso te oferecer!
        </p>
      </div>
    </div>
  );
}