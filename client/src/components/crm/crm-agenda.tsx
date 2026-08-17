import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, Clock, MapPin, CheckSquare, Plus, Trash2, 
  ChevronLeft, ChevronRight, User, FileText, CheckCircle2, Tag, StickyNote,
  Edit3, Search, Filter, Phone, MessageSquare, AlertCircle, Sparkles,
  CalendarDays, ListFilter
} from "lucide-react";
import { Lead } from "./types";
import CRMConfirmModal from "./crm-confirm-modal";

interface CRMAgendaProps {
  leads: Lead[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: "evento" | "tarefa" | "nota";
  priority: "alta" | "media" | "baixa";
  leadId?: string;
  notes?: string;
  completed?: boolean;
}

// Estrutura de Dias da Semana no Brasil: Segunda a Domingo
const DAYS_HEADER = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Helper para obter a data YYYY-MM-DD exatamente no fuso de São Paulo (America/Sao_Paulo)
const getSaoPauloDateStr = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const d = parts.find(p => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
};

export default function CRMAgenda({ leads }: CRMAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "evento" | "tarefa" | "nota">("todos");
  const [priorityFilter, setPriorityFilter] = useState<"todas" | "alta" | "media" | "baixa">("todas");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendentes" | "concluidos">("todos");
  const [activeView, setActiveView] = useState<"calendario" | "lista">("calendario");

  // Modal de Criação / Edição de Evento
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getSaoPauloDateStr());
  const [eventTime, setEventTime] = useState("14:00");
  const [eventType, setEventType] = useState<"evento" | "tarefa" | "nota">("evento");
  const [eventPriority, setEventPriority] = useState<"alta" | "media" | "baixa">("media");
  const [eventLeadId, setEventLeadId] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal de Confirmação de Exclusão
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar eventos reais do Banco PostgreSQL
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar-events");
      if (res.ok) {
        const data = await res.json();
        setDbEvents(data.map((item: any) => ({
          ...item,
          id: String(item.id),
          leadId: item.leadId ? String(item.leadId) : undefined
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar eventos do banco:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Combinar Eventos Manuais + Medições Agendadas dos Leads do Banco Real
  const scheduledLeadEvents: CalendarEvent[] = useMemo(() => {
    return leads
      .filter(l => (l.stage === "briefing" || l.stage === "apresentacao") && l.checklist?.dataAgendamento)
      .map(l => {
        const rawDate = typeof l.checklist?.dataAgendamento === "string" ? l.checklist.dataAgendamento : "";
        const dateMatch = rawDate ? (rawDate.match(/\d{4}-\d{2}-\d{2}/) || rawDate.match(/\d{2}\/\d{2}\/\d{4}/)) : null;
        let isoDate = getSaoPauloDateStr();
        if (dateMatch) {
          if (dateMatch[0].includes("/")) {
            const [d, m, y] = dateMatch[0].split("/");
            isoDate = `${y}-${m}-${d}`;
          } else {
            isoDate = dateMatch[0];
          }
        }

        const timeMatch = rawDate ? rawDate.match(/\b(\d{1,2}:\d{2})\b/) : null;
        const eventTime = timeMatch ? timeMatch[1] : "14:00";

        const enderecoText = (typeof l.checklist === "object" && l.checklist && l.checklist.enderecoObra) ? String(l.checklist.enderecoObra) : "";
        const roomsText = Array.isArray(l.rooms) ? l.rooms.join(", ") : String(l.rooms || "");

        return {
          id: `lead-${l.id}`,
          title: `Visita / Medição: ${l.name}`,
          date: isoDate,
          time: eventTime,
          type: "evento" as const,
          priority: "alta" as const,
          leadId: String(l.id),
          notes: `Ambientes: ${roomsText}${enderecoText ? ` • Local: ${enderecoText}` : ""}`,
          completed: false
        };
      });
  }, [leads]);

  const allEvents = useMemo(() => {
    // Mesclar sem duplicar eventos manuais que já possuem leadId idêntico
    const list = [...dbEvents];
    for (const leadEv of scheduledLeadEvents) {
      if (!list.some(e => e.leadId === leadEv.leadId && e.date === leadEv.date)) {
        list.push(leadEv);
      }
    }
    return list;
  }, [dbEvents, scheduledLeadEvents]);

  // Filtragem Dinâmica de Eventos
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      // Filtro por Tipo
      if (typeFilter !== "todos" && ev.type !== typeFilter) return false;
      // Filtro por Prioridade
      if (priorityFilter !== "todas" && ev.priority !== priorityFilter) return false;
      // Filtro por Conclusão
      if (statusFilter === "pendentes" && ev.completed) return false;
      if (statusFilter === "concluidos" && !ev.completed) return false;
      // Filtro por Busca de Texto / Nome
      if (searchTerm.trim().length > 0) {
        const query = searchTerm.toLowerCase();
        const leadMatch = leads.find(l => String(l.id) === ev.leadId);
        const matchesTitle = ev.title.toLowerCase().includes(query);
        const matchesNotes = (ev.notes || "").toLowerCase().includes(query);
        const matchesLead = leadMatch ? (leadMatch.name.toLowerCase().includes(query) || leadMatch.phone.includes(query)) : false;
        if (!matchesTitle && !matchesNotes && !matchesLead) return false;
      }
      return true;
    });
  }, [allEvents, typeFilter, priorityFilter, statusFilter, searchTerm, leads]);

  // Cálculos do Calendário Mensal (Segunda a Domingo)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Abrir Modal para Criar Novo Evento em Data Específica
  const openCreateModal = (dateStr: string = getSaoPauloDateStr()) => {
    setEditingEventId(null);
    setEventDate(dateStr);
    setEventTime("14:00");
    setEventTitle("");
    setEventType("evento");
    setEventPriority("media");
    setEventLeadId("");
    setEventNotes("");
    setShowEventModal(true);
  };

  // Abrir Modal para Editar Evento Existente
  const openEditModal = (ev: CalendarEvent) => {
    if (ev.id.startsWith("lead-")) {
      // Se for evento automático de lead, pré-preenche para salvar como evento fixo no banco
      setEditingEventId(null);
      setEventTitle(ev.title);
      setEventDate(ev.date);
      setEventTime(ev.time || "14:00");
      setEventType(ev.type);
      setEventPriority(ev.priority);
      setEventLeadId(ev.leadId || "");
      setEventNotes(ev.notes || "");
    } else {
      setEditingEventId(ev.id);
      setEventTitle(ev.title);
      setEventDate(ev.date);
      setEventTime(ev.time || "14:00");
      setEventType(ev.type);
      setEventPriority(ev.priority);
      setEventLeadId(ev.leadId || "");
      setEventNotes(ev.notes || "");
    }
    setShowEventModal(true);
  };

  // Salvar Evento (Criar ou Atualizar)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: eventTitle.trim(),
        date: eventDate,
        time: eventType === "nota" ? "" : eventTime,
        type: eventType,
        priority: eventPriority,
        leadId: eventLeadId ? Number(eventLeadId) : undefined,
        notes: eventNotes.trim() || "",
        completed: false
      };

