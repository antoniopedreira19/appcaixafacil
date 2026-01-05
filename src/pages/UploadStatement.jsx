
import React, { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2, Calendar, FileSpreadsheet } from "lucide-react";

// Função para parsear CSV manualmente
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, rows };
};

// Função para detectar colunas automaticamente
const detectColumns = (headers) => {
  const mapping = {};
  
  // Detecta data
  const datePatterns = ['data', 'date', 'dt'];
  mapping.date = headers.find(h => 
    datePatterns.some(p => h.toLowerCase().includes(p))
  );
  
  // Detecta descrição
  const descPatterns = ['descri', 'description', 'historico', 'hist'];
  mapping.description = headers.find(h => 
    descPatterns.some(p => h.toLowerCase().includes(p))
  );
  
  // Detecta valor
  const valuePatterns = ['valor', 'value', 'amount', 'r$'];
  mapping.value = headers.find(h => 
    valuePatterns.some(p => h.toLowerCase().includes(p))
  );
  
  // Detecta tipo
  const typePatterns = ['tipo', 'type', 'natureza'];
  mapping.type = headers.find(h => 
    typePatterns.some(p => h.toLowerCase().includes(p))
  );
  
  // Detecta fornecedor (opcional)
  const supplierPatterns = ['fornecedor', 'supplier', 'destinatario'];
  mapping.supplier = headers.find(h => 
    supplierPatterns.some(p => h.toLowerCase().includes(p))
  );
  
  return mapping;
};

// Função para converter data brasileira para ISO
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Remove espaços
  dateStr = dateStr.trim();
  
  // Tenta formato DD/MM/YYYY ou DD-MM-YYYY
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    
    // Se ano tem 2 dígitos, adiciona 20
    if (year.length === 2) {
      year = '20' + year;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // Se já está em formato ISO
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Fallback: data atual
  return new Date().toISOString().split('T')[0];
};

// Função para converter valor brasileiro para número
const parseValue = (valueStr) => {
  if (!valueStr) return 0;
  
  // Remove R$, espaços e outros caracteres
  valueStr = valueStr.replace(/[R$\s]/g, '');
  
  // Substitui vírgula por ponto (decimal brasileiro)
  // Mas primeiro remove pontos de milhar
  valueStr = valueStr.replace(/\./g, '');
  valueStr = valueStr.replace(',', '.');
  
  const value = parseFloat(valueStr);
  return isNaN(value) ? 0 : value;
};

// Função para detectar tipo da transação
const detectType = (typeStr, value, description) => {
  if (!typeStr) {
    // Se não tem tipo, infere pelo valor ou descrição
    if (value > 0) return 'income';
    if (value < 0) return 'expense';
    
    // Palavras-chave de receita
    const incomeWords = ['receb', 'credito', 'crédito', 'deposit', 'entrada'];
    if (incomeWords.some(word => description?.toLowerCase().includes(word))) {
      return 'income';
    }
    
    return 'expense';
  }
  
  typeStr = typeStr.toLowerCase();
  
  if (typeStr.includes('créd') || typeStr.includes('cred') || typeStr.includes('receb')) {
    return 'income';
  }
  
  if (typeStr.includes('déb') || typeStr.includes('deb') || typeStr.includes('pag')) {
    return 'expense';
  }
  
  // Fallback: se valor é negativo, é despesa
  return value < 0 ? 'expense' : 'income';
};

