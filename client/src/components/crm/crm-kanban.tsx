import React, { useState } from "react";
import { Search, Filter, GripVertical, CheckSquare, Phone, Download, FileText, Box, MessageSquare, CheckCheck, Clock, Trash2, Plus, RotateCw, Sparkles } from "lucide-react";
import { Lead } from "./types";

interface Stage {
  id: string;
  title: string;
  color: string;
}

interface CRMKanbanProps {
  filteredLeads: Lead[];
  STAGES: Stage[];
  setSelectedLead: (lead: Lead) => void;
  moveLead: (leadId: string, newStageId: string) => void;
  handleDeleteLead?: (leadId: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterUtm: string;
  setFilterUtm: (val: string) => void;
  boardRef: React.RefObject<HTMLDivElement> | any;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  handleMouseUp: () => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  setShowNewLeadModal?: (val: boolean) => void;
  fetchLeads?: () => void;
}

export default function CRMKanban({
  filteredLeads,
  STAGES,
  setSelectedLead,
  moveLead,
  handleDeleteLead,
  searchTerm,
  setSearchTerm,
  filterUtm,
  setFilterUtm,
  boardRef,
  handleMouseDown,
  handleMouseLeave,
  handleMouseUp,
  handleMouseMove,
  setShowNewLeadModal,
  fetchLeads
}: CRMKanbanProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [selectedStageTab, setSelectedStageTab] = useState<string>("all");
  const [syncingWhatsapp, setSyncingWhatsapp] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncWhatsapp = async () => {
    if (syncingWhatsapp) return;
    setSyncingWhatsapp(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/evolution/sync-recent-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: "dumar_comercial" })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncFeedback(data.message || "Conversas sincronizadas com sucesso!");
        if (fetchLeads) {
          await fetchLeads();
        }
      } else {
        setSyncFeedback(data.error || "Erro ao sincronizar conversas.");
      }
    } catch (e) {
      setSyncFeedback("Erro de conexão ao sincronizar com a Evolution API.");
    } finally {
      setSyncingWhatsapp(false);
      setTimeout(() => setSyncFeedback(null), 7000);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) setDragOverStageId(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      moveLead(leadId, stageId);
    }
    setDraggedLeadId(null);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStageId(null);
  };

  const getLeadLastInteractionTime = (lead: Lead): number => {
    if (lead.lastCustomerMessageAt) {
      const t = new Date(lead.lastCustomerMessageAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (Array.isArray(lead.chatHistory) && lead.chatHistory.length > 0) {
      const last = lead.chatHistory[lead.chatHistory.length - 1];
      if (last && last.timestamp) {
        const t = new Date(last.timestamp).getTime();
        if (!isNaN(t)) return t;
      }
    }
    if (lead.createdAt) {
      const t = new Date(lead.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    return Number(lead.id) || 0;
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    let p = clean.startsWith("55") && clean.length > 10 ? clean.slice(2) : clean;
    if (p.length === 11) {
      return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
    } else if (p.length === 10) {
      return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
    }
    return phone;
  };

  const getUtmCoverColor = (utmSource: string = "") => {
    const src = utmSource.toLowerCase();
    if (src.includes("google")) return "bg-[#4285F4]";
    if (src.includes("instagram") || src.includes("meta")) return "bg-[#E1306C]";
    if (src.includes("whatsapp")) return "bg-[#25D366]";
    if (src.includes("facebook")) return "bg-[#1877F2]";
    if (src.includes("promob") || src.includes("3d")) return "bg-indigo-500";
    return "bg-amber-500";
  };

  const getUtmChannelBadge = (utmSource: string = "") => {
    const src = utmSource.toLowerCase();
    if (src.includes("google")) return { label: "Google Ads", icon: "🌐", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
    if (src.includes("instagram") || src.includes("meta")) return { label: "Instagram Ads", icon: "📸", bg: "bg-pink-500/10 text-pink-400 border-pink-500/30" };
    if (src.includes("whatsapp")) return { label: "WhatsApp", icon: "💬", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
    if (src.includes("promob") || src.includes("3d")) return { label: "Projeto 3D", icon: "📐", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" };
    return { label: utmSource || "Site Direto", icon: "🏢", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
  };

  const visibleStages = selectedStageTab === "all" 
    ? STAGES 
    : STAGES.filter(s => s.id === selectedStageTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Kanban Board Top Bar */}
      <div className="p-3 md:p-4 border-b border-white/10 flex flex-wrap gap-2.5 items-center justify-between bg-black/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm md:text-base font-bold uppercase tracking-wider text-white">Funil de Vendas</h2>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-extrabold">
            {filteredLeads.length} Oportunidades
          </span>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
            <input 
              type="text"
              placeholder="Buscar por nome, telefone ou ambiente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={filterUtm}
              onChange={(e) => setFilterUtm(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer appearance-none pr-7"
            >
              <option value="all">Todas Origens</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Instagram Ads (Meta)">Instagram Ads</option>
              <option value="WhatsApp Direto / Orgânico">WhatsApp Direto</option>
              <option value="Site Oficial Dumar">Site Oficial</option>
            </select>
            <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleSyncWhatsapp}
            disabled={syncingWhatsapp}
            className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-bold transition-all border shadow-sm cursor-pointer ${
              syncingWhatsapp
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50"
            }`}
            title="Importar conversas e contatos do WhatsApp que ainda não subiram para o funil"
          >
            <RotateCw size={13} className={syncingWhatsapp ? "animate-spin text-emerald-400" : ""} />
            <span>{syncingWhatsapp ? "Sincronizando..." : "Sincronizar WhatsApp"}</span>
          </button>

          {setShowNewLeadModal && (
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus size={13} />
              Novo Lead
            </button>
          )}
        </div>
      </div>

      {/* BANNER FLUTUANTE DE FEEDBACK DA SINCRONIZAÇÃO */}
      {syncFeedback && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-fade-in shadow-inner z-20">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-gray-400 hover:text-white text-[10px] uppercase font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* BARRA DE ABAS DE ETAPAS MOBILE */}
      <div className="md:hidden flex overflow-x-auto gap-1.5 p-2 bg-black/60 border-b border-white/10 scrollbar-none flex-shrink-0">
        <button
          onClick={() => setSelectedStageTab("all")}
          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
            selectedStageTab === "all" ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          Todas ({filteredLeads.length})
        </button>
        {STAGES.map(stage => {
          const count = filteredLeads.filter(l => l.stage === stage.id).length;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageTab(stage.id)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
                selectedStageTab === stage.id ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {stage.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban Board Container com Drag-and-Drop */}
      <div 
        ref={boardRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex-1 overflow-x-auto p-3 md:p-4 flex gap-3.5 select-none scrollbar-thin cursor-grab active:cursor-grabbing"
      >
        {visibleStages.map(stage => {
          // ORDENAÇÃO RIGOROSA: Os leads com interação mais recente sobem para o topo
          const stageLeads = filteredLeads
            .filter(l => l.stage === stage.id)
            .sort((a, b) => getLeadLastInteractionTime(b) - getLeadLastInteractionTime(a));

          const isTargetStage = dragOverStageId === stage.id;

          return (
            <div 
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 flex-shrink-0 flex flex-col bg-[#0b0b0b] border rounded-xl overflow-hidden transition-all ${
                isTargetStage ? "border-amber-400 bg-white/5 shadow-2xl" : "border-white/10"
              }`}
            >
              {/* Header da Coluna */}
              <div className={`p-2.5 border-t-2 ${stage.color} bg-black/50 border-b border-white/10 flex justify-between items-center`}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-300 truncate pr-1">{stage.title}</h3>
                <span className="text-[10px] font-extrabold bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/10 flex-shrink-0">
                  {stageLeads.length}
                </span>
              </div>

              {/* Corpo da Coluna com Cards Estilo Comprido Minimalista */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-black/10 scrollbar-thin">
                {stageLeads.map(lead => {
                  const isBeingDragged = draggedLeadId === lead.id;
                  const completedChecklist = lead.checklist ? Object.values(lead.checklist).filter(Boolean).length : 0;
                  const totalChecklist = lead.checklist ? Object.keys(lead.checklist).length : 0;
                  const progressPct = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
                  const lastMsg = lead.chatHistory && lead.chatHistory.length > 0 ? lead.chatHistory[lead.chatHistory.length - 1] : null;
                  const isWaitingReply = lastMsg && lastMsg.sender === "client";
                  const channelBadge = getUtmChannelBadge(lead.utmSource);
                  const formattedPhone = formatPhoneNumber(lead.phone);
                  const msgTime = lastMsg?.timestamp || "";

                  return (
                    <div 
                      key={lead.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLead(lead)}
                      className={`bg-[#131313] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 relative group shadow-md flex flex-col ${
                        isBeingDragged 
                          ? "opacity-30 border-dashed border-amber-400 scale-95" 
                          : isWaitingReply
                            ? "border-amber-500/40 hover:border-amber-400 hover:bg-[#181818]"
                            : "border-white/10 hover:border-white/30 hover:bg-[#181818]"
                      }`}
                    >
                      {/* Faixa Header de Origem (Tag Cover) */}
                      <div className={`h-1 w-full ${getUtmCoverColor(lead.utmSource)}`} />

                      <div className="p-2.5 space-y-2">
                        {/* Origem e Status de Resposta */}
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[8px] font-extrabold border px-1.5 py-0.5 rounded uppercase tracking-wider truncate flex items-center gap-1 ${channelBadge.bg}`}>
                            <span>{channelBadge.icon}</span>
                            <span className="truncate max-w-[80px]">{channelBadge.label}</span>
                          </span>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {lead.aiPaused ? (
                              <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full" title="Atendimento Manual: IA em espera">
                                👤 Manual
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full animate-pulse" title="IA Comercial Habilitada para este lead">
                                🤖 IA Ativa
                              </span>
                            )}

                            {isWaitingReply ? (
                              <span className="flex items-center gap-1 text-[8px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full animate-pulse" title="Cliente aguarda resposta">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                Pendente
                              </span>
                            ) : lastMsg ? (
                              <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20" title="Conversa respondida">
                                <CheckCheck size={10} />
                                OK
                              </span>
                            ) : null}

                            {handleDeleteLead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLead(lead.id);
                                }}
                                className="text-gray-600 hover:text-red-400 p-0.5 transition-colors"
                                title="Excluir Lead"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Nome do Cliente & Telefone */}
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={13} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5 opacity-60" />
                          <div className="overflow-hidden flex-1">
                            <h4 className="text-xs font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors leading-snug truncate">
                              {lead.name}
                            </h4>
                            {formattedPhone && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-mono">
                                <Phone size={9} className="text-gray-500" />
                                {formattedPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Checklist & Ambientes */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {totalChecklist > 0 ? (
                            <div className="flex items-center gap-1 text-[8px] text-gray-400">
                              <CheckSquare size={9} className={progressPct === 100 ? "text-emerald-400" : "text-amber-400"} />
                              <span>{progressPct}%</span>
                            </div>
                          ) : <div />}

                          {(() => {
                            const roomsList = Array.isArray(lead.rooms) ? lead.rooms : (typeof lead.rooms === "string" && lead.rooms ? [lead.rooms] : []);
                            if (roomsList.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {roomsList.slice(0, 2).map((room, idx) => (
                                  <span key={idx} className="text-[8px] font-semibold bg-white/5 text-gray-300 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[80px]">
                                    {room}
                                  </span>
                                ))}
                                {roomsList.length > 2 && (
                                  <span className="text-[8px] text-gray-500 font-bold">+{roomsList.length - 2}</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Valor do Projeto */}
                        {lead.value > 0 && (
                          <div className="flex justify-between items-center pt-1 border-t border-white/5">
                            <span className="text-[9px] text-gray-500">Valor Fechado:</span>
                            <span className="text-[10px] font-black text-emerald-400">
                              {lead.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rodapé do Chat com Prévia da Mensagem e Horário de Brasília */}
                      <div className={`border-t px-2.5 py-1.5 flex items-center justify-between gap-2 text-[9px] ${
                        isWaitingReply ? "bg-amber-500/5 border-amber-500/20" : "bg-black/40 border-white/5"
                      }`}>
                        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                          <span className="text-[10px] flex-shrink-0">
                            {lastMsg?.sender === "agent" ? "🏢" : "👤"}
                          </span>
                          <span className={`truncate text-[9px] italic ${isWaitingReply ? "text-gray-200 font-medium" : "text-gray-400"}`}>
                            {lastMsg ? lastMsg.text : "Aguardando primeira mensagem"}
                          </span>
                        </div>

                        {msgTime && (
                          <div className="flex items-center gap-0.5 text-[9px] text-gray-400 font-mono flex-shrink-0">
                            <Clock size={9} className="text-gray-500" />
                            <span>{msgTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div className="h-28 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center p-2">
                    <p className="text-[10px] text-gray-600">Nenhum lead</p>
                    <p className="text-[9px] text-gray-700 mt-0.5">Arraste para esta coluna</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
