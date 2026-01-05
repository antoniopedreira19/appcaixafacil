import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Clock, TrendingUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const CATEGORY_COLORS = {
  fluxo_caixa: "bg-blue-100 text-blue-700",
  planejamento: "bg-purple-100 text-purple-700",
  impostos: "bg-orange-100 text-orange-700",
  credito: "bg-green-100 text-green-700",
  investimento: "bg-indigo-100 text-indigo-700",
  gestao: "bg-pink-100 text-pink-700"
};

const CATEGORY_NAMES = {
  fluxo_caixa: "Fluxo de Caixa",
  planejamento: "Planejamento",
  impostos: "Impostos",
  credito: "Crédito",
  investimento: "Investimento",
  gestao: "Gestão"
};

export default function Content() {
  const [selectedArticle, setSelectedArticle] = React.useState(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.ContentArticle.list('-created_date'),
    initialData: [],
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Conteúdos Educacionais</h1>
        <p className="text-slate-600">
          Aprenda a gerenciar melhor as finanças da sua empresa
        </p>
      </div>

      {articles.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Em breve novos conteúdos!
            </h3>
            <p className="text-slate-600">
              Estamos preparando artigos exclusivos para ajudar você a melhorar a gestão financeira da sua empresa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.filter(a => a.published).map((article) => (
            <Card 
              key={article.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => setSelectedArticle(article)}
            >
              {article.image_url && (
                <div className="h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={CATEGORY_COLORS[article.category]}>
                    {CATEGORY_NAMES[article.category]}
                  </Badge>
                  {article.reading_time && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {article.reading_time} min
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {article.summary}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para exibir artigo completo */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="space-y-3">
              <Badge className={CATEGORY_COLORS[selectedArticle?.category]}>
                {CATEGORY_NAMES[selectedArticle?.category]}
              </Badge>
              <DialogTitle className="text-2xl">{selectedArticle?.title}</DialogTitle>
              {selectedArticle?.reading_time && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  Leitura de {selectedArticle.reading_time} minutos
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedArticle?.image_url && (
            <img 
              src={selectedArticle.image_url}
              alt={selectedArticle.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{selectedArticle?.content}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}