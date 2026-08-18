import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  BarChart2, Users, Calendar as CalendarIcon, Settings, User, 
  LogOut, MessageSquare, FileText, X, ChevronLeft, ChevronRight,
  ShieldCheck, Bot
} from "lucide-react";
import logoDumar from "@/assets/logo1.jpeg";

export interface CurrentUserType {
  id?: number;
  username: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  active?: boolean;
}

interface CRMSidebarProps {
  activeSection: "dashboard" | "kanban" | "agenda" | "configuracoes" | "mensagens" | "perfil" | "financeiro";
  setActiveSection?: (section: "dashboard" | "kanban" | "agenda" | "configuracoes" | "mensagens" | "perfil" | "financeiro") => void;
  setIsAuthenticated: (val: boolean) => void;
  currentUser: CurrentUserType;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (val: boolean) => void;
}

export default function CRMSidebar({
  activeSection,
  setActiveSection,
  setIsAuthenticated,
  currentUser,
  isMobileOpen = false,
  setIsMobileOpen
}: CRMSidebarProps) {
  const [, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("crm_sidebar_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("crm_sidebar_collapsed", String(next));
      return next;
    });
  };

  const nameDisplay = currentUser?.name || currentUser?.username || "Administrador";
  const firstLetter = nameDisplay.charAt(0).toUpperCase();

  const handleNavigate = (section: "dashboard" | "kanban" | "agenda" | "configuracoes" | "mensagens" | "perfil" | "financeiro", path: string) => {
    if (setActiveSection) setActiveSection(section);
    setLocation(path);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  // Itens Globais do Sidebar
  const allNavItems = [
    { id: "dashboard", label: "Visão Geral", icon: BarChart2, path: "/crm/dashboard" },
    { id: "kanban", label: "Funil de Vendas", icon: Users, path: "/crm/funil" },
    { id: "agenda", label: "Agenda", icon: CalendarIcon, path: "/crm/agenda" },
    { id: "financeiro", label: "Gestão Financeira", icon: FileText, path: "/crm/financeiro" },
    { id: "configuracoes", label: "Configurações", icon: Settings, path: "/crm/configuracoes" },
  ];

  // Filtragem RBAC Dinâmica
  const userPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const isAdmin = currentUser?.role === "admin" || currentUser?.username === "admin" || currentUser?.username === "paulo@dumarplanejados.com.br";

  const navItems = allNavItems.filter(item => {
    if (isAdmin) return true;
    if (item.id === "configuracoes") {
      return userPermissions.includes("configuracoes") || userPermissions.includes("usuarios") || userPermissions.includes("mensagens");
    }
    return userPermissions.includes(item.id);
  });

  return (
    <>
      {/* OVERLAY MOBILE (Quando o menu gaveta abre no celular) */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] md:hidden animate-fade-in"
        />
      )}

      {/* SIDEBAR CONTAINER (Desktop Fixo Colapsável + Mobile Drawer) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-[120]
        bg-black border-r border-white/10 flex flex-col justify-between flex-shrink-0
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "md:w-20 p-3 sm:p-4" : "w-64 p-6"}
      `}>
        <div className="space-y-6">
          {/* Logo & Botão de Colapsar / Fechar */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center gap-3">
              <div 
                onClick={toggleCollapsed} 
                className="w-10 h-10 bg-black border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-amber-400/50 transition-colors"
                title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
              >
                <img src={logoDumar} alt="Dumar Logo" className="w-7 h-7 object-contain rounded" />
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden transition-all duration-200">
                  <h1 className="text-sm font-bold tracking-wider uppercase text-white">Dumar</h1>
                  <p className="text-[10px] text-white/50 font-semibold tracking-widest">PLANEJADOS</p>
                </div>
              )}
            </div>

            {/* Botão de Toggle Desktop */}
            <button
              onClick={toggleCollapsed}
              className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer ${
                isCollapsed ? "mt-3 mx-auto" : ""
              }`}
              title={isCollapsed ? "Expandir Barra Lateral" : "Recolher Barra Lateral"}
            >
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>

            {/* Fechar no Mobile */}
            {setIsMobileOpen && (
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Menus Principais */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id || (item.id === "configuracoes" && activeSection === "mensagens");
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as any, item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    isCollapsed 
                      ? "justify-center p-3" 
                      : "gap-3 px-4 py-3"
                  } ${
                    isActive 
                      ? "bg-white text-black font-bold shadow-lg shadow-white/10" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Perfil & Logout */}
        <div className={`pt-6 border-t border-white/10 space-y-3 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          <button 
            onClick={() => handleNavigate("perfil", "/crm/perfil")}
            className={`w-full flex items-center rounded-xl transition-all cursor-pointer group ${
              isCollapsed ? "justify-center p-2" : "gap-3 text-left p-2"
            } ${
              activeSection === "perfil" ? "bg-white/10 border border-amber-400/50 shadow-lg" : "hover:bg-white/5 border border-transparent"
            }`}
            title={isCollapsed ? `Meu Perfil (${nameDisplay})` : "Clique para abrir Meu Perfil"}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-hover:border-amber-400 transition-colors flex-shrink-0">
              <span className="text-xs text-white font-bold">{firstLetter}</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{nameDisplay}</p>
                <p className="text-[10px] text-gray-400 capitalize">{currentUser?.role || "Administrador"}</p>
              </div>
            )}
          </button>

          <button 
            onClick={() => {
              setIsAuthenticated(false);
              localStorage.removeItem("crm_username");
              localStorage.removeItem("crm_user_data");
            }}
            title={isCollapsed ? "Sair do Portal" : undefined}
            className={`w-full flex items-center justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-xs font-bold border border-white/10 hover:border-red-500/20 transition-all cursor-pointer ${
              isCollapsed ? "p-2.5" : "gap-2 py-2.5 px-3"
            }`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!isCollapsed && <span>Sair do Portal</span>}
          </button>
        </div>
      </aside>

      {/* BOTTOM NAVIGATION BAR MOBILE (Fixo no rodapé em smartphones com RBAC) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-[#0c0c0c]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as any, item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                isActive ? "text-amber-400 scale-105" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
