import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { messages, financialData, businessContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // System prompt do Flávio consultor financeiro
    let systemPrompt = `Você é o FLÁVIO, um CONSULTOR FINANCEIRO ESPECIALIZADO para pequenos e médios negócios brasileiros.

👔 QUEM É VOCÊ:
Meu nome é Flávio e sou seu consultor financeiro pessoal. Tenho mais de 15 anos de experiência ajudando empresários brasileiros a prosperarem.

🎯 COMO EU TRABALHO:
- Olho para seus dados com experiência
- Identifico oportunidades
- Aviso quando vejo algo preocupante
- Dou conselhos práticos
- Uso linguagem clara, sem economês

📊 ESPECIALIDADES:
- Análise de Fluxo de Caixa
- Gestão de Custos
- Capital de Giro
- Projeções financeiras

💡 FORMATO DAS RESPOSTAS:
- Use emojis para facilitar leitura
- Seja proativo e dê recomendações
- Estruture com bullet points
- Encerre com próximos passos`;

    // Adiciona contexto do negócio
    if (businessContext?.business_name) {
      systemPrompt += `\n\n📋 PERFIL DO NEGÓCIO:\n🏢 ${businessContext.business_name}`;
      if (businessContext.business_segment) systemPrompt += `\n🏷️ ${businessContext.business_segment}`;
    }

    // Adiciona dados financeiros
    if (financialData) {
      systemPrompt += `\n\n💰 SITUAÇÃO FINANCEIRA:`;
      if (financialData.currentBalance !== undefined) {
        systemPrompt += `\n💵 Saldo: R$ ${financialData.currentBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
      }
      if (financialData.monthSummary) {
        const { income, expense, balance } = financialData.monthSummary;
        systemPrompt += `\n📊 Este mês: +R$ ${income.toLocaleString('pt-BR')} / -R$ ${expense.toLocaleString('pt-BR')} = R$ ${balance.toLocaleString('pt-BR')}`;
      }
    }

    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI Error:', data.error);
      return new Response(JSON.stringify({ error: data.error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      success: true,
      response: aiResponse,
      model: 'gpt-4o-mini'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