export default function UploadStatement() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [bankAccountName, setBankAccountName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [extractedCount, setExtractedCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importToDelete, setImportToDelete] = useState(null);

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date'),
    initialData: [],
  });

  // Agrupa importações por data e nota
  const importHistory = useMemo(() => {
    const importedTransactions = transactions.filter(t => 
      t.notes && (
        t.notes.includes('Importado do extrato CSV em') ||
        t.notes.includes('Importado em') ||
        t.notes.includes('Importado via Pluggy') // Adicionado para cobrir outras fontes de importação
      )
    );
    
    if (importedTransactions.length === 0) return [];
    
    const groups = {};
    importedTransactions.forEach(t => {
      const noteKey = t.notes; // Use the full note as key to group by exact import
      if (!groups[noteKey]) {
        groups[noteKey] = {
          note: noteKey,
          transactions: [],
          created_date: t.created_date,
          bank_account: t.bank_account || 'Sem conta'
        };
      }
      groups[noteKey].transactions.push(t);
    });
    
    return Object.values(groups).sort((a, b) => {
      // Sort by the created_date of the first transaction in the group
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [transactions]);

  const deleteImportMutation = useMutation({
    mutationFn: async (transactionIds) => {
      // Delete in parallel to be faster
      await Promise.all(transactionIds.map(id => base44.entities.Transaction.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDeleteDialogOpen(false);
      setImportToDelete(null);
      alert('✅ Importação excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir importação:', error);
      alert('❌ Erro ao excluir importação. Tente novamente.');
    }
  });

  const handleDeleteImport = (importGroup) => {
    setImportToDelete(importGroup);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (importToDelete) {
      const ids = importToDelete.transactions.map(t => t.id);
      deleteImportMutation.mutate(ids);
    }
  };

  // Extrai data de importação da nota
  const getImportDate = (note) => {
    const dateMatch = note.match(/(\d{2}\/\d{2}\/\d{4})/);
    return dateMatch ? dateMatch[1] : 'Data desconhecida';
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setStatus("idle");
      setErrorDetails("");
      setMessage("");
    }
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("idle");
      setErrorDetails("");
      setMessage("");
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'UTF-8');
    });
  };

  const processFile = async () => {
    if (!file) return;
    
    if (!bankAccountName.trim()) {
      setStatus("error");
      setMessage("Nome da conta bancária é obrigatório.");
      setErrorDetails("Por favor, informe o nome da conta bancária para prosseguir com a importação.");
      return;
    }

    setStatus("uploading");
    setProgress(10);
    setMessage("Lendo arquivo...");
    setErrorDetails("");

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension !== 'csv') {
        throw new Error("Apenas arquivos CSV são suportados no momento. Por favor, exporte seu extrato em formato CSV.");
      }

      // Lê o arquivo CSV
      setProgress(20);
      const csvContent = await readFileAsText(file);
      
      setProgress(30);
      setMessage("Analisando estrutura do CSV...");
      
      // Parseia o CSV
      const { headers, rows } = parseCSV(csvContent);
      
      if (rows.length === 0) {
        throw new Error("Nenhuma transação encontrada no arquivo CSV.");
      }
      
      // Detecta colunas automaticamente
      const columnMapping = detectColumns(headers);
      
      if (!columnMapping.date || !columnMapping.description || !columnMapping.value) {
        throw new Error("Não foi possível identificar as colunas necessárias (Data, Descrição, Valor). Verifique se o arquivo está no formato correto.");
      }
      
      setProgress(40);
      setMessage(`Processando ${rows.length} transações...`);
      
      // Converte as linhas em transações
      const transactions = rows
        .map(row => {
          const dateStr = row[columnMapping.date];
          const description = row[columnMapping.description] || '';
          const supplierInfo = columnMapping.supplier ? row[columnMapping.supplier] : '';
          const fullDescription = supplierInfo ? `${description} - ${supplierInfo}` : description;
          
          const valueStr = row[columnMapping.value];
          const typeStr = columnMapping.type ? row[columnMapping.type] : '';
          
          const date = parseDate(dateStr);
          const value = parseValue(valueStr);
          const type = detectType(typeStr, value, fullDescription);
          
          return {
            date,
            description: fullDescription.trim(),
            amount: Math.abs(value),
            type
          };
        })
        .filter(t => {
          // Remove transações inválidas
          if (!t.date || !t.description || t.amount === 0) {
            console.warn('Transação inválida ignorada:', t);
            return false;
          }
          return true;
        });
      
      if (transactions.length === 0) {
        throw new Error("Nenhuma transação válida encontrada após processar o arquivo.");
      }
      
      setProgress(60);
      setMessage(`Categorizando ${transactions.length} transações com IA...`);
      
      // Categoriza em lotes de 30
      const batchSize = 30;
      let categories = [];
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        const categorizationPrompt = `Categorize cada transação abaixo em UMA categoria.

**Para RECEITAS (income):**
- vendas: Vendas de produtos/serviços
- servicos: Prestação de serviços, honorários
- outras_receitas: Outras receitas

**Para DESPESAS (expense):**
- salarios_funcionarios: Salários e folha de pagamento
- fornecedores: Pagamentos a fornecedores
- aluguel: Aluguel
- contas_servicos: Luz, água, internet, telefone
- impostos_taxas: Impostos e taxas
- marketing_publicidade: Marketing
- equipamentos_materiais: Equipamentos e materiais
- manutencao: Manutenção
- combustivel_transporte: Combustível e transporte
- outras_despesas: Outras despesas

**Transações:**
${batch.map((t, idx) => `${idx + 1}. "${t.description}" | ${t.type} | R$ ${t.amount.toFixed(2)}`).join('\n')}

Retorne APENAS um array JSON com as categorias na mesma ordem:
["categoria1", "categoria2", ...]`;

        try {
          const catResult = await base44.integrations.Core.InvokeLLM({
            prompt: categorizationPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          });
          
          categories = categories.concat(catResult.categories || []);
        } catch (error) {
          console.warn('Erro na categorização do lote, usando categorias padrão:', error);
          // Usa categorias padrão se falhar
          categories = categories.concat(batch.map(t => 
            t.type === 'income' ? 'outras_receitas' : 'outras_despesas'
          ));
        }
        
        // Atualiza progresso
        const batchProgress = 60 + (30 * (i + batch.length) / transactions.length);
        setProgress(Math.round(batchProgress));
      }
      
      setProgress(90);
      setMessage("Salvando transações...");
      
      // Cria as transações
      const transactionsToCreate = transactions.map((t, i) => {
        const category = categories[i] || (t.type === 'income' ? 'outras_receitas' : 'outras_despesas');
        
        return {
          date: t.date,
          description: t.description,
          amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
          type: t.type,
          category: category,
          payment_method: "transferencia",
          bank_account: bankAccountName.trim(),
          notes: `Importado do extrato CSV em ${new Date().toLocaleDateString('pt-BR')}`
        };
      });

      await base44.entities.Transaction.bulkCreate(transactionsToCreate);

      setProgress(100);
      setStatus("success");
      setExtractedCount(transactions.length);
      setMessage(`✅ ${transactions.length} transações importadas com sucesso!`);
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      setTimeout(() => {
        setFile(null);
        setBankAccountName("");
        setStatus("idle");
        setProgress(0);
        setMessage("");
      }, 5000);
      
    } catch (error) {
      console.error("Erro no processamento:", error);
      setStatus("error");
      
      let userMessage = "Erro ao processar arquivo";
      let details = error.message || "Erro desconhecido";
      
      setMessage(userMessage);
      setErrorDetails(details);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Importar Extrato Bancário</h1>
        <p className="text-slate-600">
          Upload de extrato CSV - processamento automático
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Formato aceito:</strong> Arquivos CSV exportados do banco com colunas de Data, Descrição e Valor.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`text-center transition-colors duration-200 ${
              dragActive ? "bg-blue-50" : ""
            }`}
          >
            {!file ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Arraste seu extrato CSV aqui
                </h3>
                <p className="text-slate-600 mb-4">
                  ou clique para selecionar
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileInput}
                />
                <label htmlFor="file-upload">
                  <Button asChild variant="outline" className="cursor-pointer">
                    <span>Selecionar Arquivo CSV</span>
                  </Button>
                </label>
                <p className="text-xs text-slate-500 mt-4">
                  Apenas arquivos CSV (máx. 10MB)
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                  status === "success" ? "bg-green-50" : status === "error" ? "bg-rose-50" : "bg-blue-50"
                }`}>
                  <FileText className={`w-10 h-10 ${
                    status === "success" ? "text-green-600" : status === "error" ? "text-rose-600" : "text-blue-600"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>

                {status === "idle" && (
                  <div className="max-w-md mx-auto space-y-2">
                    <Label htmlFor="bank-account-name" className="text-left block">
                      Nome da Conta Bancária *
                    </Label>
                    <Input
                      id="bank-account-name"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Ex: C6 Bank, Nubank, Bradesco..."
                      className="text-center"
                    />
                    <p className="text-xs text-slate-500">
                      Para identificar de qual conta são as transações
                    </p>
                  </div>
                )}

                {status !== "idle" && (
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {status === "uploading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-slate-700 font-medium">{message}</span>
                        </>
                      ) : status === "success" ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-semibold">{message}</span>
                        </>
                      ) : (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <span className="text-rose-700 font-semibold">{message}</span>
                          </div>
                          {errorDetails && (
                            <Alert variant="destructive" className="text-left">
                              <AlertDescription className="text-sm">
                                {errorDetails}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {status === "idle" && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setBankAccountName("");
                        setErrorDetails("");
                        setMessage("");
                      }}
                    >
                      Remover
                    </Button>
                    <Button
                      onClick={processFile}
                      disabled={!bankAccountName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Processar Extrato
                    </Button>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setBankAccountName("");
                        setStatus("idle");
                        setErrorDetails("");
                        setMessage("");
                      }}
                    >
                      Tentar Outro Arquivo
                    </Button>
                    <Button
                      onClick={processFile}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Importações */}
      {importHistory.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-600" />
              <CardTitle>Histórico de Importações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importHistory.map((importGroup, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">
                          Importação de {getImportDate(importGroup.note)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {importGroup.transactions.length} transações
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {importGroup.bank_account}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteImport(importGroup)}
                    className="hover:bg-rose-50 hover:text-rose-600 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato Esperado do CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">
            O arquivo CSV deve conter pelo menos as seguintes colunas:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
            <li><strong>Data:</strong> Data da transação (DD/MM/YYYY)</li>
            <li><strong>Descrição:</strong> Descrição da transação</li>
            <li><strong>Valor:</strong> Valor em reais (formato brasileiro: 1.234,56)</li>
            <li><strong>Tipo</strong> (opcional): Crédito/Débito ou Entrada/Saída</li>
          </ul>
          <Alert className="border-green-200 bg-green-50 mt-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 text-sm">
              O sistema detecta automaticamente as colunas mesmo se tiverem nomes diferentes!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Importação?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Esta ação irá <strong>excluir permanentemente {importToDelete?.transactions.length} transações</strong> da importação de {importToDelete && getImportDate(importToDelete.note)}.
            </p>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 text-sm">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita!
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteImportMutation.isPending}
            >
              {deleteImportMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
