import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import logoDumar from "@/assets/logo1.jpeg";
import { Plus, QrCode, Menu, Upload, Sparkles, Box } from "lucide-react";
import { parsePromobFile } from "@/lib/promob-parser";

// Subcomponentes importados
import { Lead } from "@/components/crm/types";
import CRMLogin from "@/components/crm/crm-login";
import CRMSidebar from "@/components/crm/crm-sidebar";
import CRMDashboard from "@/components/crm/crm-dashboard";
import CRMKanban from "@/components/crm/crm-kanban";
import CRMLeadDrawer from "@/components/crm/crm-lead-drawer";
import CRMAgenda from "@/components/crm/crm-agenda";
import CRMConnections from "@/components/crm/crm-connections";
import CRMPerfil from "@/components/crm/crm-perfil";
import CRMFinanceiro from "@/components/crm/crm-financeiro";
import CRMSettings from "@/components/crm/crm-settings";

// --- COLUNAS DO FUNIL OPERACIONAL ---
const STAGES = [
  { id: "entrada", title: "Leads de Entrada", color: "border-t-blue-500" },
  { id: "nao_responde", title: "Não Responde", color: "border-t-amber-500" },
  { id: "briefing", title: "Briefing & Medição", color: "border-t-purple-500" },
  { id: "3d", title: "Projeto 3D (Promob)", color: "border-t-white" },
  { id: "apresentacao", title: "Apresentação & Orçamento", color: "border-t-gray-400" },
  { id: "contrato", title: "Fechamento/Contrato", color: "border-t-teal-500" },
  { id: "fabrica", title: "Pedido de Fábrica", color: "border-t-orange-500" },
  { id: "montagem", title: "Entrega & Montagem", color: "border-t-pink-500" },
  { id: "posvenda", title: "Pós-Venda & Assist.", color: "border-t-green-500" },
  { id: "freezer", title: "Freezer (Leads Frios)", color: "border-t-cyan-400" },
  { id: "cancelado", title: "Cancelados / Perdidos", color: "border-t-red-500" }
];

