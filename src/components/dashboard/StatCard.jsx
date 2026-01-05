import React from 'react';
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, trendValue, type = "neutral" }) {
  const bgColors = {
    income: "from-emerald-500 to-emerald-600",
    expense: "from-rose-500 to-rose-600",
    neutral: "from-blue-500 to-blue-600"
  };

  const iconBgColors = {
    income: "bg-emerald-50",
    expense: "bg-rose-50",
    neutral: "bg-blue-50"
  };

  const iconColors = {
    income: "text-emerald-600",
    expense: "text-rose-600",
    neutral: "text-blue-600"
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColors[type]} opacity-5`} />
      <div className="relative p-3">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-lg ${iconBgColors[type]}`}>
            <Icon className={`w-4 h-4 ${iconColors[type]}`} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-xl font-bold text-slate-900 mb-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue} vs mês anterior
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}