      if (editingEventId) {
        // Atualizar evento existente
        const res = await fetch(`/api/calendar-events/${editingEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await fetchEvents();
          setShowEventModal(false);
        }
      } else {
        // Criar novo evento
        const res = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await fetchEvents();
          setShowEventModal(false);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
    } finally {
      setSaving(false);
    }
  };

  // Concluir / Reabrir Evento
  const toggleEventCompleted = async (ev: CalendarEvent) => {
    if (ev.id.startsWith("lead-")) return;
    try {
      const res = await fetch(`/api/calendar-events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !ev.completed })
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Confirmar Exclusão com Modal
  const confirmDeleteEvent = async () => {
    if (!deletingEvent || deletingEvent.id.startsWith("lead-")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/calendar-events/${deletingEvent.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchEvents();
        setDeletingEvent(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: "evento" | "tarefa" | "nota") => {
    if (type === "evento") return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    if (type === "tarefa") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  };

  const getTypeIcon = (type: "evento" | "tarefa" | "nota") => {
    if (type === "evento") return <CalendarIcon size={12} className="text-blue-400" />;
    if (type === "tarefa") return <CheckSquare size={12} className="text-emerald-400" />;
    return <StickyNote size={12} className="text-amber-400" />;
  };

  const getPriorityBadge = (priority: "alta" | "media" | "baixa") => {
    if (priority === "alta") return "bg-red-500/20 text-red-300 border-red-500/40 font-bold";
    if (priority === "media") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-slate-500/20 text-slate-300 border-slate-500/40";
  };

  // Gerar Células do Calendário
  const calendarCells = [];
  for (let i = 0; i < firstDayOffset; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month + 1).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    calendarCells.push({ day, dateStr });
  }

  const todayStr = getSaoPauloDateStr();

  return (
    <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-0 overflow-y-auto bg-black/40">
      {/* Header Principal da Agenda */}
      <div className="mb-4 bg-[#0f0f0f] border border-white/10 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Agenda Dumar
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    {filteredEvents.length} {filteredEvents.length === 1 ? "Compromisso" : "Compromissos"}
                  </span>
                </h2>
              </div>
            </div>

            {/* Navegador de Mês */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
              <button type="button" onClick={prevMonth} className="p-1 hover:text-amber-400 transition-colors cursor-pointer" title="Mês anterior">
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-white px-2 min-w-[120px] text-center text-xs">
                {MONTH_NAMES[month]} {year}
              </span>
              <button type="button" onClick={nextMonth} className="p-1 hover:text-amber-400 transition-colors cursor-pointer" title="Próximo mês">
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Alternância de Visão & Botão Novo */}
          <div className="flex items-center gap-2.5">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setActiveView("calendario")}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "calendario" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                <CalendarDays size={14} /> Calendário
              </button>
              <button
                type="button"
                onClick={() => setActiveView("lista")}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === "lista" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                <ListFilter size={14} /> Lista
              </button>
            </div>

            <button
              type="button"
              onClick={() => openCreateModal(todayStr)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Novo Compromisso</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Busca Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-white/5">
          {/* Busca */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, título ou nota..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:border-amber-400 cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="evento">Reuniões & Visitas Técnicas</option>
              <option value="tarefa">Tarefas de Projeto / Fábrica</option>
              <option value="nota">Lembretes & Notas</option>
            </select>
          </div>

          {/* Filtro por Prioridade */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:border-amber-400 cursor-pointer"
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="alta">🚨 Alta Prioridade (VIP 💎)</option>
              <option value="media">⚡ Média Prioridade</option>
              <option value="baixa">☕ Baixa Prioridade</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:border-amber-400 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendentes">Apenas Pendentes</option>
              <option value="concluidos">Apenas Concluídos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visão de Grade Mensal ou Lista Completa */}
      {activeView === "calendario" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* LADO ESQUERDO: Grid do Mês no Padrão Brasileiro (Segunda a Domingo) */}
          <div className="lg:col-span-8 flex flex-col bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl">
            {/* Header dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-400 border-b border-white/10 pb-3 mb-2">
              {DAYS_HEADER.map(d => (
                <div key={d} className="uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Grid de Células de Dias */}
            <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="bg-black/20 rounded-xl min-h-[90px] opacity-20" />;
                }

                const isToday = cell.dateStr === todayStr;
                const dayEvents = filteredEvents.filter(ev => ev.date === cell.dateStr);

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => openCreateModal(cell.dateStr)}
                    className={`border rounded-xl p-1.5 flex flex-col min-h-[95px] cursor-pointer transition-all hover:border-amber-400/50 group ${
                      isToday ? "bg-amber-500/10 border-amber-500/40 shadow-inner" : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? "bg-amber-500 text-black font-extrabold" : "text-gray-300"
                      }`}>
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Lista dos Eventos no Dia */}
                    <div className="space-y-1 overflow-y-auto max-h-[70px] scrollbar-none">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(ev);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center justify-between border truncate transition-all hover:scale-[1.02] cursor-pointer ${
                            ev.completed 
                              ? "line-through opacity-40 bg-black/40 border-transparent text-gray-500" 
                              : getTypeBadge(ev.type)
                          }`}
                          title={`${ev.time ? ev.time + " - " : ""}${ev.title} (Clique para Editar)`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {ev.priority === "alta" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                            {ev.time ? `${ev.time} ${ev.title}` : ev.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LADO DIREITO: Painel de Próximos Compromissos & Ações */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col flex-1 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Próximos Compromissos</h3>
                </div>
                <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">
                  {filteredEvents.length} Itens
                </span>
              </div>

              {/* Lista dos Eventos */}
              <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1 max-h-[540px]">
                {filteredEvents.map(ev => {
                  const linkedLead = leads.find(l => String(l.id) === ev.leadId);
                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 border rounded-xl flex flex-col gap-2.5 transition-all ${
                        ev.completed
                          ? "bg-black/30 border-white/5 opacity-50"
                          : "bg-white/5 border-white/10 hover:border-white/20 shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleEventCompleted(ev)}
                            className="cursor-pointer text-gray-400 hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5"
                            title={ev.completed ? "Reabrir compromisso" : "Concluir compromisso"}
                          >
                            {ev.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <div className="w-4 h-4 rounded border border-white/40 hover:border-emerald-400" />
                            )}
                          </button>

                          <div>
                            <h4 
                              onClick={() => openEditModal(ev)}
                              className={`text-xs font-bold truncate cursor-pointer hover:text-amber-400 transition-colors ${
                                ev.completed ? "line-through text-gray-500" : "text-white"
                              }`}
                              title="Clique para Editar"
                            >
                              {ev.title}
                            </h4>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${getTypeBadge(ev.type)}`}>
                                {getTypeIcon(ev.type)}
                                {ev.type}
                              </span>

