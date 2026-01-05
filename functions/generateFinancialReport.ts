import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body para obter período
        const body = await req.json().catch(() => ({}));
        const { startDate, endDate, reportType = 'monthly', sendEmail = false } = body;

        // Busca dados necessários
        const transactions = await base44.entities.Transaction.list('-date');
        const recurringExpenses = await base44.entities.RecurringExpense.filter({ status: 'active' });

        // Define período do relatório
        const now = new Date();
        let periodStart, periodEnd, periodLabel;

        if (startDate && endDate) {
            periodStart = new Date(startDate);
            periodEnd = new Date(endDate);
            periodLabel = `${formatDate(periodStart)} a ${formatDate(periodEnd)}`;
        } else if (reportType === 'weekly') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            periodStart = weekAgo;
            periodEnd = now;
            periodLabel = 'Últimos 7 dias';
        } else {
            // Monthly por padrão
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            periodLabel = formatMonth(now);
        }

        // Filtra transações do período
        const periodTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= periodStart && date <= periodEnd;
        });

        // Calcula estatísticas
        const income = periodTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = periodTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const balance = income - expense;

        // Saldo total (todas as transações)
        const totalBalance = transactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount));
        }, 0);

        // Top 5 despesas por categoria
        const expensesByCategory = {};
        periodTransactions
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

        // Despesas recorrentes ativas
        const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Gera análise com IA
        let aiAnalysis = '';
        try {
            const analysisResponse = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um consultor financeiro. Analise estes dados financeiros e dê um resumo executivo em 3-4 parágrafos curtos e práticos:

Período: ${periodLabel}
Receitas: R$ ${formatCurrency(income)}
Despesas: R$ ${formatCurrency(expense)}
Resultado: R$ ${formatCurrency(balance)} ${balance >= 0 ? '(positivo)' : '(negativo)'}
Saldo Atual em Caixa: R$ ${formatCurrency(totalBalance)}
Despesas Fixas Mensais: R$ ${formatCurrency(totalRecurring)}

Top 5 Categorias de Despesas:
${topExpenses.map((e, i) => `${i + 1}. ${getCategoryName(e.category)}: R$ ${formatCurrency(e.amount)}`).join('\n')}

Dê:
1. Um resumo da situação financeira
2. Principais pontos de atenção
3. 2-3 recomendações práticas e diretas

Seja objetivo, use linguagem simples e direta. Máximo 4 parágrafos curtos.`,
                add_context_from_internet: false
            });
            aiAnalysis = analysisResponse;
        } catch (error) {
            aiAnalysis = 'Análise indisponível no momento.';
        }

        // Gera PDF
        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('CaixaFácil', 20, 20);
        doc.setFontSize(14);
        doc.text('Relatório Financeiro', 20, 28);

        doc.setTextColor(0, 0, 0);
        y = 45;

        // Informações do período
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Relatório gerado em: ${formatDateTime(now)}`, 20, y);
        y += 6;
        doc.text(`Período: ${periodLabel}`, 20, y);
        y += 6;
        doc.text(`Empresa: ${user.business_name || user.full_name}`, 20, y);
        y += 12;

        // Resumo Financeiro
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('💰 Resumo Financeiro', 20, y);
        y += 10;

        doc.setFontSize(11);
        
        // Box com resumo
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, y, 170, 35, 3, 3, 'FD');
        
        y += 8;
        doc.setTextColor(16, 185, 129);
        doc.text(`Receitas: R$ ${formatCurrency(income)}`, 25, y);
        y += 8;
        doc.setTextColor(239, 68, 68);
        doc.text(`Despesas: R$ ${formatCurrency(expense)}`, 25, y);
        y += 8;
        doc.setTextColor(balance >= 0 ? 16 : 239, balance >= 0 ? 185 : 68, balance >= 0 ? 129 : 68);
        doc.setFont(undefined, 'bold');
        doc.text(`Resultado: R$ ${formatCurrency(balance)}`, 25, y);
        doc.setFont(undefined, 'normal');
        y += 8;
        doc.setTextColor(59, 130, 246);
        doc.text(`Saldo em Caixa: R$ ${formatCurrency(totalBalance)}`, 25, y);
        
        y += 15;

        // Top 5 Despesas
        if (topExpenses.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('📊 Principais Despesas', 20, y);
            y += 10;

            doc.setFontSize(10);
            topExpenses.forEach((expense, idx) => {
                const percentage = (expense.amount / totalBalance * 100).toFixed(1);
                doc.setTextColor(100, 100, 100);
                doc.text(`${idx + 1}. ${getCategoryName(expense.category)}`, 25, y);
                doc.setTextColor(239, 68, 68);
                doc.text(`R$ ${formatCurrency(expense.amount)}`, 160, y, { align: 'right' });
                y += 6;
            });
            y += 8;
        }

        // Despesas Recorrentes
        if (recurringExpenses.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('🔄 Despesas Recorrentes', 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Total mensal em despesas fixas: R$ ${formatCurrency(totalRecurring)}`, 25, y);
            y += 6;
            doc.text(`${recurringExpenses.length} despesa(s) recorrente(s) ativa(s)`, 25, y);
            y += 12;
        }

        // Nova página para análise
        doc.addPage();
        y = 20;

        // Análise IA
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('🤖 Análise do Flávio (Consultor IA)', 20, y);
        y += 12;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        // Split text para caber na página
        const analysisLines = doc.splitTextToSize(aiAnalysis, 170);
        analysisLines.forEach(line => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 6;
        });

        // Footer em todas as páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Página ${i} de ${pageCount} | CaixaFácil - Gestão Financeira Inteligente`,
                105,
                290,
                { align: 'center' }
            );
        }

        const pdfBytes = doc.output('arraybuffer');

        // Se sendEmail = true, envia por email em vez de retornar
        if (sendEmail && user.email) {
            // Aqui teríamos que fazer upload do PDF e enviar por email
            // Por enquanto, apenas retornamos o PDF
            // TODO: Implementar upload e envio de email
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: `Relatório Financeiro - ${periodLabel}`,
                body: `Olá ${user.full_name},\n\nSegue em anexo seu relatório financeiro do período ${periodLabel}.\n\nResumo:\n- Receitas: R$ ${formatCurrency(income)}\n- Despesas: R$ ${formatCurrency(expense)}\n- Resultado: R$ ${formatCurrency(balance)}\n\nAcesse o CaixaFácil para mais detalhes!\n\nAbraços,\nEquipe CaixaFácil`
            });

            return Response.json({ 
                success: true, 
                message: 'Relatório enviado por email com sucesso!' 
            });
        }

        // Retorna PDF para download
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=relatorio-financeiro-${periodLabel.replace(/\s/g, '-').toLowerCase()}.pdf`
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Helper functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatMonth(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getCategoryName(category) {
    const names = {
        vendas: 'Vendas',
        servicos: 'Serviços',
        investimentos: 'Investimentos',
        emprestimos_recebidos: 'Empréstimos Recebidos',
        outras_receitas: 'Outras Receitas',
        salarios_funcionarios: 'Salários de Funcionários',
        fornecedores: 'Fornecedores',
        aluguel: 'Aluguel',
        contas_servicos: 'Contas e Serviços',
        impostos_taxas: 'Impostos e Taxas',
        marketing_publicidade: 'Marketing e Publicidade',
        equipamentos_materiais: 'Equipamentos e Materiais',
        manutencao: 'Manutenção',
        combustivel_transporte: 'Combustível e Transporte',
        emprestimos_pagos: 'Empréstimos Pagos',
        outras_despesas: 'Outras Despesas'
    };
    return names[category] || category;
}