export default function CRMPage() {
  const [matchRoute, paramsRoute] = useRoute("/crm/:section?");
  const [, setLocation] = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("crm_username");
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<{ username: string }>({
    username: localStorage.getItem("crm_username") || "Paulo Admin"
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUtm, setFilterUtm] = useState("all");
  const [activeSection, setActiveSection] = useState<"dashboard" | "kanban" | "agenda" | "configuracoes" | "mensagens" | "perfil" | "financeiro">("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);


  // Novo lead modal/form + Promob Upload
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showNoInstanceModal, setShowNoInstanceModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");
  const [newLeadRooms, setNewLeadRooms] = useState("");
  const [newLeadPromobFiles, setNewLeadPromobFiles] = useState<string[]>([]);
  const [isParsingPromob, setIsParsingPromob] = useState(false);
  const [promobStatusMsg, setPromobStatusMsg] = useState("");


  // Sincronizar aba ativa com a URL do navegador
  useEffect(() => {
    if (matchRoute && paramsRoute?.section) {
      const s = paramsRoute.section.toLowerCase();
      if (s === "funil" || s === "kanban") setActiveSection("kanban");
      else if (s === "conexoes" || s === "configuracoes" || s === "whatsapp") setActiveSection("configuracoes");
      else if (s === "agenda") setActiveSection("agenda");
      else if (s === "financeiro" || s === "contratos") setActiveSection("financeiro");
      else if (s === "mensagens") setActiveSection("mensagens");
      else if (s === "perfil") setActiveSection("perfil");
      else setActiveSection("dashboard");
    } else {
      setActiveSection("dashboard");
    }
  }, [matchRoute, paramsRoute?.section]);

  // --- CONTROLE DE DRAG HORIZONTAL (GRAB-TO-SCROLL) ---
  const boardRef = React.useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }
    setIsMouseDown(true);
    setStartX(e.pageX - boardRef.current.offsetLeft);
    setScrollLeftState(boardRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !boardRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    boardRef.current.scrollLeft = scrollLeftState - walk;
  };

  const ensureArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
      } catch {
        if (val.trim()) return [val.trim()];
      }
    }
    return [];
  };

  // Carregar Leads do Banco Real
  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/leads?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map((l: any) => ({
          ...l,
          id: String(l.id),
          rooms: ensureArray(l.rooms),
          promobFiles: ensureArray(l.promobFiles),
          constructionPhotos: ensureArray(l.constructionPhotos),
          materials: typeof l.materials === "string" ? JSON.parse(l.materials || "{}") : (l.materials || {}),
          checklist: typeof l.checklist === "string" ? JSON.parse(l.checklist || "{}") : (l.checklist || {}),
          chatHistory: ensureArray(l.chatHistory),
        }));
        setLeads(parsed);
        setSelectedLead(prev => {
          if (!prev) return null;
          const updatedSelected = parsed.find((l: any) => String(l.id) === String(prev.id));
          return updatedSelected || prev;
        });
      }
    } catch (err) {
      console.error("Erro ao obter leads do banco:", err);
    }
  };

  // Synchronize leads periodically (Polling a cada 10s para capturar formulários do site em tempo real)
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
      const interval = setInterval(fetchLeads, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- LOGIN SECURITY ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        const rawName = data.username || username;
        let formattedName = rawName;
        if (rawName.toLowerCase().includes("paulo")) formattedName = "Paulo";
        else if (rawName.toLowerCase() === "admin") formattedName = "Admin";

        setIsAuthenticated(true);
        setCurrentUser({ username: formattedName });
        localStorage.setItem("crm_username", formattedName);
      } else {
        alert("Credenciais inválidas!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar login");
    }
  };

  // --- FILTROS ---
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const roomsList = Array.isArray(lead.rooms) ? lead.rooms : [];
    const matchesSearch = lead.name.toLowerCase().includes(searchLower) || 
                          (lead.phone && lead.phone.includes(searchLower)) ||
                          roomsList.join(" ").toLowerCase().includes(searchLower);
    const matchesUtm = filterUtm === "all" || lead.utmSource === filterUtm;
    return matchesSearch && matchesUtm;
  });

  // --- ALTERAR ETAPA (DRAG & DROP REAL COM BANCO) ---
  const moveLead = async (leadId: string, newStage: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stageName = STAGES.find(s => s.id === newStage)?.title;
    const updatedChatHistory = [
      ...lead.chatHistory,
      { sender: "system" as const, text: `Card movido para: ${stageName}`, timestamp }
    ];

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, chatHistory: updatedChatHistory })
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, stage: newStage, chatHistory: updatedChatHistory });
        }
      }
    } catch (err) {
      console.error("Erro ao mover lead:", err);
    }
  };

  const [deleteConfirmLeadId, setDeleteConfirmLeadId] = useState<string | null>(null);

  const confirmDeleteLead = async () => {
    if (!deleteConfirmLeadId) return;
    const targetId = deleteConfirmLeadId;
    setDeleteConfirmLeadId(null);

    try {
      const res = await fetch(`/api/leads/${targetId}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(prev => prev.filter(l => String(l.id) !== String(targetId)));
        if (selectedLead && String(selectedLead.id) === String(targetId)) {
          setSelectedLead(null);
        }
        await fetchLeads();
      } else {
        const errJson = await res.json().catch(() => ({ message: "Erro ao excluir" }));
        alert(errJson.message || "Erro ao excluir lead do banco de dados");
      }
    } catch (err) {
      console.error("Erro de rede ao excluir lead:", err);
      alert("Erro ao excluir lead do banco de dados");
    }
  };

  const handleDeleteLead = (leadId: string) => {
    setDeleteConfirmLeadId(leadId);
  };

  // --- ENVIAR MENSAGEM CHAT REAL VIA EVOLUTION API ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedLead) return;

    try {
      const res = await fetch("/api/evolution/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          message: chatInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setSelectedLead(data.lead);
        }
        if (data.instanceDisconnected) {
          setShowNoInstanceModal(true);
        }
        setChatInput("");
        fetchLeads();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.instanceDisconnected) {
          setShowNoInstanceModal(true);
        }
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handlePromobUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPromob(true);
    setPromobStatusMsg("Analisando arquivo do Promob...");

    try {
      const data = await parsePromobFile(file);
      if (data.clientName && !newLeadName) setNewLeadName(data.clientName);
      if (data.estimatedValue > 0) setNewLeadValue(data.estimatedValue.toString());
      if (data.rooms.length > 0) setNewLeadRooms(data.rooms.join(", "));
      if (data.fileBase64) setNewLeadPromobFiles([data.fileBase64]);

      setPromobStatusMsg(`✨ Promob Lido! ${data.rooms.join(", ")} ${data.estimatedValue > 0 ? '| R$ ' + data.estimatedValue.toLocaleString('pt-BR') : ''}`);
    } catch (err) {
      console.error("Erro ao ler arquivo Promob:", err);
      setPromobStatusMsg("⚠️ Não foi possível extrair dados automaticamente do arquivo.");
    } finally {
      setIsParsingPromob(false);
    }
  };

  // --- CRIAR LEAD MANUAL ---
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          value: Number(newLeadValue) || 0,
          rooms: newLeadRooms.split(",").map(r => r.trim()).filter(Boolean),
          utmSource: newLeadPromobFiles.length > 0 ? "Projeto 3D / Promob" : "WhatsApp Direto / CRM",
          utmCampaign: "Criado Manual",
          checklist: {},
          chatHistory: [],
          promobFiles: newLeadPromobFiles
        })
      });

      if (res.ok) {
        setShowNewLeadModal(false);
        setNewLeadName("");
        setNewLeadPhone("");
        setNewLeadValue("");
        setNewLeadRooms("");
        setNewLeadPromobFiles([]);
        setPromobStatusMsg("");
        fetchLeads();
      }
    } catch (err) {
      console.error("Erro ao salvar lead:", err);
    }
  };

  // --- CÁLCULO DE VALOR TOTAL E METRICAS ---
  const totalValue = leads.reduce((acc, lead) => acc + lead.value, 0);
  const activeProjectsCount = leads.filter(l => ["3d", "apresentacao", "contrato", "fabrica", "montagem"].includes(l.stage)).length;
  const scheduledMeasurementsCount = leads.filter(l => l.stage === "briefing").length;
  const closedSalesTotal = leads.filter(l => ["contrato", "fabrica", "montagem", "posvenda"].includes(l.stage)).reduce((acc, l) => acc + l.value, 0);

  // --- CÁLCULOS DOS CANAIS UTM REAIS ---
  const utmCounts: { [key: string]: { count: number; value: number } } = {};
  leads.forEach(lead => {
    const source = lead.utmSource || "Outros / Direto";
    if (!utmCounts[source]) {
      utmCounts[source] = { count: 0, value: 0 };
    }
    utmCounts[source].count += 1;
    utmCounts[source].value += lead.value;
  });

  const totalLeadsCount = leads.length || 1;
  const utmData = Object.keys(utmCounts).map(source => {
    const data = utmCounts[source];
    const percentage = Math.round((data.count / totalLeadsCount) * 100);
    return {
      source,
      count: data.count,
      value: data.value,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  const getNetworkColor = (source: string) => {
    const src = source.toLowerCase();
    if (src.includes("google")) return "text-[#4285F4]";
    if (src.includes("instagram")) return "text-[#E1306C]";
    if (src.includes("whatsapp")) return "text-[#25D366]";
    if (src.includes("facebook")) return "text-[#1877F2]";
    return "text-[#A3A3A3]";
  };

  if (!isAuthenticated) {
    return (
      <CRMLogin 
        handleLogin={handleLogin}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-black text-white flex font-sans overflow-hidden relative">
      {/* Sidebar de Navegação */}
      <CRMSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        setIsAuthenticated={(val) => {
          if (!val) {
            localStorage.removeItem("crm_username");
            setCurrentUser({ username: "" });
          }
          setIsAuthenticated(val);
        }}
        currentUser={currentUser}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-14 md:pb-0">
        {/* HEADER MOBILE (Aparece apenas em celulares/tablets < md) */}
        <header className="md:hidden h-14 px-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f] flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-gray-300 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10"
              title="Abrir Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoDumar} alt="Dumar Logo" className="w-6 h-6 object-contain rounded" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {activeSection === "dashboard" && "Início"}
                {activeSection === "kanban" && "Funil de Vendas"}
                {activeSection === "agenda" && "Agenda"}
                {activeSection === "financeiro" && "Financeiro"}
                {activeSection === "mensagens" && "Mensagens"}
                {activeSection === "configuracoes" && "Conexões"}
                {activeSection === "perfil" && "Meu Perfil"}
              </h2>
            </div>
          </div>

          <button 
            onClick={() => setShowNewLeadModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg shadow-amber-500/20"
          >
            <Plus size={14} />
            Lead
          </button>
        </header>

        {/* Header Desktop de Seção */}
        {activeSection !== "kanban" && (
          <header className="hidden md:flex h-14 px-6 border-b border-white/10 items-center justify-between bg-black/40 flex-shrink-0">
            <div>
              <h2 className="text-xs font-black tracking-wider uppercase text-white">
                {activeSection === "dashboard" && "Visão Geral (Gestão Comercial)"}
                {activeSection === "agenda" && "Agenda de Medições"}
                {activeSection === "financeiro" && "Financeiro & Gestão de Caixa"}
                {activeSection === "perfil" && "Meu Perfil"}
                {activeSection === "configuracoes" && "Configurações do Sistema"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNewLeadModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 transition-all"
              >
                <Plus size={13} />
                Novo Lead
              </button>
            </div>
          </header>
        )}

        {/* Abas */}
        {activeSection === "dashboard" && (
          <CRMDashboard 
            leads={leads}
            closedSalesTotal={closedSalesTotal}
            activeProjectsCount={activeProjectsCount}
            scheduledMeasurementsCount={scheduledMeasurementsCount}
            totalValue={totalValue}
            utmData={utmData}
            getNetworkColor={getNetworkColor}
          />
        )}

        {activeSection === "kanban" && (
          <CRMKanban 
            filteredLeads={filteredLeads}
            STAGES={STAGES}
            setSelectedLead={setSelectedLead}
            moveLead={moveLead}
            handleDeleteLead={handleDeleteLead}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterUtm={filterUtm}
            setFilterUtm={setFilterUtm}
            boardRef={boardRef}
            handleMouseDown={handleMouseDown}
            handleMouseLeave={handleMouseLeave}
            handleMouseUp={handleMouseUp}
            handleMouseMove={handleMouseMove}
            setShowNewLeadModal={setShowNewLeadModal}
          />
        )}

        {activeSection === "agenda" && (
          <CRMAgenda leads={leads} />
        )}

        {activeSection === "perfil" && (
          <div className="flex-1 overflow-y-auto p-8">
            <CRMPerfil currentUser={currentUser} setCurrentUser={setCurrentUser} />
          </div>
        )}

        {activeSection === "financeiro" && (
          <CRMFinanceiro leads={leads} setSelectedLead={setSelectedLead} />
        )}

        {activeSection === "mensagens" && (
          <CRMSettings />
        )}

        {activeSection === "configuracoes" && (
          <CRMConnections />
        )}
      </main>

      {/* Drawer de Detalhes */}
      {selectedLead && (
        <CRMLeadDrawer 
          selectedLead={selectedLead}
          setSelectedLead={setSelectedLead}
          fetchLeads={fetchLeads}
          STAGES={STAGES}
          moveLead={moveLead}
          handleDeleteLead={handleDeleteLead}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          setShowNoInstanceModal={setShowNoInstanceModal}
        />
      )}

      {/* MODAL WHATSAPP DESCONECTADO (Sem instância ativa) */}
      {showNoInstanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
              <QrCode size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">WhatsApp Desconectado</h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                Nenhuma instância do WhatsApp está conectada no momento. Para enviar mensagens, fotos e documentos diretamente aos clientes, conecte um número de WhatsApp escaneando o QR Code.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNoInstanceModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Agora Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNoInstanceModal(false);
                  setLocation("/crm/connections");
                }}
                className="flex-1 py-2.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Conectar ao WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO LEAD */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center">
          <form onSubmit={handleCreateLead} className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-md font-bold tracking-wide mb-4">Adicionar Novo Lead</h3>
            
            <div className="space-y-4 text-xs">
              {/* UPLOAD & PARSER PROMOB */}
              <div className="border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 p-3.5 rounded-xl transition-all text-center relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".promob,.xml,.csv,.pdf,.txt,image/*"
                  onChange={handlePromobUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                  <Box size={16} />
                  <span>{isParsingPromob ? "Lendo arquivo Promob..." : "Importar Projeto Promob (.xml, .promob, .pdf)"}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Arraste ou clique para preencher nome, cômodos e orçamento automaticamente
                </p>
              </div>

              {/* Status feedback */}
              {promobStatusMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-[11px] text-emerald-300 font-medium flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-400 flex-shrink-0" />
                  <span>{promobStatusMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-1.5">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={newLeadName}
                  onChange={e => setNewLeadName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1.5">Telefone/WhatsApp</label>
                <input 
                  type="text" 
                  value={newLeadPhone}
                  onChange={e => setNewLeadPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1.5">Valor Estimado (R$)</label>
                <input 
                  type="number" 
                  value={newLeadValue}
                  onChange={e => setNewLeadValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1.5">Ambientes (Separados por vírgula)</label>
                <input 
                  type="text" 
                  value={newLeadRooms}
                  onChange={e => setNewLeadRooms(e.target.value)}
                  placeholder="Cozinha, Quarto, Sala"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 text-xs font-semibold">
              <button 
                type="button" 
                onClick={() => setShowNewLeadModal(false)}
                className="bg-white/5 hover:bg-white/10 text-gray-300 py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-white hover:bg-neutral-200 text-black py-2 px-4 rounded-lg cursor-pointer font-bold"
              >
                Salvar Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO CUSTOMIZADO */}
      {deleteConfirmLeadId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121212] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirmar Exclusão</h3>
              <p className="text-xs text-gray-400 mt-1">Tem certeza que deseja excluir este lead permanentemente do banco de dados?</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmLeadId(null)}
                className="w-1/2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer border border-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteLead}
                className="w-1/2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-red-600/20 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
