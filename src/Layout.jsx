import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Receipt, 
  Upload, 
  BarChart3, 
  BookOpen,
  Building2,
  TrendingUp,
  Brain,
  Repeat,
  Menu, 
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Visão Geral",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Transações",
    url: createPageUrl("Transactions"),
    icon: Receipt,
  },
  {
    title: "Gerenciar Contas",
    url: createPageUrl("ManageBankAccounts"),
    icon: Building2,
  },
  {
    title: "Despesas Recorrentes",
    url: createPageUrl("RecurringExpenses"),
    icon: Repeat,
  },
  {
    title: "Assistente IA",
    url: createPageUrl("AIAssistant"),
    icon: Brain,
    badge: "IA",
    badgeColor: "bg-purple-600"
  },
  {
    title: "Conexões Bancárias",
    url: createPageUrl("BankConnectionsNew"),
    icon: Building2,
  },
  {
    title: "Importar Extrato",
    url: createPageUrl("UploadStatement"),
    icon: Upload,
  },
  {
    title: "Relatórios",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: "Conteúdos",
    url: createPageUrl("Content"),
    icon: BookOpen,
  },
  {
    title: "Notificações",
    url: createPageUrl("NotificationSettings"),
    icon: Bell,
  },
];

function SidebarContentComponent() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <>
      <SidebarHeader className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">CaixaFácil</h2>
            <p className="text-xs text-slate-500">Gestão Financeira Inteligente</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`rounded-xl transition-all duration-200 my-1 ${
                      location.pathname === item.url 
                        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5" onClick={handleLinkClick}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className={`ml-auto text-xs ${item.badgeColor || 'bg-blue-600'} text-white px-2 py-0.5 rounded-full`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-semibold text-orange-900">Lembretes Automáticos</p>
          </div>
          <p className="text-xs text-orange-700 leading-relaxed">
            Configure suas despesas recorrentes e receba lembretes por email!
          </p>
        </div>
      </SidebarFooter>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <style>{`
          :root {
            --primary: 220 70% 50%;
            --primary-foreground: 0 0% 100%;
            --success: 142 76% 36%;
            --success-foreground: 0 0% 100%;
            --danger: 0 84% 60%;
            --danger-foreground: 0 0% 100%;
          }
        `}</style>
        
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarContentComponent />
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {/* Header mobile - Botão de menu melhorado */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Botão de menu destacado e maior */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-2 hover:shadow-xl transition-all active:scale-95">
                <SidebarTrigger className="text-white hover:bg-transparent">
                  <Menu className="w-6 h-6" />
                </SidebarTrigger>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-slate-900">CaixaFácil</h1>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}