                              <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${getPriorityBadge(ev.priority)}`}>
                                {ev.priority}
                              </span>

                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {ev.date} {ev.time ? `às ${ev.time}` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação: Editar e Excluir */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(ev)}
                            className="text-gray-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                            title="Editar Compromisso"
                          >
                            <Edit3 size={13} />
                          </button>

                          {!ev.id.startsWith("lead-") && (
                            <button
                              type="button"
                              onClick={() => setDeletingEvent(ev)}
                              className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                              title="Excluir Compromisso"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lead Vinculado com WhatsApp Rápido */}
                      {linkedLead && (
                        <div className="flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-[10px]">
                          <span className="text-gray-300 font-medium flex items-center gap-1 truncate">
                            <User size={11} className="text-amber-400" />
                            {linkedLead.name}
                          </span>
                          {linkedLead.phone && (
                            <a
                              href={`https://wa.me/${linkedLead.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                              title="Chamar no WhatsApp"
                            >
                              <MessageSquare size={10} />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}

                      {/* Notas Técnicas */}
                      {ev.notes && (
                        <p className="text-[10px] text-gray-400 bg-black/40 p-2 rounded-lg border border-white/5 italic">
                          "{ev.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && !loading && (
                  <div className="text-center py-12 px-4 space-y-2">
                    <CalendarIcon size={24} className="mx-auto text-gray-600" />
                    <p className="text-gray-400 text-xs font-bold">Nenhum compromisso encontrado</p>
                    <p className="text-gray-600 text-[11px]">Tente ajustar os filtros de busca ou crie um novo agendamento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visão em Lista Expandida (Linha do Tempo) */
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ListFilter size={16} className="text-amber-400" />
              Linha do Tempo de Compromissos e Tarefas
            </h3>
            <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">
              Total: {filteredEvents.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
            {filteredEvents.map(ev => {
              const linkedLead = leads.find(l => String(l.id) === ev.leadId);
              return (
                <div
                  key={ev.id}
                  className={`p-4 border rounded-xl flex flex-col justify-between gap-3 transition-all ${
                    ev.completed ? "bg-black/30 border-white/5 opacity-50" : "bg-white/5 border-white/10 hover:border-amber-500/40 shadow-lg"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${getTypeBadge(ev.type)}`}>
                        {getTypeIcon(ev.type)}
                        {ev.type}
                      </span>

                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${getPriorityBadge(ev.priority)}`}>
                        {ev.priority}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${ev.completed ? "line-through text-gray-500" : "text-white"}`}>
                      {ev.title}
                    </h4>

                    <div className="text-xs text-amber-300 font-mono font-medium flex items-center gap-1.5">
                      <Clock size={12} />
                      {ev.date} {ev.time ? `às ${ev.time}` : ""}
                    </div>

                    {linkedLead && (
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] text-gray-300 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <User size={12} className="text-amber-400" />
                          {linkedLead.name}
                        </span>
                        {linkedLead.phone && (
                          <span className="text-gray-400 font-mono text-[10px]">{linkedLead.phone}</span>
                        )}
                      </div>
                    )}

                    {ev.notes && (
                      <p className="text-[11px] text-gray-400 bg-black/40 p-2.5 rounded-lg border border-white/5 italic">
                        "{ev.notes}"
                      </p>
                    )}
                  </div>

                  {/* Ações Inferiores */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleEventCompleted(ev)}
                      className="text-gray-400 hover:text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 size={14} className={ev.completed ? "text-emerald-400" : ""} />
                      {ev.completed ? "Concluído" : "Marcar Concluído"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(ev)}
                        className="text-gray-400 hover:text-amber-300 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors font-bold cursor-pointer"
                      >
                        Editar
                      </button>

                      {!ev.id.startsWith("lead-") && (
                        <button
                          type="button"
                          onClick={() => setDeletingEvent(ev)}
                          className="text-gray-400 hover:text-red-400 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Compromisso */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon size={16} className="text-amber-400" />
                {editingEventId ? "Editar Compromisso na Agenda" : "Novo Compromisso na Agenda"}
              </h3>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              {/* Seleção do Tipo: Evento, Tarefa ou Nota */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Tipo de Registro</label>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setEventType("evento")}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      eventType === "evento" ? "bg-blue-500 text-white shadow" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <CalendarIcon size={13} /> Reunião / Visita
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType("tarefa")}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      eventType === "tarefa" ? "bg-emerald-500 text-white shadow" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <CheckSquare size={13} /> Tarefa
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType("nota")}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      eventType === "nota" ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <StickyNote size={13} /> Nota
                  </button>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Título do Compromisso *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder={
                    eventType === "evento"
                      ? "Ex: Reunião Projeto 3D - Apresentação Promob"
                      : (eventType === "tarefa" ? "Ex: Conferir plano de corte na marcenaria" : "Ex: Anotações sobre detalhes da obra...")
                  }
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                  autoFocus
                />
              </div>

              {/* Data, Horário e Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Data *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                {eventType !== "nota" ? (
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Horário</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={e => setEventTime(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-500 font-bold mb-1 uppercase text-[10px]">Horário</label>
                    <div className="w-full bg-black/20 border border-white/5 rounded-xl px-2.5 py-1.5 text-gray-500 text-xs">
                      Dia todo
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Prioridade</label>
                  <select
                    value={eventPriority}
                    onChange={e => setEventPriority(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:border-amber-400 text-xs cursor-pointer"
                  >
                    <option value="alta">🚨 Alta (VIP 💎)</option>
                    <option value="media">⚡ Média</option>
                    <option value="baixa">☕ Baixa</option>
                  </select>
                </div>
              </div>

              {/* Vincular Cliente Lead (Opcional) */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Vincular Cliente Lead (Opcional)</label>
                <select
                  value={eventLeadId}
                  onChange={e => setEventLeadId(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Nenhum cliente vinculado</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} {l.phone ? `(${l.phone})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Notas e Observações Técnicas */}
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Notas / Observações Técnicas</label>
                <textarea
                  value={eventNotes}
                  onChange={e => setEventNotes(e.target.value)}
                  placeholder="Ex: Levar trena a laser e amostras de padrões de MDF (Carvalho / Grafite)..."
                  rows={3}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 scrollbar-thin"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Salvando..." : (editingEventId ? "Salvar Alterações" : "Criar Compromisso")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Segura de Exclusão */}
      <CRMConfirmModal
        isOpen={Boolean(deletingEvent)}
        title="Excluir Compromisso da Agenda?"
        description={`Tem certeza que deseja excluir "${deletingEvent?.title}" agendado para o dia ${deletingEvent?.date}? Esta ação removerá o registro do banco de dados.`}
        confirmText="Sim, Excluir Registro"
        cancelText="Cancelar"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={confirmDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
}
