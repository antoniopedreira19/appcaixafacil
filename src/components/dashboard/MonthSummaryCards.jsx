import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronDown, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Função para formatar valores sem decimal
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const explanations = {
  initialBalance: {
    title: "💰 Saldo Inicial",
    description: (
      <div className="space-y-3">
        <p className="text-slate-700 leading-relaxed">
          É o <strong>dinheiro que você tinha em caixa no primeiro dia do período</strong>. 
          Pense nisso como o "ponto de partida" do seu mês.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>📊 Como é calculado?</strong>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            É a soma de <strong>todas as entradas</strong> menos <strong>todas as saídas</strong> dos períodos anteriores.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-900">
            <strong>💡 Exemplo prático:</strong>
          </p>
          <p className="text-sm text-emerald-800 mt-1">
            Se em dezembro você tinha R$ 10.000 em caixa, esse é o seu <strong>Saldo Inicial de janeiro</strong>.
          </p>
        </div>
      </div>
    )
  },
  income: {
    title: "💵 Entradas do Período",
    description: (
      <div className="space-y-3">
        <p className="text-slate-700 leading-relaxed">
          É <strong>todo o dinheiro que ENTROU no seu caixa</strong> durante este período. 
        </p>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-900 font-semibold mb-2">
            ✅ Exemplos de entradas:
          </p>
          <ul className="text-sm text-emerald-800 space-y-1 ml-4">
            <li>• 💰 Vendas à vista ou no cartão</li>
            <li>• 💳 Recebimentos de clientes</li>
            <li>• 🛠️ Pagamentos por serviços prestados</li>
            <li>• 📈 Investimentos que renderam</li>
            <li>• 🎁 Outras receitas</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>💡 Dica importante:</strong>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Quanto <strong>maior este valor</strong>, mais dinheiro está entrando no seu negócio. 
            Isso é bom! 🎉
          </p>
        </div>
      </div>
    )
  },
  expense: {
    title: "💸 Saídas do Período",
    description: (
      <div className="space-y-3">
        <p className="text-slate-700 leading-relaxed">
          É <strong>todo o dinheiro que SAIU do seu caixa</strong> durante este período.
        </p>
        
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-sm text-rose-900 font-semibold mb-2">
            ❌ Exemplos de saídas:
          </p>
          <ul className="text-sm text-rose-800 space-y-1 ml-4">
            <li>• 👥 Salários de funcionários</li>
            <li>• 📦 Pagamentos a fornecedores</li>
            <li>• 🏠 Aluguel do ponto comercial</li>
            <li>• 💡 Contas de água, luz, internet</li>
            <li>• 📊 Impostos e taxas</li>
            <li>• 📱 Marketing e publicidade</li>
            <li>• 🔧 Manutenção e reparos</li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-900">
            <strong>⚠️ Atenção:</strong>
          </p>
          <p className="text-sm text-orange-800 mt-1">
            Controlar as saídas é <strong>tão importante quanto aumentar as entradas</strong>. 
            Revise sempre se há gastos que podem ser reduzidos!
          </p>
        </div>
      </div>
    )
  },
  result: {
    title: "📊 Resultado do Período",
    description: (
      <div className="space-y-3">
        <p className="text-slate-700 leading-relaxed">
          É <strong>quanto você ganhou ou perdeu</strong> durante o período. 
          É a diferença entre o que entrou e o que saiu.
        </p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-sm text-slate-900 font-semibold">
            🧮 Fórmula:
          </p>
          <p className="text-sm text-slate-700 mt-2 font-mono bg-white p-2 rounded border">
            Resultado = Entradas - Saídas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-900 font-semibold mb-1">
              ✅ Resultado Positivo
            </p>
            <p className="text-xs text-emerald-800">
              Significa que você teve <strong>lucro</strong>! 
              Entrou mais dinheiro do que saiu. 🎉
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-sm text-rose-900 font-semibold mb-1">
              ❌ Resultado Negativo
            </p>
            <p className="text-xs text-rose-800">
              Significa que você teve <strong>prejuízo</strong>. 
              Saiu mais dinheiro do que entrou. ⚠️
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>💡 Objetivo:</strong>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            O ideal é ter resultados <strong>positivos consistentes</strong>. 
            Isso significa que seu negócio está saudável e crescendo! 📈
          </p>
        </div>
      </div>
    )
  },
  finalBalance: {
    title: "🎯 Saldo Final",
    description: (
      <div className="space-y-3">
        <p className="text-slate-700 leading-relaxed">
          É o <strong>dinheiro que você tem em caixa no último dia do período</strong>. 
          É o resultado de tudo que aconteceu no mês.
        </p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-sm text-slate-900 font-semibold mb-2">
            🧮 Como é calculado:
          </p>
          <div className="bg-white p-3 rounded border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Saldo Inicial</span>
              <span className="font-mono text-slate-900">+ R$ 10.000</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">+ Entradas</span>
              <span className="font-mono text-emerald-600">+ R$ 25.000</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-rose-600">- Saídas</span>
              <span className="font-mono text-rose-600">- R$ 20.000</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">= Saldo Final</span>
              <span className="font-mono font-bold text-blue-600">= R$ 15.000</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-900 font-semibold mb-1">
              ✅ Saldo Positivo
            </p>
            <p className="text-xs text-emerald-800">
              Você tem dinheiro em caixa! 
              Seu negócio está <strong>saudável</strong>. 💪
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-sm text-rose-900 font-semibold mb-1">
              ⚠️ Saldo Negativo
            </p>
            <p className="text-xs text-rose-800">
              Você está devendo ou no cheque especial. 
              <strong>Atenção redobrada!</strong> 🚨
            </p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-900">
            <strong>🎯 Importante:</strong>
          </p>
          <p className="text-sm text-purple-800 mt-1">
            Este saldo final se torna o <strong>Saldo Inicial do próximo período</strong>. 
            É um ciclo contínuo! ♻️
          </p>
        </div>
      </div>
    )
  }
};

