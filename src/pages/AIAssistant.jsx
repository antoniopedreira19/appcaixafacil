
import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Send, Sparkles, AlertCircle, Zap, TrendingUp, TrendingDown, Target, RotateCcw, User, Palette, Home, Menu, List } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import ChatMessage from "../components/ai/ChatMessage";
import SuggestedQuestions from "../components/ai/SuggestedQuestions";
import BusinessContextDialog from "../components/ai/BusinessContextDialog";
import FlavioAvatar, { FLAVIO_AVATARS } from "../components/ai/FlavioAvatar";
import AvatarSelector from "../components/ai/AvatarSelector";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const isFirstLoadRef = useRef(true);

  const queryClient = useQueryClient();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: recurringExpenses, isLoading: loadingRecurring } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => base44.entities.RecurringExpense.list('-due_day'),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData) => base44.auth.updateMe(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !isFirstLoadRef.current) return;
    
    if (!user.business_segment && messages.length === 0) {
      setShowContextDialog(true);
      isFirstLoadRef.current = false;
      return;
    }
    
    if (!user.flavio_avatar && messages.length === 0 && !showContextDialog) {
      setTimeout(() => {
        setShowAvatarSelector(true);
        isFirstLoadRef.current = false;
      }, 500);
    } else {
      isFirstLoadRef.current = false;
    }
  }, [user, messages, showContextDialog]);

  const hasBusinessContext = useMemo(() => {
    return user?.business_segment && user?.business_name;
  }, [user]);

  const selectedAvatar = useMemo(() => {
    return user?.flavio_avatar || 'avatar1';
  }, [user]);

  const consultorName = useMemo(() => {
    const avatar = FLAVIO_AVATARS[selectedAvatar];
    return avatar?.name || 'Flávio';
  }, [selectedAvatar]);

  const financialData = useMemo(() => {
    if (!transactions.length) return null;

    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const lastMonthStart = startOfMonth(subMonths(currentDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const totalBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
    }, 0);

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const incomeVariation = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseVariation = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

    const expensesByCategory = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!expensesByCategory[t.category]) {
          expensesByCategory[t.category] = 0;
        }
        expensesByCategory[t.category] += Math.abs(t.amount);
      });

    const topExpenses = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const threeMonthsAgo = subMonths(currentDate, 3);
    const last3MonthsIncome = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date >= threeMonthsAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const avgMonthlyIncome = last3MonthsIncome / 3;

    const activeRecurring = recurringExpenses.filter(e => e.status === 'active');
    const totalRecurringExpenses = activeRecurring.reduce((sum, e) => sum + e.amount, 0);

    let cashRunway = null;
    if (currentExpense > 0) {
      const avgDailyExpense = currentExpense / 30;
      if (avgDailyExpense > 0 && totalBalance > 0) {
        cashRunway = Math.floor(totalBalance / avgDailyExpense);
      }
    }

    const last6Months = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(currentDate, i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      
      const monthTxs = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= mStart && date <= mEnd;
      });
      
      const mIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const mExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
      
      last6Months.push({
        month: format(monthDate, 'MMM/yy', { locale: ptBR }),
        income: mIncome,
        expense: mExpense,
        balance: mIncome - mExpense
      });
    }

    const hasGrowingIncome = last6Months.length >= 3 && 
      last6Months[0].income > last6Months[2].income;
    const hasGrowingExpense = last6Months.length >= 3 && 
      last6Months[0].expense > last6Months[2].expense;

    return {
      currentBalance: totalBalance,
      monthSummary: {
        income: currentIncome,
        expense: currentExpense,
        balance: currentIncome - currentExpense
      },
      lastMonthSummary: {
        income: lastIncome,
        expense: lastExpense,
        balance: lastIncome - lastExpense
      },
      variations: {
        income: incomeVariation,
        expense: expenseVariation
      },
      topExpenses,
      recurringExpenses: activeRecurring.slice(0, 5),
      totalRecurringExpenses,
      avgMonthlyIncome,
      cashRunway,
      last6Months: last6Months.reverse(),
      trends: {
        hasGrowingIncome,
        hasGrowingExpense
      }
    };
  }, [transactions, recurringExpenses]);

  const businessContext = useMemo(() => {
    if (!user) return null;
    
    return {
      business_name: user.business_name,
      business_segment: user.business_segment,
      employee_count: user.employee_count,
      operation_type: user.operation_type,
      operation_states: user.operation_states,
      operation_cities: user.operation_cities,
      main_challenge: user.main_challenge
    };
  }, [user]);

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage = {
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationMessages = [...messages, userMessage];

      const response = await base44.functions.invoke('chatGPT', {
        messages: conversationMessages,
        financialData: financialData,
        businessContext: businessContext
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        role: "assistant",
        content: `❌ Desculpe, ocorreu um erro: ${error.message}. Por favor, tente novamente.`,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInput("");
  };

  const handleSaveContext = async (contextData) => {
    try {
      await updateUserMutation.mutateAsync(contextData);
      setShowContextDialog(false);
      
      const welcomeMessage = {
        role: "assistant",
        content: `E aí! Prazer, sou ${consultorName === 'Flávia' ? 'a' : 'o'} ${consultorName}! 👋

Fiquei muito feliz em conhecer o ${contextData.business_name}! ${contextData.business_segment ? `Já trabalhei com vários negócios no ramo de ${contextData.business_segment}, então conheço bem os desafios do dia a dia.` : ''}

Olha, vou ser ${consultorName === 'Flávia' ? 'direta' : 'direto'}: não sou apenas ${consultorName === 'Flávia' ? 'uma assistente' : 'um assistente'} que responde perguntas. Sou ${consultorName === 'Flávia' ? 'sua consultora financeira pessoal' : 'seu consultor financeiro pessoal'}. Tá mais para ter ${consultorName === 'Flávia' ? 'uma parceira' : 'um parceiro'} de negócios que olha seus números com você do que um robô automático.

**O que eu faço por você:**

💰 **Analiso suas finanças a fundo** - E te falo a real, sem enrolação
🎯 **Identifico oportunidades** - Às vezes tem dinheiro parado no lugar errado
📊 **Acompanho seus indicadores** - E te aviso quando algo não tá legal
💡 **Dou conselhos práticos** - Coisas que você consegue fazer mesmo
⚠️ **Te alerto antes do problema** - Melhor prevenir que remediar, né?

${contextData.main_challenge ? `\n🎯 **Sobre o desafio que você me contou:**\n"${contextData.main_challenge}"\n\nÓtimo, vou focar especialmente nisso! Sempre que eu analisar seus números ou der alguma recomendação, vou ter esse desafio em mente.\n` : ''}

**Como a gente trabalha juntos?**
- Me pergunta o que quiser sobre seu negócio
- Pede uma análise completa da situação atual
- Me conta um problema específico que tá te tirando o sono
- Ou simplesmente bate um papo sobre as finanças

Tô aqui pra ajudar de verdade. Bora fazer esse negócio crescer com saúde financeira? 🚀`,
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error saving context:', error);
    }
  };

  const handleSelectAvatar = async (avatarId) => {
    try {
      await updateUserMutation.mutateAsync({ flavio_avatar: avatarId });
      setShowAvatarSelector(false);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const quickInsights = useMemo(() => {
    if (!financialData) return null;

    const insights = [];
    const { currentBalance, monthSummary, variations, cashRunway, totalRecurringExpenses } = financialData;

    if (currentBalance < totalRecurringExpenses && currentBalance > 0) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        text: `Caixa cobre apenas ${Math.floor(currentBalance / totalRecurringExpenses * 30)} dias de despesas fixas`
      });
    }

    if (monthSummary.balance < 0) {
      insights.push({
        type: 'danger',
        icon: TrendingDown,
        text: `Prejuízo de R$ ${Math.abs(monthSummary.balance).toLocaleString('pt-BR', {minimumFractionDigits: 0})} este mês`
      });
    }

    if (variations.income > 10) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        text: `Receita cresceu ${variations.income.toFixed(0)}% vs mês passado`
      });
    }

    if (variations.expense > 15) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        text: `Despesas aumentaram ${variations.expense.toFixed(0)}% vs mês passado`
      });
    }

    return insights;
  }, [financialData]);

  const isLoadingData = loadingUser || loadingTransactions || loadingRecurring;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl mx-auto w-full p-3 md:p-4">
        {/* Header Compacto */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-3 border border-purple-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FlavioAvatar avatarId={selectedAvatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900">{consultorName}</h1>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-blue-100 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">Consultor{consultorName === 'Flávia' ? 'a' : ''} IA</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 truncate">
                  {hasBusinessContext 
                    ? `${user.business_name} 🚀`
                    : `${consultorName === 'Flávia' ? 'Sua consultora financeira pessoal' : 'Seu consultor financeiro pessoal'}`
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAvatarSelector(true)}
                className="gap-1.5 h-8 text-xs"
                title={`Trocar avatar ${consultorName === 'Flávia' ? 'da' : 'do'} ${consultorName}`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Avatar</span>
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetConversation}
                  className="gap-1.5 h-8 text-xs"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Menu</span>
                </Button>
              )}
              {hasBusinessContext && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContextDialog(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perfil</span>
                </Button>
              )}
            </div>
          </div>

          {quickInsights && quickInsights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                {quickInsights.map((insight, idx) => {
                  const Icon = insight.icon;
                  const colors = {
                    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    warning: 'bg-orange-50 text-orange-700 border-orange-200',
                    danger: 'bg-rose-50 text-rose-700 border-rose-200'
                  };
                  return (
                    <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${colors[insight.type]}`}>
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium truncate">{insight.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!hasBusinessContext && messages.length > 0 && (
          <Alert className="mb-3 border-orange-200 bg-orange-50 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
            <AlertDescription className="text-orange-900 text-xs">
              <strong>💡 Dica:</strong> Configure seu perfil para análises mais precisas!
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowContextDialog(true)}
                className="text-orange-700 hover:text-orange-900 p-0 h-auto ml-1 text-xs"
              >
                Configurar →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {transactions.length === 0 && (
          <Alert className="mb-3 border-blue-200 bg-blue-50 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
            <AlertDescription className="text-blue-900 text-xs">
              <strong>📊 Adicione transações</strong> para análises profundas e recomendações personalizadas!
            </AlertDescription>
          </Alert>
        )}

        {/* Área de Chat */}
        <div className="flex-1 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col border-4 border-purple-200">
          {/* Área de Conteúdo com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            <div ref={messagesStartRef} />
            
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-4">
                <div className="relative">
                  <FlavioAvatar avatarId={selectedAvatar} size="xxl" className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    E aí! Sou {consultorName === 'Flávia' ? 'a' : 'o'} {consultorName} 👋
                  </h2>
                  <p className="text-slate-600 max-w-lg text-lg mb-6">
                    {consultorName === 'Flávia' ? 'Sua consultora financeira pessoal' : 'Seu consultor financeiro pessoal'}. Bora analisar suas finanças, encontrar oportunidades e fazer planos práticos?
                  </p>
                </div>

                {/* Input no meio da tela inicial */}
                <div className="w-full max-w-3xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-3"
                  >
                    <div className="flex-1 relative">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="💬 Pergunte qualquer coisa sobre suas finanças..."
                        disabled={isLoading}
                        className="h-14 text-base bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 shadow-lg rounded-xl px-5 placeholder:text-slate-400"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hidden md:block">
                        Enter para enviar
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl text-base font-semibold rounded-xl"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </form>
                  
                  <p className="text-center text-xs text-slate-500 mt-3">
                    ✨ <strong>Dica:</strong> Quanto mais detalhes você der, melhor será minha análise!
                  </p>
                </div>
                
                <div className="w-full max-w-3xl">
                  <SuggestedQuestions onSelectQuestion={handleSendMessage} />
                </div>
              </div>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetConversation}
                      className="w-full gap-2 bg-white hover:bg-purple-50 border-purple-200 shadow-sm"
                    >
                      <List className="w-4 h-4" />
                      Voltar para o menu de perguntas sugeridas
                    </Button>
                  </div>
                )}
                
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} avatarId={selectedAvatar} />
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <FlavioAvatar avatarId={selectedAvatar} size="sm" />
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4">
                      <div className="flex gap-2 items-center">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-xs text-slate-500 ml-2">{consultorName} está analisando...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input SEMPRE NO FINAL quando há mensagens */}
          {messages.length > 0 && (
            <div className="border-t-4 border-purple-200 p-4 md:p-6 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-3"
              >
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="💬 Pergunte qualquer coisa sobre suas finanças..."
                    disabled={isLoading}
                    className="h-14 text-base bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 shadow-lg rounded-xl px-5 placeholder:text-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hidden md:block">
                    Enter para enviar
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl text-base font-semibold rounded-xl"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </form>
              
              <p className="text-center text-xs text-slate-500 mt-3">
                ✨ <strong>Dica:</strong> Quanto mais detalhes você der, melhor será minha análise!
              </p>
            </div>
          )}
        </div>
      </div>

      <BusinessContextDialog
        open={showContextDialog}
        onClose={() => setShowContextDialog(false)}
        onSave={handleSaveContext}
        user={user}
      />

      <AvatarSelector
        open={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelectAvatar={handleSelectAvatar}
        currentAvatar={selectedAvatar}
      />
    </div>
  );
}