function InfoIcon({ explanationType }) {
  const [open, setOpen] = useState(false);
  const explanation = explanations[explanationType];

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center justify-center w-5 h-5 hover:bg-slate-200 rounded-full transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-slate-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">{explanation.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            {explanation.description}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MonthSummaryCards({ 
  income, 
  expense, 
  balance, 
  initialBalance,
  finalBalance,
  periodLabel,
  onClickIncome, 
  onClickExpense, 
  expandedCard, 
  children 
}) {
  return (
    <Card className="border-0 shadow-md bg-white">
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Fluxo de Caixa</h3>
        
        <div className="space-y-2">
          {/* Saldo Inicial */}
          <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
            <div>
              <span className="text-slate-700 font-medium text-sm">(=) Saldo inicial</span>
              <div className="text-xs text-slate-500 mt-0.5">({periodLabel})</div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-bold whitespace-nowrap ${
                initialBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {initialBalance >= 0 ? '' : '-'} R$ {formatCurrency(Math.abs(initialBalance))}
              </span>
              <InfoIcon explanationType="initialBalance" />
            </div>
          </div>

          {/* Entradas */}
          <div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'income' 
                  ? 'bg-emerald-50 border-2 border-emerald-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickIncome}
            >
              <div>
                <span className="text-slate-700 font-medium text-sm">(+) Entradas</span>
                <div className="text-xs text-slate-500 mt-0.5">({periodLabel})</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-emerald-600 whitespace-nowrap">
                  R$ {formatCurrency(income)}
                </span>
                <InfoIcon explanationType="income" />
                {expandedCard === 'income' ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
                )}
              </div>
            </div>
            
            {expandedCard === 'income' && children?.income}
          </div>

          {/* Saídas */}
          <div>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                expandedCard === 'expense' 
                  ? 'bg-rose-50 border-2 border-rose-500' 
                  : 'hover:bg-slate-50'
              }`}
              onClick={onClickExpense}
            >
              <div>
                <span className="text-slate-700 font-medium text-sm">(-) Saídas</span>
                <div className="text-xs text-slate-500 mt-0.5">({periodLabel})</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-rose-600 whitespace-nowrap">
                  R$ {formatCurrency(expense)}
                </span>
                <InfoIcon explanationType="expense" />
                {expandedCard === 'expense' ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
                )}
              </div>
            </div>
            
            {expandedCard === 'expense' && children?.expense}
          </div>

          {/* Resultado do Período */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <span className="text-slate-900 font-semibold text-sm">(=) Resultado</span>
                <div className="text-xs text-slate-500 mt-0.5">({periodLabel})</div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-lg font-bold whitespace-nowrap ${
                  balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {balance >= 0 ? '+' : '-'} R$ {formatCurrency(Math.abs(balance))}
                </span>
                <InfoIcon explanationType="result" />
              </div>
            </div>
          </div>

          {/* Saldo Final */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border-2 border-slate-200">
            <div>
              <span className="text-slate-900 font-bold text-sm whitespace-nowrap">(=) Saldo final</span>
              <div className="text-xs text-slate-500 mt-0.5">({periodLabel})</div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xl font-bold whitespace-nowrap ${
                finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {finalBalance >= 0 ? '' : '-'} R$ {formatCurrency(Math.abs(finalBalance))}
              </span>
              <InfoIcon explanationType="finalBalance" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default React.memo(MonthSummaryCards);